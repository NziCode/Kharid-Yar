const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const expoCli = path.join(root, 'node_modules', 'expo', 'bin', 'cli');
const result = spawnSync(process.execPath, [expoCli, 'export', '--platform', 'web'], {
  cwd: path.resolve(__dirname, '..'),
  stdio: 'inherit',
  shell: false,
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);

const dist = path.join(root, 'dist');
const indexPath = path.join(dist, 'index.html');
if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  html = html
    .replace(/src="\/_expo\//g, 'src="./_expo/')
    .replace(/href="\/_expo\//g, 'href="./_expo/')
    .replace(/<title>[^<]*<\/title>/, '<title>خریدیار</title>')
    // Native RTL (dir="rtl") is required: the app's many
    // flexDirection: 'row-reverse' layouts were authored assuming an RTL
    // base direction (row already flows right-to-left, row-reverse flips
    // specific rows back to left-to-right on purpose). Forcing ltr here
    // breaks those layouts.
    .replace(/<html lang="en">/g, '<html lang="fa" dir="rtl">');
  fs.writeFileSync(indexPath, html);
}

const fontDir = path.join(dist, 'assets', 'fonts');
fs.mkdirSync(fontDir, { recursive: true });
for (const file of ['Vazirmatn-Regular.ttf', 'Vazirmatn-Bold.ttf']) {
  fs.copyFileSync(path.join(root, 'assets', 'fonts', file), path.join(fontDir, file));
}

const cssDir = path.join(dist, '_expo', 'static', 'css');
if (fs.existsSync(cssDir)) {
  for (const file of fs.readdirSync(cssDir).filter((name) => name.endsWith('.css'))) {
    const cssPath = path.join(cssDir, file);
    const css = fs.readFileSync(cssPath, 'utf8')
      .replace(/url\(["']?\/assets\/fonts\//g, 'url("../../../assets/fonts/');
    fs.writeFileSync(cssPath, css);
  }
}
