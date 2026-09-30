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

test('PUT com erro 500 não é repetido e vira erro desconhecido', async () => {
  const fetchFalso = criarFetchFalso(({ metodo }) =>
    metodo === 'GET' ? arquivoRemoto({ noticias: [] }, 'sha') : { status: 500, corpo: {} },
  );
  await assert.rejects(
    novoCliente(fetchFalso).atualizarJson('data/noticias.json', (dados) => dados, 'msg'),
    (erro) => erro instanceof ErroGitHub && erro.tipo === 'desconhecido' && erro.status === 500,
  );
  assert.equal(fetchFalso.chamadas.filter((c) => c.metodo === 'PUT').length, 1);
});

test('403 é erro de token e 422 é conflito', async () => {
  const com = (status) => novoCliente(criarFetchFalso(() => ({ status, corpo: {} })));
  await assert.rejects(com(403).validarAcesso(), (erro) => erro instanceof ErroGitHub && erro.tipo === 'token' && erro.status === 403);
  await assert.rejects(com(422).validarAcesso(), (erro) => erro instanceof ErroGitHub && erro.tipo === 'conflito' && erro.status === 422);
});

test('apagarArquivo envia o branch no corpo do DELETE', async () => {
  const fetchFalso = criarFetchFalso(({ metodo }) =>
    metodo === 'GET' ? { status: 200, corpo: { sha: 's9' } } : { status: 200, corpo: {} },
  );
  await novoCliente(fetchFalso).apagarArquivo('assets/noticias/x.jpg', 'Remove');
  assert.equal(fetchFalso.chamadas.find((c) => c.metodo === 'DELETE').corpo.branch, 'main');
});
