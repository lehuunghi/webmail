import { readFileSync, writeFileSync } from 'node:fs';
import { marked } from 'marked';
const content = marked.parse(readFileSync(new URL('../docs/CAI-DAT.md', import.meta.url), 'utf8'));
writeFileSync(new URL('../web/public/huong-dan.html', import.meta.url), `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hướng dẫn cài đặt · Webmail</title><link rel="stylesheet" href="huong-dan.css"></head>
<body><header><a href="./">← Webmail</a><span>Phiên bản của lehuunghi</span></header><main><nav aria-label="Mục lục"><a href="#docker">Docker</a><a href="#portainer">Portainer</a><a href="#cpanel">cPanel</a></nav>${content.replace('<h2>2.', '<h2 id="docker">2.').replace('<h2>3.', '<h2 id="portainer">3.').replace('<h2>4.', '<h2 id="cpanel">4.')}</main></body></html>`);
