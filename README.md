# POTIFY City · A Wonderful High Life

## Find your way in

| If you are… | Start here | Try this |
| --- | --- | --- |
| A player | [Run the baseline game](#run-locally) | Create a grower, plant a seed and return in the same browser. |
| A storyteller | [Explore the original campaign](docs/marketing/ORIGINALS.md) | Trace the rooftop vision through the public design archive. |
| A developer | [Inspect the game state](artifacts/potify-high-life/src/game/store.ts) | Follow how the baseline records the player’s progress. |
| A worldbuilder | [Read the world bible](https://github.com/jonathanbabec5-hash/potify-city-canon) | Compare a design idea with what the game actually supports. |

[Complete repository directory tree](docs/DIRECTORY.md) · [Whitepaper](docs/WHITEPAPER.md) · [Marketing and sales plan](docs/MARKETING.md) · [Build log](docs/BUILD-LOG.md)

Grow a crop on the rooftop, get to know the neighborhood and return to a saved game in the same browser. The main branch contains the baseline life sim. The later Roof 7B lease story and developer notes are available on the [public story review branch](https://github.com/jonathanbabec5-hash/Potify/tree/codex/public-developer-guide). The game uses fictional money.

The [Canopy House development branch](https://github.com/jonathanbabec5-hash/Potify/tree/redesign/first-harvest-neighborhood/artifacts/potify-high-life) includes the first rooftop project choice, crop-status tags, and neighborhood stories at the fourth-floor kitchen and Seed & Signal. Follow [development and playtest notes in PR #5](https://github.com/jonathanbabec5-hash/Potify/pull/5).

## Original development and marketing archive

[Open the original marketing and design archive](docs/marketing/ORIGINALS.md) for the November 4 X and vertical story images, the November 8 campaign copy and artwork, and the original public game bible. The [public Master Key PDF](docs/canon/originals/POTIFY_Master_Key_PUBLIC.pdf) preserves the November 4 layout. A [text extraction](docs/canon/2026-11-04-public-master-key-extracted.txt) is also available.

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
