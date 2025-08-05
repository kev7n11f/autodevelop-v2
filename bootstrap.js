// bootstrap.js
require("dotenv").config();
const { exec } = require("child_process");

console.log("🔧 Bootstrapping autodevelop-v2...");

const install = process.env.RENDER_BUILD?.replace(/^\$\s*/, "") || "yarn";
const start = process.env.RENDER_START?.replace(/^\$\s*/, "") || "yarn start";
const repo = process.env.GITHUB_REPO_URL;

if (!repo) {
  console.error("Missing GITHUB_REPO_URL in .env");
  process.exit(1);
}

exec(`git clone ${repo} autodevelop-v2`, (err) => {
  if (err) return console.error("Clone failed:", err);

  process.chdir("autodevelop-v2");

  console.log("📦 Installing dependencies...");
  exec(install, (err) => {
    if (err) return console.error("Install failed:", err);

    console.log("🚀 Starting service...");
    exec(start, (err) => {
      if (err) return console.error("Start failed:", err);
      console.log(`✅ App running at ${process.env.RENDER_URL}`);
    });
  });
});