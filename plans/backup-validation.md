# Plano: backup restaurável com segurança

## Objetivo

Evitar que um arquivo inválido limpe os dados da empresa antes de uma restauração.

## Entrega

- [x] Validar a estrutura do backup antes de chamar a rotina destrutiva.
- [x] Revalidar a estrutura dentro da camada de banco para proteger importações futuras.
- [x] Cobrir backup válido, incompleto e tipos inválidos com testes.
- [ ] Executar restauração controlada em banco temporário e comparar contagens.

## Validação

- `npm run verify`
- `npm run test:backup -w @jeh-doces/api`

## Rollback

Reverter o commit da branch. A mudança impede entradas inválidas e não altera backups válidos.
