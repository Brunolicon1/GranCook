# Histórico de Desenvolvimento (Diário de Bordo)

Este arquivo serve como o diário oficial do projeto. O objetivo é registrar **o que** foi feito, **quando** foi feito, e **como** foi feito (decisões importantes, bibliotecas chave instaladas e configurações cruciais).

Sempre que a IA for consultada em uma nova sessão, este histórico ajudará a entender em qual etapa o projeto está, evitando repetição de tarefas.

---

## [09/07/2026] Pivot de Arquitetura: GranCook
- **O que foi feito:** Toda a documentação e os planos de ação do projeto antigo (CRM Automotivo) foram substituídos pelos novos requisitos do sistema de gestão para bares e restaurantes (GranCook).
- **Como foi feito:** O arquivo `PLANO_DE_ACAO.md` foi reescrito focando nos 4 pilares: Frente de Caixa (PDV), Operação/Cozinha (KDS), Backoffice/Estoque (Ficha Técnica) e Painel Gerencial Mobile. `TODO_MOCKS.md` e `AI_INSTRUCTIONS.md` foram adaptados para refletir a nova realidade.
- **Status Atual:** Aguardando início do desenvolvimento da infraestrutura (Backend/Frontend) e modelagem do banco de dados (Mesas, Comandas, Produtos) para o novo domínio.

## [11/07/2026] Fluxo de Fechamento de Conta (Frontend)
- **O que foi feito:** Desenvolvida toda a interface e lógica (mock) para o fechamento de conta e divisão de pagamentos no PDV, além da nova funcionalidade de pagamentos parciais. O sistema de transferência de mesas foi refatorado visualmente e o código do frontend passou por uma grande faxina (Clean Code).
- **Como foi feito:** Criado o componente `CheckoutModal.tsx` com suporte a taxas de serviço (10%), descontos e entrada multi-meios. Também implementada a função de **Salvar Pagamento Parcial**. O componente `TransferModal.tsx` foi removido em favor de cliques diretos nos cards (com alertas vermelhos para "UNIR COMANDAS"). Todo o "cérebro" do PDV foi extraído do `page.tsx` para um Custom Hook chamado `usePDV.ts`, separando completamente a Regra de Negócio do Layout.
- **Status Atual:** UX/UI e Arquitetura do Frontend da Frente de Caixa completos. Iniciada a Fase 2 (Integração Backend).

## [12/07/2026] Integração Fullstack (Fase 2)
- **O que foi feito:** O Frontend (Next.js) foi conectado ao Backend (Django) abandonando os dados estáticos (mocks).
- **Como foi feito:** O modelo `Mesa` foi adaptado no PostgreSQL para suportar `grupo_id`. Foram criados Serializers e ViewSets via DRF (`Django REST Framework`) para gerenciar as rotas: `/api/pdv/mesas/`, `/api/pdv/comandas/`, etc. O frontend (hook `usePDV.ts`) foi refatorado para utilizar a `Fetch API`, enviando requisições assíncronas para transferir mesas, agrupar, adicionar itens e finalizar pagamentos.
- **Status Atual:** Sistema PDV integrado com o banco de dados. Faltam refinamentos de sincronização em tempo real (WebSockets) que podem ser implementados no futuro.
