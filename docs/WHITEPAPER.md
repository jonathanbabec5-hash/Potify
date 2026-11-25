# Roof 7B and the first playable neighborhood

A life sim earns a player's patience when the game remembers what they did. On Roof 7B, planting, watering and harvesting give the player a reason to return. A first sale connects a crop to choices about the lease and the people downstairs. The first release question is whether a new player can discover that connection unaided.

## What the client owns

The game model owns plots, elapsed growth, inventory, fictional money, upgrades and save validation. Story state records choices and one-time rewards. The UI subscribes to the model. The Three.js scene presents the town and characters independently of the accounting logic. Tests can advance time and simulate choices without rendering a frame.

## Persistence and trade-offs

Browser storage lets one person play without a wallet or remote database. That makes the opening simple and permits offline storage on the same device. Players can edit local state, so a local score is unsuitable as evidence for a prize, a paid entitlement or a cross-device leaderboard. Legacy saves and damaged saves have distinct test cases. Online accounts or competitive rewards would require separate design and evidence.

## Release experiment

Observe five first-time adult players starting from a clean browser. Record where each discovers water, makes a sale and finds the lease story, with their consent. Compare the first two confusing interactions across sessions before expanding the map. Publicly report the tested revision, number who finished, and changes made. Actual completion and retention remain unmeasured.
