# Tela de configurações da confeitaria

- Status: `In progress`
- Branch: `feat/settings-page`
- Versão: `1.0.42`

## Objetivo

Separar as configurações operacionais da assinatura, oferecendo uma tela própria para dados da confeitaria, backup e privacidade.

## Critérios de aceite

- [x] Configurações são acessadas como tela, não modal.
- [x] Dados da confeitaria continuam editáveis e persistidos.
- [x] Backup JSON continua disponível.
- [x] Ações de LGPD continuam disponíveis com recuperação de 90 dias.
- [x] Meu plano permanece somente na tela dedicada de billing.
- [x] Banner global de pagamento não é exibido.

## Impacto e rollback

- Frontend: nova tela lógica `settings` no `App`.
- API/banco: sem alterações.
- Rollback: reverter o commit da tela e restaurar o acesso modal anterior.

## Testes

- [x] `npm run build`
- [ ] `npm run verify`
- [ ] Validar navegação desktop e mobile.
- [ ] Validar salvar configurações, exportar backup e cancelar exclusão.
