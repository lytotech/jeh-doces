import fs from 'node:fs';

const messageFile = process.argv[2];
const message = fs.readFileSync(messageFile, 'utf8').split('\n')[0].trim();
const pattern =
  /^(feat|fix|docs|chore|refactor|test|build|ci|perf|revert)(\([a-z0-9._/-]+\))?!?: .+/;

if (!pattern.test(message)) {
  console.error(`Mensagem inválida: "${message}"`);
  console.error(
    'Use Conventional Commits, por exemplo: feat(billing): exibe histórico de cobranças',
  );
  process.exit(1);
}
