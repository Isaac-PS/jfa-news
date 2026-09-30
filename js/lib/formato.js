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
