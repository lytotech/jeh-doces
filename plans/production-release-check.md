# Validação repetível de release

- Status: `Completed`
- Branch: `feat/billing-alert-metrics`
- PR: `#18`

## Objetivo

Evitar confundir um healthcheck saudável com um frontend desatualizado após o
deploy, validando a versão do bundle, banco, correlação e status da API.

## Critérios de aceite

- [x] O script valida a versão esperada do bundle publicado.
- [x] O script valida API e banco pelo endpoint `/api/health`.
- [x] O script valida a preservação de `x-request-id`.
- [x] O workflow pode ser executado manualmente após cada release.

## Uso

```sh
node scripts/check-production.mjs 1.0.64
```
