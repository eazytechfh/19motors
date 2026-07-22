import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('a barra lateral usa a marca 19 Motors quando não há logo configurada', () => {
  const source = readFileSync('src/components/Sidebar.tsx', 'utf8');

  assert.match(source, /logoUrl \|\| '\/19motors\.png'/);
  assert.match(source, /alt="19 Motors"/);
  assert.equal(existsSync('public/19motors.png'), true);
});

test('a configuração atual passa a apontar para a marca 19 Motors', () => {
  const sql = readFileSync('supabase/migrations/0014_definir_logo_19motors.sql', 'utf8');

  assert.match(sql, /update public\.app_settings/i);
  assert.match(sql, /logo_url = '\/19motors\.png'/i);
  assert.match(sql, /where id = 1/i);
});
