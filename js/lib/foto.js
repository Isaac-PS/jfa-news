export const LADO_FOTO = 500;
const QUALIDADE_JPEG = 0.88;

// Quadrado de recorte: usa o lado menor da imagem. `posicao` (0 a 1) escolhe onde ele fica no eixo que tem folga.
export function calcularRecorte(largura, altura, posicao) {
  const lado = Math.min(largura, altura);
  const p = Math.min(1, Math.max(0, posicao));
  return {
    x: Math.round((largura - lado) * (largura > altura ? p : 0)),
    y: Math.round((altura - lado) * (altura > largura ? p : 0)),
    lado,
    saida: Math.min(lado, LADO_FOTO),
  };
}

// Só funciona no navegador (usa canvas). Devolve o JPEG quadrado em base64, sem o prefixo "data:".
export function recortarFoto(imagem, posicao) {
  const { x, y, lado, saida } = calcularRecorte(imagem.width, imagem.height, posicao);
  const canvas = document.createElement('canvas');
  canvas.width = saida;
  canvas.height = saida;
  const contexto = canvas.getContext('2d');
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, saida, saida);
  contexto.drawImage(imagem, x, y, lado, lado, 0, 0, saida, saida);
  const previaUrl = canvas.toDataURL('image/jpeg', QUALIDADE_JPEG);
  return { base64: previaUrl.split(',')[1], previaUrl };
}
