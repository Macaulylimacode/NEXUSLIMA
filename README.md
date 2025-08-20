# ⚡ NEXUSLIMA
[![License: Unlicense](https://img.shields.io/npm/l/react)](https://github.com/Macaulylimacode/NEXUSLIMA/blob/main/LICENSE)

Este projeto é uma plataforma web moderna, estruturada em frontend e backend, desenvolvida para entregar performance, organização e escalabilidade.

Ele conta com:

° Login seguro de usuários.

° Painel administrativo responsivo.

° Estrutura separada entre API Backend e Interface Frontend.

° Tecnologias atuais para maior robustez e flexibilidade.

## 📂 Estrutura do Projeto

```bash
NEXUSLIMA/
│
├── backend/        # API em Node.js + Express
├── frontend/       # Interface do usuário (React + TailwindCSS)
│   └── painel/     # Painel administrativo moderno
├── docker-compose.yml   # Orquestração (se aplicável)
├── .env                # Variáveis de ambiente
└── README.md

```

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos

° Node.js (>= 18.x)

° npm ou yarn

° Banco de Dados PostgreSQL

° (Opcional) Docker + Docker Compose para execução simplificada

### 2. Clonar o Repositório.

```bash
git clone https://github.com/Macaulylimacode/NEXUSLIMA.git
cd NEXUSLIMA
```
### 3. Configuração do Backend

```bash
cd backend
npm install   # instalar dependências
npm run dev   # iniciar servidor em ambiente de desenvolvimento
```
# 🚀 Tecnologias utilizadas  
### Technologies used:

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

![HTML](https://img.shields.io/badge/HTML-239120?style=for-the-badge&logo=html5&logoColor=white)

![CSS](https://img.shields.io/badge/CSS-239120?&style=for-the-badge&logo=css3&logoColor=white)

---

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)

![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

# 🛢️ Banco de Dados

No projeto, o banco pode ser configurado via arquivo .env, com as seguintes variáveis:

```bash
DB_HOST=localhost
DB_USER=usuario
DB_PASS=senha
DB_NAME=nexuslima_db
DB_PORT=5432
```
### Principais tabelas:

° Usuários

° Autenticações

° Painel Administrativo

# ⚖️ Segurança e Boas Práticas

° Senhas criptografadas com bcrypt

° Tokens JWT com tempo de expiração

° Middleware de autenticação nas rotas protegidas

° Estrutura frontend/backend desacoplada

# ✅ Funcionalidades em Destaque

🔐 Login seguro com token JWT

👤 Painel de usuário com dados dinâmicos

📊 Painel administrativo responsivo

🌐 Arquitetura moderna (API + SPA)

⚡ Integração com banco de dados relacional

# 🛠️ Tarefas Futuras

° Integração de notificações por e-mail

° Recuperação de senha

° Autenticação em duas etapas (2FA)

° Relatórios exportáveis em PDF

° Deploy automatizado via CI/CD

# 👨‍💻 Desenvolvido por

Macauly Lima

[![linkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/macauly-lima-75984a269)
