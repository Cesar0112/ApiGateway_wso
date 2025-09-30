## Quick orientation for AI coding agents

This is a NestJS-based API Gateway that centralizes authentication, session handling, permission checks and proxying to downstream services. Keep instructions short and concrete — focus on files listed below when making changes.

Key entry points and concepts
- `src/main.ts` — application bootstrap: sets global prefix `apigateway`, enables CORS and Swagger, and serves `public/` static files.
- `src/app/app.module.ts` — top-level composition: imports `AuthenticateModule`, `ProxyModule`, `SessionModule`, `PermissionsModule`, `UsersModule`, etc. Use this file to understand why providers are wired globally (CacheModule registration uses `SessionService`).
- `src/proxy/*` — implements routing to downstream channels. `ProxyService.sendRequest` selects a strategy (`HttpClientStrategy`, `NatsClientStrategy`) based on `Channel`.
- `src/auth/*` and `src/auth/services` — pluggable auth backends. `AuthenticateModule` chooses between WSO2 (`AuthWSO2Service`) and `AuthLocalService` based on `API_GATEWAY.AUTH_TYPE` in `config.json`.
- `config.json` — environment-like configuration used by `ConfigService`. Read it to discover defaults (PORT, AUTH_TYPE, SESSION strategy, PROXY flags, PROXY_STATIC_MAP_PATH).
- `routes.json` and `routes-radix.json` — canonical route → permissions mapping. Many guards rely on these files; update with care.

Project-specific conventions and patterns
- Global route prefix: every controller path is prefixed by `/apigateway` (see `main.ts`). When you add or test endpoints, include that prefix.
- Session-first security: tokens are stored and validated server-side. Frontend doesn't receive raw tokens. Session handling is in `src/session/*` and wired into CacheModule in `app.module.ts`.
- Permission map externalized: `routes.json` defines required permission strings per route. Use it when adding new protected endpoints or updating permission logic.
- Proxy strategies: new communication channels must implement the `ClientStrategy` interface under `src/strategies` and be registered in `ProxyService.sendRequest`.
- Auth pluggability: `AuthenticateModule` uses a factory provider keyed by `API_GATEWAY.AUTH_TYPE`. To add a new auth backend, provide it and update the factory switch.

Build, run and test workflows
- Common commands (from `package.json`):
  - build: `npm run build` — compiles with Nest, copies `config.json` and `routes.json` to `dist`.
  - start: `npm start` — starts Nest in production mode; `start:dev` runs with watch.
  - test: `npm test`, `npm run test:e2e` — unit and e2e tests via Jest.
  - lint/format: `npm run lint`, `npm run format`.

Quick debugging tips
- To run locally with dev config, ensure `NODE_ENV` is not `test` so morgan logs HTTP requests.
- When debugging proxy flows, inspect `src/proxy/proxy.service.ts` and the strategy implementations in `src/strategies` to see how requests are transformed and where errors will surface.
- Many modules use `ConfigService` to read `config.json`; if behavior differs from expectations, check that `dist/config.json` matches your runtime config after `npm run build`.

Files that most often need changes
- `src/proxy/*` (routing and strategy wiring)
- `src/auth/*` and `src/auth/services/*` (auth backends and throttle rules)
- `src/session/*` (session store strategy: redis vs sqlite)
- `routes.json` / `routes-radix.json` (permission mapping) — changes here affect runtime guards.

Edge cases and constraints to respect
- Do not expose raw session tokens to the frontend. Follow existing pattern where session data is server-side only.
- Keep `routes.json` and `routes-radix.json` in sync when adding routes. Some guards depend on the radix tree format.
- `ConfigService` values are used across modules; changing a config key name requires updates in multiple providers.

If you modify behavior that affects auth, sessions or permissions
- Add or update a unit test in the corresponding module under `src/` and run `npm test` and `npm run test:e2e` when applicable.
- Document route permission changes in `ROUTES.md`.

Examples from the codebase
- Add new proxy channel: implement `src/strategies/<your>.ts` following `HttpClientStrategy` pattern and add case in `ProxyService.sendRequest`.
- Add local auth provider: add provider class in `src/auth/services/` and update the `AUTH_TYPE` switch in `AuthenticateModule`.

When in doubt, inspect these files first: `src/main.ts`, `src/app/app.module.ts`, `src/proxy/proxy.service.ts`, `src/auth/auth.module.ts`, `config.json`, `routes.json`, `routes-radix.json`.

Please review and tell me if you'd like more examples or a shorter variant focused only on tests, debugging, or permission mapping.
