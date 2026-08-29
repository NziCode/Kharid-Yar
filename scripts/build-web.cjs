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
    // breaks those layouts. The app itself flips this at runtime once the
    // user picks English (see App.js's direction useEffect).
    .replace(/<html lang="en">/g, '<html lang="fa" dir="rtl">');
  fs.writeFileSync(indexPath, html);
}

// Fonts live in /public/fonts and are referenced as absolute "/fonts/..."
// URLs in web-fonts.css. `expo export` copies /public into dist/ as-is, so
// no manual copying or path-rewriting is needed here (unlike the old
// assets/fonts/ setup, which 404'd in `expo start --web` dev mode because
// only /public is served at the site root).

