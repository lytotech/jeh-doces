import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateBackupData } from './db';

test('aceita a estrutura completa de um backup', () => {
  assert.equal(
    validateBackupData({
      version: '2.0.0',
      updatedAt: '2026-09-05T00:00:00.000Z',
      ingredients: [],
      materials: [],
      products: [],
      orders: [],
      settings: { storeName: 'Confeiti' },
    }),
    true,
  );
});

test('recusa backup incompleto antes de qualquer restauração', () => {
  assert.equal(validateBackupData({ ingredients: [], settings: {} }), false);
  assert.equal(validateBackupData(null), false);
  assert.equal(validateBackupData('backup'), false);
});
