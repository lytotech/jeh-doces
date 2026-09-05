# Contribuindo com o Confeiti

## Fluxo obrigatório

1. Crie uma branch a partir de `main`: `feat/<slug>`, `fix/<slug>`, `chore/<slug>` ou `docs/<slug>`.
2. Crie um plano em `plans/<slug>.md` antes de implementar uma feature ou correção relevante.
3. Faça commits pequenos usando Conventional Commits, por exemplo `feat(billing): exibe histórico de cobranças`.
4. Atualize `apps/web/src/version.ts` e `CHANGELOG.md` no mesmo PR.
5. Execute `npm run verify` antes de abrir o PR.
6. Abra um PR para `main` usando o template. O merge depende de revisão e CI verde.
7. Após o merge, valide o deploy, o healthcheck e os logs em produção.

Não faça push direto em `main`. Alterações de banco devem incluir a migration e a estratégia de rollback; credenciais, `.env` reais e artefatos gerados nunca devem ser versionados.

## Versionamento

Usamos Semantic Versioning: `patch` para correções compatíveis, `minor` para funcionalidades compatíveis e `major` para mudanças incompatíveis. A versão exibida ao usuário é mantida em `apps/web/src/version.ts`; toda mudança publicada deve registrar uma entrada no `CHANGELOG.md`.

## Planos

O plano deve registrar objetivo, escopo, critérios de aceite, impacto, riscos, testes e rollback. Durante o trabalho, atualize o status para `In progress`; depois da validação em produção, marque-o como `Completed`. Planos concluídos permanecem no repositório.

## Comandos úteis

```bash
npm run verify
npm run format:check
npm run lint
npm run build
npm run test:smoke -w @jeh-doces/api
```
