# Writing for POTIFY City

In *$POTIFY: A Wonderful High Life*, you are the new adult rooftop grower at Canopy House. You live in Apartment 7B on floor seven. The growing roof is reached by lift R or the last flight above the sky garden on 24. In directions, name the place a player needs to reach. “Read the lease on the desk in Apartment 7B” gives someone a room and an object to look for.

The November campaign asked one question a player could answer through work: what will the first harvest buy? Keep the glasshouse and delivery cart equally meaningful. Extra beds give one neighbor a reason to come upstairs. A cart gives the grower a reason to learn someone else’s route. Both choices can leave a trace long after the first receipt. [Original campaign materials](marketing/ORIGINALS.md)

## What residents know

| Resident | What belongs in their conversation |
| --- | --- |
| Tessa Bloom | The night desk, the common kitchen and who still needs supper after a shift. |
| Mira | The packets she labels at Seed & Signal, the orders she recognizes and the people who carry them. |
| Moss | How soil changes and why somebody once repaired a tool a particular way. |
| Jun | Low Tide, its last customer, the house recording and the sounds that travel between floors. |
| Jax Quarry | Which repair lasted, which one failed and who taught the next person to fix it. |
| Rowan Pike | The view from the rail, a crop remembered from last season and friendly rivalry between roofs. |

Give a neighbor one observation they could have made themselves. Let a player who keeps their own company discover the city, too. When writing a board notice, choose a signer, an actual local need and the point at which that notice should change.

## Use the larger POTIFY universe with care

The published opening of *The First Cycle* follows a cultivator’s habit of observing small changes. The *From Seed to Smoke* field card carries that into a simple question about what the reader will recognize tomorrow. In the game, that can become a return visit, a journal drawing or something a neighbor remembers. The title of Book II is *The Soil Remembers*. The house recording is *The Soil Remembers (Grow Room Version)*. Use the existing music asset and keep the book and song credits distinct. [First Cycle edition](https://github.com/jonathanbabec5-hash/potify-first-cycle-public-edition/tree/76c38a7629db38130de6a263a75cba02d578a022/public) · [Public world bible](canon/originals/POTIFY_Master_Key_PUBLIC.txt)

Let **Seed → Soil → Solana** appear on objects that somebody in the city had a reason to make or keep. Ordinary storefront orders use fictional simSOL. A new player can appreciate the story, the music and an evening with the neighbors entirely within the game.

## Bring one story change to review

1. Name the room, the resident and what the player is there to do. Identify the source as a published work, a game event or a proposal.
2. Pick one observable consequence. Look for a saved first choice, visit, festival memory or completed errand before adding new progress fields. [Story](../artifacts/potify-high-life/src/game/story.ts) · [House life](../artifacts/potify-high-life/src/game/house.ts) · [Game state](../artifacts/potify-high-life/src/game/store.ts)
3. Put the detail where it can be noticed from the higher third-person camera with guidance hidden. Offer an intentional inspection for close reading. Keep essential dialogue readable with audio muted. [Interaction targets](../artifacts/potify-high-life/src/game/towerWorld.ts) · [Local notices](../artifacts/potify-high-life/src/game/notices.ts)
4. Review a normal errand, an optional discovery, a second inspection and a reloaded save. Check that the first sale and both upgrades still make sense. For new art or audio, measure the affected route on a phone against the 30 FPS target.
5. Public development notes can show the craft, the setting and a player’s ordinary actions. Keep puzzle solutions, hidden trigger orders and unreleased story answers in the owner’s design notes.
