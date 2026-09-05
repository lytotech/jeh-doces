# Links públicos para assinaturas pagas

- Status: `In progress`
- Branch: `fix/share-link-paid-plan`
- Versão: `1.0.44`

## Objetivo

Garantir que empresas com assinatura Completa vigente consigam gerar links públicos de encomendas sem criar novas cobranças enquanto o plano estiver ativo.

## Critérios de aceite

- [x] Plano Completo vigente pode gerar link público.
- [x] Plano cancelado, mas ainda dentro do período pago, mantém acesso.
- [x] Plano Básico ou período expirado recebe bloqueio.
- [x] Plano ativo não pode gerar uma nova cobrança Pix ou recorrente.

## Impacto e rollback

- API de billing e links públicos; sem migration.
- Rollback: reverter este commit.

## Testes

- [ ] `npm run verify`
- [ ] Validar geração de link em produção com plano pago.
- [ ] Validar bloqueio em empresa Básica.
