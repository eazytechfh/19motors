import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('histórico de movimentações possui altura limitada e rolagem vertical', () => {
  const drawer = readFileSync('src/components/LeadDrawer.tsx', 'utf8');
  assert.match(
    drawer,
    /<ul className="[^"]*max-h-72[^"]*overflow-y-auto[^"]*">[\s\S]{0,160}\{historico\.map/
  );
});
