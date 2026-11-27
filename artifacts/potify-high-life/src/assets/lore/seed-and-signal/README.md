# Mira’s Moonmint sleeve

Mira keeps folded seed packets on the counter at Seed & Signal in POTIFY City. The counter model and the two inspection views use the same Moonmint printing, worn corner and graphite stroke. As Mira explains on the eighth-floor notice, she writes the cultivar on both ends. The small pencil lettering follows that practice. The closed packet measures approximately 11.6 × 15.5 cm. Its label faces up, and its shop-stamp end points toward local −Z in glTF.

| File | Use in the game |
| --- | --- |
| `mira-packet.glb` | Folded counter prop, Y-up, with three embedded JPEG textures. One mesh, four material primitives and 1,116 triangles. |
| `mira-packet-folded.webp` | 960 × 640 inspection view of the closed sleeve on the shop counter. |
| `mira-packet-open.webp` | 960 × 640 inspection view after the player turns the sleeve and opens the other end. |
| `packet-unfold.wav` | Original 0.56-second folded-paper sound, 32 kHz mono PCM. |

## Art and sound source

The packet mesh, fictional botanical engraving, ink stamp, paper fibres, graphite and counter grain were made for *$POTIFY: A Wonderful High Life*. The stills come from the authored Blender scene. The packet uses URW Bookman and DejaVu type rasterized into its printing. The sound is synthesized from an original seeded noise-and-filter recipe.

From the root of the repository:

```sh
blender -b -t 4 -P art-source/seed-and-signal/render_packets.py
python3 art-source/seed-and-signal/make-paper-sound.py
```

The render was produced with Blender 4.3.2 and its distribution’s Pillow and NumPy modules. The font paths at the top of the script correspond to Debian’s `fonts-urw-base35` and `fonts-dejavu-core` packages.
