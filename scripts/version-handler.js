// scripts/version-handler.js
const { execSync } = require("child_process");

const version = process.env.npm_package_version;

if (!version) {
  console.error("Ошибка: переменная окружения npm_package_version не определена.");
  process.exit(1);
}

try {
  console.log("🧪 Запуск тестов...");
  execSync("npm run test", { stdio: "inherit" });

  console.log(`📦 Обновление версии всех workspaces до ${version}...`);
  execSync(`npm version ${version} --no-git-tag-version --workspaces`, { stdio: "inherit" });

  console.log("✅ Добавление изменений в git...");
  execSync("git add .", { stdio: "inherit" });

  console.log("🎉 Скрипт version завершён успешно.");
} catch (error) {
  console.error("❌ Ошибка при выполнении version-скрипта:");
  console.error(error.message);
  process.exit(1);
}
