# Plano de Ação e Arquitetura: GranCook (Gestão de Bares e Restaurantes)

Este documento centraliza todas as decisões arquiteturais, tecnologias e regras de negócio obrigatórias para o projeto. Ele deve ser lido pela IA (junto com o `AI_INSTRUCTIONS.md`) sempre que o contexto for perdido em novas conversas.

## 1. Arquitetura e Stack de Tecnologias

### 1.1 Front-end (Salão, KDS e Painel Gerencial)
- **Framework:** Next.js
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Gerenciamento de Estado/Cache Local:** TanStack Query (React Query)

### 1.2 Back-end
- **Linguagem:** Python
- **Framework Web:** Django
- **Construção de API:** Django REST Framework (DRF)
- **Documentação da API:** Swagger automatizado via `drf-spectacular`

### 1.3 Banco de Dados e Cache
- **Banco de Dados Principal:** PostgreSQL (Relacional)
- **Cache em Memória (Opcional/Futuro):** Redis + `django-redis` (para alta concorrência)

### 1.4 Processamento Assíncrono
- **Background Jobs:** Celery (para tarefas como alertas de estoque, processamento de fechamento de caixa, etc)

### 1.5 Infraestrutura e Deploy
- **Contêinerização:** Contêineres Docker
- **Servidor de Aplicação:** WSGI Gunicorn

---

## 2. Funcionalidades Principais do Sistema (Os 4 Pilares)

### 2.1 Frente de Caixa e Atendimento (PDV Flexível)
É aqui que o "caos" financeiro acontece. O sistema precisa ser à prova de balas:
- **Mapa de Mesas e Comandas:** Visualização em tempo real (livre, ocupada, aguardando pedido, aguardando pagamento).
- **Split de Pagamento Avançado:**
  - **Multimeios:** Pagar a mesma conta com R$ 30 no dinheiro, R$ 50 no PIX e o resto no cartão de crédito.
  - **Divisão de Conta:** Opção de dividir o valor total por X pessoas, OU divisão por item (Ex: João paga as próprias cervejas, e o petisco é dividido por todos).
- **Gestão de Taxas:** Inclusão/remoção de 10% do garçom, Couvert Artístico (por pessoa) e Descontos Gerenciais.
- **Controle de Caixa:** Abertura, fechamento, "Sangria" (retirada de dinheiro no meio do turno) e "Suprimento" (colocar troco).

### 2.2 Operação e Cozinha (A "Engrenagem")
- **Modificadores e Observações:** Permitir "Hambúrguer (Ponto: Mal Passado) (Sem Cebola) (Adicional de Cheddar + R$4,00)".
- **KDS (Kitchen Display System):** Uma tela para a cozinha (ao invés de só imprimir papel). Os pedidos chegam em tempo real na tela, e o cozinheiro dá o "Pronto", que avisa o garçom.
- **Controle de Tempo:** O painel pisca em vermelho se uma mesa está esperando a comida há mais de 30 minutos.

### 2.3 Backoffice e Estoque (O Coração Financeiro)
- **Ficha Técnica (Estoque Inteligente):** Quando vende 1 Hambúrguer, o sistema desconta automaticamente do estoque: 1 Pão, 150g de carne e 1 fatia de queijo.
- **Alerta de Estoque Mínimo:** Aviso que a cerveja está acabando.
- **Controle de Funcionários:** Login separado para Gerente, Caixa e Garçom, com permissões restritas (ex: Garçom não pode cancelar sem senha do gerente).

### 2.4 O "Olho do Dono" (Painel Gerencial Mobile)
- **Dashboard Web App Responsivo:** Uma rota focada 100% no celular do dono.
- **Métricas em Tempo Real:** Faturamento do momento, mesas ativas, ticket médio e produto mais vendido do dia.
- **Alertas de Risco:** Notificações no celular (Cancelamento alto, Sangria grande).

---

## 3. Regras de Negócio Invioláveis
1. **Controle de Caixa Estrito:** Nenhuma transação pode ocorrer sem um caixa aberto para aquele turno.
2. **Segurança de Operação:** Cancelamentos de pedidos após o envio para a cozinha exigem credencial de gerente.
3. **Estoque e Ficha Técnica:** Toda venda deduz insumos imediatamente com base na ficha técnica cadastrada. Sem ficha técnica, abate unidade inteira.
4. **Alerta de SLA:** Tempo de mesa é sagrado. +30 minutos muda visualmente o estado da mesa/pedido para crítico (vermelho).

---

## 4. Histórico de Desenvolvimento (Concluído)
- [x] Limpeza do repositório antigo e definição da nova arquitetura.
- [x] Configuração da stack full-stack com Docker Compose (Django, Postgres, Redis, Celery, Next.js).
- [x] Correção de volumes e permissões de rede para acesso mobile/local ao ambiente Next.js (resolução de problemas com Turbopack).
- [x] Criação da Interface do PDV (Salão):
  - Mapa de Mesas responsivo e interativo.
  - Temporizador dinâmico de ocupação de mesa ("Ocupada há Xh Ym").
  - `TableDrawer` (Gaveta Lateral) para lançamento rápido de itens.
  - Fluxo de teclado super-rápido (Arrow keys, Enter para navegar entre Produto -> Quantidade -> Observação).
  - Sistema de "Carrinho" (Staging) para agrupar pedidos antes de enviá-los para a conta/cozinha.
  - **Lógica de Agrupamento Dinâmico:** Capacidade de unir múltiplas mesas para compartilhar a mesma conta, espelhando os totais visualmente e compartilhando os itens.
  - **Ação Direta no Card:** Botão `[⇄]` nos cartões da tela inicial para agrupar/transferir mesas rapidamente (até mesmo mesas vazias para montar grandes reservas).

---

## 5. Próximos Passos
1. **Gestão de Mesas e Reservas:** Criar interface e integração para possibilitar cadastrar/descadastrar mesas no sistema, e gerenciar o status de "Reserva".
2. **Testes de Integração Real:** Realizar testes exaustivos na interface do PDV utilizando o banco de dados PostgreSQL recém configurado.
3. **Desenvolver o KDS (Cozinha):** Criar a rota e a interface onde os pedidos lançados no "Carrinho" do Salão aparecerão para os cozinheiros.
4. **Painel Gerencial:** Iniciar o desenvolvimento da interface administrativa para gerenciar o restaurante, visualizar produtos e relatórios básicos.
