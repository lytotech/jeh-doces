# Plano: relatórios operacionais

## Objetivo

Transformar os dados de encomendas em decisões práticas para produção, vendas e compras.

## Entrega

- [x] Consolidar faturamento, recebido, a receber, custo, lucro e margem por período.
- [x] Listar os produtos mais vendidos.
- [x] Listar clientes recorrentes.
- [x] Listar consumo e custo de materiais.
- [x] Exportar relatório operacional em CSV conforme o plano.
- [x] Exportar relatório operacional em PDF conforme o plano Completo.
- [x] Adicionar filtros de período independentes do painel de entregas.

## Validação

- `npm run verify`
- Testar empresa sem pedidos, com pedidos cancelados e com cliente avulso.
- Confirmar isolamento por `companyId` no endpoint.

## Rollback

Reverter o commit da branch. O endpoint e a visualização são aditivos.
