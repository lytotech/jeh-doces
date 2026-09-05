# 🧁 Confeiti • Monorepo de Gestão para Confeitaria Artesanal

Sistema completo e moderno para confeitaria artesanal gerenciar encomendas, orçamentos, fichas técnicas, insumos e embalagens com cálculos automáticos de CMV e lucros.

---

## 🏗️ Estrutura do Monorepo

```
jeh-doces/
├── apps/
│   ├── web/                     # Frontend (React 19 + TypeScript + Vite + Tailwind CSS)
│   └── api/                     # Backend REST API (NestJS + Fastify + TypeScript)
├── packages/
│   └── shared/                  # Tipos TypeScript, Fórmulas de Custos e Seed Data
└── data/                        # Persistência de dados em disco
```

---

## 🚀 Funcionalidades

- **🍫 Gestão de Ingredientes (Insumos)**:
  - Cadastro de insumos (`g`, `ml`, `un`).
  - Cálculo dinâmico do custo unitário por grama, mililitro ou unidade.
  - Ingredientes compostos (sub-receitas como brigadeiro base, ganache, geleias).
  - Histórico de preços com registro de evolução e reajustes.

- **📦 Gestão de Materiais e Embalagens**:
  - Cadastro de caixas de transporte, fitas de cetim, sacolas, tags e adesivos.
  - Cálculo de custo por unidade com base na quantidade do lote.
  - Controle de estoque com baixa automática em vendas.

- **🧁 Cardápio & Ficha Técnica de Receitas**:
  - Criação de receitas associando ingredientes e materiais padrão.
  - Cálculo automático de CMV (Custo de Mercadoria Vendida).
  - Simulador de margem de lucro e sugestão de preço de venda.

- **📋 Gestão de Encomendas & Orçamentos**:
  - Pipeline de status interativo: `Orçamento` ➔ `Confirmado` ➔ `Produzindo` ➔ `Pronto` ➔ `Entregue`.
  - Resumo financeiro em tempo real: Subtotal, Total Cobrado, Custo Estimado e Lucro Estimado.
  - Registro de pagamentos (Pix, Dinheiro, Cartão) com controle de saldo restante.
  - Geração de orçamento formatado para envio direto via WhatsApp ou impressão/PDF.

- **📊 Painel & Relatórios**:
  - Total faturado, lucro previsto e margem média.
  - Filtros por janela de entrega e alerta de encomendas atrasadas.
  - Alertas visuais de estoque baixo.
  - Lista das próximas entregas.

- **👥 Clientes**:
  - Cadastro, arquivamento e exclusão permanente.
  - Histórico de encomendas e total movimentado por cliente.

- **🔐 Segurança e qualidade**:
  - Multiempresa com isolamento por contexto de empresa.
  - Rate limit para API, autenticação e convites.
  - Headers HTTP de segurança, lint, Prettier, build e smoke tests automatizados.

- **📱 Multi-dispositivo & Sincronização em Tempo Real**:
  - Acesso direto pelo celular, tablet ou computador na mesma rede Wi-Fi.

---

## 🛠️ Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Iniciar o ambiente de desenvolvimento (Frontend + Backend)**:
   ```bash
   npm run dev
   ```
   - **Frontend Web**: `http://localhost:5173` (ou pelo IP na rede local)
   - **Backend API**: `http://localhost:3001`

3. **Compilar todos os pacotes**:
   ```bash
   npm run build
   ```

4. **Rodar em modo de produção**:
   ```bash
   npm start
   ```

## Banco de dados

A API usa PostgreSQL 17 por meio do Prisma. Crie `apps/api/.env` a partir de
`apps/api/.env.example` e defina `DATABASE_URL`. O arquivo real é ignorado pelo
Git e deve ser configurado como segredo no ambiente de publicação.

```bash
# Aplicar migrações versionadas (desenvolvimento e produção)
npm run db:deploy -w @jeh-doces/api

# Importação única do banco JSON legado; recusa sobrescrever banco não vazio
npm run db:import-json -w @jeh-doces/api
```

No ambiente Proxmox, o banco `jeh_doces` fica no PostgreSQL do LXC 102
(`192.168.2.102:5432`). A aplicação deve receber a URL completa exclusivamente
por variável de ambiente. Não versione credenciais.

## Contas e empresas

O sistema é multiempresa. Cada pessoa possui sua própria conta e acessa apenas
os dados das empresas às quais está vinculada. Proprietários e administradores
podem convidar funcionários pela tela **Equipe**.

O primeiro cadastro após a migração assume a empresa existente e preserva seus
dados. Cadastros posteriores sem convite criam empresas separadas. Convites e
recuperação de senha são enviados por SMTP.

Variáveis adicionais de produção:

```env
APP_URL=https://seu-dominio.example
CORS_ORIGINS=https://confeiti.com.br,https://www.confeiti.com.br
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=usuario
SMTP_PASSWORD=segredo
SMTP_FROM=Jeh Doces <no-reply@example.com>
MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
MERCADOPAGO_WEBHOOK_URL=https://confeiti.com.br/api/billing/webhook
MERCADOPAGO_WEBHOOK_SECRET=chave-secreta-do-painel
```

Configure `MERCADOPAGO_WEBHOOK_SECRET` com a chave secreta exibida no painel de
notificações do Mercado Pago. Quando preenchida, a API valida a assinatura
`x-signature` e rejeita notificações adulteradas ou antigas.

`APP_URL` também determina se o cookie de sessão será marcado como `Secure`:
use uma URL `https://` no acesso público e a URL HTTP da LAN apenas durante a
validação interna.
