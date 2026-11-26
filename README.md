# POTIFY City · A Wonderful High Life

[Full repository tree](docs/DIRECTORY.md) · [Technical whitepaper](docs/WHITEPAPER.md) · [Marketing and sales plan](docs/MARKETING.md) · [Developer log](docs/BUILD-LOG.md)

## Who gets to stay on Roof 7B?

A first crop gives you something to sell. The lease gives you a reason to care what that sale makes possible. Roof 7B belongs as much to the neighbors downstairs as it does to the person watering the roof. A player who remembers Moss and a broken latch has found a different game from one who only remembers the balance.

Follow a harvest in the [game store](artifacts/potify-high-life/src/game/store.ts), then a resident’s task in the [story model](artifacts/potify-high-life/src/game/story.ts). The ledger, latch and signal belong to different residents. Growth, inventory and the local save have to agree with the story even after you close the tab.

Start a fresh local game, harvest once, speak to a resident and reload. Tell us the first moment you understood why the lease mattered—or where that connection was lost. Give the device and the last action. The currency is fictional; this is a playtest.

Grow a first crop on Roof 7B, meet the neighbors in the Canopy Quarter and decide how to keep the rooftop lease. This branch includes the game's first story arc, a browser save system and an in-game developer log. Seed → Soil → Solana is the project's creative lineage. The game economy uses fictional currency.

## Run the game locally

Use Node.js 24 and pnpm 11. From the repository root, install the locked dependencies and start the game.

```sh
pnpm install --frozen-lockfile
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/potify-high-life dev
```

Open http://localhost:5173 and start a new grower. Plant a seed, water it, and visit the neighborhood while it grows. Return to the same browser to resume the save. The client can run on its own. The separate Express API workspace includes a health endpoint.

## Check a change

```sh
pnpm --filter @workspace/potify-high-life test
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/potify-high-life build
```

Vite writes the game to `artifacts/potify-high-life/dist/public`. The tests cover game state, legacy saves, story progression and public developer-log boundaries. For a mobile release, also exercise tap controls, HUD readability and reload on a real phone.

## Developer entry points

| Change | Start here |
| --- | --- |
| Planting, upgrades, storage and save validation | `artifacts/potify-high-life/src/game/store.ts` |
| Lease choices and resident dialogue | `artifacts/potify-high-life/src/game/story.ts` |
| Rooftop, town and characters | `artifacts/potify-high-life/src/scene/` |
| Menus and touch controls | `artifacts/potify-high-life/src/ui/` |
| Public roadmap and dated progress | `artifacts/potify-high-life/src/content/devlogRegistry.ts` |

To report a bug, give the commit, device, browser, location in the game and the fewest actions that reproduce it. Use a fresh game for a second attempt. Preserve the original save locally if the bug involves recovery.
