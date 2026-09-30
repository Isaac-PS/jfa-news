// Imita a API de conteúdo do GitHub em memória, só para testar o painel sem um repositório real.
// Uso: npm run mock-github   (http://localhost:4010, token: token-de-teste)
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const porta = Number(process.env.PORTA_MOCK ?? 4010);
const TOKEN = 'token-de-teste';
const arquivos = new Map();
let conflitosPendentes = 0;

const shaDe = (buffer) => createHash('sha1').update(buffer).digest('hex');
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-github-api-version, accept',
};

function responder(res, status, corpo) {
  res.writeHead(status, { ...CORS, 'Content-Type': 'application/json; charset=utf-8' });
  res.end(corpo === undefined ? '' : JSON.stringify(corpo));
}

async function lerCorpo(req) {
  const partes = [];
  for await (const parte of req) partes.push(parte);
  return partes.length > 0 ? JSON.parse(Buffer.concat(partes).toString('utf8')) : null;
}

arquivos.set('data/noticias.json', await readFile(path.join(raiz, 'data', 'noticias.json')));

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${porta}`);
    console.log(req.method, url.pathname);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      res.end();
      return;
    }

    // Rotas de apoio para inspecionar e provocar situações de teste
    if (url.pathname === '/__estado') {
      return responder(res, 200, {
        caminhos: [...arquivos.keys()],
        noticias: JSON.parse(arquivos.get('data/noticias.json').toString('utf8')),
      });
    }
    if (url.pathname === '/__conflito') {
      conflitosPendentes = Number(url.searchParams.get('vezes') ?? 1);
      return responder(res, 200, { conflitosPendentes });
    }
    if (url.pathname === '/__arquivo') {
      const conteudo = arquivos.get(url.searchParams.get('caminho'));
      if (!conteudo) return responder(res, 404, { message: 'Not Found' });
      res.writeHead(200, { ...CORS, 'Content-Type': 'image/jpeg' });
      res.end(conteudo);
      return;
    }

    if (req.headers.authorization !== `Bearer ${TOKEN}`) {
      return responder(res, 401, { message: 'Bad credentials' });
    }

    // /repos/:owner/:repo[/contents/<caminho>]
    const partes = url.pathname.split('/').filter(Boolean);
    if (partes[0] !== 'repos' || partes.length < 3) return responder(res, 404, { message: 'Not Found' });
    if (partes.length === 3) return responder(res, 200, { full_name: `${partes[1]}/${partes[2]}` });
    if (partes[3] !== 'contents') return responder(res, 404, { message: 'Not Found' });

    const caminho = partes.slice(4).map(decodeURIComponent).join('/');
    const atual = arquivos.get(caminho);

    if (req.method === 'GET') {
      if (!atual) return responder(res, 404, { message: 'Not Found' });
      return responder(res, 200, { content: atual.toString('base64'), sha: shaDe(atual), encoding: 'base64' });
    }

    const corpo = await lerCorpo(req);
    if (conflitosPendentes > 0) {
      conflitosPendentes -= 1;
      return responder(res, 409, { message: 'sha does not match' });
    }

    if (req.method === 'PUT') {
      if (atual && !corpo.sha) return responder(res, 422, { message: "sha wasn't supplied" });
      if (atual && corpo.sha !== shaDe(atual)) return responder(res, 409, { message: 'sha does not match' });
      const novo = Buffer.from(corpo.content, 'base64');
      arquivos.set(caminho, novo);
      return responder(res, atual ? 200 : 201, { content: { path: caminho, sha: shaDe(novo) } });
    }

    if (req.method === 'DELETE') {
      if (!atual) return responder(res, 404, { message: 'Not Found' });
      if (corpo.sha !== shaDe(atual)) return responder(res, 409, { message: 'sha does not match' });
      arquivos.delete(caminho);
      return responder(res, 200, { commit: { message: corpo.message } });
    }

    return responder(res, 405, { message: 'Method not allowed' });
  } catch (erro) {
    console.error(erro);
    responder(res, 500, { message: String(erro) });
  }
}).listen(porta, () => console.log(`GitHub falso em http://localhost:${porta} (token: ${TOKEN})`));
