# 🍔 GranCook PDV

![Status](https://img.shields.io/badge/Status-Ativo-green)
![Conclusão](https://img.shields.io/badge/Conclus%C3%A3o-90%25-yellow)

Bem-vindo ao **GranCook**! Um sistema completo (Full Stack) de Ponto de Venda e Kitchen Display System (KDS) focado em restaurantes. Este projeto foi desenvolvido utilizando a filosofia e o fluxo de **Vibecoding**, inteiramente construído através da fantástica IDE **Antigravity**.

## 🌐 Acesso ao Sistema
Você pode acessar e testar a versão em produção (na nuvem) acessando o link abaixo:
🔗 **[grancook.onrender.com](https://grancook.onrender.com)**

Caso prefira rodar localmente, o projeto está configurado para iniciar de forma automatizada via Docker Compose:

```bash
git clone https://github.com/Brunolicon1/GranCook.git
cd GranCook
docker compose up -d --build
```

## ⚠️ Status do Projeto
O sistema encontra-se **90% concluído** e ativo.

As principais rotinas de um restaurante já estão perfeitamente implementadas:
- Controle de Mesas em tempo real (incluindo agrupamento e transferência).
- KDS (Tela da Cozinha) com gerenciamento visual de fila.
- Fechamento de caixa robusto (pagamentos parciais, gorjeta e descontos).

### 🚧 Próximas Atualizações Planejadas
Ainda há algumas melhorias de segurança e operacionais que serão lapidadas nas próximas versões:
- **Gerenciamento de Estoque:** Controle rígido de entrada e saída de insumos.
- **Auditoria de Cancelamentos:** Refatoração do fluxo de cancelamento de itens para impedir fraudes (ex: o garçom receber o pagamento em dinheiro e cancelar o pedido na interface).

> [!NOTE]
> **Emissão de Notas (NFC-e):** A integração com a Sefaz para emissão de notas fiscais reais foi **desativada** nesta versão de demonstração. O fluxo funciona apenas internamente para fins de validação do sistema.

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
