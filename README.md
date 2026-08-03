# 🍔 GranCook PDV

![Status](https://img.shields.io/badge/Status-Ativo-green)
![Conclusão](https://img.shields.io/badge/Conclus%C3%A3o-100%25-green)

Bem-vindo ao **GranCook**! Um sistema completo (Full Stack) de Ponto de Venda e Kitchen Display System (KDS) focado em restaurantes. Este projeto foi desenvolvido utilizando a filosofia e o fluxo de **Vibecoding**, inteiramente construído através da fantástica IDE **Antigravity**.

## 🌐 Acesso ao Sistema
O projeto está configurado para rodar localmente de forma automatizada via Docker Compose.

```bash
git clone https://github.com/SEU_USUARIO/GranCook.git
cd GranCook
docker compose up -d --build
```

- **Painel PDV (Frontend):** [http://localhost:3000](http://localhost:3000)
- **API (Backend):** [http://localhost:8000/api](http://localhost:8000/api)

## ⚠️ Status do Projeto
O sistema encontra-se **100% funcional** e ativo.

As principais rotinas de um restaurante já estão perfeitamente implementadas:
- Controle de Mesas em tempo real (incluindo agrupamento e transferência).
- KDS (Tela da Cozinha) com gerenciamento visual de fila.
- Fechamento de caixa robusto (pagamentos parciais, gorjeta e descontos).
- **Integração Fiscal:** Motor de emissão de cupons fiscais (NFC-e) via Focus NFe.

> [!NOTE]
> **Emissão de Notas (NFC-e):** O ambiente fiscal encontra-se configurado em modo de Simulação (MOCK) para permitir que os recrutadores validem o payload JSON que seria enviado à Sefaz através de um "Espelho de Dados", dispensando a necessidade de certificados digitais e CNPJ ativo para os testes.

## 🛠 Tecnologias Utilizadas (Vibecoding)
- Next.js (App Router)
- React & Tailwind CSS
- Python & Django REST Framework
- PostgreSQL (Banco de Dados Relacional)
- Redis & Celery (Gerenciamento de Filas)
- Docker & Docker Compose
- **Antigravity IDE**

---

*Desenvolvido em fluxo contínuo de vibecoding.* ✨
