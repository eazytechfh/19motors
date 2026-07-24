import assert from 'node:assert/strict';
import test from 'node:test';

import { readFileSync } from 'node:fs';
import { houveTransferencia } from './transferencia.ts';

test('só considera transferência quando o responsável realmente muda', () => {
  assert.equal(houveTransferencia('Ana', 'Ana'), false);
  assert.equal(houveTransferencia(' Ana ', 'ana'), false);
  assert.equal(houveTransferencia(null, 'Bruno'), true);
  assert.equal(houveTransferencia('Ana', 'Bruno'), true);
});

test('separa o toque de popup da transferência e o motor da venda fechada', () => {
  const audio = readFileSync('src/lib/feedback/transferencia.ts', 'utf8');
  const pipeline = readFileSync('src/app/(app)/pipeline/page.tsx', 'utf8');
  const celebration = readFileSync('src/components/VendaFechadaCelebration.tsx', 'utf8');

  assert.match(audio, /tocarSomTransferencia/);
  assert.match(audio, /tocarSomVendaFechada/);
  assert.match(audio, /\/effects\/sale-money\.mp3/);
  assert.match(audio, /\/effects\/sale-engine\.mp3/);
  assert.match(audio, /inicio:\s*5/);
  assert.match(audio, /inicio:\s*11/);
  assert.match(audio, /5000/);
  assert.match(pipeline, /tocarSomVendaFechada/);
  assert.match(pipeline, /VendaFechadaCelebration/);
  assert.match(celebration, /Parabéns pela venda!/);
  assert.match(celebration, /prefers-reduced-motion|motion-reduce/);
  assert.match(celebration, /5000/);
});
