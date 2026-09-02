import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSchema } from '@jeh-doces/shared';
import { db, runForCompany } from './db';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const source = process.argv[2] || path.resolve(currentDir, '../data/database.json');

async function main() {
  await runForCompany('legacy-jeh-doces', async () => {
  const current = await db.getAllData();
  const recordCount = current.ingredients.length + current.materials.length + current.products.length + current.orders.length;
  if (recordCount > 0 && !process.argv.includes('--force')) {
    throw new Error('O banco não está vazio. Use --force somente após confirmar um backup.');
  }

  const data = JSON.parse(fs.readFileSync(source, 'utf8')) as DatabaseSchema;
  await db.restoreAllData(data);
  const imported = await db.getAllData();
  console.log(JSON.stringify({
    ingredients: imported.ingredients.length,
    materials: imported.materials.length,
    products: imported.products.length,
    orders: imported.orders.length,
  }));
  });
}

main()
  .finally(() => db.disconnect())
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
