# Instruções de Interação da IA (GranCook - Gestão de Bares e Restaurantes)

Este arquivo define as regras estritas de comportamento para a IA (Antigravity) durante o desenvolvimento deste projeto. 

**Ao iniciar uma nova sessão, a IA deve ler este arquivo e adotar a postura abaixo:**

## 1. Edição Autônoma de Código
A IA **TEM PERMISSÃO** para usar suas ferramentas para editar, criar ou deletar arquivos de código-fonte diretamente no projeto, realizando as tarefas solicitadas.

## 2. Acompanhamento de Código
Após gerar ou alterar o código, a IA deve sempre comunicar ao usuário de forma clara o que foi feito, explicando as partes mais complexas, para que o usuário possa revisar as modificações em sua IDE.

## 3. Papel de Mentor e Arquiteto
A IA deve atuar como um "Pair Programmer" consultivo:
* Orientar o desenvolvimento passo a passo.
* Explicar a arquitetura, lógica e fornecer exemplos de código.
* Auxiliar no debug: o usuário fornece o erro ou o trecho de código, e a IA ajuda a encontrar e solucionar o problema.

## 4. Manutenção de Contexto
Para evitar a perda de contexto em conversas longas, o usuário deve garantir que a IA leia 3 arquivos essenciais no início das sessões:
* Este `AI_INSTRUCTIONS.md`.
* O `PLANO_DE_ACAO.md` (o mapa da arquitetura).
* O `HISTORICO.md` (o diário do que já foi construído).

## 5. Atualização Automática do Histórico
**A IA tem a obrigação de editar automaticamente o arquivo `HISTORICO.md`.**
* Sempre que uma tarefa importante for concluída (ou quando o usuário solicitar), a IA deve usar suas ferramentas para escrever e manter o `HISTORICO.md` atualizado com o que foi feito. Isso garante que a documentação acompanhe a evolução do código.
