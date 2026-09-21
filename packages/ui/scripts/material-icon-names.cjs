const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { parse } = require('@vue/compiler-sfc');
const ui = path.resolve(__dirname, '..');
const root = path.resolve(ui, '../..');
const printer = ts.createPrinter({ removeComments: true });

function withoutScriptComments(source) {
  return printer.printFile(ts.createSourceFile('icons.ts', source, ts.ScriptTarget.Latest, true));
}

function sourceTokens(source, extension) {
  if (extension === '.vue') {
    const { descriptor } = parse(source);
    source = [
      descriptor.template?.content.replace(/<!--[\s\S]*?-->/g, ''),
      ...[descriptor.script, descriptor.scriptSetup]
        .filter(Boolean)
        .map((block) => withoutScriptComments(block.content)),
      ...descriptor.styles.map((block) => block.content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')),
    ].join('\n');
  } else if (['.ts', '.js', '.mjs'].includes(extension)) {
    source = withoutScriptComments(source);
  } else {
    source = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  }
  return source.match(/[A-Za-z0-9_]+/g) || [];
}

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.(vue|ts|js|scss|css)$/.test(file) && entry.name !== 'material-icons.css'
        ? [file]
        : [];
  });
}

function requiredNames() {
  const upstream = fs.readFileSync(
    require.resolve('material-design-icons-iconfont/dist/material-design-icons.css'),
    'utf8',
  );
  const available = new Set([...upstream.matchAll(/\.material-icons\.(\w+):before/g)].map((match) => match[1]));
  const files = [...sourceFiles(path.join(ui, 'src')), path.join(root, 'node_modules/vuetify/lib/iconsets/md.mjs')];
  return [
    ...new Set(
      files
        .flatMap((file) => sourceTokens(fs.readFileSync(file, 'utf8'), path.extname(file)))
        .filter((token) => available.has(token)),
    ),
  ].sort();
}

module.exports = { requiredNames, sourceTokens };
if (require.main === module) console.log(JSON.stringify(requiredNames()));
