import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('a migration permite que qualquer usuário autenticado crie etiquetas', () => {
  const sql = readFileSync('supabase/migrations/0011_vendedores_criam_etiquetas.sql', 'utf8');

  assert.match(sql, /on public\.etiquetas for insert\s+to authenticated\s+with check \(true\)/i);
});
