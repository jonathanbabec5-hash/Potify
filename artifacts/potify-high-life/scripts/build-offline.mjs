import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'vite';

const root = path.resolve(import.meta.dirname, '..');
process.env.PORT ??= '5173';
process.env.BASE_PATH = '/';
process.env.VITE_SINGLE_FILE = 'true';
const result = await build({
  root,
  configFile: path.join(root, 'vite.config.ts'),
  build: {
    write: false,
    modulePreload: false,
    assetsInlineLimit: Infinity,
    cssCodeSplit: false,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const output = result.output;
const entry = output.find(item => item.type === 'chunk' && item.isEntry);
const css = output.find(item => item.fileName.endsWith('.css'));
const template = output.find(item => item.fileName === 'index.html');
if (!entry || !css || !template) throw new Error('Incomplete standalone build');
const favicon = await readFile(path.join(root, 'public/favicon.svg'), 'utf8');
const styles = String(css.source).replace(/@import\s*(?:url\()?["']https:\/\/fonts\.googleapis\.com[^"']*["']\)?\s*;/g, '');
const html = String(template.source)
  .replace(/<link[^>]+rel="preconnect"[^>]*>/g, '')
  .replace('href="/favicon.svg"', () => 'href="data:image/svg+xml,' + encodeURIComponent(favicon) + '"')
  .replace(/<link[^>]+rel="stylesheet"[^>]*>/, () => '<style>' + styles + '</style>')
  .replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/, () => '<script type="module">' + entry.code.replace(/<\/script/gi, '<\\/script') + '</script>');
const dir = path.join(root, 'dist/offline');
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, 'POTIFY-A-Wonderful-High-Life.html'), html);
