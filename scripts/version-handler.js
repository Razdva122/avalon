// scripts/version-handler.js
const { execSync } = require("child_process");

const version = process.env.npm_package_version;

if (!version) {
  console.error("❌ Error: Environment variable npm_package_version is not defined.");
  process.exit(1);
}

try {
  console.log("🧪 Running tests...");
  execSync("npm run test", { stdio: "inherit" });

  console.log(`📦 Updating all workspaces to version ${version}...`);
  execSync(`npm version ${version} --no-git-tag-version --workspaces`, { stdio: "inherit" });

  console.log("✅ Staging changes in git...");
  execSync("git add .", { stdio: "inherit" });

  console.log("🎉 Version script completed successfully.");
} catch (error) {
  console.error("❌ Error while executing version script:");
  console.error(error.message);
  process.exit(1);
}
