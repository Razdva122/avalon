// scripts/postversion-handler.js
const { execSync } = require("child_process");
const { version } = require("../package.json");

try {
  console.log("🚀 Pushing commits to remote...");
  execSync("git push", { stdio: "inherit" });

  console.log(`📌 Pushing git tag v${version} to origin...`);
  execSync(`git push origin tag v${version}`, { stdio: "inherit" });

  console.log("✅ postversion completed successfully.");
} catch (err) {
  console.error("❌ Error while executing postversion script:");
  console.error(err.message);
  process.exit(1);
}
