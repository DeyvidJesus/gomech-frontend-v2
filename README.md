# GoMech Frontend

Aplicação web SPA em React 19, TypeScript e Vite. As rotas ficam em `src/routes/`; `src/features/` agrupa componentes, chamadas de API e tipos por domínio. TanStack Query cuida do estado remoto, Zustand do estado compartilhado da interface e Axios da comunicação HTTP.

## Executar

Requer Node.js 20 e npm.

```bash
npm ci
npm run dev
```

O Vite inicia em `http://localhost:5173`. Para apontar para outra API, configure `VITE_API_URL`. Para rodar a plataforma completa, use o [guia do ambiente local do repositório principal](https://github.com/DeyvidJesus/gomech/blob/master/docs/guias/ambiente-local.md).

Comandos disponíveis:

```bash
npm run lint
npm run build
npm run preview
```

## Referências

- [Guia de estudo do projeto](https://github.com/DeyvidJesus/gomech/blob/master/docs/guias/guia-de-estudo-entrevista.md)
- [Arquitetura do frontend](https://github.com/DeyvidJesus/gomech/blob/master/docs/FRONTEND_ARCHITECTURE.md)
- [Design system e protótipos](https://github.com/DeyvidJesus/gomech/blob/master/docs/design/README.md)
