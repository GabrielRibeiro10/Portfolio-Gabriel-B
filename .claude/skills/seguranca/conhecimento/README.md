# Base de conhecimento compartilhada — Segurança

Esta pasta guarda aprendizados genéricos e reutilizáveis para que a Skill `seguranca` consulte experiências anteriores em outros projetos.

## Funcionamento
1. No início de cada auditoria, consulte o índice e os arquivos temáticos relevantes.
2. Depois de uma correção validada por testes, registre a causa raiz, a regra preventiva e a validação.
3. Atualize o índice.
4. Nunca registre segredos, dados pessoais, informações de clientes ou código proprietário.

## Compartilhamento entre projetos
Para compartilhar aprendizados, use uma única instalação global da Skill do Claude Code, normalmente em `~/.claude/skills/seguranca/`. Se esta pasta estiver em `.claude/skills/seguranca/` dentro de um projeto, o conhecimento pertence àquela cópia e não será automaticamente compartilhado com outros projetos.

## Qualidade
Registre como confirmado apenas o que teve causa compreendida e correção testada. Se não foi possível testar, marque como observação não validada. Não transforme todo alerta de scanner em vulnerabilidade.
