# sociax

A modern, extensible social media web app built with Next.js, TypeScript, and Prisma.

## Overview

sociax is a full-featured social platform prototype (posts, profiles, groups, events, marketplace, etc.).
It's provided as a starter scaffold and reference implementation rather than a production-ready hosted service.

## Tech stack

- Next.js (App Router)
- TypeScript
- Prisma (Postgres / SQLite)
- Tailwind CSS, Radix UI, Tiptap, and other UI/utility libraries
- Vitest and Playwright for testing

## Key features

- Posts, comments, likes, and media uploads
- Events, groups, pages, and marketplace flows
- Authentication with NextAuth and Prisma adapter
- Notification and messaging primitives

## Quick start

Prerequisites: Node.js 18+.

1. Install dependencies

```bash
npm install
```

2. Environment

```bash
# copy the example env
cp .env.example .env
# on Windows PowerShell use:
copy .env.example .env
```

Edit `.env` and set `DATABASE_URL` and any provider keys required by your setup.

3. Run in development (default port 4000)

```bash
npm run dev
```

## Important npm scripts

- `npm run dev` — Start Next.js in development (port 4000)
- `npm run build` — Generate Prisma client and build the app
- `npm start` — Start production server (`next start`)
- `npm run startDev` — Start server on port 4000 (production start variant)
- `npm run seed` — Run the seed script
- `npm run lint` — Run ESLint
- `npm test` — Run tests (Vitest)
- `npm run format` — Run Prettier

## Database & Prisma

- Apply local migrations and generate client:

```bash
npx prisma migrate dev
npx prisma generate
```

- In CI / production use:

```bash
npx prisma migrate deploy
```

- To run the project seed (if present):

```bash
npm run seed
```

## Development notes

- Dev server defaults to port 4000. See `package.json` scripts for options.
- Prisma client is generated as part of the build step (`npm run build`).
- Static assets live in `public/` and uploads are in `public/uploads/`.

## Contributing

- Fork the repo, create a feature branch, and open a pull request.
- Keep changes small and focused; add tests for new behavior.
- Run `npm run lint` and `npm run format` before submitting.

## Troubleshooting

- Server won't start: verify `.env` exists and `DATABASE_URL` is correct.
- Prisma issues: run `npx prisma migrate dev` to apply migrations locally, then `npx prisma generate`.

## License

Add a `LICENSE` file to the repository to indicate the project license.

