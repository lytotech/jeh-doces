# Gates de qualidade no CI

- Status: `Completed`
- Branch: `feat/billing-alert-metrics`
- PR: `#18`
- Versão: `1.0.64`

## Objetivo

Garantir que os fluxos críticos já cobertos por testes sejam executados em toda PR,
e não apenas localmente.

## Critérios de aceite

- [x] CI executa smoke, billing, webhook, payment, finance, inventory, account e backup.
- [x] Falha em qualquer suíte bloqueia a revisão.
