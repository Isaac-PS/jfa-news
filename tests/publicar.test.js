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
