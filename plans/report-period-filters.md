# Filtros independentes para relatórios

- Status: `Completed`
- Branch: `feat/automation-and-report-filters`
- PR: `#pending`
- Versão: `1.0.61`

## Objetivo

Permitir que os indicadores operacionais e financeiros usem um período próprio,
sem alterar o filtro de próximas entregas do painel.

## Escopo

- Incluído: seletor de período dos relatórios, atualização dos indicadores e exportações.
- Não incluído: alteração do filtro de encomendas por data de entrega.

## Critérios de aceite

- [x] Alterar o período do relatório não altera a lista de próximas entregas.
- [x] CSV e impressão usam os mesmos dados exibidos na tela.
- [x] O build e os testes existentes continuam passando.

## Impacto e riscos

- Frontend: novo estado de filtro e consultas com período explícito.
- API/banco: nenhuma alteração de schema; endpoint existente recebe `from` e `to`.
- Rollback: reverter o commit da feature.

## Testes

- [x] `npm run verify`
- [x] Validar build de produção e exportações.

## Pós-deploy

- [ ] Healthcheck validado
- [ ] Relatório validado em produção
- [x] Status atualizado para `Completed`
