// Genera mis-figuras.html: un solo archivo con todo (HTML + CSS + JS) para abrir en el navegador.
const fs = require('fs');
const path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');

let html = src('index.html')
  .replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
  .replace('<link rel="stylesheet" href="styles.css" />', () => `<style>\n${src('styles.css')}</style>`)
  .replace('<script src="app.js"></script>', () => `<script>\n${src('app.js')}</script>`);

fs.writeFileSync(path.join(__dirname, 'mis-figuras.html'), html);
console.log('Listo: mis-figuras.html');
