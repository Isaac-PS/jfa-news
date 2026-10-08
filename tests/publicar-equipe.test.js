import { test } from 'node:test';
import assert from 'node:assert/strict';
import { salvarMembro, excluirMembroPublicado, moverMembroPublicado, lerEquipe, CAMINHO_EQUIPE } from '../js/lib/publicar-equipe.js';
import { ErroValidacao } from '../js/lib/publicar.js';

const dados = { nome: 'Bia', funcao: 'Edição', bio: 'Oi.' };
const membro = (id, extra = {}) => ({ id, nome: id, funcao: 'x', bio: '', foto: null, ...extra });

function clienteFalso({ membros = [], falhar = {} } = {}) {
  const estado = { json: { membros: structuredClone(membros) }, arquivos: new Map(), apagados: [], chamadas: [] };
  return {
    estado,
    async lerJson() { estado.chamadas.push('lerJson'); return { dados: structuredClone(estado.json), sha: 's' }; },
    async atualizarJson(caminho, mutar) {
      estado.chamadas.push(`atualizarJson:${caminho}`);
      if (falhar.atualizarJson) throw falhar.atualizarJson;
      estado.json = mutar(structuredClone(estado.json));
      return estado.json;
    },
    async enviarArquivo(caminho, base64) { estado.chamadas.push('enviarArquivo'); estado.arquivos.set(caminho, base64); },
    async apagarArquivo(caminho) {
      estado.chamadas.push('apagarArquivo');
      if (falhar.apagarArquivo) throw falhar.apagarArquivo;
      estado.apagados.push(caminho);
    },
  };
}

test('lerEquipe devolve os membros com ids', async () => {
  const cliente = clienteFalso({ membros: [{ nome: 'Ana', funcao: 'x', bio: '', foto: null }] });
  assert.deepEqual((await lerEquipe(cliente)).map((x) => x.id), ['ana']);
});

test('salvarMembro novo, sem foto: grava em data/equipe.json, no fim, e já escreve os ids antigos', async () => {
  const cliente = clienteFalso({ membros: [{ nome: 'Ana', funcao: 'x', bio: '', foto: null }] });
  const r = await salvarMembro({ cliente, dados });
  assert.equal(r.id, 'bia');
  assert.deepEqual(cliente.estado.json.membros.map((x) => [x.id, x.nome]), [['ana', 'Ana'], ['bia', 'Bia']]);
  assert.equal(cliente.estado.json.membros[1].foto, null);
  assert.ok(cliente.estado.chamadas.includes(`atualizarJson:${CAMINHO_EQUIPE}`));
});

test('salvarMembro com dados inválidos falha antes de falar com o GitHub', async () => {
  const cliente = clienteFalso();
  await assert.rejects(salvarMembro({ cliente, dados: { nome: '', funcao: '', bio: '' } }), ErroValidacao);
  assert.deepEqual(cliente.estado.chamadas, []);
});

test('salvarMembro com foto envia o arquivo antes do JSON, com nome versionado', async () => {
  const cliente = clienteFalso();
  const r = await salvarMembro({ cliente, dados, fotoBase64: 'FOTO', agora: () => 1000 });
  const caminho = cliente.estado.json.membros[0].foto;
  assert.match(caminho, /^assets\/equipe\/bia-[a-z0-9]+\.jpg$/);
  assert.equal(cliente.estado.arquivos.get(caminho), 'FOTO');
  assert.ok(cliente.estado.chamadas.indexOf('enviarArquivo') < cliente.estado.chamadas.findIndex((c) => c.startsWith('atualizarJson')));
  assert.equal(r.id, 'bia');
});

test('editar trocando a foto apaga a foto antiga da pasta da equipe', async () => {
  const cliente = clienteFalso({ membros: [membro('bia', { foto: 'assets/equipe/bia-velha.jpg' })] });
  await salvarMembro({ cliente, dados, id: 'bia', fotoBase64: 'NOVA', agora: () => 5 });
  assert.deepEqual(cliente.estado.apagados, ['assets/equipe/bia-velha.jpg']);
  assert.notEqual(cliente.estado.json.membros[0].foto, 'assets/equipe/bia-velha.jpg');
});

test('editar sem mexer na foto mantém a foto e não apaga nada', async () => {
  const cliente = clienteFalso({ membros: [membro('bia', { foto: 'assets/equipe/bia.jpg' })] });
  await salvarMembro({ cliente, dados: { ...dados, nome: 'Bia S.' }, id: 'bia' });
  assert.equal(cliente.estado.json.membros[0].foto, 'assets/equipe/bia.jpg');
  assert.equal(cliente.estado.json.membros[0].nome, 'Bia S.');
  assert.deepEqual(cliente.estado.apagados, []);
});

test('editar removendo a foto zera o campo e apaga o arquivo', async () => {
  const cliente = clienteFalso({ membros: [membro('bia', { foto: 'assets/equipe/bia.jpg' })] });
  await salvarMembro({ cliente, dados, id: 'bia', removerFoto: true });
  assert.equal(cliente.estado.json.membros[0].foto, null);
  assert.deepEqual(cliente.estado.apagados, ['assets/equipe/bia.jpg']);
});

test('nunca apaga arquivo fora de assets/equipe/', async () => {
  const cliente = clienteFalso({ membros: [membro('bia', { foto: 'assets/logo-jornal.png' })] });
  await salvarMembro({ cliente, dados, id: 'bia', removerFoto: true });
  assert.deepEqual(cliente.estado.apagados, []);
  const c2 = clienteFalso({ membros: [membro('bia', { foto: 'assets/equipe/../x.jpg' })] });
  await excluirMembroPublicado({ cliente: c2, id: 'bia' });
  assert.deepEqual(c2.estado.apagados, []);
});

test('falha ao gravar o JSON não apaga a foto antiga', async () => {
  const cliente = clienteFalso({
    membros: [membro('bia', { foto: 'assets/equipe/bia.jpg' })],
    falhar: { atualizarJson: new Error('falhou') },
  });
  await assert.rejects(salvarMembro({ cliente, dados, id: 'bia', fotoBase64: 'N' }), /falhou/);
  assert.deepEqual(cliente.estado.apagados, []);
});

test('falha ao apagar a foto antiga vira aviso, não erro', async () => {
  const cliente = clienteFalso({
    membros: [membro('bia', { foto: 'assets/equipe/bia.jpg' })],
    falhar: { apagarArquivo: new Error('rede') },
  });
  const r = await salvarMembro({ cliente, dados, id: 'bia', removerFoto: true });
  assert.equal(r.avisos.length, 1);
});

test('editar membro que sumiu falha sem gravar', async () => {
  const cliente = clienteFalso();
  await assert.rejects(salvarMembro({ cliente, dados, id: 'x' }), /não existe mais/);
  assert.ok(!cliente.estado.chamadas.some((c) => c.startsWith('atualizarJson')));
});

test('excluirMembroPublicado remove do JSON e apaga a foto', async () => {
  const cliente = clienteFalso({ membros: [membro('ana', { foto: 'assets/equipe/ana.jpg' }), membro('bia')] });
  const r = await excluirMembroPublicado({ cliente, id: 'ana' });
  assert.deepEqual(r.avisos, []);
  assert.deepEqual(cliente.estado.json.membros.map((x) => x.id), ['bia']);
  assert.deepEqual(cliente.estado.apagados, ['assets/equipe/ana.jpg']);
});

test('moverMembroPublicado muda a ordem no JSON', async () => {
  const cliente = clienteFalso({ membros: [{ nome: 'A', funcao: 'x', bio: '', foto: null }, { nome: 'B', funcao: 'x', bio: '', foto: null }] });
  await moverMembroPublicado({ cliente, id: 'b', delta: -1 });
  assert.deepEqual(cliente.estado.json.membros.map((x) => x.id), ['b', 'a']);
});
