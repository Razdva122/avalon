const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

module.exports = class LocaleGenerationPlugin {
  apply(compiler) {
    const generator = path.join(compiler.context, 'scripts/generate-locales.cjs');
    const sources = path.join(compiler.context, 'src/i18n/langs');
    compiler.hooks.beforeCompile.tap('LocaleGeneration', () => {
      execFileSync(process.execPath, [generator], { cwd: compiler.context, stdio: 'inherit' });
    });
    compiler.hooks.afterCompile.tap('LocaleGeneration', (compilation) => {
      compilation.fileDependencies.add(generator);
      compilation.contextDependencies.add(sources);
      for (const file of fs.readdirSync(sources, { recursive: true })) {
        if (file.endsWith('.ts')) compilation.fileDependencies.add(path.join(sources, file));
      }
    });
  }
};
