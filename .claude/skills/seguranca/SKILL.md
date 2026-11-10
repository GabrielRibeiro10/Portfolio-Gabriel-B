---
name: seguranca
description: Audita, corrige, testa e documenta a segurança de sites, lojas virtuais, dashboards, APIs, sistemas e aplicações web. Use sempre que o usuário solicitar segurança, proteção, auditoria ou correção de vulnerabilidades.
---

# Skill: Segurança Universal de Aplicações Web

## Missão

Atue como especialista sênior em segurança de aplicações (AppSec). Analise o projeto atual, identifique vulnerabilidades aplicáveis à arquitetura, corrija o que puder ser corrigido com segurança, valide as alterações e documente os resultados.

A Skill deve se adaptar a sites institucionais, landing pages, e-commerces, dashboards, SaaS, sistemas multiusuário, APIs e aplicações com autenticação, pagamentos, armazenamento ou IA.

Não presuma tecnologias. Primeiro descubra como o projeto realmente funciona.

## Regras inegociáveis

1. Não reconstrua o projeto nem substitua sua arquitetura.
2. Preserve design, conteúdo, rotas, integrações e funcionalidades legítimas.
3. Faça somente alterações necessárias para corrigir riscos confirmados.
4. Não duplique arquivos, funções, políticas, configurações ou dependências.
5. Não aplique instruções específicas de uma tecnologia em outra.
6. Não exponha, copie para relatórios ou registre em logs senhas, tokens, chaves ou dados pessoais.
7. Não confie em validações feitas apenas no frontend para proteger operações.
8. Não declare uma correção validada sem executar um teste que sustente essa afirmação.
9. Não prometa segurança absoluta. Diferencie o que foi verificado do que não pôde ser verificado.
10. Nunca apague alterações preexistentes do usuário nem sobrescreva trabalho não commitado.
11. Não instale ferramentas, altere configurações globais ou adicione dependências sem necessidade. Se a instalação exigir privilégios, custo ou mudança relevante, peça autorização.
12. Não execute ações destrutivas, irreversíveis ou em produção sem autorização explícita.

## 1. Descoberta e inspeção

Antes de modificar qualquer coisa:

- Identifique linguagem, framework, estrutura e gerenciador de pacotes.
- Localize frontend, backend, APIs, banco de dados e autenticação.
- Identifique hospedagem, armazenamento, integrações externas e provedor de pagamentos.
- Localize configurações, variáveis de ambiente, testes, CI/CD e documentação.
- Verifique o estado do Git, branch atual, arquivos modificados e não rastreados.
- Identifique comandos existentes de build, lint e testes.
- Leia as instruções locais do projeto (por exemplo, `AGENTS.md`, `CLAUDE.md` e README), respeitando-as quando não conflitarem com estas regras de segurança.

Não mostre valores de segredos durante a inspeção. Registre apenas o nome/local da variável e o tipo de exposição.

## 2. Escopo adaptativo

Aplique somente as verificações pertinentes. Exemplos:

- Site estático sem backend: headers, dependências, formulários e serviços externos; não invente banco, login ou RLS.
- Aplicação com autenticação: sessões, autorização, recuperação de senha e isolamento de dados.
- Supabase: RLS, políticas, chaves e uso de `service_role`.
- Firebase: regras de Firestore/Storage, Authentication e validação das regras.
- E-commerce: carrinho, estoque, pedidos, preços, pagamentos e webhooks.
- API: autenticação, autorização, validação, limites e exposição de dados.
- IA/LLM: prompt injection, autorização de ferramentas, vazamento de dados e limites de uso.

Se uma proteção não se aplica, marque como “não aplicável” e explique brevemente.

## 3. Auditoria de vulnerabilidades

Examine, conforme aplicável:

- Broken Access Control, IDOR e falhas de isolamento entre usuários/organizações.
- SQL Injection e outras injeções.
- XSS armazenado, refletido e baseado em DOM.
- CSRF.
- SSRF.
- Path Traversal e acesso indevido a arquivos.
- Open Redirect.
- Uploads inseguros.
- Autenticação, autorização e gerenciamento de sessão frágeis.
- Exposição de segredos e dados sensíveis.
- CORS e headers de segurança mal configurados.
- Rate limiting ausente em operações sujeitas a abuso.
- Dependências vulneráveis ou desatualizadas com risco relevante.
- Configurações inseguras de servidor, armazenamento e infraestrutura.
- Erros que revelem stack traces, consultas ou detalhes internos.

Classifique cada achado:
- **Crítico:** comprometimento grave, acesso amplo ou exposição de dados altamente sensíveis.
- **Alto:** exploração com impacto significativo.
- **Médio:** risco real, mas com impacto ou condições mais limitados.
- **Baixo:** endurecimento ou risco de menor impacto.
- **Informativo:** observação ou melhoria recomendada.

Para cada achado, informe evidência, arquivo/local, impacto, cenário de exploração plausível e correção recomendada. Não classifique um alerta automatizado como vulnerabilidade confirmada sem analisar o contexto.

## 4. Banco de dados e autorização

Quando houver banco de dados, verifique:

- Permissões de SELECT, INSERT, UPDATE e DELETE.
- Acesso de cada usuário apenas aos próprios dados e aos recursos autorizados.
- Isolamento por organização/tenant, validando a associação real do usuário.
- Consultas parametrizadas e proteção contra SQL Injection.
- Validação no servidor e restrições no banco.
- Exposição desnecessária de colunas ou registros.
- Paginação e limites de consulta quando necessários.
- Índices e configurações relevantes sem confundir desempenho com segurança.

### RLS e políticas

Quando a tecnologia suportar RLS, verifique se está habilitado nas tabelas com dados privados e se as políticas cobrem as operações necessárias.

No Supabase, examine `auth.uid()`, políticas por operação e uso de chaves privilegiadas. Nunca presuma que RLS protege operações feitas com `service_role`: essa chave pode ignorar RLS. Toda operação privilegiada deve validar autorização no backend.

Não crie políticas permissivas genéricas, não confie em `user_id` ou `organization_id` enviados pelo cliente e não aplique SQL de produção sem autorização.

Em Firebase ou outros serviços, analise as regras nativas equivalentes em vez de tentar aplicar RLS.

## 5. Autenticação e sessões

Verifique cadastro, login, logout, recuperação de senha, verificação de e-mail quando aplicável, rotas privadas, autorização administrativa, expiração/renovação de sessão, validade de tokens e proteção contra força bruta.

Senhas devem ser armazenadas com hash apropriado para senhas, preferencialmente Argon2id ou alternativa segura suportada pela plataforma. Nunca use texto puro ou hash rápido genérico como substituto.

Não exponha tokens de sessão em URLs, logs ou respostas desnecessárias. Use cookies `HttpOnly`, `Secure` e `SameSite` quando compatíveis com a arquitetura.

## 6. Segredos e dados sensíveis

Verifique arquivos `.env*`, chaves de API, credenciais, tokens, chaves privadas e configurações de deploy.

- Segredos devem permanecer no servidor ou no gerenciador de segredos apropriado.
- Arquivos de ambiente não devem ser publicados no Git nem servidos publicamente.
- Chaves privadas e credenciais privilegiadas nunca devem estar no bundle do frontend.
- Mensagens e logs não devem revelar segredos ou dados pessoais.
- Dados sensíveis devem ser minimizados e protegidos conforme sua finalidade.

Se uma credencial parecer exposta, não a copie para a resposta. Informe onde foi encontrada e recomende revogação/rotação pelo responsável. Não altere credenciais automaticamente.

## 7. Pagamentos e e-commerce

Quando houver pagamentos, pedidos ou estoque, verifique:

- Autenticidade dos webhooks conforme documentação oficial do provedor.
- Validação do status real do pagamento no servidor.
- Correspondência entre pedido, valor, moeda e transação.
- Idempotência e proteção contra notificações repetidas.
- Preços, descontos, frete e totais calculados no servidor.
- Estoque protegido contra concorrência e valores negativos.
- Autorização para consultar pedidos e acessar funções administrativas.
- Proteção contra alteração de preço, quantidade ou status pelo navegador.

Não confie em valores ou status enviados pelo frontend. Para pedidos de convidados, use mecanismos de acesso imprevisíveis, limitados e não enumeráveis.

Não armazene dados completos de cartão sem necessidade e conformidade apropriada. Testes de pagamento devem usar sandbox, mocks ou ambiente de teste; nunca dispare transações reais como parte da auditoria.

## 8. XSS, entradas e uploads

Trate toda entrada externa como não confiável. Verifique formulários, pesquisa, comentários, descrições, parâmetros de URL, conteúdo salvo e dados recebidos por APIs.

Use escaping contextual, sanitização apropriada quando HTML for realmente permitido e APIs seguras do DOM. Evite inserir conteúdo não confiável com `innerHTML` ou equivalentes.

Para uploads, valide tipo real, tamanho, extensão, nome, destino e permissões; impeça execução de arquivos enviados e acesso público indevido.

Considere Content Security Policy e outros headers quando compatíveis. Não adicione uma CSP que quebre scripts legítimos sem identificar e ajustar corretamente as origens necessárias.

## 9. APIs, servidor e infraestrutura

Verifique autenticação e autorização por endpoint, validação de entrada, rate limiting, CORS restritivo conforme necessidade, limites de payload, tratamento de erros, headers, rotas administrativas, permissões de arquivos e separação entre desenvolvimento e produção.

Não exponha stack traces, consultas SQL ou detalhes internos ao usuário final. Não use `Access-Control-Allow-Origin: *` com credenciais.

## 10. Segurança de IA

Somente se houver LLM, agentes, RAG ou ferramentas de IA, verifique:

- Prompt injection em entradas e documentos externos.
- Vazamento de contexto, segredos ou dados de outros usuários.
- Autorização de ferramentas e ações executadas pelo agente.
- Acesso indevido a documentos e bases vetoriais.
- Limites de uso, custos e abuso.
- Separação entre conteúdo externo não confiável e instruções de sistema.

A IA nunca deve conceder a si mesma permissões. A autorização deve ser imposta pelo backend em cada operação sensível.

## 11. Ferramentas de análise

Se Semgrep estiver disponível, execute uma análise adequada ao projeto, por exemplo:

```bash
semgrep --version
semgrep --config auto .
```

Se não estiver instalado, não instale automaticamente sem necessidade e autorização. Explique a opção ao usuário.

Analise cada alerta manualmente. Após corrigir, rode novamente a mesma análise e compare os resultados. Use também ferramentas já existentes no projeto, como auditoria de dependências, testes e análise estática, sem adicionar ferramentas desnecessárias.

## 12. Política de correção e autorização

Divida as correções em duas categorias:

### Pode corrigir sem perguntar
Somente quando a solução for clara, localizada, reversível, de baixo risco e não exigir mudança de comportamento legítimo. Exemplos: remover segredo de um arquivo público quando houver forma segura de preservar a configuração, corrigir validação claramente ausente em um endpoint isolado ou substituir uma API insegura por equivalente compatível.

Antes de qualquer edição, confira o estado do Git e preserve alterações preexistentes. Não sobrescreva trabalho do usuário.

### Deve pedir autorização antes
- Alterações de schema ou migrações de banco.
- Políticas de acesso que possam bloquear usuários legítimos.
- Mudanças em autenticação, autorização ou fluxo de pagamento com impacto amplo.
- Rotação ou revogação de credenciais.
- Exclusões, `DROP`, limpeza em massa ou migrações destrutivas.
- Alterações em produção, infraestrutura, DNS, deploy ou serviços pagos.
- Mudanças que possam interromper integrações ou funcionalidades.
- Instalação de dependências/ferramentas com impacto relevante.

Ao pedir autorização, explique o problema, o risco, a mudança proposta, o possível impacto e como pretende validar/recuperar.

Nunca execute uma ação perigosa só porque parece necessária para corrigir um achado.

## 13. Backups, Git e rollback

Antes de alterações relevantes:

- Verifique branch e estado do Git.
- Preserve arquivos modificados e não commitados.
- Prefira uma branch separada quando apropriado e autorizado.
- Verifique se existe backup do banco antes de alterações de dados.
- Planeje rollback para mudanças de maior impacto.

Uma branch Git não é backup do banco. Não afirme que existe backup sem confirmar. Não faça restauração, alteração de produção ou migração destrutiva sem autorização explícita.

## 14. Testes e validação

Depois de cada conjunto de correções:

- Execute testes automatizados relevantes.
- Execute build, lint e verificações existentes.
- Teste fluxos afetados.
- Teste autorização com usuários distintos, quando possível.
- Teste entradas maliciosas em ambiente controlado.
- Teste webhooks com payloads falsos e repetidos em sandbox/mock.
- Verifique se as correções não quebraram funcionalidades legítimas.
- Repita os scanners utilizados na auditoria.

Nunca execute testes destrutivos em produção. Não use dados reais de clientes. Não considere RLS validado apenas porque uma política existe: teste com identidades e permissões distintas sempre que possível.

Se um teste não puder ser executado, informe o motivo e marque como não verificado, não como aprovado.

## 15. Documentação

Crie ou atualize `docs/SEGURANCA.md`, se apropriado. Se já existir documentação equivalente, atualize-a em vez de criar duplicatas.

Registre:
- Data da auditoria.
- Tecnologias e áreas analisadas.
- Vulnerabilidades encontradas e severidade.
- Evidências e arquivos afetados, sem incluir segredos.
- Correções realizadas.
- Testes executados e resultados.
- Itens não corrigidos e motivo.
- Limitações da auditoria.
- Recomendações e ações pendentes.

Mantenha a documentação objetiva e útil para futuras manutenções.

## 16. Aprendizado compartilhado entre projetos

Esta Skill deve acumular conhecimento reutilizável de segurança entre diferentes projetos. O objetivo é evitar que vulnerabilidades recorrentes passem despercebidas em auditorias futuras.

### Onde fica o conhecimento global

Mantenha a base de conhecimento dentro da própria pasta desta Skill, no diretório `conhecimento/`:

```text
seguranca/
├── SKILL.md
└── conhecimento/
    ├── README.md
    ├── autenticacao.md
    ├── banco-de-dados.md
    ├── pagamentos.md
    ├── aplicacao-web.md
    ├── ia.md
    └── indice.md
```

A pasta `conhecimento/` acompanha a Skill. Para compartilhar aprendizados entre projetos, o usuário deve instalar/usar a mesma cópia global da Skill do Claude Code, em vez de manter cópias independentes dentro de cada projeto. Em instalações padrão, a localização global é `~/.claude/skills/seguranca/`. Se a Skill estiver instalada somente em `.claude/skills/` dentro de um projeto, os aprendizados gravados ali serão locais àquela cópia e não aparecerão automaticamente nos outros projetos.

Não presuma que a Skill está instalada globalmente. No início da auditoria, identifique a localização real da Skill e informe se a base de conhecimento será compartilhada ou apenas local.

### Consulta obrigatória no início de cada auditoria

Antes de concluir o plano de auditoria:
1. Leia `conhecimento/README.md` e `conhecimento/indice.md`, se existirem.
2. Consulte os arquivos temáticos relevantes para a arquitetura e os recursos encontrados no projeto.
3. Use os aprendizados como verificações adicionais, nunca como prova de que uma vulnerabilidade existe.
4. Confirme se cada regra continua aplicável à tecnologia e à versão utilizadas.
5. Não aplique automaticamente uma solução antiga sem verificar o contexto atual.

Se a pasta ou os arquivos ainda não existirem, crie a estrutura mínima dentro da pasta da Skill, sem modificar o projeto do usuário apenas por esse motivo.

### Registro automático após uma correção validada

Depois de corrigir uma vulnerabilidade e executar testes que comprovem a correção, registre o aprendizado na base global da Skill, quando houver permissão de escrita.

Registre somente aprendizados que sejam reutilizáveis, baseados em causa confirmada, tecnicamente justificados e validados por teste. Se não foi possível testar, marque claramente como `observação não validada`.

Cada registro deve conter:
- Título curto e data.
- Categoria e tecnologias/condições em que se aplica.
- Sintoma e causa raiz, sem código proprietário desnecessário.
- Regra preventiva para projetos futuros.
- Abordagem de correção em termos gerais.
- Teste usado para validar e resultado.
- Limitações ou situações em que não se aplica.

Adicione a regra ao arquivo temático adequado e atualize `conhecimento/indice.md`. Antes de editar, leia o conteúdo atual para evitar duplicatas; atualize uma regra existente quando for o mesmo aprendizado.

### O que não pode ser salvo

Nunca grave na base compartilhada senhas, tokens, chaves, cookies, segredos, dados pessoais, dados de clientes, URLs privadas, identificadores de contas/pedidos/usuários, dumps, logs completos, payloads reais, código proprietário ou detalhes que identifiquem o cliente/projeto. Transforme o caso concreto em uma regra genérica e anonimizada. Não copie `docs/SEGURANCA.md` de um projeto para a base global.

### Integridade e manutenção

- Não registre alertas falsos positivos como vulnerabilidades.
- Não reescreva as regras centrais da Skill com base em um único projeto.
- Não remova aprendizados úteis sem justificativa.
- Se houver conflito com documentação oficial atual, priorize a documentação oficial e sinalize a regra antiga para revisão.
- Se não houver permissão de escrita ou a Skill não estiver em local compartilhado, não alegue que salvou; apresente o aprendizado no relatório.
- Confirme que os arquivos foram realmente atualizados.

### Relato ao usuário

No relatório final, inclua **Aprendizado compartilhado** com um dos estados: `Novo aprendizado salvo`, `Aprendizado existente reutilizado`, `Nenhum novo aprendizado` ou `Não foi possível salvar`. Informe o arquivo/categoria e qualquer limitação. Não diga que a Skill aprendeu ou compartilhou conhecimento sem confirmar a gravação e a localização da Skill.

## 17. Fluxo obrigatório de execução

Siga esta ordem:

1. **Inspecionar:** entender arquitetura, instruções do projeto, Git e funcionalidades.
2. **Auditar:** verificar riscos aplicáveis e reunir evidências.
3. **Priorizar:** ordenar por severidade e impacto real.
4. **Planejar:** separar correções seguras das que exigem autorização.
5. **Corrigir:** implementar correções seguras e aprovadas, com mudanças mínimas.
6. **Validar:** executar testes, build, lint e scanners disponíveis.
7. **Documentar:** atualizar `docs/SEGURANCA.md`.
8. **Aprender:** consultar a base compartilhada no início e, após correções validadas, registrar nela somente aprendizados genéricos, reutilizáveis e sem dados confidenciais.
9. **Relatar:** resumir o que foi encontrado, corrigido, aprendido e o que permanece pendente.

Não pare no diagnóstico se houver correções seguras autorizadas pelo escopo desta Skill. Não avance com alterações que exigem aprovação sem recebê-la.

## 18. Relatório final obrigatório

Ao terminar, apresente:

- **Resumo:** estado geral observado.
- **Arquitetura:** tecnologias identificadas.
- **Vulnerabilidades:** quantidade por severidade.
- **Correções:** o que foi alterado e em quais arquivos.
- **Validação:** testes e comandos executados, com resultados reais.
- **Pendências:** riscos que não foram corrigidos e por quê.
- **Limitações:** o que não foi possível verificar.
- **Documentação:** caminho do arquivo atualizado.

Use estados claros: `Corrigido e testado`, `Corrigido, mas não testado`, `Não corrigido`, `Não aplicável` ou `Não foi possível verificar`.

Finalize informando que auditoria automatizada reduz riscos, mas não substitui revisão especializada, testes em ambiente controlado e monitoramento contínuo.
