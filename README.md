# POTIFY City · A Wonderful High Life

[Complete repository directory tree](docs/DIRECTORY.md) · [Whitepaper](docs/WHITEPAPER.md) · [Marketing and sales plan](docs/MARKETING.md) · [Build log](docs/BUILD-LOG.md)

Grow a crop on the rooftop, get to know the neighborhood and return to a saved game in the same browser. The main branch contains the baseline life sim. The later Roof 7B lease story and developer notes are available on the [public story review branch](https://github.com/jonathanbabec5-hash/Potify/tree/codex/public-developer-guide). The game uses fictional money.

## Original development and marketing archive

- [November 4, 2026 public Master Key — complete extracted text](docs/canon/2026-11-04-public-master-key-extracted.txt): original spoiler-safe design canon; not the original PDF layout and not a claim that every feature is implemented.
- [November 8, 2026 original campaign copy and artwork](docs/marketing/2026-11-08-original-campaign.md): recovered copy and exact original JPEG; publication remains unverified.

## Run locally

Use Node 24 and pnpm 11. From the root run the following commands.

```sh
pnpm install --frozen-lockfile
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/potify-high-life dev
```

Open http://localhost:5173. Create a grower, plant your first seed and water it. Return in the same browser to check your plot. For game logic, start with `artifacts/potify-high-life/src/game/store.ts`. The scene, user interface and developer log live under the same application's `src/` directory.

## Test and build

```sh
pnpm --filter @workspace/potify-high-life test
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/potify-high-life build
```

The client build is written to `artifacts/potify-high-life/dist/public`. No external wallet is required to play the baseline game.
