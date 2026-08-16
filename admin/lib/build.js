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

  // GITHUB_REPO (format "owner/repo") skips parsing the origin remote entirely -
  // set it if the remote URL ever comes back in a format the regex below can't
  // handle. Otherwise this is derived automatically from `origin`.
  let ownerRepo = process.env.GITHUB_REPO;
  let remoteResult;
  if (!ownerRepo) {
    remoteResult = await run("git", ["remote", "get-url", "origin"]);
    const match = remoteResult.stdout.match(/github\.com[:/]([^/]+\/[^/.]+?)(\.git)?$/);
    ownerRepo = match && match[1];
  }
  if (!ownerRepo) {
    return {
      command: "git push",
      ok: false,
      stdout: "",
      stderr: `Could not determine the GitHub owner/repo from the origin remote (got: "${remoteResult ? remoteResult.stdout : ""}" ${remoteResult ? remoteResult.stderr : ""}). Set GITHUB_REPO=owner/repo to bypass this.`,
    };
  }

  const branchResult = await run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  const branch = (branchResult.stdout || "main").trim();
  const authedUrl = `https://x-access-token:${token}@github.com/${ownerRepo}.git`;
  const result = await run("git", ["push", authedUrl, `HEAD:${branch}`]);

  const scrub = (s) => s.split(token).join("***");
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

module.exports = { runBuild, runPublish };
