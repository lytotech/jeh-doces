# Lembretes automáticos

- Status: `Completed`
- Branch: `feat/automation-and-report-filters`
- PR: `#17`
- Versão: `1.0.62`

## Objetivo

Reduzir esquecimentos de entrega e cobrança com preferências por empresa e uma
fila idempotente de lembretes prontos para envio pelo WhatsApp.

## Escopo

- Incluído: preferências de entrega/cobrança, geração periódica da fila e ação de envio no painel.
- Não incluído: envio automático pela API do WhatsApp, que depende de credenciais/provedor externo.

## Critérios de aceite

- [x] Cada encomenda possui no máximo um lembrete de cada tipo.
- [x] Empresas não enxergam lembretes de outras empresas.
- [x] O painel abre a conversa e conclui o lembrete sem repetir a fila.
- [x] A rotina periódica é tolerante a falhas e não interrompe o servidor.

## Testes

- [x] `npm run verify`
- [x] Validar migration e build de produção.

## Pós-deploy

- [ ] Aplicar migration
- [ ] Confirmar lembrete de entrega e cobrança em uma empresa de teste
- [ ] Status atualizado para `Completed`
