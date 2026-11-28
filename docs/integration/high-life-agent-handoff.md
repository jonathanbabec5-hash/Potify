# High Life integration handoff

This integration starts from `redesign/first-harvest-neighborhood` at `5ccd0a1b15fe6b2dc36967f8477ae629cdd60e3a`. The source of the playable game in this repository is `artifacts/potify-high-life/`. This branch is a development source, not proof that a Site, Replit project, or public game has been deployed.

## Included agent work

| Work | Original source revision | Notes |
| --- | --- | --- |
| Pause guide | `8945f14c2ca3b9d19ecfcc299f2546e3ce1958ef` | Uses the existing objective selector and leaves overlay preferences intact. |
| Crop status | `2c684335007a13d5c75d163f625b94652cc1bdcf` | Status markers derive from unrounded plot values. |
| First rooftop job confirmation | `3e80571f64590fc560e11c785c5c05490f1eea95` | Confirms the player's first project choice. |
| Roofworks/Rootworks connection | `652e41346eae3aad009eb7995e25ebda2a23ab28`, `7846a0a4043845b360c8e8330adf974df200fd59` | Preserves Roofworks as the service and Rootworks as the shop. |
| Apartment morning art | `05403689ca214755199df5db93c3a12a7f08af14` | Adds a warmer morning window and room details. |

These revisions are integrated by content; if integrating another agent's branch, compare its changes to this list instead of reapplying work blindly. `Menus.tsx` contains changes from several agents: preserve the pause guide, bed panel, and Roofworks changes during conflict resolution. No changes here touch save schema, economy math, or audio files.

## Still separate

A newer sound and story playtest exists separately. Its compiled assets are not a substitute for its editable source, and this integration does not claim to include, validate, or deploy that work. The sound agent should integrate the approved source and licenses against the current game revision. Keep this development source aligned with the tested playtest before considering a release.

## Validation and outstanding review

Combined source: production build, TypeScript, 30 game tests and the pause-guide component check passed. A development-server shutdown produced a dependency-scan warning during the component check. Browser-based opening and first-work-slip checks could not run because the local Chromium executable is unavailable. Check mobile 390×844 layout, desktop keyboard focus/Escape and the pause guide's map button, crop-tag legibility, the first-job choice, and apartment visuals on a real device or accessible browser before release. Test sound separately with the sound agent; do not infer it works from this integration.
