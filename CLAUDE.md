# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Objetivo del Proyecto
El proyecto consiste en un comandero de un restaurante, la app web constará de una pagina de gestion. El usuario final sera el camarero, el cual seleccionado los diferentes platos podra crear una comanda, en un archivo PDF, que será impreso por una impresora.
El proyecto es ficcticio para clase, por lo que se realizara todo en local, usando como BD un archivo .txt el cual almacena los platos activos en la app

## Stack Definido
Reflejado en el apartado architecture de este archivo

## Base de Datos (archivo local)
- Ruta: `/data/platos.txt`
- Formato por línea: `id|nombre|precio|activo`
- Ejemplo: `1|Ensalada César|8.50|true`
- Las operaciones CRUD se gestionan desde `lib/platos.ts`

## Lo que debe desarrollarse
1. Feature 1 — home de la app (listado clicable de platos que se encuentran en el sistema) al ser clicados el plato se añadirá a la lista comandada
2. Feature 2 — pagina de gestión de platos, añadir, eliminar, modificar. cada plato tendra un nombre.
3. Feature 3 — Creación del motor de la app. Permitiendo así almacenar los platos seleccionados, así como un comentario opcional sobre los mismos. Factoria de PDFs, al darle a enviar en el resumen flotante de los platos seleccionados creara un pdf, el cual sera enviado a la impresora de la cocina(no realizar el flujo a la impresora, almacenar dicho PDF en una carpeta interna en la raiz del proyecto)
- Los PDFs generados se almacenan en `/comandas/` en la raíz del proyecto
- Nombrar cada PDF como: `comanda-[timestamp].pdf`
4. feature 4 — pagina flotante de resumen de comanda, aparecerá un resumen de los platos seleccionados, así como un comentario sobre el mismo, este comentario será opcional

## Convenciones
- Server Components por defecto, Client Components solo cuando se necesite interactividad
- Carpeta `components/ui` para componentes reutilizables
- Carpeta `lib` para utilidades y configuración de servicios
- Tipos en `types/` o co-localizados con el módulo


## Punto de entrada
1. Verificar que Tailwind v4 esté funcionando correctamente
2. Crear el layout base (`app/layout.tsx`) con navbar responsive que incluya navegación entre Home y Gestión de Platos
3. Crear `/data/platos.txt` con 5 platos de ejemplo
4. Implementar `lib/platos.ts` con las funciones de lectura/escritura del archivo

## Commands

```bash
npm run dev      # Start dev server (Turbopack, outputs to .next/dev)
npm run build    # Production build (Turbopack by default)
npm run start    # Start production server
npm run lint     # Run ESLint directly (NOT `next lint` — it was removed in v16)
```

No test runner is configured yet.

## Architecture

Next.js **16.2.7** with React **19.2**, using the **App Router** (`app/` directory). Tailwind CSS v4 (imported via `@import "tailwindcss"` in CSS, not `tailwind.config.js`). TypeScript with strict mode and path alias `@/*` → `./*`.

Turbopack is on by default for both `dev` and `build`. Custom `webpack` config will break builds — use `turbopack` top-level key in `next.config.ts` instead.

## Next.js 16 Breaking Changes

These differ from what most training data covers. Read `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md` for the full list.

**Async Request APIs** — `cookies()`, `headers()`, `draftMode()`, `params`, and `searchParams` are now **fully async**. Synchronous access was removed. Always `await` them:

```tsx
// page.tsx
export default async function Page({ params }: PageProps<'/blog/[slug]'>) {
  const { slug } = await params
  const query = await searchParams
}
```

Run `npx next typegen` to generate `PageProps`, `LayoutProps`, `RouteContext` helpers.

**`middleware` → `proxy`** — Rename `middleware.ts` to `proxy.ts` and the exported function from `middleware` to `proxy`. The `edge` runtime is NOT supported in `proxy` (nodejs only). Keep `middleware.ts` only if you need the edge runtime. Config flag `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`.

**`next lint` removed** — Use `eslint` (or `npm run lint`) directly. `next build` no longer runs linting. ESLint flat config format is now the default.

**`revalidateTag` signature changed** — Now requires a second `cacheLife` profile argument:

```ts
revalidateTag('posts', 'max')  // was: revalidateTag('posts')
```

For immediate expiration, use `updateTag` in Server Actions instead.

**`cacheLife` / `cacheTag`** — Drop the `unstable_` prefix; import directly from `next/cache`.

**PPR** — `experimental.ppr` and route-level `experimental_ppr` are removed. Use `cacheComponents: true` in `next.config.ts`.

**Parallel routes** — All `@slot` directories must have an explicit `default.js`; builds fail without them.

**`next/image`**:
- Local images with query strings require `images.localPatterns[].search` config
- `images.domains` deprecated → use `images.remotePatterns`
- `next/legacy/image` deprecated → use `next/image`
- `minimumCacheTTL` default changed from 60 s to 4 h
- `imageSizes` default no longer includes `16`
- `qualities` default is now `[75]` only

**Removed entirely**: AMP support, `serverRuntimeConfig`/`publicRuntimeConfig` (use env vars), `devIndicators.appIsrStatus/buildActivity/buildActivityPosition`.

**`next dev` output** — Dev server writes to `.next/dev` (not `.next`). `next dev` and `next build` can now run concurrently.
