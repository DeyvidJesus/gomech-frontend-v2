# GoMech Frontend

[![CI](https://github.com/DeyvidJesus/gomech-frontend-v2/actions/workflows/ci.yml/badge.svg)](https://github.com/DeyvidJesus/gomech-frontend-v2/actions/workflows/ci.yml)

Aplicação web SPA em React 19, TypeScript e Vite. As rotas ficam em `src/routes/`; `src/features/` agrupa componentes, chamadas de API e tipos por domínio. TanStack Query cuida do estado remoto, Zustand do estado compartilhado da interface e Axios da comunicação HTTP.

## Executar

Requer Node.js 20 (versão fixada em `.nvmrc`) e npm.

```bash
npm ci
npm run dev
```

O Vite inicia em `http://localhost:5173`. Para apontar para outra API, configure `VITE_API_URL`. Para rodar a plataforma completa, use o [guia do ambiente local do repositório principal](https://github.com/DeyvidJesus/gomech/blob/master/docs/guias/ambiente-local.md).

Comandos disponíveis:

```bash
npm run lint     # ESLint
npm run build    # checagem de tipos (tsc -b) e build de produção
npm run preview
```

A CI executa `npm ci`, `npm run lint` e `npm run build` a cada push e pull request.

## Referências

- [Arquitetura do frontend](https://github.com/DeyvidJesus/gomech/blob/master/docs/FRONTEND_ARCHITECTURE.md)
- [Design system e protótipos](https://github.com/DeyvidJesus/gomech/blob/master/docs/design/README.md)
