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
