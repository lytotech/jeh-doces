# Confeiti mobile

Aplicativo Flutter para Android e iOS, mantido em `mobile/` dentro do mesmo
repositório do site e da API. O projeto tem dependências e ciclo de build
próprios; `npm install` e `npm run build` continuam atendendo o sistema web/API.

## Primeira versão

- Login com a conta existente, restauração de sessão, troca de empresa e logout.
- Resumo financeiro: recebido, a receber, saldo, despesas, vendas e lucro estimado.
- Lista e busca de pedidos, filtro de status, detalhes e mudança de etapa.
- Criação de orçamentos com cliente, produtos, entrega e observações. Os materiais
  das receitas são enviados para o controle de estoque sem duplicar seu custo.
- Registro de pagamentos com data e hora locais convertidas para UTC na API.
- Consulta, busca, cadastro e edição de clientes.

A primeira versão exige conexão com a API. Cadastro de contas, confirmação de
email, recuperação de senha, receitas, estoque, despesas e administração dos
planos continuam no sistema web. O app usa os endpoints existentes e não cria
outro banco de dados. O código do pedido é gerado exclusivamente pela API.

## Preparação

Use **Flutter 3.50.0 / Dart 3.14**, versão registrada em `.fvmrc`. FVM é opcional;
uma instalação normal do Flutter da mesma versão também funciona.

```bash
flutter --version
flutter doctor
cd mobile # a partir da raiz do repositório
flutter pub get
```

Para Android, configure Android Studio, SDK e aceite as licenças com
`flutter doctor --android-licenses`. O projeto usa Java 17 e suporta Android 7+
(API 24+). Para iOS, use um Mac com Xcode configurado e iOS 15+.

Documentação oficial: [instalar Flutter](https://docs.flutter.dev/install),
[Android](https://docs.flutter.dev/platform-integration/android/setup) e
[iOS](https://docs.flutter.dev/platform-integration/ios/setup).

## Conexão com a API

A URL é recebida em tempo de compilação por `--dart-define=API_URL=...` e deve
incluir `/api`. Não coloque senhas ou tokens nessa opção: ela fica no binário.
Sem a URL, o app mostra uma mensagem de configuração.

### API publicada

```bash
flutter run --dart-define=API_URL=https://confeiti.com.br/api
```

### API local

Inicie a API como de costume, em outro terminal, na raiz do repositório:

```bash
npm run dev:api
```

No emulador Android, `10.0.2.2` representa o computador host:

```bash
cd mobile
flutter run --dart-define=API_URL=http://10.0.2.2:3001/api
```

No simulador iOS, use `http://localhost:3001/api`. Em um aparelho físico, use o
IP do computador na mesma rede e verifique se a API está acessível nesse IP.
HTTP é permitido nos projetos nativos somente em Debug. Builds Release exigem
HTTPS tanto na configuração Dart quanto nas regras de rede nativas.

## Sessão e dados

A API autentica com o cookie `jeh_session`, não com JWT. O app utiliza Dio,
CookieManager e PersistCookieJar, respeitando domínio, caminho e validade.
Os dados serializados do cookie são guardados no armazenamento seguro do Android
ou no Keychain do iOS. A senha não é persistida. As sessões são separadas por URL
da API, e sair da conta limpa os cookies locais mesmo se a rede falhar.

A troca de empresa e a expiração da sessão descartam a navegação anterior. Os
limites de plano e as permissões continuam sendo validados pelo backend.
Não há cache de negócio nem modo offline nesta versão. As listas podem ser
atualizadas puxando para baixo; o financeiro é recarregado ao abrir a aba.

## Estrutura

```text
lib/
  main.dart                    # configuração da API e sessão persistente
  app.dart                     # tema, localização e navegação
  core/                        # cliente HTTP, estado de sessão e modelos
  ui/                          # login, financeiro, pedidos, pagamentos e clientes
android/                       # projeto nativo Android
   app/src/debug/              # HTTP local permitido apenas para desenvolvimento
ios/                           # projeto nativo iOS, Keychain e configurações de rede
test/                          # testes de regras, integração HTTP simulada e telas
```

## Validação

```bash
dart format --output=none --set-exit-if-changed lib test
flutter analyze
flutter test --coverage
flutter build bundle --dart-define=API_URL=https://confeiti.com.br/api
```

Os testes usam respostas HTTP simuladas e não acessam contas ou dados de produção.
O workflow `.github/workflows/mobile.yml` executa análise, testes e builds nativos:
APK Debug no Linux e app de simulador iOS no macOS. O APK fica disponível como
artefato do workflow. O build de simulador não exige assinatura Apple.

## Builds e distribuição

```bash
# Desenvolvimento Android
flutter build apk --debug --dart-define=API_URL=https://confeiti.com.br/api

# Simulador iOS (executar em um Mac)
flutter build ios --simulator --debug --no-codesign \
  --dart-define=API_URL=https://confeiti.com.br/api
```

Antes de publicar nas lojas, defina o identificador definitivo do aplicativo,
a assinatura Android e a equipe/provisionamento Apple, substitua os ícones
nativos padrão e configure as informações de privacidade e distribuição.
O tema e o logo interno já usam a identidade Confeiti. O APK Debug do workflow
é destinado à validação, não à publicação na Play Store.

As telas ainda não foram validadas em aparelho físico. Testes Dart e de widgets
não substituem a validação de Keychain/Keystore, rede e teclado nos dispositivos.
