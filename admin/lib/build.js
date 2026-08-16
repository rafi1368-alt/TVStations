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

// On a hosted server there's no local git credential (SSH key/keychain) to push
// with, so a GITHUB_TOKEN env var is used to push over an authenticated HTTPS
// URL instead. Locally (no token set) this falls back to a plain `git push`,
// unchanged from before.
async function pushStep() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return run("git", ["push"]);
  }

  const remoteResult = await run("git", ["remote", "get-url", "origin"]);
  const match = remoteResult.stdout.match(/github\.com[:/]([^/]+\/[^/.]+?)(\.git)?$/);
  if (!match) {
    return {
      command: "git push",
      ok: false,
      stdout: "",
      stderr: "Could not determine the GitHub owner/repo from the origin remote.",
    };
  }

  const branchResult = await run("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  const branch = (branchResult.stdout || "main").trim();
  const authedUrl = `https://x-access-token:${token}@github.com/${match[1]}.git`;
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
  steps.push(await run("git", ["commit", "-m", JSON.stringify(message || "Update TV display content")]));
  steps.push(await pushStep());
  return steps;
}

module.exports = { runBuild, runPublish };
