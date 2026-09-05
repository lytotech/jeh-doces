# Plano: histórico de comunicação

## Objetivo

Registrar os avisos de status enviados pelo Confeiti para evitar duplicidade e dar
visibilidade ao atendimento da empresa.

## Escopo

- [x] Persistir canal, template, status, destinatário e data por empresa/encomenda.
- [x] Registrar o aviso de WhatsApp depois de abrir a conversa.
- [x] Garantir isolamento por empresa no backend.
- [ ] Exibir a linha do tempo no detalhe da encomenda.
- [ ] Adicionar lembretes automáticos de entrega e cobrança.

## Validação

- `npm run verify`
- `npx prisma validate --schema apps/api/prisma/schema.prisma`
- Confirmar que a migration é aditiva e não recria enums existentes.

## Rollback

Reverter o commit. Como a feature é aditiva, a tabela pode permanecer sem ser consultada;
remoção da tabela deve ser feita apenas em uma migration posterior e aprovada.
