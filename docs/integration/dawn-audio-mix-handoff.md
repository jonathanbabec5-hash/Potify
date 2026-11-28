# Dawn playtest: music mix handoff

The owner reported that footsteps were audible on iPhone and requested quieter starting music. Dawn Playtest version 4 was updated with the record mix bus reduced from `0.48` to `0.24` (approximately -6 dB), while the effects bus levels stayed the same. The owner has not yet confirmed the new music balance on iPhone.

The Dawn Site contains a built static snapshot, not the complete source. Its equivalent source change is in the newer audio-enabled game source at `artifacts/potify-high-life/src/game/mixProfile.ts`:

```diff
- record: .48, ambience: .68, step: .41, world: .60, voice: .53, ui: .37,
+ record: .24, ambience: .68, step: .41, world: .60, voice: .53, ui: .37,
```

That file and the approved sound bank are absent from this redesign baseline. Apply the change to the audio agent's actual integration source after reconciling its current mix, rather than adding a second audio system or treating this note as the implementation. Preserve source-level and iPhone fallback behavior, effects settings, license records, and the owner's existing saves. Rebuild the combined version and test music, footsteps, doors and interaction cues on an iPhone before updating the public game.
