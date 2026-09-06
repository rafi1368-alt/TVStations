const { execFile } = require("child_process");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

function run(command, args) {
  return new Promise((resolve) => {
    execFile(command, args, { cwd: ROOT, shell: true }, (error, stdout, stderr) => {
      resolve({
        command: `${command} ${args.join(" ")}`,
        ok: !error,
        stdout: (stdout || "").trim(),
        stderr: (stderr || "").trim(),
      });
    });
  });
}

async function runBuild() {
  return run("npm", ["run", "build"]);
}

// A hosted server has no git identity configured and can't auto-detect one the
// way git does locally from your OS account (which is why local commits work
// today, just with a warning) - so `git commit` hard-fails there with "unknown
// author". Only set a fallback identity if a commit actually fails on that
// specific error, so this never touches a real local identity that already works.
async function ensureGitIdentity() {
  await run("git", ["config", "user.email", process.env.GIT_AUTHOR_EMAIL || "admin@tvstation.local"]);
  await run("git", ["config", "user.name", process.env.GIT_AUTHOR_NAME || "TVStation Admin"]);
}

// Shared by pushStep and syncFromOrigin: figure out which GitHub repo to talk
// to (GITHUB_REPO env var, or parsed from the `origin` remote) and which
// branch to treat as "the" branch (a deploy checkout is usually a detached
// HEAD, where `rev-parse --abbrev-ref HEAD` literally returns "HEAD").
async function resolveRepoAndBranch() {
  let ownerRepo = process.env.GITHUB_REPO;
  let remoteResult;
  if (!ownerRepo) {
    remoteResult = await run("git", ["remote", "get-url", "origin"]);
    const match = remoteResult.stdout.match(/github\.com[:/]([^/]+\/[^/.]+?)(\.git)?$/);
    ownerRepo = match && match[1];
  }
  if (!ownerRepo) {
    return {
      error: `Could not determine the GitHub owner/repo from the origin remote (got: "${remoteResult ? remoteResult.stdout : ""}" ${remoteResult ? remoteResult.stderr : ""}). Set GITHUB_REPO=owner/repo to bypass this.`,
    };
  }
  const branchResult = await run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  const detectedBranch = branchResult.stdout.trim();
  const branch = process.env.GIT_PUBLISH_BRANCH || (detectedBranch && detectedBranch !== "HEAD" ? detectedBranch : "main");
  return { ownerRepo, branch };
}

// Keeps this checkout's sites-data/assets in sync with GitHub even when
// nothing has been deployed here recently - Render's auto-deploy has proven
// unreliable, and edits can also land from a different running instance
// (e.g. someone's local admin panel). Called before rendering the site list
// and edit pages, so the panel can't silently show stale content.
// Never touches anything if there are uncommitted local changes.
async function syncFromOrigin() {
  const statusResult = await run("git", ["status", "--porcelain"]);
  if (statusResult.stdout.trim()) {
    return { synced: false, reason: "local changes present" };
  }

  const token = process.env.GITHUB_TOKEN;
  const { ownerRepo, branch, error } = await resolveRepoAndBranch();
  if (error) return { synced: false, reason: error };

  const fetchUrl = token ? `https://x-access-token:${token}@github.com/${ownerRepo}.git` : "origin";
  const fetchResult = await run("git", ["fetch", fetchUrl, branch]);
  if (!fetchResult.ok) {
    return { synced: false, reason: fetchResult.stderr || "git fetch failed" };
  }

  const beforeResult = await run("git", ["rev-parse", "HEAD"]);
  const afterResult = await run("git", ["rev-parse", "FETCH_HEAD"]);
  if (beforeResult.stdout === afterResult.stdout) {
    return { synced: false, reason: "already up to date" };
  }

  const resetResult = await run("git", ["reset", "--hard", "FETCH_HEAD"]);
  return {
    synced: resetResult.ok,
    reason: resetResult.ok ? null : resetResult.stderr,
    from: beforeResult.stdout.slice(0, 7),
    to: afterResult.stdout.slice(0, 7),
  };
}

async function commitStep(message) {
  const args = ["commit", "-m", JSON.stringify(message || "Update TV display content")];
  const result = await run("git", args);
  if (!result.ok && /Please tell me who you are|unable to auto-detect/i.test(result.stdout + result.stderr)) {
    await ensureGitIdentity();
    return run("git", args);
  }
  return result;
}

// On a hosted server there's no local git credential (SSH key/keychain) to push
// with, so a GITHUB_TOKEN env var is used to push over an authenticated HTTPS
// URL instead. Locally (no token set) this falls back to a plain `git push`,
// unchanged from before.
async function pushStep() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return run("git", ["push"]);
  }

  const { ownerRepo, branch, error } = await resolveRepoAndBranch();
  if (error) {
    return { command: "git push", ok: false, stdout: "", stderr: error };
  }

  const authedUrl = `https://x-access-token:${token}@github.com/${ownerRepo}.git`;
  const scrub = (s) => s.split(token).join("***");

  // This checkout can fall behind origin between publishes (e.g. someone else
  // published, or this instance restarted on an older commit) - rebase the new
  // commit(s) onto the latest remote tip first so the push below doesn't get
  // rejected as a non-fast-forward.
  const fetchResult = await run("git", ["fetch", authedUrl, branch]);
  if (fetchResult.ok) {
    const rebaseResult = await run("git", ["rebase", "FETCH_HEAD"]);
    if (!rebaseResult.ok) {
      await run("git", ["rebase", "--abort"]);
      return {
        command: "git rebase (onto latest GitHub content)",
        ok: false,
        stdout: scrub(rebaseResult.stdout),
        stderr: `${scrub(rebaseResult.stderr)}\n\nThis change conflicts with something already published since this page loaded. Reload and try again.`,
      };
    }
  }

  const result = await run("git", ["push", authedUrl, `HEAD:${branch}`]);
  return {
    command: "git push (using GITHUB_TOKEN)",
    ok: result.ok,
    stdout: scrub(result.stdout),
    stderr: scrub(result.stderr),
  };
}

async function runPublish(message) {
  const steps = [];
  steps.push(await run("npm", ["run", "build"]));
  steps.push(await run("git", ["add", "-A"]));
  steps.push(await commitStep(message));
  steps.push(await pushStep());
  return steps;
}

module.exports = { runBuild, runPublish, syncFromOrigin };
