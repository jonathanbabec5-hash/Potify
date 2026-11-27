# POTIFY City · A Wonderful High Life

[Complete repository directory tree](docs/DIRECTORY.md) · [Whitepaper](docs/WHITEPAPER.md) · [Marketing and sales plan](docs/MARKETING.md) · [Build log](docs/BUILD-LOG.md)

This redesign brings the Roof 7B story together with the [first-harvest campaign](docs/marketing/2026-11-08-original-campaign.md). Start in the apartment, read the lease, meet the neighbors and carry your first crop downstairs to Green Exchange. Everything runs on fictional simSOL and browser saves.

On a phone, the clock, objectives and notifications start hidden. Open the pause menu in the upper right and tap **Show overlays** or **Hide overlays**. The game remembers the setting on this browser.

The market-square board carries signed crop orders and festival invitations. Upstairs, the notes belong to individual landings. Low Tide and the rooftop radio play the official POTIFY release *The Soil Remembers (Grow Room Version)*. [First Cycle source recording](https://github.com/jonathanbabec5-hash/potify-first-cycle-public-edition/blob/76c38a7629db38130de6a263a75cba02d578a022/public/assets/the-soil-remembers-grow-room.mp3).

## From Roof 7B to the canal

| Place | What you can do |
| --- | --- |
| Home 7B | Read the lease and follow Moss or Jun through the existing caretaker story. |
| Green Exchange | Sell a first harvest and commission either roof project for 4 simSOL. The second costs 80. |
| Glasshouse extension | Plant and tend two additional beds under an open-sided glass canopy. |
| Rooftop delivery cart | Pack a harvested batch beside the stairs. Carry it downstairs to the café or lab. Each signed delivery pays the market value plus 5 simSOL. |
| Old Industrial Ward | Walk east of the exchange. With a roof project, 250 traded units and 90 simSOL, lease the canal warehouse. The shutter opens onto a freight bench that takes two batches each day for their combined value plus 12 simSOL. |

## Life in Canopy House

Apartment 7B is on the seventh floor. Leave the lease table and head east to the lift, or climb the right-hand stair flight, turn at the window, and take the left flight back to the next hall. Every landing from 1 through 24 is walkable. The last flight opens onto the growing roof. Your position saves mid-climb.

| Floor | What happens there |
| --- | --- |
| 1 | Tessa runs the night desk. The front door opens onto Canopy Quarter. |
| 4 | Neighbors meet in the common kitchen after work and for Autumn Harvest Fest. |
| 7 | Read the lease, sleep, collect keepsakes and make a home. |
| 12 | The listening room hosts the Summer Sunrise Jam. A pass from the archive opens the tape booth. |
| 18 | Find Jax at the repair archive and join the Winter Repair Fair. |
| 21 | In year two, two festival keepsakes and a trusted friend qualify you to restore the commons. A seed exchange supplies seasonal packets. A tape library lets neighbors listen to two original reels. |
| 24 | Rowan tends the sky garden. Spring Bloom Fest leaves flowers in the color you chose. The roof is one flight above. |

Each season lasts ten days. Festivals run on days four through six. Outdoor growth changes with the season. The glasshouse holds its pace through winter. Neighbors remember visits on distinct days and decisions in their personal stories. Partnership and parenthood are optional. After a full year together, a household can welcome a child. Shared meals, music and repair projects shape the family album through childhood, adolescence and adulthood.

The opening illustration comes from the original campaign. The interior and skyline render in 3D. The [public design bible](docs/canon/originals/POTIFY_Master_Key_PUBLIC.txt) records the wider city design.

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
