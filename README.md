# GoMech V2 - Frontend (React + Vite)

Este é o frontend da plataforma GoMech V2, construído utilizando React 19, TypeScript, e Vite. Ele consome a API RESTful fornecida pelo projeto Backend.

## Pré-requisitos

Certifique-se de ter instalado em sua máquina:

- **Node.js** (Versão 18 ou superior recomendada)
- **npm** (Gerenciador de pacotes, já incluso com o Node.js)

## Instalação

Abra o terminal, navegue até a pasta `frontend` e execute o comando abaixo para instalar todas as dependências necessárias do projeto:

```bash
npm install
```

## Como Rodar o Projeto

Após a instalação das dependências, você pode iniciar o servidor de desenvolvimento utilizando o comando:

```bash
npm run dev
```

O Vite iniciará o servidor local, normalmente disponível em: **http://localhost:5173**

## Fluxo Recomendado com Docker Compose

O fluxo recomendado para a stack local parte da raiz do monorepo:

```bash
cp .env.example .env
docker compose up --build
```

Esse comando sobe frontend, backend, AI e PostgreSQL juntos. O guia completo está em [../docs/STARTUP_GUIDE.md](/home/deyvid/Documents/work/gomech-project/gomech/docs/STARTUP_GUIDE.md).

## Conexão com o Backend

Por padrão, a aplicação frontend consome as APIs locais do backend rodando na porta **8080**.

**Passos para uma conexão perfeita:**

1. Certifique-se de que o **Backend** esteja rodando simultaneamente (Veja o `README.md` na pasta `backend`).
2. O servidor Spring Boot do backend deve estar escutando em `http://localhost:8080`.
3. O cliente HTTP (Axios) do frontend estará apontando as requisições para a URL do backend local.

Caso o backend não esteja rodando, as requisições de autenticação e outras rotas de API irão falhar na interface do usuário.

## Outros Comandos Úteis

- `npm run build`: Compila o projeto em TypeScript e gera a build de produção (pasta `dist`).
- `npm run preview`: Inicia um servidor web local para visualizar a build de produção.
- `npm run lint`: Executa a análise de código usando o ESLint para encontrar e corrigir problemas.
