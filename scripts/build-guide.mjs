import { readFileSync, writeFileSync } from 'node:fs';
import { marked } from 'marked';
const sections = [
  ['chuan-bi', '1. Chuẩn bị'], ['docker', '2. Docker riêng'],
  ['portainer', '3. Portainer'], ['cpanel', '4. Hosting cPanel'],
  ['kiem-tra', '5. Kiểm tra & lỗi'], ['logo', '6. Đổi logo'],
  ['cloudflare', '7. Cloudflare'], ['sao-luu', '8. Sao lưu'],
];
const markdown = readFileSync(new URL('../docs/CAI-DAT.md', import.meta.url), 'utf8')
  .replace(/<!-- include:(docker-compose\.(?:portainer|cloudflare)\.yml) -->/g, (_, file) =>
    `\n\`\`\`yaml\n${readFileSync(new URL(`../${file}`, import.meta.url), 'utf8').trim()}\n\`\`\`\n`);
const content = marked.parse(markdown)
  .replace(/<h2>([1-8])\./g, (_, number) => `<h2 id="${sections[Number(number) - 1][0]}">${number}.`);
const toc = sections.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('');
writeFileSync(new URL('../web/public/huong-dan.html', import.meta.url), `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hướng dẫn cài đặt · Webmail</title><link rel="stylesheet" href="huong-dan.css"></head>
<body><header><a href="./">← Webmail</a><span>Hướng dẫn triển khai · lehuunghi</span></header><main><nav aria-label="Mục lục"><strong>Mục lục</strong>${toc}<a class="source-link" href="https://github.com/lehuunghi/webmail/tree/codex/vietnamese-default-deployment-guide">Xem mã nguồn ↗</a></nav><article>${content}</article></main><footer>Hướng dẫn tiếng Việt · Đối chiếu ngày 02/10/2026 · Kiểm tra môi trường thật trước khi đưa vào sử dụng.</footer></body></html>`);
