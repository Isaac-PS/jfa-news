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
