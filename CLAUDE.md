# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server with Turbopack at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run Vitest tests (jsdom environment)
npx vitest run src/components/chat/__tests__/ChatInterface.test.tsx  # Run a single test file
npm run db:reset     # Reset and re-migrate the SQLite database
```

**Do not run `npm audit fix`** — dependencies are pinned and audit fix can break compatibility.

## Environment

Copy `.env.example` to `.env` (if present) and set:
- `ANTHROPIC_API_KEY` — if unset or `your-api-key-here`, the app falls back to a `MockLanguageModel` that returns canned components
- `JWT_SECRET` — defaults to `development-secret-key`

## Architecture

UIGen is a Next.js 15 App Router app where users chat with Claude to generate React components that render in a live iframe preview — all without writing files to disk.

### Data flow for component generation

1. **User sends a chat message** → `ChatContext` (`src/lib/contexts/chat-context.tsx`) calls the Vercel AI SDK's `useChat`, which POSTs to `/api/chat`
2. **`/api/chat` route** (`src/app/api/chat/route.ts`) streams a `streamText` response using `claude-haiku-4-5` (or the mock) with two tools: `str_replace_editor` and `file_manager`
3. **Tool calls update the virtual FS** — as the stream arrives, `onToolCall` in `ChatContext` dispatches to `FileSystemContext.handleToolCall` (`src/lib/contexts/file-system-context.tsx`), which mutates the in-memory `VirtualFileSystem`
4. **Preview re-renders** — `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) watches `refreshTrigger` from `FileSystemContext`, runs `createImportMap` + `createPreviewHTML` from `src/lib/transform/jsx-transformer.ts`, and writes a new `srcdoc` to an iframe
5. **Persistence** — on `onFinish`, the route saves messages + serialized FS to `prisma.project` (SQLite) only for authenticated users with a `projectId`

### Virtual file system

`VirtualFileSystem` (`src/lib/file-system.ts`) is an in-memory tree stored in two Maps (`files` and `root.children`). It never touches disk. It exposes editor-style methods (`replaceInFile`, `insertInFile`, `createFileWithParents`) that match the AI tool schemas. Serialization flattens it to `Record<string, FileNode>` for JSON transport.

### Client-side JSX compilation

`src/lib/transform/jsx-transformer.ts` uses `@babel/standalone` in the browser to transpile each `.jsx`/`.tsx` file, then wraps each output as a `Blob` URL. It builds an `importmap` that resolves `@/` aliases, third-party packages (via `https://esm.sh/`), and placeholder stubs for missing modules. The final HTML is set as the iframe's `srcdoc`.

### AI tools available to the model

- `str_replace_editor` — `create`, `str_replace`, `insert`, `view` commands on the virtual FS
- `file_manager` — `rename`, `delete`, `list` commands

Both tools are built in `src/lib/tools/` and receive a `VirtualFileSystem` instance per request (reconstructed from the serialized `files` payload the client sends).

### Auth

Custom JWT auth using `jose` with httpOnly cookies (7-day sessions). Implemented in `src/lib/auth.ts` (server-only). The app allows anonymous usage — `src/lib/anon-work-tracker.ts` persists anonymous work to `localStorage` so it can be claimed after sign-up.

### Database

Prisma + SQLite (`prisma/dev.db`). Two models: `User` (email + bcrypt password) and `Project` (stores `messages` and `data` as JSON strings). Run `npx prisma studio` to browse data.

### Provider fallback

`src/lib/provider.ts` exports `getLanguageModel()` — returns `anthropic("claude-haiku-4-5")` when `ANTHROPIC_API_KEY` is set, otherwise a `MockLanguageModel` that generates canned Counter/Form/Card components through a scripted multi-step tool-call sequence.

### Generation system prompt

`src/lib/prompts/generation.tsx` — the prompt instructs the model to always create `/App.jsx` as the entry point, use `@/` import aliases for local files, and style with Tailwind only.
