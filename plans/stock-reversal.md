# Baixa e estorno automático de estoque

- Status: `Completed`
- Branch: `feat/stock-reversal`
- Versão: `1.0.49`

## Critérios de aceite

- [x] Materiais manuais e materiais da receita são agregados por produto.
- [x] Baixa automática ocorre uma única vez quando a encomenda entra em produção/confirmada.
- [x] Cancelar ou reabrir a encomenda estorna a baixa uma única vez.
- [x] Movimentações registram baixa e estorno com motivo e saldo antes/depois.
- [x] Cálculo não mistura materiais de produtos diferentes.
- [ ] Validar fluxo completo com banco em produção após migration/deploy.

## Testes

- [x] Testes unitários de composição de materiais.
- [x] Build da API.
- [ ] Teste E2E de confirmar, cancelar e reabrir uma encomenda.
