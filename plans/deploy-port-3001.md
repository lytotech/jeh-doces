# Porta de produção da API

- Branch: `fix/deploy-port-3001-pr`
- Tipo: `fix`
- Objetivo: declarar a porta 3001 da aplicação no artefato Docker para que o
  proxy do Dokploy consiga alcançar o serviço Swarm.

## Critérios de aceite

- A imagem Docker expõe `3001/tcp`.
- O build do workspace shared, web e API passa.
- Nenhuma credencial ou variável de ambiente é incluída no artefato.

## Impacto e rollback

- Impacto: somente o processo de build/deploy da aplicação.
- Rollback: redeploy da imagem/revisão anterior no Dokploy.
