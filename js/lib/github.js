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
