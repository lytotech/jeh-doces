import React from 'react';
import { ArrowLeft, Cake, ExternalLink, Mail, ShieldCheck } from 'lucide-react';

export type LegalDocument = 'terms' | 'privacy' | 'lgpd';

const updatedAt = '2 de setembro de 2026';
const contactEmail = 'doces@lyto.com.br';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl font-bold text-[#3D2A1C]">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-[#665344]">{children}</div>
    </section>
  );
}

const Terms = () => (
  <>
    <Section title="1. Sobre o serviço">
      <p>
        Estes Termos regulam o uso do Confeiti, sistema de gestão para confeitaria operado pela
        LytoTech. Ao criar uma conta ou utilizar o serviço, você concorda com estas condições.
      </p>
    </Section>
    <Section title="2. Conta e acesso">
      <p>
        Você deve fornecer informações verdadeiras, confirmar seu e-mail e proteger sua senha. A
        conta é pessoal; integrantes da equipe devem usar acessos individuais. Você é responsável
        pelas ações realizadas em sua conta, salvo uso indevido comprovadamente alheio à sua
        conduta.
      </p>
    </Section>
    <Section title="3. Uso permitido">
      <p>
        O serviço pode ser usado para administrar receitas, ingredientes, materiais, encomendas,
        clientes, pagamentos e informações relacionadas ao negócio. É proibido usá-lo para
        atividades ilícitas, fraude, violação de direitos, distribuição de código malicioso ou
        tentativa de acesso a dados de terceiros.
      </p>
    </Section>
    <Section title="4. Dados inseridos">
      <p>
        Você mantém a responsabilidade e os direitos sobre os dados que cadastrar. Ao utilizar o
        serviço, autoriza o tratamento técnico necessário para armazenar, processar, exibir,
        proteger e disponibilizar esses dados às pessoas autorizadas da sua empresa.
      </p>
    </Section>
    <Section title="5. Disponibilidade e mudanças">
      <p>
        Buscamos manter o serviço disponível e seguro, mas manutenções, falhas de terceiros e
        eventos fora de nosso controle podem causar interrupções. Funcionalidades podem evoluir;
        alterações relevantes destes Termos serão comunicadas de maneira adequada.
      </p>
    </Section>
    <Section title="6. Responsabilidade">
      <p>
        Os cálculos de custo, margem e lucro são ferramentas de apoio baseadas nos dados informados
        pelo usuário. Decisões comerciais, fiscais, contábeis ou jurídicas continuam sob
        responsabilidade do negócio e devem receber orientação profissional quando necessário.
      </p>
    </Section>
    <Section title="7. Suspensão e encerramento">
      <p>
        O acesso pode ser suspenso em caso de violação destes Termos, risco à segurança ou obrigação
        legal. Você pode solicitar o encerramento da conta e a eliminação dos dados, observadas as
        hipóteses legais de conservação.
      </p>
    </Section>
    <Section title="8. Lei aplicável e contato">
      <p>
        Aplicam-se as leis brasileiras. Eventuais conflitos serão tratados pelo foro competente
        conforme a legislação aplicável, preservados os direitos do consumidor quando incidentes.
      </p>
      <p>
        Dúvidas:{' '}
        <a href={`mailto:${contactEmail}`} className="font-bold text-[#96642F] underline">
          {contactEmail}
        </a>
        .
      </p>
    </Section>
  </>
);

const Privacy = () => (
  <>
    <Section title="1. Quem trata seus dados">
      <p>
        A LytoTech, responsável pelo serviço Confeiti, atua como controladora dos dados de conta e
        operação da plataforma. Para dados pessoais que sua empresa inclui em encomendas e cadastros
        de clientes, sua empresa define as finalidades e o Confeiti realiza o tratamento necessário
        para prestar o serviço.
      </p>
    </Section>
    <Section title="2. Dados coletados">
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Conta:</strong> nome, e-mail, senha protegida por hash, empresa, função, aceites e
          sessões.
        </li>
        <li>
          <strong>Operação:</strong> receitas, custos, estoque, encomendas, dados de clientes,
          pagamentos e configurações inseridas pelos usuários.
        </li>
        <li>
          <strong>Segurança e funcionamento:</strong> endereço IP, data e hora, informações básicas
          do navegador, registros de erro e eventos de autenticação.
        </li>
        <li>
          <strong>Comunicação:</strong> e-mail e histórico técnico de mensagens transacionais, como
          confirmação, convite e recuperação de senha.
        </li>
      </ul>
    </Section>
    <Section title="3. Finalidades e bases legais">
      <p>
        Tratamos dados para criar e autenticar contas, executar o contrato de serviço, separar dados
        por empresa, sincronizar informações, enviar comunicações transacionais, prevenir fraude,
        manter segurança, atender obrigações legais e exercer direitos. Conforme o caso, utilizamos
        execução de contrato, cumprimento de obrigação legal, exercício regular de direitos,
        legítimo interesse e consentimento quando ele for efetivamente aplicável.
      </p>
    </Section>
    <Section title="4. Compartilhamento e operadores">
      <p>
        Dados são compartilhados somente quando necessário com fornecedores de infraestrutura, banco
        de dados, segurança, entrega de e-mail e conectividade, incluindo Cloudflare e Resend, ou
        quando exigido por lei. Esses fornecedores tratam dados segundo contratos, instruções e
        medidas de proteção aplicáveis. Alguns podem operar infraestrutura fora do Brasil,
        envolvendo transferência internacional com salvaguardas adequadas.
      </p>
    </Section>
    <Section title="5. Cookies">
      <p>
        Utilizamos cookie estritamente necessário para manter a sessão autenticada. Ele é HTTP-only,
        protegido em HTTPS e não é utilizado para publicidade ou rastreamento comportamental.
      </p>
    </Section>
    <Section title="6. Retenção e eliminação">
      <p>
        Dados são mantidos enquanto a conta estiver ativa e pelo tempo necessário para prestar o
        serviço, cumprir obrigações legais, prevenir fraude e exercer direitos. Tokens de
        confirmação e recuperação possuem expiração. Após solicitação de exclusão, eliminamos ou
        anonimizamos os dados, salvo quando a conservação for permitida ou exigida por lei.
      </p>
    </Section>
    <Section title="7. Segurança">
      <p>
        Adotamos controles como HTTPS, senhas derivadas com função criptográfica, tokens armazenados
        como hash, sessões protegidas, isolamento por empresa, controle de acesso e backups. Nenhum
        sistema é infalível; incidentes relevantes serão tratados e comunicados conforme a
        legislação.
      </p>
    </Section>
    <Section title="8. Seus direitos">
      <p>
        Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio,
        eliminação, portabilidade quando regulamentada, informações sobre compartilhamento, revisão
        de decisões automatizadas e oposição nos casos legais. Consulte a Central LGPD para saber
        como exercer esses direitos.
      </p>
    </Section>
    <Section title="9. Crianças e adolescentes">
      <p>
        O serviço é destinado à gestão profissional de negócios e não é direcionado a crianças. Não
        cadastre dados de menores sem base legal adequada e sem observar o melhor interesse do
        titular.
      </p>
    </Section>
    <Section title="10. Contato e atualizações">
      <p>
        Solicitações de privacidade podem ser enviadas para{' '}
        <a href={`mailto:${contactEmail}`} className="font-bold text-[#96642F] underline">
          {contactEmail}
        </a>
        . Esta política poderá ser atualizada; mudanças relevantes serão informadas na plataforma.
      </p>
    </Section>
  </>
);

const Lgpd = () => (
  <>
    <Section title="Seus direitos como titular">
      <p>Nos termos da Lei Geral de Proteção de Dados, você pode solicitar:</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {[
          'Confirmação da existência de tratamento',
          'Acesso aos dados pessoais',
          'Correção de dados incompletos ou inexatos',
          'Anonimização, bloqueio ou eliminação quando cabível',
          'Portabilidade, conforme regulamentação',
          'Informação sobre compartilhamentos',
          'Revogação do consentimento, quando aplicável',
          'Oposição e revisão de decisões automatizadas',
        ].map((item) => (
          <li key={item} className="flex gap-2 rounded-xl bg-[#FAF7F2] p-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#A86F35]" size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>
    <Section title="Como fazer uma solicitação">
      <p>
        Envie uma mensagem para{' '}
        <a
          href={`mailto:${contactEmail}?subject=Solicitação LGPD`}
          className="font-bold text-[#96642F] underline"
        >
          {contactEmail}
        </a>{' '}
        com o assunto “Solicitação LGPD”. Informe qual direito deseja exercer e o e-mail da conta.
      </p>
      <p>
        Para proteger seus dados, poderemos pedir informações adicionais para confirmar sua
        identidade. Nunca solicitaremos sua senha. Responderemos nos prazos e formatos previstos
        pela legislação aplicável.
      </p>
    </Section>
    <Section title="Dados de clientes da sua empresa">
      <p>
        Se sua solicitação estiver relacionada a uma encomenda feita com uma confeitaria que utiliza
        o Confeiti, procure primeiro essa empresa. Ela é responsável por decidir como utiliza os
        dados do próprio cliente; nós a apoiaremos no atendimento quando necessário.
      </p>
    </Section>
    <Section title="Encarregado e autoridade">
      <p>
        O canal de privacidade e contato com o responsável pelo tratamento é{' '}
        <a href={`mailto:${contactEmail}`} className="font-bold text-[#96642F] underline">
          {contactEmail}
        </a>
        . Caso sua solicitação não seja solucionada, você também poderá peticionar perante a
        Autoridade Nacional de Proteção de Dados, observados os requisitos aplicáveis.
      </p>
      <a
        href="https://www.gov.br/anpd/pt-br"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 font-bold text-[#96642F] underline"
      >
        Autoridade Nacional de Proteção de Dados <ExternalLink size={14} />
      </a>
    </Section>
    <Section title="Princípios adotados">
      <p>
        Tratamos dados com finalidade definida, adequação, necessidade, livre acesso, qualidade,
        transparência, segurança, prevenção, não discriminação e responsabilização. Revisamos os
        acessos e coletamos somente o necessário para operar e proteger o serviço.
      </p>
    </Section>
  </>
);

const documentInfo = {
  terms: {
    eyebrow: 'Regras da plataforma',
    title: 'Termos de Uso',
    description: 'Condições para criar uma conta e utilizar o Confeiti.',
  },
  privacy: {
    eyebrow: 'Transparência e proteção',
    title: 'Política de Privacidade',
    description: 'Como coletamos, utilizamos, compartilhamos e protegemos dados pessoais.',
  },
  lgpd: {
    eyebrow: 'Central de privacidade',
    title: 'LGPD e seus direitos',
    description: 'Entenda seus direitos e saiba como fazer uma solicitação.',
  },
};

export function LegalPage({ document }: { document: LegalDocument }) {
  const info = documentInfo[document];
  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#382B20]">
      <header className="border-b border-[#E8DECF] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <a
            href="/"
            className="flex items-center gap-2 font-serif text-xl font-bold text-[#4A3423]"
          >
            <img src="/confeiti-app-icon.png" alt="" className="h-9 w-9 rounded-xl" />
            Confeiti
          </a>
          <a href="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7A4B1D]">
            <ArrowLeft size={16} /> Voltar
          </a>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-5 py-12 sm:py-16">
        <div className="mb-10 rounded-[2rem] bg-[#422D20] p-8 text-white sm:p-10">
          <span className="text-xs font-bold uppercase tracking-[.18em] text-[#E2BC8C]">
            {info.eyebrow}
          </span>
          <h1 className="mt-3 font-serif text-4xl font-bold sm:text-5xl">{info.title}</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-[#EADFD5]">{info.description}</p>
          <p className="mt-5 text-xs text-[#CDBDAD]">Versão vigente desde {updatedAt}</p>
        </div>
        <article className="space-y-10 rounded-[2rem] border border-[#E8DECF] bg-white p-6 shadow-sm sm:p-10">
          {document === 'terms' ? <Terms /> : document === 'privacy' ? <Privacy /> : <Lgpd />}
        </article>
        <div className="mt-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#E8DECF] bg-white p-5 text-sm sm:flex-row">
          <span className="flex items-center gap-2 text-[#6B5747]">
            <Mail size={17} className="text-[#A86F35]" /> Dúvidas sobre privacidade?
          </span>
          <a href={`mailto:${contactEmail}`} className="font-bold text-[#96642F] underline">
            {contactEmail}
          </a>
        </div>
      </div>
    </main>
  );
}
