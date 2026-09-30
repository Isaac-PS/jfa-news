// Texto de uma notícia: parágrafos separados por linha em branco, com marcação simples opcional:
//   ## Subtítulo   **negrito**   *itálico*   [texto](https://link)
//   ![descrição](endereço)   (imagem, sozinha no parágrafo)
//   https://youtu.be/...     (link de YouTube ou Vimeo sozinho no parágrafo vira vídeo)
// O resultado é uma árvore de dados, nunca HTML: quem exibe deve criar nós com textContent.
import { imagemValida } from './formato.js';

const PASTA_IMAGENS = 'assets/noticias/';

export function paragrafos(texto) {
  return String(texto ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((paragrafo) => paragrafo.trim())
    .filter(Boolean);
}

export function linkSeguro(endereco) {
  try {
    const url = new URL(endereco);
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? endereco : null;
  } catch {
    return null;
  }
}

export function imagemSegura(endereco) {
  if (imagemValida(endereco, PASTA_IMAGENS)) return endereco;
  try {
    return new URL(endereco).protocol === 'https:' ? endereco : null;
  } catch {
    return null;
  }
}

export function videoIncorporado(endereco) {
  let url;
  try {
    url = new URL(endereco);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:') return null;
  const host = url.hostname.replace(/^(www|m)\./, '');
  let id = null;
  if (host === 'youtube.com') {
    id = url.pathname === '/watch' ? url.searchParams.get('v') : url.pathname.match(/^\/(?:shorts|embed)\/([\w-]{11})$/)?.[1];
  } else if (host === 'youtu.be') {
    id = url.pathname.slice(1);
  }
  if (id !== null && id !== undefined) return /^[\w-]{11}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  if (host === 'vimeo.com') {
    const numero = url.pathname.match(/^\/(\d+)$/)?.[1];
    return numero ? `https://player.vimeo.com/video/${numero}` : null;
  }
  return null;
}

const MARCACAO_INLINE = /\[([^\]\n]+)\]\(([^)\s]+)\)|\*\*(?!\s)([^*]*[^*\s])\*\*|\*(?!\s)([^*\n]*[^*\s\n])\*/;

function inline(texto) {
  const partes = [];
  let resto = texto;
  while (resto) {
    const achado = MARCACAO_INLINE.exec(resto);
    if (!achado) {
      partes.push({ tipo: 'texto', texto: resto });
      break;
    }
    if (achado.index > 0) partes.push({ tipo: 'texto', texto: resto.slice(0, achado.index) });
    const [completo, rotuloLink, endereco, negrito, italico] = achado;
    if (rotuloLink !== undefined) {
      const href = linkSeguro(endereco);
      partes.push(href ? { tipo: 'link', href, partes: inline(rotuloLink) } : { tipo: 'texto', texto: completo });
    } else if (negrito !== undefined) {
      partes.push({ tipo: 'negrito', partes: inline(negrito) });
    } else {
      partes.push({ tipo: 'italico', partes: inline(italico) });
    }
    resto = resto.slice(achado.index + completo.length);
  }
  return partes;
}

function bloco(paragrafo) {
  const subtitulo = paragrafo.match(/^##[ \t]+(.+)$/);
  if (subtitulo) return { tipo: 'subtitulo', partes: inline(subtitulo[1].trim()) };

  const imagem = paragrafo.match(/^!\[([^\]\n]*)\]\(([^)\s]+)\)$/);
  if (imagem) {
    const src = imagemSegura(imagem[2]);
    if (src) return { tipo: 'imagem', src, alt: imagem[1] };
  }

  if (!/\s/.test(paragrafo)) {
    const video = videoIncorporado(paragrafo);
    if (video) return { tipo: 'video', src: video };
  }

  return { tipo: 'paragrafo', partes: inline(paragrafo) };
}

export function blocos(texto) {
  return paragrafos(texto).map(bloco);
}

function textoDasPartes(partes) {
  return partes.map((parte) => (parte.tipo === 'texto' ? parte.texto : textoDasPartes(parte.partes))).join('');
}

// O texto sem marcação nem mídia, em uma linha só: serve de resumo automático.
export function textoSimples(texto) {
  return blocos(texto)
    .filter((b) => b.partes)
    .map((b) => textoDasPartes(b.partes))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Imagens do corpo hospedadas no próprio site (as únicas que o painel pode apagar).
export function imagensDoTexto(texto) {
  return blocos(texto).filter((b) => b.tipo === 'imagem' && imagemValida(b.src, PASTA_IMAGENS)).map((b) => b.src);
}
