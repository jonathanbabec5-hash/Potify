# The rooftop game loop

The baseline game invites a player to plant, water and harvest, then spend fictional proceeds on upgrades. Local persistence gives those choices a consequence on the next visit. The first product question is whether a new player can complete that loop without a guided tour.

The game model owns growth time, plants, inventory and local save state. Rendering and player inputs sit outside the model so tests can simulate the passage of time without a GPU. The 3D environment presents the rooftop and surrounding neighborhood. A local browser save is convenient for solo play. It cannot substantiate an official prize or a cross-device balance.

The next playtest observes five first-time players attempting a first harvest. Record completion and the first point of confusion with consent. The later Roof 7B branch adds lease choices to the economic loop. Its [technical whitepaper](https://github.com/jonathanbabec5-hash/Potify/tree/codex/public-developer-guide/docs/WHITEPAPER.md) covers the branch-specific story implementation.
