# GranCook 🍳🍽️

**GranCook** é um sistema completo (Full Stack) de PDV (Ponto de Venda) e KDS (Kitchen Display System) para restaurantes e bares, focado em alta performance, UX moderna e controle financeiro preciso. 

![Screenshot do Sistema](https://via.placeholder.com/1200x600?text=Screenshot+do+GranCook)

## 🚀 Funcionalidades

- **Gerenciamento de Mesas em Tempo Real:** 
  - Controle visual de ocupação (Livre, Ocupada, Aguardando).
  - Funcionalidade avançada de **Agrupamento de Mesas** (juntar mesas fisicamente) com interface de Multi-seleção intuitiva.
  - Transferência rápida de comandas entre mesas.
- **Fechamento de Conta Avançado:**
  - Suporte a pagamentos parciais (divisão de conta).
  - Cálculo automático de Gorjeta (Taxa de Serviço de 10%).
  - Estorno de pagamentos e auditoria financeira segura.
- **KDS (Kitchen Display System):**
  - Tela dedicada para a cozinha acompanhar os pedidos em tempo real.
  - Fluxo otimizado: de "Em Preparo" para "Pronto".
- **Painel Gerencial (Em Breve):** Histórico de Caixa, fechamento de turno e relatórios.

## 🛠️ Tecnologias Utilizadas

### Frontend (O Rosto do Sistema)
- **Next.js 14** (App Router) & **React**
- **Tailwind CSS** para estilização utilitária e design moderno (Glassmorphism).
- **TypeScript** para segurança de tipagem e manutenibilidade.

### Backend (O Motor do Sistema)
- **Python & Django 5**
- **Django REST Framework (DRF)** para a construção da API.
- **PostgreSQL** para o banco de dados relacional (transações financeiras seguras).
- **Redis & Celery** (Preparado para tarefas em segundo plano e filas de mensagens).
- **JWT** (JSON Web Tokens) para autenticação.

## ⚙️ Como rodar localmente (Docker)

O projeto foi projetado para rodar com extrema facilidade utilizando o **Docker Compose**.

### Pré-requisitos
- Docker e Docker Compose instalados.

### Passos
1. Clone o repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/GranCook.git
   cd GranCook
   ```

2. Suba todos os serviços (Banco de Dados, Redis, Backend, Frontend e Celery):
   ```bash
   docker-compose up --build
   ```

3. (Primeira vez) Em outro terminal, rode as migrações e crie os dados iniciais:
   ```bash
   docker-compose exec web python manage.py migrate
   docker-compose exec web python manage.py shell < seed_users.py
   docker-compose exec web python manage.py shell < seed_db.py
   ```

4. Acesse a aplicação:
   - Frontend (PDV): `http://localhost:3000`
   - Backend API: `http://localhost:8000/api`
   - Painel Admin Django: `http://localhost:8000/admin` (Usuário: admin / Senha: 123)

## ☁️ Deploy na Nuvem (Render.com)

Este projeto está configurado para deploy automatizado (Infrastructure as Code) via **Render.com**. 
Basta conectar este repositório no seu dashboard do Render e utilizar a opção **Blueprint** selecionando o arquivo `render.yaml` localizado na raiz do projeto. O Render irá provisionar todos os recursos necessários automaticamente.

### 📝 Nota sobre Arquitetura (Redis & Celery)
O ecossistema original do GranCook foi desenhado utilizando **Redis** (como banco de dados em memória/cache super rápido) e **Celery** (um "worker" para processar tarefas pesadas em segundo plano, como envio de notificações e relatórios, sem travar a navegação do usuário).
No entanto, a maioria das plataformas em nuvem (incluindo o Render) exige um plano pago para manter serviços de "Workers" (processamento em background) e instâncias gerenciadas de Redis.
Para viabilizar este projeto como um portfólio **100% gratuito** na nuvem:
- O **Celery** e o **Redis** foram temporariamente retirados do arquivo de orquestração de deploy (`render.yaml`).
- O Backend (Django) foi reconfigurado com contingência para utilizar memória local (`LocMemCache`) na ausência do Redis, garantindo que a aplicação funcione com alta performance mesmo na nuvem gratuita.
- Caso o projeto seja rodado localmente (via Docker Compose), o ecossistema completo com a dupla Redis/Celery subirá e funcionará perfeitamente.

---
*Desenvolvido como projeto de portfólio para demonstrar arquitetura Full Stack, modelagem de dados complexa e design de interface focada na experiência do usuário.*
