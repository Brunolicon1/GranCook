<div align="center">
  <b>🇺🇸 English</b> | <a href="README.pt-br.md">🇧🇷 Português</a>
</div>

---

# 🍔 GranCook PDV

![Status](https://img.shields.io/badge/Status-Active-green)
![Completion](https://img.shields.io/badge/Completion-90%25-yellow)

Welcome to **GranCook**! A complete Full Stack Point of Sale (POS) and Kitchen Display System (KDS) focused on restaurants. This project was developed using the **Vibecoding** philosophy and workflow, built entirely through the fantastic **Antigravity IDE**.

## 🌐 Access the System
You can access and test the production version (cloud-hosted) by clicking the link below:
🔗 **[grancook.onrender.com](https://grancook.onrender.com)**

If you prefer to run it locally, the project is configured to start automatically via Docker Compose:

```bash
git clone https://github.com/Brunolicon1/GranCook.git
cd GranCook
docker compose up -d --build
```

## ⚠️ Project Status
The system is currently **90% completed** and active.

The main routines of a restaurant are already perfectly implemented:
- Real-time Table Management (including grouping and transferring).
- KDS (Kitchen Display System) with visual queue management.
- Robust Checkout System (partial payments, splitting, tips, and discounts).

### 🚧 Planned Updates
There are still some security and operational improvements to be refined in upcoming versions:
- **Inventory Management:** Strict tracking of raw material inputs and outputs.
- **Cancellation Auditing:** Refactoring the item cancellation flow to prevent fraud (e.g., preventing waitstaff from receiving cash payments and canceling the order in the interface).

> [!NOTE]
> **Fiscal Invoicing (NFC-e):** The integration with the Brazilian Sefaz (Tax Authority) for real invoice emission has been **disabled** in this demo version. The flow works entirely internally for system validation purposes.

## 🛠 Technologies Used (Vibecoding)
- Next.js (App Router)
- React & Tailwind CSS
- Python & Django REST Framework
- PostgreSQL (Relational Database)
- Redis & Celery (Background Queue Management)
- Docker & Docker Compose
- **Antigravity IDE**

---

*Developed in a continuous vibecoding flow.* ✨
