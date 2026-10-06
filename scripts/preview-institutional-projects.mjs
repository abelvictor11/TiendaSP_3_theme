/** Isolated UI preview of the production sections; no Shopify credentials required. */
import {createRequire} from 'node:module';
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {execFileSync} from 'node:child_process';
const root = resolve(new URL('..', import.meta.url).pathname);
const directory = '/tmp/tienda-institutional-preview';
await mkdir(directory, {recursive: true});
const entry = `import React from 'react'; import {hydrateRoot} from 'react-dom/client'; import {renderToString} from 'react-dom/server'; import {InstitutionalBlockView} from './app/sections/SectionInstitutional'; import {createDefaultInstitutionalRoute,readInstitutionalSection} from './app/lib/institutional'; const blocks=createDefaultInstitutionalRoute().sections.references.nodes.map(readInstitutionalSection); function Landing(){return <>{blocks.map(b=><InstitutionalBlockView key={b.id} block={b}/>)}</>}; export const html=renderToString(<Landing/>); if(typeof document!=='undefined')hydrateRoot(document.getElementById('landing'),<Landing/>);`;
const common = {
  stdin: {contents: entry, resolveDir: root, loader: 'tsx'},
  bundle: true,
  write: false,
  tsconfig: resolve(root, 'tsconfig.json'),
  define: {'process.env.NODE_ENV': '"production"'},
  jsx: 'automatic',
};
const ssr = await build({...common, platform: 'node', format: 'cjs'});
await writeFile(resolve(directory, 'render.cjs'), ssr.outputFiles[0].text);
const {html} = createRequire(import.meta.url)(resolve(directory, 'render.cjs'));
const browser = await build({...common, platform: 'browser', format: 'iife'});
await writeFile(resolve(directory, 'preview.js'), browser.outputFiles[0].text);
execFileSync(
  resolve(root, 'node_modules/.bin/tailwindcss'),
  [
    '--postcss',
    resolve(root, 'postcss.config.cjs'),
    '-i',
    resolve(root, 'app/styles/app.css'),
    '-o',
    resolve(directory, 'preview.css'),
    '--content',
    resolve(root, 'app/sections/SectionInstitutional.tsx'),
  ],
  {cwd: root, stdio: 'inherit'},
);
const fontCss =
  'https://cdn.shopify.com/oxygen-v2/49100/64529/134361/4657967/assets/custom-font-CpFtswTa.css';
await writeFile(
  resolve(directory, 'index.html'),
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Proyectos Institucionales · vista de componentes</title><link rel="stylesheet" href="${fontCss}"><link rel="stylesheet" href="/preview.css"></head><body class="font-body text-slate-900"><div style="padding:12px 20px;background:#f8fafc;font-size:12px">Vista local de los bloques. En Hydrogen se muestra el header y footer del sitio.</div><main id="landing">${html}</main><script src="/preview.js"></script></body></html>`,
);
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};
createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    const base = path.startsWith('/images/')
      ? resolve(root, 'public')
      : directory;
    const file = resolve(base, '.' + (path === '/' ? '/index.html' : path));
    if (!file.startsWith(base + '/')) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader(
      'Content-Type',
      types[extname(file)] || 'application/octet-stream',
    );
    res.end(await readFile(file));
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(4173, '0.0.0.0', () =>
  console.log('Institutional UI preview: http://localhost:4173'),
);
