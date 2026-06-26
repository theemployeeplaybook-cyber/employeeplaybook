import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter(f => f.endsWith('.html') && !f.startsWith('google'));
let problems = 0;
for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (html.includes('<style') || html.includes('<script>')) {
    console.error(`[heavy-inline] ${file} still contains inline style/script blocks`);
    problems++;
  }
  if (!html.includes('assets/css/app.css')) {
    console.error(`[missing-css] ${file}`);
    problems++;
  }
}
console.log(`Checked ${htmlFiles.length} HTML files.`);
if (problems) process.exit(1);
