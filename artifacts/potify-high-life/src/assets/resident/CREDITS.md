# Canopy House resident

The adult player, new-resident portrait, wardrobe and character viewer load the same editable glTF 2.0 model. The model contains its joint hierarchy, inverse bind matrices, UVs, materials and textures. The garment dye is named `Shirt` and the complexion material is named `Skin`. Phone gameplay uses precomputed lower-detail indices in the same model, with the same textures, bones and saved colors. The game animates the joints in `scene/Resident.tsx`.

The human topology, face and hand weights, skin, eyes, brows, hair, lashes, workwear and shoes derive from the MakeHuman core collection. Core assets are CC0. POTIFY's adaptation includes the fitted knit cap and its woven seedling label, dyed workwear, a relaxed hand and mouth pose, stubble, a reduced joint palette and geometry optimized for gameplay.

- [MakeHuman core asset license](https://static.makehumancommunity.org/about/license.html)
- [Official system assets](https://static.makehumancommunity.org/assets/assetpacks/makehuman_system_assets.html)
- [MakeHuman base mesh and shape targets](https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data)
- [Core asset data conversion used for fitting](https://github.com/makehuman-js/makehuman-data/tree/e5d1a42cb469025a6d2b3ecea3e0252e6feccc1f/public/data)

Open `?resident=1` to inspect the face, rotate the outfit or see the gait. Use Wardrobe in gameplay to save a shirt and complexion. Run `npm run build:offline` followed by `node --experimental-strip-types scripts/profile-mobile.mjs --resident --check` to exercise the visible model across the five profiling routes.

The swept crop, coily crop and ponytail use the MakeHuman CC0 system hair (short02, afro01 and ponytail01). Each attachment fits this head in joint-local coordinates with baked handheld triangle indices. The cap uses fitted hair at its rim and the ponytail exits at the back. Test an uncovered style in third person with the additional profiling flag `--hair=tail`.
