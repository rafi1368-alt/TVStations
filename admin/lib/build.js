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

async function runPublish(message) {
  const steps = [];
  steps.push(await run("npm", ["run", "build"]));
  steps.push(await run("git", ["add", "-A"]));
  steps.push(await run("git", ["commit", "-m", JSON.stringify(message || "Update TV display content")]));
  steps.push(await run("git", ["push"]));
  return steps;
}

module.exports = { runBuild, runPublish };
