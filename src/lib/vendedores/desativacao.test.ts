import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contarLeadsPorVendedor,
  distribuirIgualmente,
  destinoRedistribuicao,
  REDISTRIBUIR_IGUALMENTE,
} from './desativacao.ts';

test('destinoRedistribuicao normaliza um vendedor de destino válido', () => {
  assert.equal(destinoRedistribuicao('  Bruno  ', 'Ana'), 'Bruno');
});

test('destinoRedistribuicao aceita null para remover a atribuição', () => {
  assert.equal(destinoRedistribuicao(null, 'Ana'), null);
  assert.equal(destinoRedistribuicao('', 'Ana'), null);
});

test('destinoRedistribuicao recusa redistribuição para o próprio vendedor', () => {
  assert.throws(() => destinoRedistribuicao(' ana ', 'Ana'), /vendedor diferente/);
});

test('destinoRedistribuicao preserva a opção de distribuição igualitária', () => {
  assert.equal(destinoRedistribuicao(REDISTRIBUIR_IGUALMENTE, 'Ana'), REDISTRIBUIR_IGUALMENTE);
});

test('distribuirIgualmente divide os leads com diferença máxima de um', () => {
  assert.deepEqual(distribuirIgualmente([1, 2, 3, 4, 5], ['Ana', 'Bruno', 'Carlos']), [
    { vendedor: 'Ana', itens: [1, 4] },
    { vendedor: 'Bruno', itens: [2, 5] },
    { vendedor: 'Carlos', itens: [3] },
  ]);
});

test('distribuirIgualmente recusa a distribuição quando não há outro vendedor ativo', () => {
  assert.throws(() => distribuirIgualmente([1], []), /outro vendedor ativo/);
});

test('contarLeadsPorVendedor calcula a contagem real e ignora leads sem vendedor', () => {
  assert.deepEqual(
    contarLeadsPorVendedor(['Ana', null, 'Bruno', 'Ana', '']),
    new Map([
      ['Ana', 2],
      ['Bruno', 1],
    ]),
  );
});
