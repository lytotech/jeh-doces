# Cancelamento de cobranças pendentes

- Status: `In progress`
- Branch: `fix/pending-payment-cancellation`
- Versão: `1.0.43`

## Objetivo

Permitir que o usuário identifique e cancele qualquer cobrança Pix pendente, inclusive cobranças antigas exibidas no histórico.

## Critérios de aceite

- [x] Cobranças pendentes aparecem em uma seção própria.
- [x] Cada cobrança possui ação individual de cancelamento.
- [x] O backend valida que a cobrança pertence à empresa.
- [x] Cobranças aprovadas não podem ser canceladas.
- [x] Cancelar a cobrança ativa limpa o estado pendente da assinatura.
- [ ] Validar o fluxo em produção com duas cobranças pendentes.

## Impacto e rollback

- Frontend e API billing; sem migration.
- Rollback: reverter o commit da alteração de cancelamento.

## Testes

- [ ] `npm run verify`
- [ ] Teste de billing para cobrança ativa, antiga e aprovada.
