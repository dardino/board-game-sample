# Project Context

## Overview

This is a TypeScript pnpm monorepo for a cooperative board-game sample. The `client/` is a Vite web app; the `server/` is a NestJS app using Fastify. Game rules and implementation status are documented in [REGOLE.md](./REGOLE.md).

## Architecture and Existing Features

- Player registration uses the `/me` API and HTTP-only cookies. The client loads the current player through `Registration.GetMe()`; game refresh recovery uses the game ID in the URL and this existing cookie-backed identity, not a player ID stored in `localStorage`.
- Components that remain mounted across route changes should subscribe to `Registration.SubscribeToChanges()` and unsubscribe when disconnected so registration and logout state stays current without a full page reload.
- The server manages lobbies and in-memory game models; game and lobby updates are delivered through WebSocket and SSE streams.
- Game setup includes character selection. The in-progress page presents game status and a reusable sidebar with an in-game chat.
- Character definitions and the canonical character catalog (including the Bardo) live in `server/src/gameone/gameone-contents.ts`; derive client-facing character data from `CHARACTERS` rather than duplicating the catalog. The selection card backgrounds are in `client/src/assets/` and are mapped by class in the in-progress component; keep their 2:3 aspect ratio.
- Character selection is a two-stage, server-authoritative flow. During the 30-second choosing stage, players can change preferences and share the same preference; `Ready` locks that player's preference. When the timer expires or everyone is ready, conflicts are resolved randomly and unassigned players receive random remaining characters.
- Final character assignments are shown during a 10-second reveal stage. `Ready` in this stage advances early when every player is ready. After the reveal, insert the first `Start` tile before beginning the first player turn. Keep stage deadlines and per-game timers in `GamesServices`; selection preferences and ready-player state belong to `GameoneState`.
- The game-state WebSocket event exposes selection stage, deadline, ready player IDs, preferences or final assignments. Keep its DTO, gateway action validation, service, rules/reducers, and the in-progress UI in sync when changing this flow.
- A game WebSocket disconnect pauses gameplay actions and character-selection timers for up to 15 seconds. Reconnecting the same cookie-authenticated player resumes immediately; if the grace period expires first, the game resumes and that player may still rejoin. Keep this status in the game-state DTO and preserve it on refresh of either in-progress child route.
- The in-progress page owns the persistent game connection and status/sidebar shell; character selection UI lives in `client/src/pages/bgsCharacterSelection/` at `/game/:id/in-progress/character-selection`, and the game board lives in `client/src/pages/bgsGameBoard/` at `/game/:id/in-progress/board`. When selection ends, automatically route to the board field and render every tile in each game-state snapshot; tile positioning is not implemented yet. Keep the parent mounted across child routes so its WebSocket is not recreated, and replace rather than push history for automatic phase transitions.
- The reusable game tile is `bgs-game-tile` in `client/src/pages/bgsGameBoard/components/bgs-game-tile/`. It is a pointy-top hexagon (north/south vertices) using `client/src/assets/tile-000.jpg` by default.
- Chat state lives in memory in each game model. Messages include `playerId`, nickname, text, and server timestamp; the server validates non-empty messages up to 500 characters.
- The in-progress client must await `Registration.GetMe()` before opening its game WebSocket and use the returned player ID for its subscription, rendering, and actions. This prevents multiple clients from being treated as the same player before identity has loaded.
- WebSocket subscriptions currently trust a client-supplied `playerId` and validate it against the game roster; it is not yet bound to the authenticated HTTP session. Treat this as a known authorization limitation.
- Client templates may use CSS Modules via the Vite template plugin; preserve the existing template/CSS-module import pattern rather than switching those styles to global CSS.

## Development and Validation

- Install/use the repository's declared package manager, pnpm.
- Build all packages: `pnpm build`
- Run all tests: `pnpm test`
- Run client tests: `pnpm --filter client test`
- Run server tests: `pnpm --filter server test`
- Run lint: `pnpm lint`

## Recent Work

- `e34a673` — completed character selection and game recovery behavior.
- `3968c4a` — added in-game chat and fixed current-player identity loading.
- The chat input is single-line; the current player's messages are right-aligned and labeled “You”.
- Regression coverage verifies that the in-progress page subscribes with the player ID loaded for that browser.
- Selection rules and timer/reveal integration coverage live in `server/src/gameone/rule-manager/rule-manager.service.spec.ts` and `server/src/services/game/game-flow.integration.spec.ts`.

The user generally communicates in Italian and requests commits explicitly.

## Important

- Keep this file up-to-date
