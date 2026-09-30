# Jornal FA News Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o site do Jornal FA News (escola Félix de Azevedo) com página principal, mini blog de notícias e painel administrativo online que publica pelo GitHub, sem banco de dados.

**Architecture:** Site estático (HTML, CSS e JavaScript em módulos ES, sem build) publicado no GitHub Pages. As notícias ficam em `data/noticias.json`; as fotos, em `assets/noticias/`. O painel `/admin` lê e grava esses arquivos pela API de conteúdo do GitHub usando um token. A lógica que não depende do navegador vive em `js/lib/` e é testada com `node --test`; as telas são verificadas manualmente no navegador.

**Tech Stack:** HTML5, CSS3, JavaScript (ES modules), Node 20+ apenas para testes e servidores locais de desenvolvimento (sem dependências npm), PowerShell + System.Drawing para recortar os logos, GitHub Pages e API REST do GitHub.

**Spec:** `docs/superpowers/specs/2026-09-30-jornal-fa-news-design.md`

## Global Constraints

- Idioma de toda a interface e dos textos: português do Brasil. Identificadores de código em português, como na especificação (`gerarSlug`, `criarNoticia`, ...).
- Nome da escola exibido: "Félix de Azevedo" (sem "Colégio" ou "Escola" colado ao nome no rodapé). Nome do jornal: "Jornal FA News".
- Links e contatos exatos: YouTube `https://www.youtube.com/@JornalFA`; Instagram `https://www.instagram.com/jorna.lfa/`; WhatsApp `5585996333970` (exibido como `+55 85 99633-3970`); crédito "Isaac Paiva" com link `https://www.isaacpaiva.com.br/`; e-mail provisório `contato@jornalfa.example`.
- Nenhuma dependência npm. `package.json` só declara `"type": "module"` e scripts. Testes com `node --test`.
- Todo texto vindo de JSON ou do formulário entra no DOM com `textContent` (via `el()`/`montar()` de `js/lib/dom.js`). Proibido `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` e `eval` em `js/`.
- Caminhos de imagem só são aceitos se `imagemValida()` retornar `true` (pasta `assets/noticias/` para notícias, `assets/equipe/` para a equipe).
- O token do GitHub nunca vai para o repositório. Fica em `sessionStorage` (padrão) ou `localStorage` (opção "lembrar neste dispositivo"); "Sair" apaga os dois.
- Imagens de notícia: largura máxima de 1200px, JPEG, qualidade 0.85, enviadas para `assets/noticias/<id>.jpg`. Formatos aceitos: JPG, PNG, WebP; tamanho máximo do arquivo original: 15 MB.
- Notícia: título obrigatório (máx. 120 caracteres), data válida `AAAA-MM-DD`, resumo opcional (máx. 160), texto obrigatório, autor opcional. Linha em branco separa parágrafos.
- Conflito de gravação (HTTP 409/422): repetir leitura + gravação, no máximo 3 tentativas.
- Paleta (variáveis CSS em `:root`): azul `#0047ab`, azul escuro `#00307a`, azul profundo `#001f52`, amarelo `#ffdd57`, amarelo forte `#f5b800`, cinza `#d9d9d9`. Amarelo nunca é cor de texto sobre fundo branco. Fonte dos títulos: Montserrat (Google Fonts).
- Layout responsivo a partir de 360px, foco visível, `alt` nas imagens, respeito a `prefers-reduced-motion`.
- Todo commit termina com a linha `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>` (use um segundo `-m`).
- Ferramentas locais confirmadas: Node v24, Git 2.55, Windows PowerShell 5.1. Os comandos `curl` e `grep` destes passos são para o Bash (Git Bash); no PowerShell, `curl` é um alias de `Invoke-WebRequest`.

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `package.json`, `.gitignore`, `.nojekyll` | Scripts npm, arquivos ignorados, desliga o Jekyll do GitHub Pages |
| `scripts/recortar-logos.ps1` | Recorta as margens transparentes dos logos e gera `assets/logo-*.png`, `assets/icone.png` |
| `scripts/servir.js` | Servidor estático local (porta 4000) para desenvolvimento |
| `scripts/mock-github.js` | API de conteúdo do GitHub falsa (porta 4010) para testar o painel sem repositório real |
| `js/lib/slug.js` | `gerarSlug`, `gerarId` |
| `js/lib/texto.js` | `paragrafos` |
| `js/lib/formato.js` | `formatarData`, `iniciais`, `linkWhatsapp`, `imagemValida`, `resumoOuInicio`, `usuarioInstagram`, `dataIsoLocal` |
| `js/lib/modelo.js` | Validação, ordenação e mutações imutáveis da lista de notícias |
| `js/lib/github.js` | Cliente da API de conteúdo do GitHub (base64, leitura, gravação com repetição) |
| `js/lib/imagem.js` | Validação e preparo (redimensionar/converter) de imagem no navegador |
| `js/lib/publicar.js` | Orquestra "publicar/editar/excluir notícia" sobre um cliente GitHub injetado |
| `js/lib/dados.js` | `carregarJson` |
| `js/lib/dom.js` | `el`, `montar` (criação de DOM segura) |
| `js/main.js` | Menu, links vindos de `config.json`, equipe |
| `js/noticias.js` | Cards, lista e leitura de notícias no site público |
| `js/admin.js` | Interface do painel |
| `css/style.css`, `css/admin.css` | Estilos do site e do painel |
| `index.html`, `noticias.html`, `noticia.html`, `admin/index.html` | Páginas |
| `data/noticias.json`, `equipe.json`, `config.json` | Conteúdo e configuração |
| `tests/*.test.js`, `tests/_fetch-falso.js` | Testes automatizados e helper de fetch falso |
| `README.md` | Guia de publicação e uso |

---

### Task 1: Scaffolding, logos recortados e servidor local

**Files:**
- Create: `package.json`, `.gitignore`, `.nojekyll`
- Create: `scripts/recortar-logos.ps1`, `scripts/servir.js`
- Move: os 3 PNGs de `assets/` para `assets/originais/`
- Create (gerados): `assets/logo-jornal.png`, `assets/logo-escola.png`, `assets/icone.png`

**Interfaces:**
- Consumes: nada.
- Produces: `npm test`, `npm run servir` (http://localhost:4000), `npm run mock-github` (definido na Task 11); arquivos `assets/logo-jornal.png`, `assets/logo-escola.png`, `assets/icone.png` (fundo transparente, sem margens vazias; o ícone é quadrado).

- [ ] **Step 1: Inicializar o Git e criar os arquivos de configuração**

```powershell
git init -b main
if (-not (git config user.name)) { git config user.name "Isaac Paiva" }
if (-not (git config user.email)) { git config user.email "isaacpaivass@gmail.com" }
New-Item -ItemType File -Path .nojekyll | Out-Null
```

Criar `package.json`:

```json
{
  "name": "jornal-fa-news",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "Site do Jornal FA News, da escola Félix de Azevedo",
  "scripts": {
    "test": "node --test tests/*.test.js",
    "servir": "node scripts/servir.js",
    "mock-github": "node scripts/mock-github.js"
  }
}
```

Criar `.gitignore`:

```
node_modules/
*.log
.DS_Store
Thumbs.db
.env
.claude/settings.local.json
```

- [ ] **Step 2: Mover os logos originais**

```powershell
New-Item -ItemType Directory -Force assets\originais | Out-Null
Move-Item "assets\1000189664-removebg-preview.png", "assets\Logo da escola.png", "assets\Logo do jornal da escola.png" assets\originais\
Get-ChildItem assets\originais | Select-Object Name
```

Expected: três arquivos listados em `assets\originais`.

- [ ] **Step 3: Criar o script que recorta os logos**

Criar `scripts/recortar-logos.ps1`:

```powershell
# Recorta as margens transparentes dos logos e grava as versões otimizadas em assets/.
# Uso, na raiz do projeto:
#   powershell -ExecutionPolicy Bypass -File scripts/recortar-logos.ps1
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$pastaOrigem = Join-Path $raiz 'assets\originais'
$pastaDestino = Join-Path $raiz 'assets'
$margem = 6

function Recortar {
  param([string]$Entrada, [string]$CaminhoSaida, [bool]$Quadrado)

  $fonte = New-Object System.Drawing.Bitmap($Entrada)
  try {
    $minX = $fonte.Width; $minY = $fonte.Height; $maxX = -1; $maxY = -1
    for ($y = 0; $y -lt $fonte.Height; $y++) {
      for ($x = 0; $x -lt $fonte.Width; $x++) {
        if ($fonte.GetPixel($x, $y).A -gt 16) {
          if ($x -lt $minX) { $minX = $x }
          if ($x -gt $maxX) { $maxX = $x }
          if ($y -lt $minY) { $minY = $y }
          if ($y -gt $maxY) { $maxY = $y }
        }
      }
    }
    if ($maxX -lt 0) { throw "Imagem sem conteudo visivel: $Entrada" }

    $minX = [Math]::Max(0, $minX - $margem)
    $minY = [Math]::Max(0, $minY - $margem)
    $maxX = [Math]::Min($fonte.Width - 1, $maxX + $margem)
    $maxY = [Math]::Min($fonte.Height - 1, $maxY + $margem)
    $largura = $maxX - $minX + 1
    $altura = $maxY - $minY + 1

    if ($Quadrado) {
      $telaL = [Math]::Max($largura, $altura)
      $telaA = $telaL
    } else {
      $telaL = $largura
      $telaA = $altura
    }
    $dx = [int][Math]::Floor(($telaL - $largura) / 2)
    $dy = [int][Math]::Floor(($telaA - $altura) / 2)

    $imagemFinal = New-Object System.Drawing.Bitmap($telaL, $telaA, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
      $g = [System.Drawing.Graphics]::FromImage($imagemFinal)
      try {
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $destino = [System.Drawing.Rectangle]::new($dx, $dy, $largura, $altura)
        $origem = [System.Drawing.Rectangle]::new($minX, $minY, $largura, $altura)
        $g.DrawImage($fonte, $destino, $origem, [System.Drawing.GraphicsUnit]::Pixel)
      } finally { $g.Dispose() }
      $imagemFinal.Save($CaminhoSaida, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $imagemFinal.Dispose() }
    Write-Host ("{0}: {1}x{2} -> {3}x{4}" -f (Split-Path $Entrada -Leaf), $fonte.Width, $fonte.Height, $telaL, $telaA)
  } finally { $fonte.Dispose() }
}

Recortar (Join-Path $pastaOrigem 'Logo do jornal da escola.png') (Join-Path $pastaDestino 'logo-jornal.png') $false
Recortar (Join-Path $pastaOrigem 'Logo da escola.png') (Join-Path $pastaDestino 'logo-escola.png') $false
Recortar (Join-Path $pastaOrigem '1000189664-removebg-preview.png') (Join-Path $pastaDestino 'icone.png') $true
```

- [ ] **Step 4: Rodar o script e conferir**

Run: `powershell -ExecutionPolicy Bypass -File scripts/recortar-logos.ps1`
Expected: três linhas no formato `arquivo.png: 666x375 -> LxA` (a largura e a altura finais menores que as originais; o ícone com largura igual à altura).

Depois, abrir `assets/logo-jornal.png`, `assets/logo-escola.png` e `assets/icone.png` com a ferramenta de leitura de imagens e conferir: logo recortado sem grande faixa vazia, sem partes cortadas (o "S" de NEWS, a chama do brasão) e o ícone quadrado.

- [ ] **Step 5: Criar o servidor estático local**

Criar `scripts/servir.js`:

```js
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
```

- [ ] **Step 6: Verificar o servidor**

Run (em segundo plano): `npm run servir`
Run: `curl -s -o /dev/null -w "%{http_code} %{content_type}\n" http://localhost:4000/assets/icone.png`
Expected: `200 image/png`

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4000/nao-existe`
Expected: `404`

Run: `curl -s -o /dev/null -w "%{http_code}\n" --path-as-is "http://localhost:4000/..%5c..%5c..%5cWindows%5cwin.ini"`
Expected: `404` ou `403`, nunca `200` (o servidor não pode entregar arquivos de fora da pasta do projeto).

Parar o servidor.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: estrutura inicial, logos recortados e servidor local" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: `slug.js` — id das notícias

**Files:**
- Create: `js/lib/slug.js`
- Test: `tests/slug.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `gerarSlug(titulo: string): string` — minúsculas, sem acentos, hífens, máx. 60 caracteres, sem hífen no fim; devolve `'noticia'` se não sobrar nada.
  - `gerarId(dataIso: string, titulo: string, idsExistentes?: string[]): string` — `"<dataIso>-<slug>"`, com sufixo `-2`, `-3`... se já existir.

- [ ] **Step 1: Escrever os testes**

Criar `tests/slug.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gerarSlug, gerarId } from '../js/lib/slug.js';

test('gerarSlug remove acentos e símbolos e usa hífens', () => {
  assert.equal(gerarSlug('Feira de Ciências!'), 'feira-de-ciencias');
  assert.equal(gerarSlug('  Ação & Reação: 2 edição  '), 'acao-reacao-2-edicao');
});

test('gerarSlug limita o tamanho a 60 caracteres sem hífen no fim', () => {
  const slug = gerarSlug('a'.repeat(59) + ' bbbbbbbbbb');
  assert.equal(slug, 'a'.repeat(59));
});

test('gerarSlug devolve "noticia" quando não sobra nada', () => {
  assert.equal(gerarSlug('!!!'), 'noticia');
  assert.equal(gerarSlug(''), 'noticia');
  assert.equal(gerarSlug(undefined), 'noticia');
});

test('gerarId junta a data e o slug', () => {
  assert.equal(gerarId('2026-09-30', 'Feira de Ciências'), '2026-09-30-feira-de-ciencias');
});

test('gerarId acrescenta sufixo quando o id já existe', () => {
  const existentes = ['2026-09-30-feira', '2026-09-30-feira-2'];
  assert.equal(gerarId('2026-09-30', 'Feira', existentes), '2026-09-30-feira-3');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/slug.test.js`
Expected: FAIL com `ERR_MODULE_NOT_FOUND` (arquivo `js/lib/slug.js` não existe).

- [ ] **Step 3: Implementar**

Criar `js/lib/slug.js`:

```js
const TAMANHO_MAXIMO = 60;

export function gerarSlug(titulo) {
  const base = String(titulo ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, TAMANHO_MAXIMO)
    .replace(/-+$/g, '');
  return base || 'noticia';
}

export function gerarId(dataIso, titulo, idsExistentes = []) {
  const base = `${dataIso}-${gerarSlug(titulo)}`;
  const usados = new Set(idsExistentes);
  if (!usados.has(base)) return base;
  let numero = 2;
  while (usados.has(`${base}-${numero}`)) numero += 1;
  return `${base}-${numero}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: 5 testes passando, 0 falhas. (Confirma também que o glob `tests/*.test.js` funciona.)

- [ ] **Step 5: Commit**

```bash
git add js/lib/slug.js tests/slug.test.js
git commit -m "feat: gera id e slug das notícias" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: `texto.js` e `formato.js` — parágrafos e formatação

**Files:**
- Create: `js/lib/texto.js`, `js/lib/formato.js`
- Test: `tests/texto.test.js`, `tests/formato.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `paragrafos(texto: string): string[]` — divide em linhas em branco, apara, descarta vazios; quebras simples dentro do parágrafo são mantidas (`\n`); o texto nunca é interpretado como HTML.
  - `formatarData(iso: string): string` — `"2026-09-30"` → `"30 de setembro de 2026"`; inválida → `""`.
  - `iniciais(nome: string): string` — primeira letra do primeiro e do último nome, maiúsculas; vazio → `"?"`.
  - `linkWhatsapp(numero: string, mensagem?: string): string` — `https://wa.me/<dígitos>[?text=<codificada>]`.
  - `imagemValida(caminho: unknown, pasta?: string): boolean` — `pasta` padrão `'assets/noticias/'`; exige prefixo da pasta, sem `..`, extensão jpg/jpeg/png/webp.
  - `resumoOuInicio(noticia: {resumo?: string, texto?: string}, limite?: number): string` — usa o resumo; se vazio, o começo do texto (com `…`), limite padrão 160.
  - `usuarioInstagram(url: string): string` — `"https://www.instagram.com/jorna.lfa/"` → `"jorna.lfa"`; inválida → `""`.
  - `dataIsoLocal(data?: Date): string` — `AAAA-MM-DD` no fuso local.

- [ ] **Step 1: Escrever os testes**

Criar `tests/texto.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paragrafos } from '../js/lib/texto.js';

test('paragrafos separa por linhas em branco e ignora excesso', () => {
  assert.deepEqual(paragrafos('A\n\nB\n\n\n\nC'), ['A', 'B', 'C']);
});

test('paragrafos mantém quebras simples dentro do parágrafo', () => {
  assert.deepEqual(paragrafos('linha 1\nlinha 2\n\nB'), ['linha 1\nlinha 2', 'B']);
});

test('paragrafos normaliza quebras do Windows', () => {
  assert.deepEqual(paragrafos('A\r\n\r\nB'), ['A', 'B']);
});

test('paragrafos devolve lista vazia para texto vazio ou só espaços', () => {
  assert.deepEqual(paragrafos(''), []);
  assert.deepEqual(paragrafos('  \n\n  '), []);
  assert.deepEqual(paragrafos(undefined), []);
});

test('paragrafos não interpreta HTML', () => {
  assert.deepEqual(paragrafos('<b>oi</b>\n\n<script>x</script>'), ['<b>oi</b>', '<script>x</script>']);
});
```

Criar `tests/formato.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatarData,
  iniciais,
  linkWhatsapp,
  imagemValida,
  resumoOuInicio,
  usuarioInstagram,
  dataIsoLocal,
} from '../js/lib/formato.js';

test('formatarData escreve a data em português', () => {
  assert.equal(formatarData('2026-09-30'), '30 de setembro de 2026');
  assert.equal(formatarData('2026-01-05'), '5 de janeiro de 2026');
});

test('formatarData devolve vazio para valores inválidos', () => {
  assert.equal(formatarData('30/09/2026'), '');
  assert.equal(formatarData(undefined), '');
  assert.equal(formatarData('2026-13-40'), '');
});

test('iniciais usa o primeiro e o último nome', () => {
  assert.equal(iniciais('Maria Exemplo'), 'ME');
  assert.equal(iniciais('joão da silva'), 'JS');
  assert.equal(iniciais('Ana'), 'A');
  assert.equal(iniciais('   '), '?');
});

test('linkWhatsapp monta o link com a mensagem codificada', () => {
  assert.equal(
    linkWhatsapp('+55 85 99633-3970', 'Olá! Tenho interesse'),
    'https://wa.me/5585996333970?text=Ol%C3%A1!%20Tenho%20interesse',
  );
  assert.equal(linkWhatsapp('5585996333970'), 'https://wa.me/5585996333970');
});

test('imagemValida aceita só imagens dentro da pasta esperada', () => {
  assert.equal(imagemValida('assets/noticias/a.jpg'), true);
  assert.equal(imagemValida('assets/noticias/a.WEBP'), true);
  assert.equal(imagemValida('assets/equipe/ana.png', 'assets/equipe/'), true);
  assert.equal(imagemValida('assets/equipe/ana.png'), false);
  assert.equal(imagemValida('https://exemplo.com/a.jpg'), false);
  assert.equal(imagemValida('/etc/passwd'), false);
  assert.equal(imagemValida('assets/noticias/../../a.jpg'), false);
  assert.equal(imagemValida('assets/noticias/a.gif'), false);
  assert.equal(imagemValida('assets/noticias/a.jpg?x=1'), false);
  assert.equal(imagemValida(null), false);
});

test('resumoOuInicio usa o resumo quando existe', () => {
  assert.equal(resumoOuInicio({ resumo: ' Um resumo ', texto: 'Texto longo' }), 'Um resumo');
});

test('resumoOuInicio corta o texto quando não há resumo', () => {
  const texto = 'palavra '.repeat(40);
  const resultado = resumoOuInicio({ resumo: '', texto }, 50);
  assert.ok(resultado.length <= 50);
  assert.ok(resultado.endsWith('…'));
  assert.equal(resumoOuInicio({ texto: 'Curto\n\ntexto' }), 'Curto texto');
});

test('usuarioInstagram extrai o usuário da URL', () => {
  assert.equal(usuarioInstagram('https://www.instagram.com/jorna.lfa/'), 'jorna.lfa');
  assert.equal(usuarioInstagram('não é url'), '');
});

test('dataIsoLocal formata no fuso local', () => {
  assert.equal(dataIsoLocal(new Date(2026, 8, 5)), '2026-09-05');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/texto.test.js tests/formato.test.js`
Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar**

Criar `js/lib/texto.js`:

```js
// Divide o texto de uma notícia em parágrafos. Linha em branco separa parágrafos;
// quebras simples ficam dentro do parágrafo e o CSS as exibe (white-space: pre-line).
// O resultado é sempre texto puro: quem exibe deve usar textContent.
export function paragrafos(texto) {
  return String(texto ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}
```

Criar `js/lib/formato.js`:

```js
const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

export function formatarData(iso) {
  if (!DATA_ISO.test(iso ?? '')) return '';
  const data = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(data.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(data);
}

export function iniciais(nome) {
  const partes = String(nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

export function linkWhatsapp(numero, mensagem = '') {
  const digitos = String(numero).replace(/\D/g, '');
  return mensagem
    ? `https://wa.me/${digitos}?text=${encodeURIComponent(mensagem)}`
    : `https://wa.me/${digitos}`;
}

export function imagemValida(caminho, pasta = 'assets/noticias/') {
  return (
    typeof caminho === 'string' &&
    caminho.startsWith(pasta) &&
    !caminho.includes('..') &&
    /\.(jpe?g|png|webp)$/i.test(caminho)
  );
}

export function resumoOuInicio(noticia, limite = 160) {
  const resumo = (noticia.resumo ?? '').trim();
  if (resumo) return resumo;
  const texto = (noticia.texto ?? '').replace(/\s+/g, ' ').trim();
  return texto.length <= limite ? texto : `${texto.slice(0, limite - 1).trimEnd()}…`;
}

export function usuarioInstagram(url) {
  try {
    return new URL(url).pathname.split('/').filter(Boolean)[0] ?? '';
  } catch {
    return '';
  }
}

export function dataIsoLocal(data = new Date()) {
  const dois = (numero) => String(numero).padStart(2, '0');
  return `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: todos os testes passando (slug + texto + formato), 0 falhas.

- [ ] **Step 5: Commit**

```bash
git add js/lib/texto.js js/lib/formato.js tests/texto.test.js tests/formato.test.js
git commit -m "feat: formatação de data, parágrafos, WhatsApp e validação de imagem" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `modelo.js` — validar, ordenar, criar, editar, excluir

**Files:**
- Create: `js/lib/modelo.js`
- Test: `tests/modelo.test.js`

**Interfaces:**
- Consumes: nada.
- Produces (todas as funções são puras e não mudam a lista recebida):
  - `LIMITE_RESUMO = 160`, `LIMITE_TITULO = 120`
  - `validar(dados: {titulo, autor?, data, resumo?, texto}): string[]` — mensagens de erro; vazio se tudo certo.
  - `ordenar(lista): Noticia[]` — data mais recente primeiro; empate mantém a ordem da lista.
  - `buscar(lista, id): Noticia | undefined`
  - `criarNoticia(lista, dados, id): Noticia[]` — coloca a nova no início; lança `Error('Já existe uma notícia com este identificador.')` se o id existir.
  - `editarNoticia(lista, id, dados): Noticia[]` — mantém o `id`; se `dados` não tiver a chave `imagem`, mantém a imagem atual; lança `Error('Esta notícia não existe mais.')` se o id não existir.
  - `excluirNoticia(lista, id): Noticia[]` — lança o mesmo erro se não existir.
  - `Noticia = { id, titulo, autor, data, resumo, texto, imagem: string|null }`

- [ ] **Step 1: Escrever os testes**

Criar `tests/modelo.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITE_RESUMO,
  validar,
  ordenar,
  buscar,
  criarNoticia,
  editarNoticia,
  excluirNoticia,
} from '../js/lib/modelo.js';

const base = {
  titulo: 'Título',
  autor: 'Equipe',
  data: '2026-09-30',
  resumo: 'Resumo',
  texto: 'Texto',
};

test('validar aceita dados corretos', () => {
  assert.deepEqual(validar(base), []);
});

test('validar exige título e texto', () => {
  const erros = validar({ ...base, titulo: '  ', texto: '' });
  assert.equal(erros.length, 2);
  assert.match(erros[0], /título/i);
  assert.match(erros[1], /texto/i);
});

test('validar recusa data inexistente', () => {
  assert.equal(validar({ ...base, data: '2026-02-30' }).length, 1);
  assert.equal(validar({ ...base, data: '30/09/2026' }).length, 1);
  assert.equal(validar({ ...base, data: '' }).length, 1);
});

test('validar limita o resumo e o título', () => {
  assert.equal(validar({ ...base, resumo: 'x'.repeat(LIMITE_RESUMO + 1) }).length, 1);
  assert.deepEqual(validar({ ...base, resumo: 'x'.repeat(LIMITE_RESUMO) }), []);
  assert.equal(validar({ ...base, titulo: 'x'.repeat(121) }).length, 1);
});

test('validar aceita autor e resumo vazios', () => {
  assert.deepEqual(validar({ titulo: 'T', data: '2026-09-30', texto: 'X' }), []);
});

test('ordenar coloca a data mais recente primeiro e mantém a ordem nos empates', () => {
  const lista = [
    { id: 'a', data: '2026-09-01' },
    { id: 'b', data: '2026-09-30' },
    { id: 'c', data: '2026-09-30' },
  ];
  assert.deepEqual(ordenar(lista).map((n) => n.id), ['b', 'c', 'a']);
  assert.deepEqual(lista.map((n) => n.id), ['a', 'b', 'c']);
});

test('criarNoticia coloca no início, normaliza e não altera a lista original', () => {
  const lista = [{ id: 'velha', ...base }];
  const nova = criarNoticia(lista, { ...base, titulo: '  Novo  ', texto: 'A\r\nB  ' }, 'nova');
  assert.equal(nova.length, 2);
  assert.equal(nova[0].id, 'nova');
  assert.equal(nova[0].titulo, 'Novo');
  assert.equal(nova[0].texto, 'A\nB');
  assert.equal(nova[0].imagem, null);
  assert.equal(lista.length, 1);
});

test('criarNoticia recusa id repetido', () => {
  assert.throws(() => criarNoticia([{ id: 'x', ...base }], base, 'x'), /Já existe/);
});

test('editarNoticia mantém o id e a imagem quando a chave imagem não vem', () => {
  const lista = [{ id: 'x', ...base, imagem: 'assets/noticias/x.jpg' }];
  const editada = editarNoticia(lista, 'x', { ...base, titulo: 'Outro' });
  assert.equal(editada[0].id, 'x');
  assert.equal(editada[0].titulo, 'Outro');
  assert.equal(editada[0].imagem, 'assets/noticias/x.jpg');
});

test('editarNoticia troca ou remove a imagem quando a chave vem', () => {
  const lista = [{ id: 'x', ...base, imagem: 'assets/noticias/x.jpg' }];
  assert.equal(editarNoticia(lista, 'x', { ...base, imagem: null })[0].imagem, null);
});

test('editarNoticia e excluirNoticia falham para id inexistente', () => {
  assert.throws(() => editarNoticia([], 'x', base), /não existe mais/);
  assert.throws(() => excluirNoticia([], 'x'), /não existe mais/);
});

test('excluirNoticia remove só a notícia pedida', () => {
  const lista = [{ id: 'a', ...base }, { id: 'b', ...base }];
  assert.deepEqual(excluirNoticia(lista, 'a').map((n) => n.id), ['b']);
  assert.equal(buscar(lista, 'b').id, 'b');
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/modelo.test.js`
Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar**

Criar `js/lib/modelo.js`:

```js
export const LIMITE_RESUMO = 160;
export const LIMITE_TITULO = 120;

const DATA_ISO = /^\d{4}-\d{2}-\d{2}$/;

function dataValida(texto) {
  if (!DATA_ISO.test(texto)) return false;
  const data = new Date(`${texto}T00:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === texto;
}

export function validar(dados) {
  const erros = [];
  const titulo = (dados.titulo ?? '').trim();
  const resumo = (dados.resumo ?? '').trim();
  const texto = (dados.texto ?? '').trim();

  if (!titulo) erros.push('Informe o título.');
  else if (titulo.length > LIMITE_TITULO) erros.push(`O título pode ter no máximo ${LIMITE_TITULO} caracteres.`);
  if (!dataValida(dados.data ?? '')) erros.push('Informe uma data válida.');
  if (resumo.length > LIMITE_RESUMO) erros.push(`O resumo pode ter no máximo ${LIMITE_RESUMO} caracteres.`);
  if (!texto) erros.push('Escreva o texto da notícia.');
  return erros;
}

export function ordenar(lista) {
  return [...lista].sort((a, b) => {
    if (a.data < b.data) return 1;
    if (a.data > b.data) return -1;
    return 0;
  });
}

export function buscar(lista, id) {
  return lista.find((noticia) => noticia.id === id);
}

function normalizar(dados) {
  return {
    titulo: dados.titulo.trim(),
    autor: (dados.autor ?? '').trim(),
    data: dados.data,
    resumo: (dados.resumo ?? '').trim(),
    texto: dados.texto.replace(/\r\n/g, '\n').trim(),
    imagem: dados.imagem ?? null,
  };
}

export function criarNoticia(lista, dados, id) {
  if (buscar(lista, id)) throw new Error('Já existe uma notícia com este identificador.');
  return [{ id, ...normalizar(dados) }, ...lista];
}

export function editarNoticia(lista, id, dados) {
  const atual = buscar(lista, id);
  if (!atual) throw new Error('Esta notícia não existe mais.');
  return lista.map((noticia) =>
    noticia.id === id ? { id, ...normalizar({ imagem: atual.imagem, ...dados }) } : noticia,
  );
}

export function excluirNoticia(lista, id) {
  if (!buscar(lista, id)) throw new Error('Esta notícia não existe mais.');
  return lista.filter((noticia) => noticia.id !== id);
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: todos os testes passando, 0 falhas.

- [ ] **Step 5: Commit**

```bash
git add js/lib/modelo.js tests/modelo.test.js
git commit -m "feat: modelo de notícias com validação e operações imutáveis" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: `github.js` — cliente da API de conteúdo do GitHub

**Files:**
- Create: `js/lib/github.js`
- Create: `tests/_fetch-falso.js` (helper, não é teste)
- Test: `tests/github.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `class ErroGitHub extends Error` com `tipo: 'token' | 'rede' | 'conflito' | 'naoencontrado' | 'desconhecido'` e `status: number | null`.
  - `paraBase64(texto: string): string`, `deBase64(base64: string): string` (UTF-8 seguro).
  - `criarClienteGitHub({ owner, repo, branch = 'main', token, apiUrl = 'https://api.github.com', fetchFn = fetch })` devolve:
    - `validarAcesso(): Promise<void>`
    - `lerJson(caminho): Promise<{ dados: any, sha: string }>`
    - `atualizarJson(caminho, mutar: (dados) => novosDados, mensagem, tentativas = 3): Promise<any>` — lê, aplica `mutar`, grava com o `sha`; em conflito relê e repete; erros lançados por `mutar` propagam sem gravar.
    - `enviarArquivo(caminho, base64, mensagem): Promise<void>` — cria ou substitui.
    - `apagarArquivo(caminho, mensagem): Promise<void>` — não faz nada se o arquivo não existir.
  - Todas as requisições enviam `Authorization: Bearer <token>`, `Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28` e `cache: 'no-store'`.

- [ ] **Step 1: Criar o helper de fetch falso**

Criar `tests/_fetch-falso.js`:

```js
import { paraBase64 } from '../js/lib/github.js';

// Cria um fetch falso. `tratador({ url, metodo, corpo, numero })` devolve { status, corpo }.
// O fetch falso guarda cada chamada em `fetchFalso.chamadas`.
export function criarFetchFalso(tratador) {
  const chamadas = [];
  async function fetchFalso(url, init = {}) {
    const metodo = init.method ?? 'GET';
    const corpo = init.body ? JSON.parse(init.body) : null;
    chamadas.push({ url, metodo, corpo, cabecalhos: init.headers ?? {}, cache: init.cache });
    const resposta = await tratador({ url, metodo, corpo, numero: chamadas.length });
    return {
      ok: resposta.status >= 200 && resposta.status < 300,
      status: resposta.status,
      json: async () => resposta.corpo,
    };
  }
  fetchFalso.chamadas = chamadas;
  return fetchFalso;
}

// Resposta de GET /contents/... para um arquivo JSON.
export function arquivoRemoto(objeto, sha) {
  return {
    status: 200,
    corpo: { content: paraBase64(JSON.stringify(objeto)), sha, encoding: 'base64' },
  };
}
```

- [ ] **Step 2: Escrever os testes**

Criar `tests/github.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarClienteGitHub, ErroGitHub, paraBase64, deBase64 } from '../js/lib/github.js';
import { criarFetchFalso, arquivoRemoto } from './_fetch-falso.js';

function novoCliente(fetchFn, extra = {}) {
  return criarClienteGitHub({ owner: 'dono', repo: 'repo', branch: 'main', token: 't0k3n', fetchFn, ...extra });
}

test('base64 preserva acentos e emoji', () => {
  const texto = 'Ação — céu 🌟';
  assert.equal(deBase64(paraBase64(texto)), texto);
});

test('deBase64 ignora quebras de linha do GitHub', () => {
  const b64 = paraBase64('olá mundo');
  const comQuebras = `${b64.slice(0, 4)}\n${b64.slice(4)}\n`;
  assert.equal(deBase64(comQuebras), 'olá mundo');
});

test('validarAcesso consulta o repositório com o token', async () => {
  const fetchFalso = criarFetchFalso(() => ({ status: 200, corpo: {} }));
  await novoCliente(fetchFalso).validarAcesso();
  const [chamada] = fetchFalso.chamadas;
  assert.equal(chamada.url, 'https://api.github.com/repos/dono/repo');
  assert.equal(chamada.cabecalhos.Authorization, 'Bearer t0k3n');
  assert.equal(chamada.cabecalhos.Accept, 'application/vnd.github+json');
  assert.equal(chamada.cache, 'no-store');
});

test('validarAcesso classifica 401 como erro de token', async () => {
  const fetchFalso = criarFetchFalso(() => ({ status: 401, corpo: {} }));
  await assert.rejects(novoCliente(fetchFalso).validarAcesso(), (erro) => {
    assert.ok(erro instanceof ErroGitHub);
    assert.equal(erro.tipo, 'token');
    assert.equal(erro.status, 401);
    return true;
  });
});

test('falha de rede vira ErroGitHub do tipo rede', async () => {
  const cliente = novoCliente(async () => {
    throw new TypeError('Failed to fetch');
  });
  await assert.rejects(cliente.validarAcesso(), (erro) => erro instanceof ErroGitHub && erro.tipo === 'rede');
});

test('lerJson decodifica o conteúdo e devolve o sha', async () => {
  const fetchFalso = criarFetchFalso(() => arquivoRemoto({ noticias: [{ titulo: 'Ação' }] }, 'abc123'));
  const resultado = await novoCliente(fetchFalso).lerJson('data/noticias.json');
  assert.deepEqual(resultado.dados, { noticias: [{ titulo: 'Ação' }] });
  assert.equal(resultado.sha, 'abc123');
  assert.equal(
    fetchFalso.chamadas[0].url,
    'https://api.github.com/repos/dono/repo/contents/data/noticias.json?ref=main',
  );
});

test('atualizarJson lê, aplica a mudança e grava com o sha', async () => {
  const fetchFalso = criarFetchFalso(({ metodo }) =>
    metodo === 'GET' ? arquivoRemoto({ noticias: ['a'] }, 'sha1') : { status: 200, corpo: {} },
  );
  const novos = await novoCliente(fetchFalso).atualizarJson(
    'data/noticias.json',
    (dados) => ({ noticias: [...dados.noticias, 'b'] }),
    'Publica notícia',
  );
  assert.deepEqual(novos, { noticias: ['a', 'b'] });
  const put = fetchFalso.chamadas.find((c) => c.metodo === 'PUT');
  assert.equal(put.corpo.sha, 'sha1');
  assert.equal(put.corpo.message, 'Publica notícia');
  assert.equal(put.corpo.branch, 'main');
  assert.deepEqual(JSON.parse(deBase64(put.corpo.content)), { noticias: ['a', 'b'] });
});

test('atualizarJson tenta de novo quando há conflito', async () => {
  let versao = 0;
  const fetchFalso = criarFetchFalso(({ metodo }) => {
    if (metodo === 'GET') {
      versao += 1;
      return arquivoRemoto({ noticias: [versao] }, `sha${versao}`);
    }
    return versao === 1 ? { status: 409, corpo: {} } : { status: 200, corpo: {} };
  });
  const vistos = [];
  await novoCliente(fetchFalso).atualizarJson(
    'data/noticias.json',
    (dados) => {
      vistos.push(dados.noticias[0]);
      return { noticias: [...dados.noticias, 'novo'] };
    },
    'msg',
  );
  assert.deepEqual(vistos, [1, 2]);
  const puts = fetchFalso.chamadas.filter((c) => c.metodo === 'PUT');
  assert.equal(puts.length, 2);
  assert.equal(puts[1].corpo.sha, 'sha2');
  assert.deepEqual(JSON.parse(deBase64(puts[1].corpo.content)), { noticias: [2, 'novo'] });
});

test('atualizarJson desiste depois de 3 conflitos', async () => {
  const fetchFalso = criarFetchFalso(({ metodo }) =>
    metodo === 'GET' ? arquivoRemoto({ noticias: [] }, 'sha') : { status: 409, corpo: {} },
  );
  await assert.rejects(
    novoCliente(fetchFalso).atualizarJson('data/noticias.json', (d) => d, 'msg'),
    (erro) => erro instanceof ErroGitHub && erro.tipo === 'conflito',
  );
  assert.equal(fetchFalso.chamadas.filter((c) => c.metodo === 'PUT').length, 3);
});

test('atualizarJson não grava quando a mudança lança erro', async () => {
  const fetchFalso = criarFetchFalso(() => arquivoRemoto({ noticias: [] }, 'sha'));
  await assert.rejects(
    novoCliente(fetchFalso).atualizarJson('data/noticias.json', () => {
      throw new Error('Esta notícia não existe mais.');
    }, 'msg'),
    /não existe mais/,
  );
  assert.equal(fetchFalso.chamadas.filter((c) => c.metodo === 'PUT').length, 0);
});

test('enviarArquivo cria o arquivo quando ele não existe', async () => {
  const fetchFalso = criarFetchFalso(({ metodo }) =>
    metodo === 'GET' ? { status: 404, corpo: {} } : { status: 201, corpo: {} },
  );
  await novoCliente(fetchFalso).enviarArquivo('assets/noticias/x.jpg', 'QUJD', 'Imagem');
  const put = fetchFalso.chamadas.find((c) => c.metodo === 'PUT');
  assert.equal(put.corpo.content, 'QUJD');
  assert.equal('sha' in put.corpo, false);
});

test('enviarArquivo substitui usando o sha do arquivo existente', async () => {
  const fetchFalso = criarFetchFalso(({ metodo }) =>
    metodo === 'GET' ? { status: 200, corpo: { sha: 'antigo' } } : { status: 200, corpo: {} },
  );
  await novoCliente(fetchFalso).enviarArquivo('assets/noticias/x.jpg', 'QUJD', 'Imagem');
  assert.equal(fetchFalso.chamadas.find((c) => c.metodo === 'PUT').corpo.sha, 'antigo');
});

test('apagarArquivo remove usando o sha e ignora arquivo inexistente', async () => {
  const existente = criarFetchFalso(({ metodo }) =>
    metodo === 'GET' ? { status: 200, corpo: { sha: 's9' } } : { status: 200, corpo: {} },
  );
  await novoCliente(existente).apagarArquivo('assets/noticias/x.jpg', 'Remove');
  const apagar = existente.chamadas.find((c) => c.metodo === 'DELETE');
  assert.equal(apagar.corpo.sha, 's9');
  assert.equal(apagar.corpo.message, 'Remove');

  const ausente = criarFetchFalso(() => ({ status: 404, corpo: {} }));
  await novoCliente(ausente).apagarArquivo('assets/noticias/x.jpg', 'Remove');
  assert.equal(ausente.chamadas.filter((c) => c.metodo === 'DELETE').length, 0);
});

test('apiUrl personalizada é respeitada', async () => {
  const fetchFalso = criarFetchFalso(() => ({ status: 200, corpo: {} }));
  await novoCliente(fetchFalso, { apiUrl: 'http://localhost:4010' }).validarAcesso();
  assert.equal(fetchFalso.chamadas[0].url, 'http://localhost:4010/repos/dono/repo');
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `node --test tests/github.test.js`
Expected: FAIL com `ERR_MODULE_NOT_FOUND` (`github.js` não existe).

- [ ] **Step 4: Implementar**

Criar `js/lib/github.js`:

```js
// Cliente mínimo da API de conteúdo do GitHub (https://docs.github.com/rest/repos/contents).
// Não depende do DOM. O `fetch` pode ser injetado para testes.

export class ErroGitHub extends Error {
  // tipo: 'token' | 'rede' | 'conflito' | 'naoencontrado' | 'desconhecido'
  constructor(tipo, mensagem, status = null) {
    super(mensagem);
    this.name = 'ErroGitHub';
    this.tipo = tipo;
    this.status = status;
  }
}

export function paraBase64(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario);
}

export function deBase64(base64) {
  const binario = atob(base64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binario, (caractere) => caractere.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function criarClienteGitHub({
  owner,
  repo,
  branch = 'main',
  token,
  apiUrl = 'https://api.github.com',
  fetchFn = fetch,
}) {
  const base = `${apiUrl}/repos/${owner}/${repo}`;
  const cabecalhos = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  const urlConteudo = (caminho) =>
    `${base}/contents/${caminho.split('/').map(encodeURIComponent).join('/')}`;
  const urlLeitura = (caminho) => `${urlConteudo(caminho)}?ref=${encodeURIComponent(branch)}`;

  async function requisitar(metodo, url, corpo) {
    let resposta;
    try {
      resposta = await fetchFn(url, {
        method: metodo,
        headers: corpo ? { ...cabecalhos, 'Content-Type': 'application/json' } : cabecalhos,
        body: corpo ? JSON.stringify(corpo) : undefined,
        cache: 'no-store',
      });
    } catch {
      throw new ErroGitHub('rede', 'Sem conexão com a internet. Verifique sua rede e tente de novo.');
    }
    if (resposta.ok) return resposta.status === 204 ? null : resposta.json();

    const status = resposta.status;
    if (status === 401 || status === 403) {
      throw new ErroGitHub('token', 'O token é inválido, expirou ou não tem permissão neste repositório.', status);
    }
    if (status === 404) throw new ErroGitHub('naoencontrado', 'Repositório ou arquivo não encontrado.', status);
    if (status === 409 || status === 422) {
      throw new ErroGitHub('conflito', 'Outra pessoa alterou o conteúdo ao mesmo tempo.', status);
    }
    throw new ErroGitHub('desconhecido', `O GitHub respondeu com erro ${status}.`, status);
  }

  async function validarAcesso() {
    await requisitar('GET', base);
  }

  async function lerJson(caminho) {
    const arquivo = await requisitar('GET', urlLeitura(caminho));
    return { dados: JSON.parse(deBase64(arquivo.content)), sha: arquivo.sha };
  }

  async function obterSha(caminho) {
    try {
      return (await requisitar('GET', urlLeitura(caminho))).sha;
    } catch (erro) {
      if (erro instanceof ErroGitHub && erro.tipo === 'naoencontrado') return null;
      throw erro;
    }
  }

  function gravar(caminho, base64, mensagem, sha) {
    const corpo = { message: mensagem, content: base64, branch };
    if (sha) corpo.sha = sha;
    return requisitar('PUT', urlConteudo(caminho), corpo);
  }

  async function atualizarJson(caminho, mutar, mensagem, tentativas = 3) {
    for (let tentativa = 1; ; tentativa += 1) {
      const { dados, sha } = await lerJson(caminho);
      const novos = mutar(dados);
      try {
        await gravar(caminho, paraBase64(`${JSON.stringify(novos, null, 2)}\n`), mensagem, sha);
        return novos;
      } catch (erro) {
        const conflito = erro instanceof ErroGitHub && erro.tipo === 'conflito';
        if (!conflito || tentativa >= tentativas) throw erro;
      }
    }
  }

  async function enviarArquivo(caminho, base64, mensagem) {
    await gravar(caminho, base64, mensagem, await obterSha(caminho));
  }

  async function apagarArquivo(caminho, mensagem) {
    const sha = await obterSha(caminho);
    if (!sha) return;
    await requisitar('DELETE', urlConteudo(caminho), { message: mensagem, sha, branch });
  }

  return { validarAcesso, lerJson, atualizarJson, enviarArquivo, apagarArquivo };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test`
Expected: todos os testes passando, 0 falhas.

- [ ] **Step 6: Commit**

```bash
git add js/lib/github.js tests/_fetch-falso.js tests/github.test.js
git commit -m "feat: cliente da API de conteúdo do GitHub com repetição em conflito" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: `imagem.js` — validar e preparar imagem

**Files:**
- Create: `js/lib/imagem.js`
- Test: `tests/imagem.test.js`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `TIPOS_ACEITOS`, `TAMANHO_MAXIMO` (15 MB), `LARGURA_MAXIMA` (1200).
  - `validarArquivoImagem(arquivo: {type: string, size: number}): string | null` — mensagem de erro ou `null`.
  - `calcularDimensoes(largura, altura, maximo = 1200): { largura, altura }` — só reduz, mantém a proporção.
  - `prepararImagem(arquivo: File): Promise<{ base64: string, previaUrl: string }>` — só no navegador; fundo branco, JPEG 0.85. `base64` não tem o prefixo `data:`.

- [ ] **Step 1: Escrever os testes (só das funções puras)**

Criar `tests/imagem.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validarArquivoImagem, calcularDimensoes, TAMANHO_MAXIMO } from '../js/lib/imagem.js';

test('validarArquivoImagem aceita JPG, PNG e WebP dentro do limite', () => {
  assert.equal(validarArquivoImagem({ type: 'image/jpeg', size: 1000 }), null);
  assert.equal(validarArquivoImagem({ type: 'image/png', size: 1000 }), null);
  assert.equal(validarArquivoImagem({ type: 'image/webp', size: 1000 }), null);
});

test('validarArquivoImagem recusa outros formatos e arquivos grandes', () => {
  assert.match(validarArquivoImagem({ type: 'image/gif', size: 1000 }), /JPG, PNG ou WebP/);
  assert.match(validarArquivoImagem({ type: 'application/pdf', size: 1000 }), /JPG, PNG ou WebP/);
  assert.match(validarArquivoImagem({ type: 'image/png', size: TAMANHO_MAXIMO + 1 }), /15 MB/);
});

test('calcularDimensoes reduz imagens largas mantendo a proporção', () => {
  assert.deepEqual(calcularDimensoes(2400, 1600), { largura: 1200, altura: 800 });
  assert.deepEqual(calcularDimensoes(3000, 1000), { largura: 1200, altura: 400 });
});

test('calcularDimensoes não amplia imagens pequenas', () => {
  assert.deepEqual(calcularDimensoes(800, 600), { largura: 800, altura: 600 });
  assert.deepEqual(calcularDimensoes(1200, 900), { largura: 1200, altura: 900 });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/imagem.test.js`
Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar**

Criar `js/lib/imagem.js`:

```js
export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAXIMO = 15 * 1024 * 1024;
export const LARGURA_MAXIMA = 1200;
const QUALIDADE_JPEG = 0.85;

export function validarArquivoImagem(arquivo) {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) return 'Use uma imagem JPG, PNG ou WebP.';
  if (arquivo.size > TAMANHO_MAXIMO) return 'A imagem é grande demais (máximo de 15 MB).';
  return null;
}

export function calcularDimensoes(largura, altura, maximo = LARGURA_MAXIMA) {
  if (largura <= maximo) return { largura, altura };
  return { largura: maximo, altura: Math.round(altura * (maximo / largura)) };
}

// Só funciona no navegador (usa canvas). Devolve o JPEG em base64, sem o prefixo "data:".
export async function prepararImagem(arquivo) {
  const bitmap = await createImageBitmap(arquivo);
  try {
    const { largura, altura } = calcularDimensoes(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const contexto = canvas.getContext('2d');
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, largura, altura);
    contexto.drawImage(bitmap, 0, 0, largura, altura);
    const previaUrl = canvas.toDataURL('image/jpeg', QUALIDADE_JPEG);
    return { base64: previaUrl.split(',')[1], previaUrl };
  } finally {
    bitmap.close?.();
  }
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: todos os testes passando, 0 falhas.

- [ ] **Step 5: Commit**

```bash
git add js/lib/imagem.js tests/imagem.test.js
git commit -m "feat: validação e preparo de imagem para as notícias" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: `publicar.js` — publicar, editar e excluir notícias

**Files:**
- Create: `js/lib/publicar.js`
- Test: `tests/publicar.test.js`

**Interfaces:**
- Consumes:
  - `gerarId(dataIso, titulo, idsExistentes)` de `js/lib/slug.js`
  - `validar`, `buscar`, `criarNoticia`, `editarNoticia`, `excluirNoticia` de `js/lib/modelo.js`
  - um `cliente` com `lerJson`, `atualizarJson`, `enviarArquivo`, `apagarArquivo` (assinaturas da Task 5)
- Produces:
  - `CAMINHO_JSON = 'data/noticias.json'`, `PASTA_IMAGENS = 'assets/noticias/'`
  - `class ErroValidacao extends Error` com `erros: string[]`
  - `publicarNoticia({ cliente, dados, id = null, imagemBase64 = null, removerImagem = false }): Promise<{ id: string, avisos: string[] }>` — `id` preenchido significa edição. Valida antes de qualquer chamada ao cliente. Ordem das gravações: imagem, depois JSON, depois remoção da imagem antiga.
  - `excluirNoticiaPublicada({ cliente, id }): Promise<{ avisos: string[] }>`
  - Falha ao apagar imagem não derruba a operação: vira item em `avisos`.

- [ ] **Step 1: Escrever os testes**

Criar `tests/publicar.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicarNoticia, excluirNoticiaPublicada, ErroValidacao } from '../js/lib/publicar.js';

const dados = { titulo: 'Título X', autor: 'Equipe', data: '2026-09-30', resumo: 'Resumo', texto: 'Texto' };

function criarClienteFalso({ noticias = [], falhar = {} } = {}) {
  const estado = { json: { noticias: structuredClone(noticias) }, arquivos: new Map(), apagados: [], chamadas: [] };
  return {
    estado,
    async lerJson() {
      estado.chamadas.push('lerJson');
      return { dados: structuredClone(estado.json), sha: 's' };
    },
    async atualizarJson(caminho, mutar) {
      estado.chamadas.push('atualizarJson');
      if (falhar.atualizarJson) throw falhar.atualizarJson;
      estado.json = mutar(structuredClone(estado.json));
      return estado.json;
    },
    async enviarArquivo(caminho, base64) {
      estado.chamadas.push('enviarArquivo');
      estado.arquivos.set(caminho, base64);
    },
    async apagarArquivo(caminho) {
      estado.chamadas.push('apagarArquivo');
      if (falhar.apagarArquivo) throw falhar.apagarArquivo;
      estado.apagados.push(caminho);
    },
  };
}

test('publicar cria a notícia sem imagem', async () => {
  const cliente = criarClienteFalso();
  const resultado = await publicarNoticia({ cliente, dados });
  assert.equal(resultado.id, '2026-09-30-titulo-x');
  assert.deepEqual(resultado.avisos, []);
  assert.equal(cliente.estado.json.noticias[0].id, '2026-09-30-titulo-x');
  assert.equal(cliente.estado.json.noticias[0].imagem, null);
  assert.ok(!cliente.estado.chamadas.includes('enviarArquivo'));
});

test('publicar envia a imagem antes de gravar o JSON', async () => {
  const cliente = criarClienteFalso();
  const { id } = await publicarNoticia({ cliente, dados, imagemBase64: 'QUJD' });
  const caminho = `assets/noticias/${id}.jpg`;
  assert.equal(cliente.estado.arquivos.get(caminho), 'QUJD');
  assert.equal(cliente.estado.json.noticias[0].imagem, caminho);
  assert.ok(cliente.estado.chamadas.indexOf('enviarArquivo') < cliente.estado.chamadas.indexOf('atualizarJson'));
});

test('publicar evita id repetido com sufixo', async () => {
  const cliente = criarClienteFalso({ noticias: [{ id: '2026-09-30-titulo-x', ...dados, imagem: null }] });
  const { id } = await publicarNoticia({ cliente, dados });
  assert.equal(id, '2026-09-30-titulo-x-2');
  assert.equal(cliente.estado.json.noticias.length, 2);
});

test('publicar recusa dados inválidos sem tocar no GitHub', async () => {
  const cliente = criarClienteFalso();
  await assert.rejects(publicarNoticia({ cliente, dados: { ...dados, titulo: '' } }), (erro) => {
    assert.ok(erro instanceof ErroValidacao);
    assert.equal(erro.erros.length, 1);
    return true;
  });
  assert.deepEqual(cliente.estado.chamadas, []);
});

test('editar mantém o id e a imagem antiga', async () => {
  const antiga = { id: 'x', ...dados, imagem: 'assets/noticias/x.jpg' };
  const cliente = criarClienteFalso({ noticias: [antiga] });
  const { id } = await publicarNoticia({ cliente, id: 'x', dados: { ...dados, titulo: 'Novo título' } });
  assert.equal(id, 'x');
  assert.equal(cliente.estado.json.noticias[0].titulo, 'Novo título');
  assert.equal(cliente.estado.json.noticias[0].imagem, 'assets/noticias/x.jpg');
  assert.deepEqual(cliente.estado.apagados, []);
});

test('editar com nova imagem sobrescreve o mesmo caminho', async () => {
  const cliente = criarClienteFalso({ noticias: [{ id: 'x', ...dados, imagem: 'assets/noticias/x.jpg' }] });
  await publicarNoticia({ cliente, id: 'x', dados, imagemBase64: 'NOVA' });
  assert.equal(cliente.estado.arquivos.get('assets/noticias/x.jpg'), 'NOVA');
  assert.equal(cliente.estado.json.noticias[0].imagem, 'assets/noticias/x.jpg');
  assert.deepEqual(cliente.estado.apagados, []);
});

test('editar removendo a imagem apaga o arquivo antigo', async () => {
  const cliente = criarClienteFalso({ noticias: [{ id: 'x', ...dados, imagem: 'assets/noticias/x.jpg' }] });
  await publicarNoticia({ cliente, id: 'x', dados, removerImagem: true });
  assert.equal(cliente.estado.json.noticias[0].imagem, null);
  assert.deepEqual(cliente.estado.apagados, ['assets/noticias/x.jpg']);
});

test('editar notícia inexistente falha sem gravar', async () => {
  const cliente = criarClienteFalso();
  await assert.rejects(publicarNoticia({ cliente, id: 'x', dados }), /não existe mais/);
  assert.ok(!cliente.estado.chamadas.includes('atualizarJson'));
});

test('falha ao apagar a imagem antiga vira aviso e não derruba a edição', async () => {
  const cliente = criarClienteFalso({
    noticias: [{ id: 'x', ...dados, imagem: 'assets/noticias/x.jpg' }],
    falhar: { apagarArquivo: new Error('rede') },
  });
  const resultado = await publicarNoticia({ cliente, id: 'x', dados, removerImagem: true });
  assert.equal(resultado.avisos.length, 1);
  assert.equal(cliente.estado.json.noticias[0].imagem, null);
});

test('erro ao gravar o JSON é repassado', async () => {
  const cliente = criarClienteFalso({ falhar: { atualizarJson: new Error('falhou') } });
  await assert.rejects(publicarNoticia({ cliente, dados }), /falhou/);
});

test('excluir remove a notícia e a imagem', async () => {
  const cliente = criarClienteFalso({
    noticias: [{ id: 'x', ...dados, imagem: 'assets/noticias/x.jpg' }, { id: 'y', ...dados, imagem: null }],
  });
  const resultado = await excluirNoticiaPublicada({ cliente, id: 'x' });
  assert.deepEqual(resultado.avisos, []);
  assert.deepEqual(cliente.estado.json.noticias.map((n) => n.id), ['y']);
  assert.deepEqual(cliente.estado.apagados, ['assets/noticias/x.jpg']);
});

test('excluir notícia sem imagem não apaga arquivo', async () => {
  const cliente = criarClienteFalso({ noticias: [{ id: 'y', ...dados, imagem: null }] });
  await excluirNoticiaPublicada({ cliente, id: 'y' });
  assert.deepEqual(cliente.estado.apagados, []);
  assert.ok(!cliente.estado.chamadas.includes('apagarArquivo'));
});

test('excluir notícia inexistente falha sem gravar', async () => {
  const cliente = criarClienteFalso();
  await assert.rejects(excluirNoticiaPublicada({ cliente, id: 'x' }), /não existe mais/);
  assert.ok(!cliente.estado.chamadas.includes('atualizarJson'));
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/publicar.test.js`
Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar**

Criar `js/lib/publicar.js`:

```js
import { gerarId } from './slug.js';
import { validar, buscar, criarNoticia, editarNoticia, excluirNoticia } from './modelo.js';

export const CAMINHO_JSON = 'data/noticias.json';
export const PASTA_IMAGENS = 'assets/noticias/';

export class ErroValidacao extends Error {
  constructor(erros) {
    super(erros.join(' '));
    this.name = 'ErroValidacao';
    this.erros = erros;
  }
}

// Cria (id = null) ou edita (id preenchido) uma notícia.
// Ordem: valida, envia a imagem, grava o JSON e, por último, apaga a imagem antiga.
export async function publicarNoticia({ cliente, dados, id = null, imagemBase64 = null, removerImagem = false }) {
  const erros = validar(dados);
  if (erros.length > 0) throw new ErroValidacao(erros);

  const { dados: atual } = await cliente.lerJson(CAMINHO_JSON);
  const lista = atual.noticias;
  const existente = id ? buscar(lista, id) : null;
  if (id && !existente) throw new Error('Esta notícia não existe mais.');
  const idFinal = id ?? gerarId(dados.data, dados.titulo, lista.map((noticia) => noticia.id));

  let imagem = existente?.imagem ?? null;
  if (removerImagem) imagem = null;
  if (imagemBase64) {
    imagem = `${PASTA_IMAGENS}${idFinal}.jpg`;
    await cliente.enviarArquivo(imagem, imagemBase64, `Imagem da notícia ${idFinal}`);
  }

  const registro = { ...dados, imagem };
  await cliente.atualizarJson(
    CAMINHO_JSON,
    (json) => ({
      ...json,
      noticias: existente
        ? editarNoticia(json.noticias, idFinal, registro)
        : criarNoticia(json.noticias, registro, idFinal),
    }),
    `${existente ? 'Edita' : 'Publica'} notícia: ${dados.titulo}`,
  );

  const avisos = [];
  const imagemAntiga = existente?.imagem;
  if (imagemAntiga && imagemAntiga !== imagem) {
    try {
      await cliente.apagarArquivo(imagemAntiga, `Remove imagem antiga da notícia ${idFinal}`);
    } catch {
      avisos.push('A notícia foi salva, mas não foi possível apagar a imagem antiga.');
    }
  }
  return { id: idFinal, avisos };
}

export async function excluirNoticiaPublicada({ cliente, id }) {
  const { dados: atual } = await cliente.lerJson(CAMINHO_JSON);
  const existente = buscar(atual.noticias, id);
  if (!existente) throw new Error('Esta notícia não existe mais.');

  await cliente.atualizarJson(
    CAMINHO_JSON,
    (json) => ({ ...json, noticias: excluirNoticia(json.noticias, id) }),
    `Exclui notícia: ${existente.titulo}`,
  );

  const avisos = [];
  if (existente.imagem) {
    try {
      await cliente.apagarArquivo(existente.imagem, `Remove imagem da notícia ${id}`);
    } catch {
      avisos.push('A notícia foi excluída, mas não foi possível apagar a imagem.');
    }
  }
  return { avisos };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: todos os testes passando, 0 falhas.

- [ ] **Step 5: Commit**

```bash
git add js/lib/publicar.js tests/publicar.test.js
git commit -m "feat: fluxo de publicar, editar e excluir notícias" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: `dados.js`, arquivos de dados e teste de integridade

**Files:**
- Create: `js/lib/dados.js`
- Create: `data/noticias.json`, `data/equipe.json`, `data/config.json`
- Test: `tests/dados.test.js`

**Interfaces:**
- Consumes: `validar` (modelo.js), `imagemValida` (formato.js).
- Produces:
  - `carregarJson(caminho: string, fetchFn = fetch): Promise<any>` — usa `cache: 'no-cache'`; lança `Error` se a resposta não for ok.
  - `data/noticias.json`: `{ "noticias": Noticia[] }` com 3 exemplos.
  - `data/equipe.json`: `{ "membros": [{ nome, funcao, bio, foto: string|null }] }` com 4 exemplos.
  - `data/config.json`: chaves `github { owner, repo, branch }`, `youtube`, `instagram`, `whatsapp`, `whatsappExibicao`, `email`, `mensagemPatrocinio`. (`github.apiUrl` é opcional e não aparece no arquivo.)

- [ ] **Step 1: Escrever os testes**

Criar `tests/dados.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { carregarJson } from '../js/lib/dados.js';
import { validar } from '../js/lib/modelo.js';
import { imagemValida } from '../js/lib/formato.js';

const lerArquivo = async (caminho) => JSON.parse(await readFile(new URL(`../${caminho}`, import.meta.url), 'utf8'));

test('carregarJson devolve o JSON e pede revalidação do cache', async () => {
  let recebido;
  const fetchFalso = async (caminho, init) => {
    recebido = { caminho, init };
    return { ok: true, status: 200, json: async () => ({ ola: 'mundo' }) };
  };
  assert.deepEqual(await carregarJson('data/x.json', fetchFalso), { ola: 'mundo' });
  assert.deepEqual(recebido, { caminho: 'data/x.json', init: { cache: 'no-cache' } });
});

test('carregarJson lança erro quando a resposta não é ok', async () => {
  const fetchFalso = async () => ({ ok: false, status: 404, json: async () => ({}) });
  await assert.rejects(carregarJson('data/x.json', fetchFalso), /404/);
});

test('noticias.json tem notícias válidas, ids únicos e imagens permitidas', async () => {
  const { noticias } = await lerArquivo('data/noticias.json');
  assert.ok(Array.isArray(noticias));
  const ids = new Set();
  for (const noticia of noticias) {
    assert.deepEqual(validar(noticia), [], `notícia inválida: ${noticia.id}`);
    assert.ok(noticia.id, 'notícia sem id');
    assert.ok(!ids.has(noticia.id), `id repetido: ${noticia.id}`);
    ids.add(noticia.id);
    assert.ok(noticia.imagem === null || imagemValida(noticia.imagem), `imagem inválida em ${noticia.id}`);
  }
});

test('equipe.json tem membros com nome e função', async () => {
  const { membros } = await lerArquivo('data/equipe.json');
  assert.ok(Array.isArray(membros) && membros.length > 0);
  for (const membro of membros) {
    assert.ok(membro.nome && membro.funcao, 'membro sem nome ou função');
    assert.ok(membro.foto === null || imagemValida(membro.foto, 'assets/equipe/'), `foto inválida: ${membro.nome}`);
  }
});

test('config.json tem os contatos e links definidos na especificação', async () => {
  const config = await lerArquivo('data/config.json');
  assert.equal(config.youtube, 'https://www.youtube.com/@JornalFA');
  assert.equal(config.instagram, 'https://www.instagram.com/jorna.lfa/');
  assert.match(config.whatsapp, /^55\d{2}9\d{8}$/);
  assert.equal(config.whatsapp, '5585996333970');
  assert.equal(config.whatsappExibicao, '+55 85 99633-3970');
  assert.ok(config.email.includes('@'));
  assert.ok(config.mensagemPatrocinio.length > 0);
  assert.ok(config.github.owner && config.github.repo && config.github.branch);
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `node --test tests/dados.test.js`
Expected: FAIL com `ERR_MODULE_NOT_FOUND` (`dados.js` não existe).

- [ ] **Step 3: Implementar `dados.js`**

Criar `js/lib/dados.js`:

```js
// Carrega um arquivo JSON do próprio site, pedindo ao navegador que revalide o cache
// para que uma notícia nova apareça assim que o GitHub Pages terminar de publicar.
export async function carregarJson(caminho, fetchFn = fetch) {
  const resposta = await fetchFn(caminho, { cache: 'no-cache' });
  if (!resposta.ok) throw new Error(`Falha ao carregar ${caminho} (${resposta.status})`);
  return resposta.json();
}
```

- [ ] **Step 4: Criar os arquivos de dados**

Criar `data/config.json`:

```json
{
  "github": { "owner": "SEU-USUARIO", "repo": "fa-news", "branch": "main" },
  "youtube": "https://www.youtube.com/@JornalFA",
  "instagram": "https://www.instagram.com/jorna.lfa/",
  "whatsapp": "5585996333970",
  "whatsappExibicao": "+55 85 99633-3970",
  "email": "contato@jornalfa.example",
  "mensagemPatrocinio": "Olá! Tenho interesse em patrocinar o Jornal FA News."
}
```

Criar `data/equipe.json`:

```json
{
  "membros": [
    { "nome": "Maria Exemplo", "funcao": "Apresentadora", "bio": "Mini bio de exemplo. Troque pelo texto real da integrante.", "foto": null },
    { "nome": "João Exemplo", "funcao": "Repórter", "bio": "Mini bio de exemplo. Troque pelo texto real do integrante.", "foto": null },
    { "nome": "Ana Exemplo", "funcao": "Edição de vídeo", "bio": "Mini bio de exemplo. Troque pelo texto real da integrante.", "foto": null },
    { "nome": "Pedro Exemplo", "funcao": "Coordenação", "bio": "Mini bio de exemplo. Troque pelo texto real do integrante.", "foto": null }
  ]
}
```

Criar `data/noticias.json`:

```json
{
  "noticias": [
    {
      "id": "2026-09-30-exemplo-bem-vindos-ao-jornal-fa-news",
      "titulo": "Exemplo: Bem-vindos ao Jornal FA News",
      "autor": "Equipe FA News",
      "data": "2026-09-30",
      "resumo": "Esta é uma notícia de exemplo para você ver como as publicações aparecem no site.",
      "texto": "Esta é uma notícia de exemplo. Ela existe apenas para mostrar como o texto, a data e o autor aparecem na página.\n\nPara apagar este exemplo, entre no painel administrativo e use o botão Excluir.\n\nDepois, publique a primeira notícia de verdade!",
      "imagem": null
    },
    {
      "id": "2026-09-26-exemplo-feira-de-ciencias",
      "titulo": "Exemplo: Feira de Ciências",
      "autor": "Equipe FA News",
      "data": "2026-09-26",
      "resumo": "Modelo de notícia com dois parágrafos. Troque pelo texto real do evento.",
      "texto": "Este é um modelo de notícia sobre um evento da escola. Aqui entram as informações principais: o que aconteceu, quando e onde.\n\nNo segundo parágrafo, o texto pode trazer detalhes, depoimentos e o que vem a seguir.",
      "imagem": null
    },
    {
      "id": "2026-09-22-exemplo-campeonato-interclasse",
      "titulo": "Exemplo: Campeonato Interclasse",
      "autor": "Equipe FA News",
      "data": "2026-09-22",
      "resumo": "Outro exemplo de notícia, só para preencher a lista enquanto o jornal não publica as reais.",
      "texto": "Mais um texto de exemplo. Ele será substituído pelas notícias que a equipe do jornal publicar pelo painel.",
      "imagem": null
    }
  ]
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test`
Expected: todos os testes passando, 0 falhas.

- [ ] **Step 6: Commit**

```bash
git add js/lib/dados.js data tests/dados.test.js
git commit -m "feat: carregamento de JSON e dados iniciais de exemplo" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: CSS, utilitários de DOM e página principal

**Files:**
- Create: `css/style.css`, `js/lib/dom.js`, `js/main.js`, `index.html`

**Interfaces:**
- Consumes: `carregarJson` (dados.js), `iniciais`, `linkWhatsapp`, `usuarioInstagram`, `imagemValida` (formato.js).
- Produces:
  - `el(tag: string, props?: object, ...filhos): HTMLElement` — `props.class`, `props.text` (vira `textContent`), `props.onXxx` (função vira listener), demais chaves viram atributos; filhos podem ser nós, strings, arrays, `null` ou `false` (ignorados).
  - `montar(container: Element, ...filhos): Element` — esvazia o container e acrescenta os filhos (mesmas regras).
  - Classes CSS reutilizadas nas próximas tarefas: `container`, `botao`, `botao--azul|amarelo|contorno|perigo|pequeno`, `secao`, `secao__cabeca`, `grade-cards`, `card*`, `aviso`, `aviso--erro`, `menu*`, `rodape*`, `leitura*`, `sr-only`, `[hidden]`.
  - Convenção de `data-` no HTML: `[data-link="youtube|instagram|whatsapp|email"]` recebe `href`; `[data-texto="whatsappExibicao|email|instagramExibicao"]` recebe texto. `<body data-pagina="home|lista|leitura|admin">`.

- [ ] **Step 1: Criar `css/style.css`**

```css
/* ===== Tokens ===== */
:root {
  --azul: #0047ab;
  --azul-escuro: #00307a;
  --azul-profundo: #001f52;
  --amarelo: #ffdd57;
  --amarelo-forte: #f5b800;
  --cinza: #d9d9d9;
  --cinza-claro: #f3f5f9;
  --texto: #1b2333;
  --texto-suave: #4a5568;
  --branco: #ffffff;
  --erro: #b42318;
  --sucesso: #067647;
  --raio: 16px;
  --sombra: 0 6px 24px rgba(0, 31, 82, 0.1);
  --largura: 1120px;
  --altura-menu: 68px;
  --fonte-titulo: "Montserrat", system-ui, sans-serif;
  --fonte-corpo: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

/* ===== Base ===== */
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: var(--altura-menu); }
body {
  margin: 0;
  font-family: var(--fonte-corpo);
  font-size: 1.0625rem;
  line-height: 1.6;
  color: var(--texto);
  background: var(--branco);
}
img { max-width: 100%; height: auto; display: block; }
a { color: var(--azul); }
h1, h2, h3 { font-family: var(--fonte-titulo); line-height: 1.15; margin: 0 0 0.5em; color: var(--azul-profundo); }
[hidden] { display: none !important; }
:focus-visible { outline: 3px solid var(--azul); outline-offset: 3px; border-radius: 4px; }

.container { width: min(100% - 32px, var(--largura)); margin-inline: auto; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.pular { position: absolute; left: -999px; top: 8px; z-index: 100; background: var(--amarelo); color: var(--azul-profundo); padding: 10px 16px; border-radius: 8px; font-weight: 700; }
.pular:focus { left: 8px; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
}

/* ===== Botões ===== */
.botao {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px 26px; border-radius: 999px; border: 2px solid transparent;
  font-family: var(--fonte-titulo); font-weight: 700; font-size: 1rem; text-decoration: none; cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
}
.botao:hover { transform: translateY(-2px); box-shadow: var(--sombra); }
.botao--azul { background: var(--azul); color: var(--branco); }
.botao--azul:hover { background: var(--azul-escuro); }
.botao--amarelo { background: var(--amarelo); color: var(--azul-profundo); }
.botao--amarelo:hover { background: var(--amarelo-forte); }
.botao--contorno { background: transparent; color: var(--azul); border-color: var(--azul); }
.botao--contorno:hover { background: var(--cinza-claro); }
.botao--perigo { background: var(--erro); color: var(--branco); }
.botao--pequeno { padding: 8px 16px; font-size: 0.9rem; }
.botao[disabled] { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }

/* ===== Menu ===== */
.menu { position: sticky; top: 0; z-index: 50; background: rgba(255, 255, 255, 0.96); backdrop-filter: blur(8px); border-bottom: 1px solid #e6e9f0; }
.menu__interno { display: flex; align-items: center; justify-content: space-between; height: var(--altura-menu); }
.menu__logo img { height: 44px; width: auto; }
.menu__lista { display: flex; gap: 4px; list-style: none; margin: 0; padding: 0; }
.menu__lista a { display: block; padding: 10px 14px; border-radius: 999px; text-decoration: none; color: var(--azul-profundo); font-weight: 600; font-size: 0.95rem; }
.menu__lista a:hover { background: var(--cinza-claro); }
.menu__botao { display: none; align-items: center; justify-content: center; width: 44px; height: 44px; border: 2px solid var(--azul); border-radius: 12px; background: transparent; color: var(--azul); cursor: pointer; }
.menu__barras { width: 20px; height: 2px; background: currentColor; box-shadow: 0 -6px 0 currentColor, 0 6px 0 currentColor; }

@media (max-width: 860px) {
  .menu__botao { display: inline-flex; }
  .menu__lista { position: absolute; inset: var(--altura-menu) 0 auto 0; flex-direction: column; gap: 0; padding: 8px 16px 16px; background: var(--branco); border-bottom: 1px solid #e6e9f0; display: none; }
  .menu__lista.aberto { display: flex; }
  .menu__lista a { padding: 14px 12px; border-radius: 10px; }
}

/* ===== Hero ===== */
.hero { position: relative; overflow: hidden; padding: 56px 0 72px; background: linear-gradient(180deg, var(--branco) 0%, var(--cinza-claro) 100%); }
.hero::before, .hero::after { content: ""; position: absolute; border-radius: 50%; pointer-events: none; }
.hero::before { width: 420px; aspect-ratio: 1; right: -140px; top: -160px; background: var(--amarelo); opacity: 0.35; }
.hero::after { width: 260px; aspect-ratio: 1; left: -90px; bottom: -120px; background: var(--azul); opacity: 0.1; }
.hero > .container { position: relative; z-index: 1; }
.hero__grade { display: grid; gap: 40px; align-items: center; }
@media (min-width: 860px) { .hero__grade { grid-template-columns: 1.2fr 0.8fr; } }
.hero__selo { display: inline-block; margin-bottom: 16px; padding: 6px 14px; border-radius: 999px; background: var(--amarelo); color: var(--azul-profundo); font-family: var(--fonte-titulo); font-weight: 700; font-size: 0.8rem; letter-spacing: 0.08em; text-transform: uppercase; }
.hero h1 { font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 800; }
.hero h1 span { color: var(--azul); }
.hero__texto { max-width: 56ch; font-size: 1.15rem; color: var(--texto-suave); }
.hero__acoes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }
.hero__arte { justify-self: center; width: min(78%, 360px); }
.hero__arte img { width: 100%; filter: drop-shadow(0 18px 30px rgba(0, 71, 171, 0.25)); animation: flutuar 6s ease-in-out infinite; }
@keyframes flutuar { 50% { transform: translateY(-10px); } }

/* ===== Seções ===== */
.secao { padding: 72px 0; }
.secao--cinza { background: var(--cinza-claro); }
.secao__cabeca { margin-bottom: 32px; }
.secao__cabeca h1, .secao__cabeca h2 { font-size: clamp(1.6rem, 3.5vw, 2.4rem); font-weight: 800; }
.secao__cabeca h1::after, .secao__cabeca h2::after { content: ""; display: block; width: 64px; height: 6px; margin-top: 12px; border-radius: 3px; background: var(--amarelo-forte); }
.secao__cabeca p { margin: 0; max-width: 60ch; color: var(--texto-suave); }
.secao__rodape { margin: 32px 0 0; text-align: center; }

.aviso { margin: 0; padding: 20px; border-radius: 12px; background: var(--cinza-claro); color: var(--texto-suave); text-align: center; }
.aviso--erro { background: #fdecea; color: var(--erro); }

/* ===== Cards de notícia ===== */
.grade-cards { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.grade-cards .aviso { grid-column: 1 / -1; }
.card { position: relative; display: flex; flex-direction: column; overflow: hidden; background: var(--branco); border: 1px solid #e9ecf3; border-radius: var(--raio); box-shadow: var(--sombra); transition: transform 0.2s; }
.card:hover { transform: translateY(-4px); }
.card__imagem { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; background: var(--cinza-claro); }
.card__imagem--vazia { display: grid; place-items: center; }
.card__imagem--vazia img { opacity: 0.6; }
.card__corpo { display: flex; flex: 1; flex-direction: column; gap: 8px; padding: 20px; }
.card__data { font-size: 0.85rem; font-weight: 600; color: var(--texto-suave); }
.card__titulo { margin: 0; font-size: 1.2rem; }
.card__titulo a { color: var(--azul-profundo); text-decoration: none; }
.card__titulo a::after { content: ""; position: absolute; inset: 0; }
.card__resumo { margin: 0; color: var(--texto-suave); }
.card__mais { margin-top: auto; font-weight: 700; color: var(--azul); }

/* ===== Faixa do YouTube ===== */
.faixa { padding: 56px 0; background: var(--azul); color: var(--branco); }
.faixa__interno { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px; }
.faixa h2 { margin: 0 0 8px; color: var(--branco); font-size: clamp(1.5rem, 3.5vw, 2.2rem); font-weight: 800; }
.faixa p { margin: 0; max-width: 52ch; color: #dbe6ff; }
.faixa :focus-visible, .rodape :focus-visible { outline-color: var(--amarelo); }

/* ===== Equipe ===== */
.grade-equipe { display: grid; gap: 24px; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); }
.grade-equipe .aviso { grid-column: 1 / -1; }
.membro { padding: 28px 20px; border-radius: var(--raio); background: var(--cinza-claro); text-align: center; }
.membro__foto, .membro__iniciais { width: 112px; height: 112px; margin: 0 auto 14px; border: 4px solid var(--amarelo); border-radius: 50%; background: var(--azul); }
.membro__foto { object-fit: cover; }
.membro__iniciais { display: grid; place-items: center; color: var(--amarelo); font-family: var(--fonte-titulo); font-weight: 800; font-size: 2rem; }
.membro h3 { margin: 0; font-size: 1.1rem; }
.membro__funcao { margin: 2px 0 10px; font-size: 0.9rem; font-weight: 700; color: var(--azul); }
.membro__bio { margin: 0; font-size: 0.98rem; color: var(--texto-suave); }

/* ===== Patrocínio ===== */
.patrocinio { padding: 64px 0; background: var(--amarelo); }
.patrocinio__interno { display: grid; gap: 24px; align-items: center; }
@media (min-width: 760px) { .patrocinio__interno { grid-template-columns: 1fr auto; } }
.patrocinio h2 { margin: 0 0 8px; font-size: clamp(1.6rem, 3.5vw, 2.4rem); font-weight: 800; }
.patrocinio p { margin: 0; max-width: 56ch; color: var(--azul-profundo); }

/* ===== Redes sociais ===== */
.redes { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
.rede { display: flex; align-items: center; gap: 16px; padding: 20px; border: 1px solid #e3e7f0; border-radius: var(--raio); background: var(--branco); box-shadow: var(--sombra); color: var(--texto); text-decoration: none; transition: transform 0.15s; }
.rede:hover { transform: translateY(-3px); }
.rede__icone { display: grid; flex: none; place-items: center; width: 48px; height: 48px; border-radius: 50%; background: var(--azul); color: var(--branco); }
.rede__icone svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.rede__nome { display: block; font-family: var(--fonte-titulo); font-weight: 700; color: var(--azul-profundo); }
.rede__detalhe { font-size: 0.95rem; color: var(--texto-suave); word-break: break-word; }

/* ===== Rodapé ===== */
.rodape { padding: 48px 0 28px; background: var(--azul-profundo); color: #cfd9f2; }
.rodape__grade { display: grid; gap: 24px; align-items: center; }
@media (min-width: 760px) { .rodape__grade { grid-template-columns: auto 1fr; gap: 32px; } }
.rodape__logo { width: 108px; padding: 10px; border-radius: 20px; background: var(--branco); }
.rodape__nome { margin: 0 0 4px; font-family: var(--fonte-titulo); font-weight: 800; font-size: 1.25rem; color: var(--branco); }
.rodape p { margin: 0; }
.rodape a { color: var(--amarelo); }
.rodape__credito { margin-top: 28px !important; padding-top: 20px; border-top: 1px solid rgba(255, 255, 255, 0.15); font-size: 0.95rem; }

/* ===== Leitura de notícia ===== */
.leitura { max-width: 760px; padding: 48px 0 72px; }
.leitura__voltar { display: inline-block; margin-bottom: 20px; font-weight: 700; text-decoration: none; }
.leitura h1 { font-size: clamp(1.8rem, 4.5vw, 2.8rem); font-weight: 800; }
.leitura__meta { margin: 0 0 24px; font-weight: 600; color: var(--texto-suave); }
.leitura__imagem { width: 100%; margin-bottom: 28px; border-radius: var(--raio); box-shadow: var(--sombra); }
.leitura__texto p { margin: 0 0 1.2em; font-size: 1.125rem; white-space: pre-line; }
```

- [ ] **Step 2: Criar `js/lib/dom.js`**

```js
// Criação de DOM sem innerHTML: todo texto entra como nó de texto (seguro contra injeção de HTML).

export function el(tag, props = {}, ...filhos) {
  const no = document.createElement(tag);
  for (const [chave, valor] of Object.entries(props)) {
    if (valor == null || valor === false) continue;
    if (chave === 'class') no.className = valor;
    else if (chave === 'text') no.textContent = valor;
    else if (chave.startsWith('on') && typeof valor === 'function') no.addEventListener(chave.slice(2).toLowerCase(), valor);
    else no.setAttribute(chave, valor === true ? '' : String(valor));
  }
  for (const filho of filhos.flat()) {
    if (filho == null || filho === false) continue;
    no.append(filho);
  }
  return no;
}

export function montar(container, ...filhos) {
  container.replaceChildren();
  for (const filho of filhos.flat()) {
    if (filho == null || filho === false) continue;
    container.append(filho);
  }
  return container;
}
```

- [ ] **Step 3: Criar `js/main.js`**

```js
import { carregarJson } from './lib/dados.js';
import { el, montar } from './lib/dom.js';
import { iniciais, imagemValida, linkWhatsapp, usuarioInstagram } from './lib/formato.js';

function iniciarMenu() {
  const botao = document.querySelector('.menu__botao');
  const lista = document.getElementById('menu-lista');
  if (!botao || !lista) return;
  const alternar = (aberto) => {
    lista.classList.toggle('aberto', aberto);
    botao.setAttribute('aria-expanded', String(aberto));
  };
  botao.addEventListener('click', () => alternar(!lista.classList.contains('aberto')));
  lista.addEventListener('click', (evento) => {
    if (evento.target.closest('a')) alternar(false);
  });
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') alternar(false);
  });
}

function aplicarConfig(config) {
  const links = {
    youtube: config.youtube,
    instagram: config.instagram,
    whatsapp: linkWhatsapp(config.whatsapp, config.mensagemPatrocinio),
    email: `mailto:${config.email}`,
  };
  for (const no of document.querySelectorAll('[data-link]')) {
    const url = links[no.dataset.link];
    if (url) no.setAttribute('href', url);
  }

  const usuario = usuarioInstagram(config.instagram);
  const textos = {
    whatsappExibicao: config.whatsappExibicao,
    email: config.email,
    instagramExibicao: usuario ? `@${usuario}` : '',
  };
  for (const no of document.querySelectorAll('[data-texto]')) {
    const texto = textos[no.dataset.texto];
    if (texto) no.textContent = texto;
  }
}

function criarMembro(membro) {
  const foto = imagemValida(membro.foto, 'assets/equipe/')
    ? el('img', { class: 'membro__foto', src: membro.foto, alt: `Foto de ${membro.nome}`, loading: 'lazy' })
    : el('div', { class: 'membro__iniciais', 'aria-hidden': 'true', text: iniciais(membro.nome) });
  return el('article', { class: 'membro' },
    foto,
    el('h3', { text: membro.nome }),
    el('p', { class: 'membro__funcao', text: membro.funcao }),
    el('p', { class: 'membro__bio', text: membro.bio }),
  );
}

async function iniciarEquipe(container) {
  try {
    const dados = await carregarJson('data/equipe.json');
    const membros = Array.isArray(dados.membros) ? dados.membros : [];
    if (membros.length === 0) {
      montar(container, el('p', { class: 'aviso', text: 'A equipe será apresentada em breve.' }));
      return;
    }
    montar(container, membros.map(criarMembro));
  } catch (erro) {
    console.error(erro);
    montar(container, el('p', { class: 'aviso aviso--erro', text: 'Não foi possível carregar a equipe agora.' }));
  }
}

iniciarMenu();

carregarJson('data/config.json')
  .then(aplicarConfig)
  .catch((erro) => console.error('Não foi possível ler data/config.json', erro));

const containerEquipe = document.getElementById('equipe-lista');
if (containerEquipe) iniciarEquipe(containerEquipe);
```

- [ ] **Step 4: Criar `index.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Jornal FA News · Félix de Azevedo</title>
  <meta name="description" content="Jornal FA News, o jornal interno da escola Félix de Azevedo: notícias, vídeos e a equipe que faz tudo acontecer.">
  <meta name="theme-color" content="#0047ab">
  <link rel="icon" type="image/png" href="assets/icone.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body data-pagina="home">
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>

  <header class="menu">
    <div class="container menu__interno">
      <a class="menu__logo" href="./" aria-label="Jornal FA News, página inicial">
        <img src="assets/logo-jornal.png" alt="Jornal FA News">
      </a>
      <button class="menu__botao" type="button" aria-expanded="false" aria-controls="menu-lista">
        <span class="menu__barras" aria-hidden="true"></span>
        <span class="sr-only">Abrir ou fechar o menu</span>
      </button>
      <nav aria-label="Principal">
        <ul class="menu__lista" id="menu-lista">
          <li><a href="./#inicio">Início</a></li>
          <li><a href="./#noticias">Notícias</a></li>
          <li><a href="./#videos">Vídeos</a></li>
          <li><a href="./#equipe">Equipe</a></li>
          <li><a href="./#patrocine">Patrocine</a></li>
          <li><a href="./#contato">Contato</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="conteudo">
    <section class="hero" id="inicio">
      <div class="container hero__grade">
        <div>
          <span class="hero__selo">Jornal interno · Félix de Azevedo</span>
          <h1>Seja bem-vindo ao <span>Jornal FA News</span></h1>
          <p class="hero__texto">
            O Jornal FA News é o jornal da escola Félix de Azevedo. Aqui você acompanha o que acontece
            no dia a dia da escola, conhece as pessoas que fazem tudo acontecer e descobre o que vem por aí.
            Leia as últimas notícias, assista aos nossos vídeos e fique por dentro de tudo!
          </p>
          <div class="hero__acoes">
            <a class="botao botao--azul" href="./#noticias">Ver últimas notícias</a>
            <a class="botao botao--contorno" href="#" data-link="youtube" target="_blank" rel="noopener noreferrer">Assistir no YouTube</a>
          </div>
        </div>
        <div class="hero__arte">
          <img src="assets/icone.png" alt="" width="360" height="360">
        </div>
      </div>
    </section>

    <section class="secao" id="noticias">
      <div class="container">
        <div class="secao__cabeca">
          <h2>Últimas notícias</h2>
          <p>Fique por dentro do que acontece na escola.</p>
        </div>
        <div class="grade-cards" id="noticias-lista" aria-live="polite">
          <p class="aviso">Carregando notícias…</p>
        </div>
        <p class="secao__rodape">
          <a class="botao botao--contorno" href="noticias.html">Ver todas as notícias</a>
        </p>
      </div>
    </section>

    <section class="faixa" id="videos">
      <div class="container faixa__interno">
        <div>
          <h2>Assista ao Jornal FA News</h2>
          <p>Reportagens, entrevistas e os bastidores da escola em vídeo, no nosso canal do YouTube.</p>
        </div>
        <a class="botao botao--amarelo" href="#" data-link="youtube" target="_blank" rel="noopener noreferrer">Clique e assista agora</a>
      </div>
    </section>

    <section class="secao" id="equipe">
      <div class="container">
        <div class="secao__cabeca">
          <h2>Conheça nossa equipe</h2>
          <p>As pessoas por trás de cada notícia e de cada vídeo.</p>
        </div>
        <div class="grade-equipe" id="equipe-lista" aria-live="polite">
          <p class="aviso">Carregando a equipe…</p>
        </div>
      </div>
    </section>

    <section class="patrocinio" id="patrocine">
      <div class="container patrocinio__interno">
        <div>
          <h2>Seja um patrocinador</h2>
          <p>Apoie o jornal da escola e divulgue a sua marca para alunos, famílias e toda a comunidade escolar. Fale com a gente pelo WhatsApp.</p>
        </div>
        <a class="botao botao--azul" href="#" data-link="whatsapp" target="_blank" rel="noopener noreferrer">Falar no WhatsApp</a>
      </div>
    </section>

    <section class="secao" id="contato">
      <div class="container">
        <div class="secao__cabeca">
          <h2>Redes sociais</h2>
          <p>Siga o Jornal FA News e fale com a gente.</p>
        </div>
        <div class="redes">
          <a class="rede" href="#" data-link="instagram" target="_blank" rel="noopener noreferrer">
            <span class="rede__icone" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>
            </span>
            <span><span class="rede__nome">Instagram</span><span class="rede__detalhe" data-texto="instagramExibicao">…</span></span>
          </a>
          <a class="rede" href="#" data-link="whatsapp" target="_blank" rel="noopener noreferrer">
            <span class="rede__icone" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M3 21l1.65-4.85A8.5 8.5 0 1 1 8.1 19.4z"/><path d="M9 8.5c0 3 3 6 6 6l1.5-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/></svg>
            </span>
            <span><span class="rede__nome">WhatsApp</span><span class="rede__detalhe" data-texto="whatsappExibicao">…</span></span>
          </a>
          <a class="rede" href="#" data-link="email">
            <span class="rede__icone" aria-hidden="true">
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
            </span>
            <span><span class="rede__nome">E-mail</span><span class="rede__detalhe" data-texto="email">…</span></span>
          </a>
        </div>
      </div>
    </section>
  </main>

  <footer class="rodape">
    <div class="container">
      <div class="rodape__grade">
        <img class="rodape__logo" src="assets/logo-escola.png" alt="Brasão da escola Félix de Azevedo">
        <div>
          <p class="rodape__nome">Félix de Azevedo</p>
          <p>Jornal FA News, o jornal interno da escola.</p>
        </div>
      </div>
      <p class="rodape__credito">Desenvolvido por <a href="https://www.isaacpaiva.com.br/" target="_blank" rel="noopener noreferrer">Isaac Paiva</a></p>
    </div>
  </footer>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Verificar no navegador**

Run (em segundo plano): `npm run servir`
Abrir `http://localhost:4000/` e conferir, com o navegador da sessão:

1. Topo fixo com o logo do jornal e 6 itens de menu; clicar em "Equipe" rola até a seção correta (sem o título ficar escondido atrás do menu).
2. Hero: selo amarelo, título "Seja bem-vindo ao Jornal FA News" com "Jornal FA News" em azul, texto introdutório, dois botões, ícone circular grande flutuando à direita (desktop) ou abaixo (celular).
3. Seção "Últimas notícias": mostra "Carregando notícias…" (o script das notícias entra na Task 10).
4. Faixa azul do YouTube: botão amarelo "Clique e assista agora". Passar o mouse sobre ele e olhar a barra de status: `https://www.youtube.com/@JornalFA`.
5. Equipe: 4 cartões com iniciais (ME, JE, AE, PE) em círculos azuis com borda amarela.
6. Patrocínio (fundo amarelo): botão "Falar no WhatsApp" com link `https://wa.me/5585996333970?text=...`.
7. Redes: três cartões com Instagram `@jorna.lfa`, WhatsApp `+55 85 99633-3970` e e-mail `contato@jornalfa.example`.
8. Rodapé azul profundo com brasão sobre fundo branco, "Félix de Azevedo" e o crédito com link para `https://www.isaacpaiva.com.br/`.
9. Console do navegador sem erros (exceto, se aparecer, a mensagem do 404 de `js/noticias.js` — não deve aparecer, pois o script ainda não foi incluído).
10. Reduzir a janela para 375px de largura: sem rolagem horizontal; o botão de menu (três barras) aparece; ao clicar, o menu abre em lista; ao escolher um item, o menu fecha.

Se algo falhar, corrigir o CSS/HTML antes de seguir.

Parar o servidor.

- [ ] **Step 6: Commit**

```bash
git add css js/lib/dom.js js/main.js index.html
git commit -m "feat: página principal com hero, equipe, patrocínio, redes e rodapé" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Notícias — cards, lista completa e leitura

**Files:**
- Create: `js/noticias.js`, `noticias.html`, `noticia.html`
- Modify: `index.html` (incluir `js/noticias.js`)

**Interfaces:**
- Consumes: `carregarJson`, `el`, `montar`, `ordenar`, `buscar`, `formatarData`, `imagemValida`, `resumoOuInicio`, `paragrafos`; classes CSS da Task 9; `<body data-pagina>`; containers `#noticias-lista` e `#leitura`.
- Produces:
  - `js/noticias.js` decide o que fazer por `document.body.dataset.pagina`: `home` (3 mais recentes em `#noticias-lista`), `lista` (todas), `leitura` (notícia do `?id=` em `#leitura`).
  - Link do card: `noticia.html?id=<id codificado>`.

- [ ] **Step 1: Criar `js/noticias.js`**

```js
import { carregarJson } from './lib/dados.js';
import { el, montar } from './lib/dom.js';
import { ordenar, buscar } from './lib/modelo.js';
import { formatarData, imagemValida, resumoOuInicio } from './lib/formato.js';
import { paragrafos } from './lib/texto.js';

const AVISO_VAZIO = 'Ainda não há notícias publicadas. Volte em breve!';
const AVISO_ERRO = 'Não foi possível carregar as notícias agora. Tente novamente em instantes.';
const TITULO_SITE = 'Jornal FA News';

const aviso = (texto, erro = false) => el('p', { class: erro ? 'aviso aviso--erro' : 'aviso', text: texto });

async function carregarNoticias() {
  const dados = await carregarJson('data/noticias.json');
  if (!dados || !Array.isArray(dados.noticias)) throw new Error('data/noticias.json com formato inválido');
  return ordenar(dados.noticias);
}

export function criarCard(noticia, nivelTitulo = 'h3') {
  const midia = imagemValida(noticia.imagem)
    ? el('img', { class: 'card__imagem', src: noticia.imagem, alt: `Imagem da notícia: ${noticia.titulo}`, loading: 'lazy' })
    : el('div', { class: 'card__imagem card__imagem--vazia' }, el('img', { src: 'assets/icone.png', alt: '', width: 72, height: 72 }));

  return el('article', { class: 'card' },
    midia,
    el('div', { class: 'card__corpo' },
      el('span', { class: 'card__data', text: formatarData(noticia.data) }),
      el(nivelTitulo, { class: 'card__titulo' },
        el('a', { href: `noticia.html?id=${encodeURIComponent(noticia.id)}`, text: noticia.titulo })),
      el('p', { class: 'card__resumo', text: resumoOuInicio(noticia) }),
      el('span', { class: 'card__mais', 'aria-hidden': 'true', text: 'Ler notícia →' }),
    ),
  );
}

async function iniciarLista(container, limite, nivelTitulo) {
  try {
    const noticias = (await carregarNoticias()).slice(0, limite);
    if (noticias.length === 0) {
      montar(container, aviso(AVISO_VAZIO));
      return;
    }
    montar(container, noticias.map((noticia) => criarCard(noticia, nivelTitulo)));
  } catch (erro) {
    console.error(erro);
    montar(container, aviso(AVISO_ERRO, true));
  }
}

function linkVoltar() {
  return el('a', { class: 'leitura__voltar', href: 'noticias.html', text: '← Todas as notícias' });
}

async function iniciarLeitura(container) {
  let noticias;
  try {
    noticias = await carregarNoticias();
  } catch (erro) {
    console.error(erro);
    montar(container, linkVoltar(), aviso(AVISO_ERRO, true));
    return;
  }

  const id = new URLSearchParams(location.search).get('id');
  const noticia = id ? buscar(noticias, id) : undefined;
  if (!noticia) {
    document.title = `Notícia não encontrada · ${TITULO_SITE}`;
    montar(container,
      linkVoltar(),
      el('h1', { text: 'Notícia não encontrada' }),
      el('p', { text: 'O endereço pode estar errado ou a notícia foi removida.' }),
    );
    return;
  }

  document.title = `${noticia.titulo} · ${TITULO_SITE}`;
  const meta = [formatarData(noticia.data), noticia.autor ? `Por ${noticia.autor}` : ''].filter(Boolean).join(' · ');
  montar(container,
    linkVoltar(),
    el('h1', { text: noticia.titulo }),
    el('p', { class: 'leitura__meta', text: meta }),
    imagemValida(noticia.imagem)
      ? el('img', { class: 'leitura__imagem', src: noticia.imagem, alt: `Imagem da notícia: ${noticia.titulo}` })
      : null,
    el('div', { class: 'leitura__texto' }, paragrafos(noticia.texto).map((paragrafo) => el('p', { text: paragrafo }))),
  );
}

const pagina = document.body.dataset.pagina;
if (pagina === 'home') iniciarLista(document.getElementById('noticias-lista'), 3, 'h3');
else if (pagina === 'lista') iniciarLista(document.getElementById('noticias-lista'), Infinity, 'h2');
else if (pagina === 'leitura') iniciarLeitura(document.getElementById('leitura'));
```

- [ ] **Step 2: Incluir o script na página principal**

Em `index.html`, trocar a linha final de scripts:

```html
  <script type="module" src="js/main.js"></script>
```

por:

```html
  <script type="module" src="js/main.js"></script>
  <script type="module" src="js/noticias.js"></script>
```

- [ ] **Step 3: Criar `noticias.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Todas as notícias · Jornal FA News</title>
  <meta name="description" content="Todas as notícias do Jornal FA News, da escola Félix de Azevedo.">
  <meta name="theme-color" content="#0047ab">
  <link rel="icon" type="image/png" href="assets/icone.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body data-pagina="lista">
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>

  <header class="menu">
    <div class="container menu__interno">
      <a class="menu__logo" href="./" aria-label="Jornal FA News, página inicial">
        <img src="assets/logo-jornal.png" alt="Jornal FA News">
      </a>
      <button class="menu__botao" type="button" aria-expanded="false" aria-controls="menu-lista">
        <span class="menu__barras" aria-hidden="true"></span>
        <span class="sr-only">Abrir ou fechar o menu</span>
      </button>
      <nav aria-label="Principal">
        <ul class="menu__lista" id="menu-lista">
          <li><a href="./#inicio">Início</a></li>
          <li><a href="./#noticias">Notícias</a></li>
          <li><a href="./#videos">Vídeos</a></li>
          <li><a href="./#equipe">Equipe</a></li>
          <li><a href="./#patrocine">Patrocine</a></li>
          <li><a href="./#contato">Contato</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="conteudo">
    <section class="secao">
      <div class="container">
        <div class="secao__cabeca">
          <h1>Todas as notícias</h1>
          <p>Tudo o que aconteceu, do mais recente ao mais antigo.</p>
        </div>
        <div class="grade-cards" id="noticias-lista" aria-live="polite">
          <p class="aviso">Carregando notícias…</p>
        </div>
      </div>
    </section>
  </main>

  <footer class="rodape">
    <div class="container">
      <div class="rodape__grade">
        <img class="rodape__logo" src="assets/logo-escola.png" alt="Brasão da escola Félix de Azevedo">
        <div>
          <p class="rodape__nome">Félix de Azevedo</p>
          <p>Jornal FA News, o jornal interno da escola.</p>
        </div>
      </div>
      <p class="rodape__credito">Desenvolvido por <a href="https://www.isaacpaiva.com.br/" target="_blank" rel="noopener noreferrer">Isaac Paiva</a></p>
    </div>
  </footer>

  <script type="module" src="js/main.js"></script>
  <script type="module" src="js/noticias.js"></script>
</body>
</html>
```

- [ ] **Step 4: Criar `noticia.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Notícia · Jornal FA News</title>
  <meta name="theme-color" content="#0047ab">
  <link rel="icon" type="image/png" href="assets/icone.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body data-pagina="leitura">
  <a class="pular" href="#conteudo">Pular para o conteúdo</a>

  <header class="menu">
    <div class="container menu__interno">
      <a class="menu__logo" href="./" aria-label="Jornal FA News, página inicial">
        <img src="assets/logo-jornal.png" alt="Jornal FA News">
      </a>
      <button class="menu__botao" type="button" aria-expanded="false" aria-controls="menu-lista">
        <span class="menu__barras" aria-hidden="true"></span>
        <span class="sr-only">Abrir ou fechar o menu</span>
      </button>
      <nav aria-label="Principal">
        <ul class="menu__lista" id="menu-lista">
          <li><a href="./#inicio">Início</a></li>
          <li><a href="./#noticias">Notícias</a></li>
          <li><a href="./#videos">Vídeos</a></li>
          <li><a href="./#equipe">Equipe</a></li>
          <li><a href="./#patrocine">Patrocine</a></li>
          <li><a href="./#contato">Contato</a></li>
        </ul>
      </nav>
    </div>
  </header>

  <main id="conteudo">
    <article class="container leitura" id="leitura" aria-live="polite">
      <p class="aviso">Carregando notícia…</p>
    </article>
  </main>

  <footer class="rodape">
    <div class="container">
      <div class="rodape__grade">
        <img class="rodape__logo" src="assets/logo-escola.png" alt="Brasão da escola Félix de Azevedo">
        <div>
          <p class="rodape__nome">Félix de Azevedo</p>
          <p>Jornal FA News, o jornal interno da escola.</p>
        </div>
      </div>
      <p class="rodape__credito">Desenvolvido por <a href="https://www.isaacpaiva.com.br/" target="_blank" rel="noopener noreferrer">Isaac Paiva</a></p>
    </div>
  </footer>

  <script type="module" src="js/main.js"></script>
  <script type="module" src="js/noticias.js"></script>
</body>
</html>
```

- [ ] **Step 5: Verificar no navegador**

Run (em segundo plano): `npm run servir`

1. `http://localhost:4000/`: seção "Últimas notícias" mostra 3 cards (Exemplo: Bem-vindos…, Feira de Ciências, Campeonato Interclasse), do mais recente ao mais antigo, cada um com o ícone do jornal no lugar da foto, data por extenso ("30 de setembro de 2026"), título, resumo e "Ler notícia →". Clicar em qualquer ponto do card abre a notícia.
2. `http://localhost:4000/noticias.html`: os mesmos 3 cards em grade; o título da página é "Todas as notícias".
3. `http://localhost:4000/noticia.html?id=2026-09-26-exemplo-feira-de-ciencias`: título "Exemplo: Feira de Ciências", linha "26 de setembro de 2026 · Por Equipe FA News", dois parágrafos, link "← Todas as notícias"; a aba do navegador mostra "Exemplo: Feira de Ciências · Jornal FA News".
4. `http://localhost:4000/noticia.html?id=nao-existe` e `http://localhost:4000/noticia.html`: mostram "Notícia não encontrada" e o link de volta.
5. Teste de HTML no texto: editar temporariamente o campo `titulo` de uma notícia em `data/noticias.json` para `<b>oi</b><img src=x onerror=alert(1)>`, recarregar `/` e `/noticias.html`: o texto aparece literalmente, sem negrito e sem alerta. **Reverter** com `git checkout data/noticias.json`.
6. Teste de falha: renomear temporariamente `data/noticias.json`, recarregar `/`: aparece a mensagem "Não foi possível carregar as notícias agora…" em vermelho e o resto da página continua funcionando. **Reverter** o nome.
7. Teste de lista vazia: trocar temporariamente o conteúdo de `data/noticias.json` por `{ "noticias": [] }`: aparece "Ainda não há notícias publicadas. Volte em breve!". **Reverter** com `git checkout data/noticias.json`.
8. Console sem erros em todas as páginas; 375px de largura sem rolagem horizontal.

Parar o servidor. Confirmar `git status` sem alterações inesperadas em `data/`.

- [ ] **Step 6: Commit**

```bash
git add js/noticias.js noticias.html noticia.html index.html
git commit -m "feat: notícias no site com cards, lista completa e página de leitura" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Servidor GitHub falso para testar o painel

**Files:**
- Create: `scripts/mock-github.js`

**Interfaces:**
- Consumes: `data/noticias.json` (semente inicial em memória).
- Produces: servidor HTTP em `http://localhost:4010` que imita `GET/PUT/DELETE /repos/:owner/:repo/contents/*` e `GET /repos/:owner/:repo`.
  - Token aceito: `token-de-teste` (outro token → 401).
  - `PUT` em arquivo existente sem `sha` → 422; com `sha` diferente → 409; correto → 200. `DELETE` com `sha` diferente → 409.
  - Rotas de apoio: `GET /__estado` (lista de caminhos + conteúdo de `noticias.json`), `GET /__conflito?vezes=N` (as próximas N gravações respondem 409), `GET /__arquivo?caminho=...` (baixa um arquivo enviado).
  - CORS aberto (`*`) com preflight.
  - Dados só em memória: reiniciar o servidor volta ao estado do `data/noticias.json`.

- [ ] **Step 1: Criar `scripts/mock-github.js`**

```js
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
```

- [ ] **Step 2: Verificar com curl**

Run (em segundo plano): `npm run mock-github`

```bash
curl -s -o /dev/null -w "sem token: %{http_code}\n" http://localhost:4010/repos/a/b
curl -s -o /dev/null -w "com token: %{http_code}\n" -H "Authorization: Bearer token-de-teste" http://localhost:4010/repos/a/b
curl -s -o /dev/null -w "arquivo inexistente: %{http_code}\n" -H "Authorization: Bearer token-de-teste" "http://localhost:4010/repos/a/b/contents/nao/existe.jpg?ref=main"
curl -s http://localhost:4010/__estado
```

Expected: `sem token: 401`, `com token: 200`, `arquivo inexistente: 404`, e o `__estado` mostra `"caminhos":["data/noticias.json"]` com as 3 notícias de exemplo.

Verificar o controle de `sha` (PowerShell):

```powershell
$h = @{ Authorization = 'Bearer token-de-teste' }
$corpo = @{ message = 'x'; content = 'e30='; branch = 'main' } | ConvertTo-Json
try { Invoke-WebRequest -Method Put -Uri 'http://localhost:4010/repos/a/b/contents/data/noticias.json' -Headers $h -Body $corpo -ContentType 'application/json' -UseBasicParsing } catch { $_.Exception.Response.StatusCode.value__ }
```

Expected: `422` (arquivo existe e o `sha` não foi enviado).

Parar o servidor.

- [ ] **Step 3: Commit**

```bash
git add scripts/mock-github.js
git commit -m "chore: servidor GitHub falso para testar o painel localmente" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Painel administrativo

**Files:**
- Create: `admin/index.html`, `css/admin.css`, `js/admin.js`

**Interfaces:**
- Consumes: `carregarJson`; `criarClienteGitHub`, `ErroGitHub`; `ordenar`, `buscar`, `LIMITE_RESUMO`; `publicarNoticia`, `excluirNoticiaPublicada`, `ErroValidacao`, `CAMINHO_JSON`; `prepararImagem`, `validarArquivoImagem`; `formatarData`, `dataIsoLocal`; `el`, `montar`; `data/config.json` (`github.owner/repo/branch` e `github.apiUrl` opcional).
- Produces: página `/admin/` com telas de login, lista e formulário. Chave de armazenamento do token: `fa-news-token`.

- [ ] **Step 1: Criar `css/admin.css`**

```css
/* Estilos do painel administrativo. Usa os tokens e botões de style.css. */
.admin { min-height: 100vh; background: var(--cinza-claro); }

.admin__topo { padding: 14px 0; background: var(--azul-profundo); color: var(--branco); }
.admin__topo .container { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.admin__marca { display: flex; align-items: center; gap: 14px; }
.admin__marca img { height: 36px; padding: 4px 10px; border-radius: 8px; background: var(--branco); }
.admin__marca strong { font-family: var(--fonte-titulo); font-size: 1.05rem; }
.admin__topo .botao--contorno { color: var(--branco); border-color: var(--branco); }
.admin__topo .botao--contorno:hover { background: rgba(255, 255, 255, 0.12); }
.admin__topo :focus-visible { outline-color: var(--amarelo); }

.mensagem-area { max-width: 960px; margin: 24px auto 0; }
.mensagem { margin-bottom: 0; padding: 12px 16px; border-radius: 10px; font-weight: 600; }
.mensagem--erro { background: #fdecea; color: var(--erro); }
.mensagem--ok { background: #e7f6ee; color: var(--sucesso); }
.mensagem--info { background: #e8f0fe; color: var(--azul-escuro); }

.painel { max-width: 720px; margin: 24px auto 48px; padding: 28px; border-radius: var(--raio); background: var(--branco); box-shadow: var(--sombra); }
.painel--largo { max-width: 960px; }
.painel h1 { font-size: 1.6rem; font-weight: 800; }
.painel__cabeca { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
.painel__cabeca h1 { margin: 0; }
.painel__ajuda { margin: 0 0 20px; color: var(--texto-suave); font-size: 0.98rem; }

.campo { display: grid; gap: 6px; margin-bottom: 18px; }
.campo label { font-weight: 700; color: var(--azul-profundo); }
.campo input[type="text"], .campo input[type="password"], .campo input[type="date"], .campo textarea {
  width: 100%; padding: 12px 14px; border: 2px solid #ccd3e0; border-radius: 10px; background: var(--branco); color: var(--texto); font: inherit;
}
.campo input:focus, .campo textarea:focus { border-color: var(--azul); outline: none; box-shadow: 0 0 0 3px rgba(0, 71, 171, 0.2); }
.campo textarea { min-height: 96px; resize: vertical; }
.campo textarea.campo__texto { min-height: 240px; }
.campo small { color: var(--texto-suave); }
.campo--linha { display: flex; align-items: center; gap: 10px; }
.campo--linha label { font-weight: 600; }
.contador { justify-self: end; font-size: 0.85rem; color: var(--texto-suave); }
.contador.excedeu { color: var(--erro); font-weight: 700; }
.previa-imagem { max-width: 320px; margin-top: 8px; border-radius: 10px; }

.linha-acoes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px; }

.lista-admin { display: grid; gap: 12px; margin: 0; padding: 0; list-style: none; }
.item-admin { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 16px; border: 1px solid #e3e7f0; border-radius: 12px; }
.item-admin__titulo { font-weight: 700; color: var(--azul-profundo); }
.item-admin__data { font-size: 0.9rem; color: var(--texto-suave); }
.item-admin__acoes { display: flex; gap: 8px; }
```

- [ ] **Step 2: Criar `admin/index.html`**

```html
<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>Painel · Jornal FA News</title>
  <link rel="icon" type="image/png" href="../assets/icone.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="../css/admin.css">
</head>
<body class="admin" data-pagina="admin">
  <header class="admin__topo">
    <div class="container">
      <div class="admin__marca">
        <img src="../assets/logo-jornal.png" alt="Jornal FA News">
        <strong>Painel administrativo</strong>
      </div>
      <button class="botao botao--contorno botao--pequeno" type="button" id="botao-sair" hidden>Sair</button>
    </div>
  </header>

  <main class="container">
    <div class="mensagem-area" id="mensagem" role="status" aria-live="polite"></div>

    <section class="painel" id="tela-login">
      <h1>Entrar</h1>
      <p class="painel__ajuda">
        Cole o token de acesso do GitHub. Ele fica guardado só neste navegador e nunca vai para o site.
        O passo a passo para gerar o token está no arquivo README do projeto.
      </p>
      <form id="form-login" autocomplete="off">
        <div class="campo">
          <label for="campo-token">Token de acesso</label>
          <input type="password" id="campo-token" autocomplete="off" spellcheck="false" required>
        </div>
        <div class="campo campo--linha">
          <input type="checkbox" id="campo-lembrar">
          <label for="campo-lembrar">Lembrar neste dispositivo</label>
        </div>
        <div class="linha-acoes">
          <button class="botao botao--azul" type="submit" id="botao-entrar">Entrar</button>
        </div>
      </form>
    </section>

    <section class="painel painel--largo" id="tela-lista" hidden>
      <div class="painel__cabeca">
        <h1>Notícias</h1>
        <button class="botao botao--azul" type="button" id="botao-nova">Nova notícia</button>
      </div>
      <ul class="lista-admin" id="lista-admin"></ul>
    </section>

    <section class="painel" id="tela-form" hidden>
      <h1 id="titulo-formulario">Nova notícia</h1>
      <form id="form-noticia" novalidate>
        <div class="campo">
          <label for="campo-titulo">Título</label>
          <input type="text" id="campo-titulo" maxlength="200">
        </div>
        <div class="campo">
          <label for="campo-autor">Autor</label>
          <input type="text" id="campo-autor" maxlength="120">
        </div>
        <div class="campo">
          <label for="campo-data">Data</label>
          <input type="date" id="campo-data">
        </div>
        <div class="campo">
          <label for="campo-resumo">Resumo (opcional)</label>
          <textarea id="campo-resumo" rows="3"></textarea>
          <span class="contador" id="contador-resumo" aria-live="polite">0/160</span>
          <small>Aparece no cartão da notícia. Se ficar em branco, usamos o início do texto.</small>
        </div>
        <div class="campo">
          <label for="campo-texto">Texto</label>
          <textarea id="campo-texto" class="campo__texto"></textarea>
          <small>Deixe uma linha em branco entre um parágrafo e outro.</small>
        </div>
        <div class="campo">
          <label for="campo-imagem">Imagem de capa (opcional)</label>
          <input type="file" id="campo-imagem" accept="image/jpeg,image/png,image/webp">
          <small>JPG, PNG ou WebP. A imagem é reduzida automaticamente antes de ser enviada.</small>
          <img class="previa-imagem" id="previa-imagem" alt="Prévia da imagem escolhida" hidden>
        </div>
        <div class="campo campo--linha" id="grupo-remover-imagem" hidden>
          <input type="checkbox" id="campo-remover-imagem">
          <label for="campo-remover-imagem">Remover a imagem atual</label>
        </div>
        <div class="linha-acoes">
          <button class="botao botao--azul" type="submit" id="botao-publicar">Publicar</button>
          <button class="botao botao--contorno" type="button" id="botao-cancelar">Cancelar</button>
        </div>
      </form>
    </section>
  </main>

  <script type="module" src="../js/admin.js"></script>
</body>
</html>
```

- [ ] **Step 3: Criar `js/admin.js`**

```js
import { carregarJson } from './lib/dados.js';
import { criarClienteGitHub, ErroGitHub } from './lib/github.js';
import { ordenar, buscar, LIMITE_RESUMO } from './lib/modelo.js';
import { publicarNoticia, excluirNoticiaPublicada, ErroValidacao, CAMINHO_JSON } from './lib/publicar.js';
import { prepararImagem, validarArquivoImagem } from './lib/imagem.js';
import { formatarData, dataIsoLocal } from './lib/formato.js';
import { el, montar } from './lib/dom.js';

const CHAVE_TOKEN = 'fa-news-token';
const AVISO_PUBLICACAO = 'O site será atualizado em cerca de 1 a 2 minutos.';

const $ = (id) => document.getElementById(id);
const telas = { login: $('tela-login'), lista: $('tela-lista'), form: $('tela-form') };

let config = null;
let cliente = null;
let lista = [];
let editandoId = null;
let imagemPreparada = null; // { base64, previaUrl } da imagem escolhida no formulário

// ===== Token =====
function lerToken() {
  try {
    return sessionStorage.getItem(CHAVE_TOKEN) ?? localStorage.getItem(CHAVE_TOKEN);
  } catch {
    return null;
  }
}

function guardarToken(token, lembrar) {
  try {
    (lembrar ? localStorage : sessionStorage).setItem(CHAVE_TOKEN, token);
  } catch {
    // Armazenamento indisponível: o token vale só enquanto esta página estiver aberta.
  }
}

function apagarToken() {
  try {
    sessionStorage.removeItem(CHAVE_TOKEN);
    localStorage.removeItem(CHAVE_TOKEN);
  } catch {
    // Nada a apagar se o armazenamento está indisponível.
  }
}

// ===== Telas e mensagens =====
function mostrarTela(nome) {
  for (const [chave, secao] of Object.entries(telas)) secao.hidden = chave !== nome;
  $('botao-sair').hidden = nome === 'login';
}

function mostrarMensagem(tipo, texto) {
  montar($('mensagem'), el('div', { class: `mensagem mensagem--${tipo}`, text: texto }));
  $('mensagem').scrollIntoView({ block: 'nearest' });
}

function limparMensagem() {
  montar($('mensagem'));
}

function textoDoErro(erro) {
  if (erro instanceof ErroValidacao) return erro.erros.join(' ');
  if (erro instanceof ErroGitHub && erro.tipo === 'conflito') {
    return 'Não foi possível salvar porque outra pessoa alterou as notícias ao mesmo tempo. Tente de novo.';
  }
  return erro?.message || 'Algo deu errado. Tente de novo.';
}

function tratarErro(erro) {
  console.error(erro);
  if (erro instanceof ErroGitHub && erro.tipo === 'token') {
    apagarToken();
    cliente = null;
    mostrarTela('login');
  }
  mostrarMensagem('erro', textoDoErro(erro));
}

// ===== Lista =====
async function recarregarLista() {
  const { dados } = await cliente.lerJson(CAMINHO_JSON);
  lista = dados.noticias;
  desenharLista();
}

function desenharLista() {
  const itens = ordenar(lista);
  montar($('lista-admin'),
    itens.length === 0
      ? el('li', { class: 'aviso', text: 'Nenhuma notícia publicada ainda.' })
      : itens.map((noticia) => el('li', { class: 'item-admin' },
          el('div', {},
            el('div', { class: 'item-admin__titulo', text: noticia.titulo }),
            el('div', { class: 'item-admin__data', text: formatarData(noticia.data) }),
          ),
          el('div', { class: 'item-admin__acoes' },
            el('button', { type: 'button', class: 'botao botao--contorno botao--pequeno', text: 'Editar', onclick: () => abrirFormulario(noticia.id) }),
            el('button', { type: 'button', class: 'botao botao--perigo botao--pequeno', text: 'Excluir', onclick: () => excluir(noticia) }),
          ),
        )),
  );
}

async function excluir(noticia) {
  if (!window.confirm(`Excluir a notícia "${noticia.titulo}"? Esta ação não pode ser desfeita.`)) return;
  limparMensagem();
  try {
    const { avisos } = await excluirNoticiaPublicada({ cliente, id: noticia.id });
    await recarregarLista();
    mostrarMensagem(avisos.length > 0 ? 'info' : 'ok', ['Notícia excluída.', AVISO_PUBLICACAO, ...avisos].join(' '));
  } catch (erro) {
    tratarErro(erro);
  }
}

// ===== Formulário =====
function atualizarContador() {
  const tamanho = $('campo-resumo').value.length;
  $('contador-resumo').textContent = `${tamanho}/${LIMITE_RESUMO}`;
  $('contador-resumo').classList.toggle('excedeu', tamanho > LIMITE_RESUMO);
}

function atualizarPrevia(src) {
  const imagem = $('previa-imagem');
  if (src) {
    imagem.src = src;
    imagem.hidden = false;
  } else {
    imagem.removeAttribute('src');
    imagem.hidden = true;
  }
}

function abrirFormulario(id = null) {
  limparMensagem();
  editandoId = id;
  imagemPreparada = null;
  const noticia = id ? buscar(lista, id) : null;
  $('titulo-formulario').textContent = noticia ? 'Editar notícia' : 'Nova notícia';
  $('campo-titulo').value = noticia?.titulo ?? '';
  $('campo-autor').value = noticia?.autor ?? 'Equipe FA News';
  $('campo-data').value = noticia?.data ?? dataIsoLocal();
  $('campo-resumo').value = noticia?.resumo ?? '';
  $('campo-texto').value = noticia?.texto ?? '';
  $('campo-imagem').value = '';
  $('campo-remover-imagem').checked = false;
  $('grupo-remover-imagem').hidden = !noticia?.imagem;
  atualizarContador();
  atualizarPrevia(noticia?.imagem ? `../${noticia.imagem}` : null);
  mostrarTela('form');
  $('campo-titulo').focus();
}

async function aoEscolherImagem(evento) {
  const arquivo = evento.target.files[0];
  imagemPreparada = null;
  if (!arquivo) {
    atualizarPrevia(null);
    return;
  }
  const problema = validarArquivoImagem(arquivo);
  if (problema) {
    evento.target.value = '';
    atualizarPrevia(null);
    mostrarMensagem('erro', problema);
    return;
  }
  try {
    imagemPreparada = await prepararImagem(arquivo);
    atualizarPrevia(imagemPreparada.previaUrl);
    $('campo-remover-imagem').checked = false;
    limparMensagem();
  } catch (erro) {
    console.error(erro);
    evento.target.value = '';
    atualizarPrevia(null);
    mostrarMensagem('erro', 'Não foi possível ler esta imagem. Tente outro arquivo.');
  }
}

async function aoEnviarFormulario(evento) {
  evento.preventDefault();
  limparMensagem();
  const botao = $('botao-publicar');
  botao.disabled = true;
  botao.textContent = 'Publicando…';
  try {
    const dados = {
      titulo: $('campo-titulo').value,
      autor: $('campo-autor').value,
      data: $('campo-data').value,
      resumo: $('campo-resumo').value,
      texto: $('campo-texto').value,
    };
    const { avisos } = await publicarNoticia({
      cliente,
      dados,
      id: editandoId,
      imagemBase64: imagemPreparada?.base64 ?? null,
      removerImagem: $('campo-remover-imagem').checked,
    });
    await recarregarLista();
    mostrarTela('lista');
    mostrarMensagem(avisos.length > 0 ? 'info' : 'ok', ['Publicado!', AVISO_PUBLICACAO, ...avisos].join(' '));
  } catch (erro) {
    tratarErro(erro);
  } finally {
    botao.disabled = false;
    botao.textContent = 'Publicar';
  }
}

// ===== Login =====
async function entrar(token) {
  const novo = criarClienteGitHub({ ...config.github, token });
  await novo.validarAcesso();
  cliente = novo;
  await recarregarLista();
  mostrarTela('lista');
}

async function aoEnviarLogin(evento) {
  evento.preventDefault();
  limparMensagem();
  const token = $('campo-token').value.trim();
  if (!token) {
    mostrarMensagem('erro', 'Cole o token de acesso.');
    return;
  }
  const botao = $('botao-entrar');
  botao.disabled = true;
  try {
    await entrar(token);
    guardarToken(token, $('campo-lembrar').checked);
    $('campo-token').value = '';
  } catch (erro) {
    tratarErro(erro);
  } finally {
    botao.disabled = false;
  }
}

function sair() {
  apagarToken();
  cliente = null;
  lista = [];
  limparMensagem();
  mostrarTela('login');
}

// ===== Início =====
async function iniciar() {
  $('form-login').addEventListener('submit', aoEnviarLogin);
  $('form-noticia').addEventListener('submit', aoEnviarFormulario);
  $('campo-resumo').addEventListener('input', atualizarContador);
  $('campo-imagem').addEventListener('change', aoEscolherImagem);
  $('botao-nova').addEventListener('click', () => abrirFormulario());
  $('botao-cancelar').addEventListener('click', () => {
    limparMensagem();
    mostrarTela('lista');
  });
  $('botao-sair').addEventListener('click', sair);
  mostrarTela('login');

  try {
    config = await carregarJson('../data/config.json');
  } catch (erro) {
    console.error(erro);
    mostrarMensagem('erro', 'Não foi possível ler o arquivo data/config.json.');
    return;
  }
  if (config.github.owner === 'SEU-USUARIO') {
    mostrarMensagem('info', 'Antes de usar o painel, informe o seu repositório do GitHub em data/config.json.');
  }

  const guardado = lerToken();
  if (guardado) {
    try {
      await entrar(guardado);
    } catch (erro) {
      tratarErro(erro);
    }
  }
}

iniciar();
```

- [ ] **Step 4: Verificar o painel contra o GitHub falso**

Run (dois processos em segundo plano): `npm run servir` e `npm run mock-github`.

Editar **temporariamente** `data/config.json`, trocando o bloco `github` por:

```json
"github": { "owner": "teste", "repo": "teste", "branch": "main", "apiUrl": "http://localhost:4010" },
```

Abrir `http://localhost:4000/admin/` e conferir, na ordem:

1. Tela "Entrar" com campo de token, caixa "Lembrar neste dispositivo" e botão. Botão "Sair" oculto. Página sem link no menu do site (`/` não menciona o painel).
2. Token `errado` → mensagem em vermelho "O token é inválido, expirou ou não tem permissão neste repositório." e continua na tela de login.
3. Token `token-de-teste` → aparece a lista com as 3 notícias de exemplo (mais recente primeiro), botões Editar/Excluir e "Nova notícia"; botão "Sair" visível.
4. **Nova notícia**: formulário com autor "Equipe FA News" e a data de hoje. Enviar vazio → mensagem "Informe o título. Escreva o texto da notícia.". Preencher título "Teste do painel", texto com dois parágrafos, resumo qualquer; digitar 170 caracteres no resumo → contador fica vermelho e a publicação é recusada com a mensagem do limite; corrigir.
5. Escolher `assets/logo-escola.png` como imagem → prévia aparece; um arquivo `.gif` ou `.pdf` é recusado com "Use uma imagem JPG, PNG ou WebP.". Publicar → mensagem verde "Publicado! O site será atualizado em cerca de 1 a 2 minutos.", volta à lista com a nova notícia no topo.
6. `curl http://localhost:4010/__estado`: `caminhos` inclui `assets/noticias/<data>-teste-do-painel.jpg` e a notícia nova, com `"imagem": "assets/noticias/<id>.jpg"`, aparece primeiro em `noticias`.
7. **Editar** a notícia nova: formulário preenchido, prévia da imagem atual (pode aparecer quebrada porque a imagem só existe no GitHub falso, e isso é esperado), caixa "Remover a imagem atual" visível. Mudar o título e publicar → o id não muda (`__estado`), o título muda.
8. **Editar** de novo marcando "Remover a imagem atual" e publicar → em `__estado`, `imagem` fica `null` e o arquivo `.jpg` some de `caminhos`.
9. **Conflito com sucesso**: `curl "http://localhost:4010/__conflito?vezes=1"`, depois publicar uma edição → funciona (repetiu sozinho). **Conflito sem sucesso**: `curl "http://localhost:4010/__conflito?vezes=3"`, publicar → mensagem "Não foi possível salvar porque outra pessoa alterou as notícias ao mesmo tempo. Tente de novo."; o formulário continua na tela com os dados preenchidos; publicar de novo funciona.
10. **Excluir** a notícia nova → confirmação do navegador; aceitar → some da lista, mensagem verde; `__estado` sem ela. Cancelar a confirmação não exclui nada.
11. Injeção: criar notícia com título `<img src=x onerror=alert(1)>` → aparece como texto na lista do painel, sem alerta. Excluí-la depois.
12. Sair → volta ao login e apaga o token. Entrar de novo sem marcar "lembrar" e recarregar a página (F5) → entra automaticamente (sessionStorage). Fechar e reabrir a aba → pede o token de novo. Entrar marcando "lembrar", fechar e reabrir → entra direto; "Sair" apaga.
13. Parar o servidor GitHub falso e clicar em Publicar (ou recarregar logado): mensagem "Sem conexão com a internet…" sem quebrar a página.
14. Console sem erros inesperados; 375px de largura: sem rolagem horizontal, formulário legível.

**Reverter** a configuração: `git checkout data/config.json`. Confirmar com `git diff --stat` que `data/` não tem alterações.

Parar os servidores.

- [ ] **Step 5: Commit**

```bash
git add admin css/admin.css js/admin.js
git commit -m "feat: painel administrativo para publicar notícias pelo GitHub" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 13: README e verificação final

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: todo o projeto.
- Produces: guia em português para publicar e operar o site, e a verificação final do conjunto.

- [ ] **Step 1: Criar `README.md`**

````markdown
# Jornal FA News

Site do jornal interno da escola Félix de Azevedo. É um site estático (HTML, CSS e JavaScript), publicado no GitHub Pages, com um painel administrativo em `/admin` para publicar notícias. Não usa banco de dados: as notícias ficam no arquivo `data/noticias.json` e as fotos em `assets/noticias/`.

Desenvolvido por [Isaac Paiva](https://www.isaacpaiva.com.br/).

## O que tem no site

- Página principal: boas-vindas, últimas notícias, botão para o YouTube, equipe, patrocínio (WhatsApp) e redes sociais.
- `noticias.html`: todas as notícias. `noticia.html?id=...`: uma notícia.
- `admin/`: painel para criar, editar e excluir notícias.

## Ver o site no computador

Precisa do [Node.js](https://nodejs.org/) (versão 20 ou mais nova).

```bash
npm run servir
```

Abra http://localhost:4000. Para rodar os testes automáticos: `npm test`.

## Publicar no GitHub Pages (uma vez só)

1. Crie uma conta em https://github.com, se ainda não tiver.
2. Crie um repositório **público** (por exemplo `fa-news`). O GitHub Pages gratuito exige repositório público.
3. Envie o projeto para o repositório:
   ```bash
   git remote add origin https://github.com/SEU-USUARIO/fa-news.git
   git push -u origin main
   ```
4. No GitHub, abra o repositório > **Settings** > **Pages**. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main` e pasta `/ (root)`. Salve.
5. Aguarde cerca de 1 a 2 minutos. O endereço aparece na mesma tela (algo como `https://SEU-USUARIO.github.io/fa-news/`).
6. Para usar um domínio próprio (por exemplo `jornalfa.com.br`), preencha o campo **Custom domain** na mesma tela e siga as instruções de DNS do GitHub.

## Configurar o painel

Edite `data/config.json` e troque `SEU-USUARIO` e `fa-news` pelo dono e pelo nome do seu repositório:

```json
"github": { "owner": "SEU-USUARIO", "repo": "fa-news", "branch": "main" }
```

Salve e envie a alteração para o GitHub (`git add`, `git commit`, `git push`).

## Gerar o token de acesso (para quem vai publicar)

O painel grava no repositório usando um token pessoal do GitHub.

1. No GitHub: foto do perfil > **Settings** > **Developer settings** > **Personal access tokens** > **Fine-grained tokens** > **Generate new token**.
2. **Token name:** `Painel FA News`. **Expiration:** escolha uma validade (por exemplo, 1 ano).
3. **Repository access:** *Only select repositories* e escolha o repositório do jornal.
4. **Permissions** > **Repository permissions** > **Contents: Read and write**.
5. Clique em **Generate token** e copie o valor (ele só aparece uma vez).

Guarde o token em local seguro e não o compartilhe fora da equipe. Se ele vazar, apague-o em **Fine-grained tokens** e gere outro.

## Publicar uma notícia

1. Abra `https://SEU-SITE/admin/`.
2. Cole o token e clique em **Entrar**. Marque "Lembrar neste dispositivo" só em computador ou celular de uso pessoal.
3. Clique em **Nova notícia**, preencha título, texto (uma linha em branco separa os parágrafos), resumo e, se quiser, a imagem de capa.
4. Clique em **Publicar**. A notícia aparece no site em cerca de 1 a 2 minutos.
5. Para corrigir ou apagar, use **Editar** ou **Excluir** na lista. Ao terminar, clique em **Sair**, principalmente em computadores compartilhados.

As três notícias que vêm no projeto são exemplos (título começa com "Exemplo:"). Exclua-as pelo painel quando publicar as reais.

## Trocar textos, equipe e contatos

| O que | Onde |
|---|---|
| Texto de boas-vindas | `index.html`, parágrafo com a classe `hero__texto` |
| Integrantes da equipe | `data/equipe.json` |
| Links, WhatsApp, e-mail | `data/config.json` |

**Equipe:** para cada integrante, edite `nome`, `funcao` e `bio`. Para usar foto, coloque o arquivo em `assets/equipe/` (JPG, PNG ou WebP, de preferência quadrada e com menos de 500 KB) e escreva o caminho em `foto`, por exemplo `"foto": "assets/equipe/maria.jpg"`. Sem foto (`null`), o site mostra as iniciais.

**Contatos:** em `data/config.json`, troque `email` pelo e-mail real. O número do WhatsApp fica em `whatsapp` (só dígitos, com 55 e DDD) e `whatsappExibicao` (como aparece no site).

## Problemas comuns

- **"O token é inválido, expirou ou não tem permissão":** gere um token novo (veja acima) e confira se a permissão **Contents: Read and write** está marcada e se o repositório certo foi escolhido.
- **"Repositório ou arquivo não encontrado":** confira `owner` e `repo` em `data/config.json` e se essas alterações foram enviadas ao GitHub.
- **A notícia não aparece logo:** aguarde 1 a 2 minutos e recarregue. O GitHub Pages precisa publicar de novo a cada alteração.
- **"Outra pessoa alterou as notícias ao mesmo tempo":** tente publicar de novo.

## Testar o painel sem GitHub (desenvolvimento)

`npm run mock-github` sobe um GitHub falso em http://localhost:4010 (token `token-de-teste`). Para usá-lo, acrescente temporariamente `"apiUrl": "http://localhost:4010"` ao bloco `github` de `data/config.json` e **remova** antes de publicar.

## Estrutura

```
index.html, noticias.html, noticia.html   páginas do site
admin/index.html                          painel
css/                                      estilos
js/                                       scripts (js/lib/ tem a lógica testada)
data/                                     notícias, equipe e configuração
assets/                                   logos, fotos das notícias e da equipe
scripts/                                  ferramentas locais (servidor, GitHub falso, recorte de logos)
tests/                                    testes automáticos (npm test)
```
````

- [ ] **Step 2: Rodar todos os testes**

Run: `npm test`
Expected: todos os testes passando (slug, texto, formato, modelo, github, imagem, publicar, dados), `fail 0`.

- [ ] **Step 3: Verificações de segurança e limpeza no código**

Run:

```bash
grep -rnE "innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(" js/ || echo "OK: nenhuma API insegura em js/"
grep -rnE "TODO|FIXME|XXX" js css index.html noticias.html noticia.html admin data || echo "OK: sem pendências no código"
grep -n "apiUrl" data/config.json || echo "OK: config.json sem apiUrl"
grep -rn "token" data/ || echo "OK: nenhum token em data/"
```

Expected: as quatro linhas "OK: ...". Se alguma falhar, corrigir antes de seguir.

- [ ] **Step 4: Verificação final no navegador**

Run (em segundo plano): `npm run servir`

1. Percorrer `/`, `/noticias.html`, `/noticia.html?id=2026-09-30-exemplo-bem-vindos-ao-jornal-fa-news` e `/admin/` em 1280px e em 375px de largura: sem rolagem horizontal, sem sobreposição de elementos, todos os textos legíveis, foco de teclado visível ao navegar com Tab (inclusive o link "Pular para o conteúdo" ao primeiro Tab).
2. Console sem erros nem avisos nas 4 páginas.
3. Clicar em todos os links externos e conferir o destino: YouTube `https://www.youtube.com/@JornalFA`, Instagram `https://www.instagram.com/jorna.lfa/`, WhatsApp `https://wa.me/5585996333970?text=...` (mensagem de patrocínio preenchida), crédito `https://www.isaacpaiva.com.br/`.
4. Conferir que `/` não tem nenhum link para `/admin/`.

Parar o servidor.

- [ ] **Step 5: Commit final**

```bash
git add README.md
git commit -m "docs: guia de publicação e uso do site" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git status --short
```

Expected: `git status --short` sem saída (árvore limpa).

- [ ] **Step 6: Entregar ao usuário**

Informar, sem rodeios: o que foi entregue e verificado (testes automáticos, verificação no navegador, painel testado contra o GitHub falso); que **o painel ainda não foi testado contra um repositório real do GitHub** (depende de o Isaac criar o repositório e o token); e a lista de valores provisórios a trocar (texto de boas-vindas, equipe, e-mail, `owner`/`repo` em `config.json`, notícias de exemplo).

---

## Self-review (feito ao escrever o plano)

**Cobertura da especificação:** estrutura de arquivos (Task 1, 2–12; `.nojekyll` na Task 1); dados e schemas (Task 8); home com as 7 seções na ordem do esboço (Task 9); `noticias.html`/`noticia.html` e leitura com revalidação de cache, falha e vazio (Tasks 8 e 10); visual, acessibilidade e responsivo (Task 9 e verificações); painel — acesso por token com `sessionStorage`/`localStorage` e "Sair" (Task 12), telas, fluxo de salvar com repetição em conflito, exclusão com imagem, tratamento de erros (Tasks 5, 7, 12); testes automáticos das funções puras e do `github.js` com fetch simulado (Tasks 2–8); verificação manual em desktop/375px (Tasks 9, 10, 12, 13); README com passo a passo (Task 13); valores provisórios (Task 8 e README). Itens fora do escopo continuam fora.

**Desvios em relação à especificação, todos aditivos:** `js/lib/publicar.js` (fluxo de publicação testável, Task 7), `css/admin.css`, `scripts/` (servidor local, GitHub falso, recorte de logos), `assets/originais/` e o campo opcional `github.apiUrl` em `config.json`. A especificação já foi atualizada com esses itens.

**Consistência de tipos e nomes:** `criarClienteGitHub` devolve `validarAcesso`, `lerJson`, `atualizarJson`, `enviarArquivo`, `apagarArquivo`, exatamente os usados em `publicar.js` e `admin.js`; `imagemValida(caminho, pasta)` usado com a pasta padrão nas notícias e `'assets/equipe/'` na equipe; `ErroValidacao.erros`, `CAMINHO_JSON`, `LIMITE_RESUMO`, `montar`/`el` e as chaves de `data-*` são os mesmos onde aparecem.

**Limite conhecido:** o painel só é exercitado de ponta a ponta contra o GitHub falso; a validação contra um repositório real fica para quando o repositório e o token existirem (registrado no Step 6 da Task 13).
