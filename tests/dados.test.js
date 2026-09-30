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
  assert.equal('apiUrl' in config.github, false);
});
