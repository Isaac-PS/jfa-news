// Servidor estático mínimo, só para desenvolvimento local.
// Uso: npm run servir   (abre em http://localhost:4000)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const porta = Number(process.env.PORTA ?? 4000);

const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const relativo = path.normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
    let arquivo = path.join(raiz, relativo);
    if (arquivo !== raiz && !arquivo.startsWith(raiz + path.sep)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Proibido');
      return;
    }
    const info = await stat(arquivo).catch(() => null);
    if (info?.isDirectory()) arquivo = path.join(arquivo, 'index.html');
    const conteudo = await readFile(arquivo);
    res.writeHead(200, {
      'Content-Type': tipos[path.extname(arquivo).toLowerCase()] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(conteudo);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Não encontrado');
  }
}).listen(porta, () => console.log(`Site em http://localhost:${porta}`));
