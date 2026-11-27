# POTIFY City · A Wonderful High Life

[Complete repository directory tree](docs/DIRECTORY.md) · [Whitepaper](docs/WHITEPAPER.md) · [Marketing and sales plan](docs/MARKETING.md) · [Build log](docs/BUILD-LOG.md)

This redesign brings the Roof 7B story together with the [first-harvest campaign](docs/marketing/2026-11-08-original-campaign.md). Start in the apartment, read the lease, meet the neighbors and carry your first crop downstairs to Green Exchange. Everything runs on fictional simSOL and browser saves.

## From Roof 7B to the canal

| Place | What you can do |
| --- | --- |
| Home 7B | Read the lease and follow Moss or Jun through the existing caretaker story. |
| Green Exchange | Sell a first harvest and commission either roof project for 4 simSOL. The second costs 80. |
| Glasshouse extension | Plant and tend two additional beds under an open-sided glass canopy. |
| Rooftop delivery cart | Pack a harvested batch beside the stairs. Carry it downstairs to the café or lab. Each signed delivery pays the market value plus 5 simSOL. |
| Old Industrial Ward | Walk east of the exchange. With a roof project, 250 traded units and 90 simSOL, lease the canal warehouse. The shutter opens onto a freight bench that takes two batches each day for their combined value plus 12 simSOL. |

The opening illustration comes from the original campaign. The canal, bridges, skyline, warehouse and rooftop additions are rendered in the game world. The larger multi-property city, changing seasons and long-term resident arcs remain development goals in the [public design bible](docs/canon/originals/POTIFY_Master_Key_PUBLIC.txt).

## Original development and marketing archive

[Open the original marketing and design archive](docs/marketing/ORIGINALS.md) for the November 4 X and vertical story images, the November 8 campaign copy and artwork, and the original public game bible. The [public Master Key PDF](docs/canon/originals/POTIFY_Master_Key_PUBLIC.pdf) preserves the November 4 layout. A [text extraction](docs/canon/2026-11-04-public-master-key-extracted.txt) is also available.

## Run locally

Use Node 24 and pnpm 11. From the root run the following commands.

```sh
pnpm install --frozen-lockfile
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/potify-high-life dev
```

Open http://localhost:5173. Create a grower, plant your first seed and water it. Return in the same browser to check your plot. For game logic, start with `artifacts/potify-high-life/src/game/store.ts`. The scene, user interface and developer log live under the same application's `src/` directory.

## Downloadable edition

Run `pnpm --filter @workspace/potify-high-life build:offline` to package the game, artwork, and devlog in one HTML file under `artifacts/potify-high-life/dist/offline/`. Open the file in a WebGL-capable browser. Keep it at the same path to continue its local save.

## Test and build

```sh
pnpm --filter @workspace/potify-high-life test
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/potify-high-life build
```

The client build is written to `artifacts/potify-high-life/dist/public`. No external wallet is required to play the baseline game.
