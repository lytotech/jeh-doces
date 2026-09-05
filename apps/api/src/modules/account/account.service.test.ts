import test from 'node:test';
import assert from 'node:assert/strict';
import { deletionDateFrom } from './account.service';

test('agenda a inativação exatamente 90 dias após a solicitação', () => {
  const start = new Date('2026-09-05T12:00:00.000Z');
  assert.equal(deletionDateFrom(start).toISOString(), '2026-12-04T12:00:00.000Z');
});
