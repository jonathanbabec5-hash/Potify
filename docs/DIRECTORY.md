# Repository directory tree

```text
Potify/
├── artifacts/
│   ├── api-server/
│   │   ├── .replit-artifact/
│   │   │   └── artifact.toml
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── .gitkeep
│   │   │   │   └── logger.ts
│   │   │   ├── middlewares/
│   │   │   │   └── .gitkeep
│   │   │   ├── routes/
│   │   │   │   ├── health.ts
│   │   │   │   └── index.ts
│   │   │   ├── app.ts
│   │   │   └── index.ts
│   │   ├── build.mjs
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── mockup-sandbox/
│   │   ├── .replit-artifact/
│   │   │   └── artifact.toml
│   │   ├── src/
│   │   │   ├── .generated/
│   │   │   │   └── mockup-components.ts
│   │   │   ├── components/
│   │   │   │   └── ui/
│   │   │   │       ├── accordion.tsx
│   │   │   │       ├── alert-dialog.tsx
│   │   │   │       ├── alert.tsx
│   │   │   │       ├── aspect-ratio.tsx
│   │   │   │       ├── avatar.tsx
│   │   │   │       ├── badge.tsx
│   │   │   │       ├── breadcrumb.tsx
│   │   │   │       ├── button-group.tsx
│   │   │   │       ├── button.tsx
│   │   │   │       ├── calendar.tsx
│   │   │   │       ├── card.tsx
│   │   │   │       ├── carousel.tsx
│   │   │   │       ├── chart.tsx
│   │   │   │       ├── checkbox.tsx
│   │   │   │       ├── collapsible.tsx
│   │   │   │       ├── command.tsx
│   │   │   │       ├── context-menu.tsx
│   │   │   │       ├── dialog.tsx
│   │   │   │       ├── drawer.tsx
│   │   │   │       ├── dropdown-menu.tsx
│   │   │   │       ├── empty.tsx
│   │   │   │       ├── field.tsx
│   │   │   │       ├── form.tsx
│   │   │   │       ├── hover-card.tsx
│   │   │   │       ├── input-group.tsx
│   │   │   │       ├── input-otp.tsx
│   │   │   │       ├── input.tsx
│   │   │   │       ├── item.tsx
│   │   │   │       ├── kbd.tsx
│   │   │   │       ├── label.tsx
│   │   │   │       ├── menubar.tsx
│   │   │   │       ├── navigation-menu.tsx
│   │   │   │       ├── pagination.tsx
│   │   │   │       ├── popover.tsx
│   │   │   │       ├── progress.tsx
│   │   │   │       ├── radio-group.tsx
│   │   │   │       ├── resizable.tsx
│   │   │   │       ├── scroll-area.tsx
│   │   │   │       ├── select.tsx
│   │   │   │       ├── separator.tsx
│   │   │   │       ├── sheet.tsx
│   │   │   │       ├── sidebar.tsx
│   │   │   │       ├── skeleton.tsx
│   │   │   │       ├── slider.tsx
│   │   │   │       ├── sonner.tsx
│   │   │   │       ├── spinner.tsx
│   │   │   │       ├── switch.tsx
│   │   │   │       ├── table.tsx
│   │   │   │       ├── tabs.tsx
│   │   │   │       ├── textarea.tsx
│   │   │   │       ├── toast.tsx
│   │   │   │       ├── toaster.tsx
│   │   │   │       ├── toggle-group.tsx
│   │   │   │       ├── toggle.tsx
│   │   │   │       └── tooltip.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-mobile.tsx
│   │   │   │   └── use-toast.ts
│   │   │   ├── lib/
│   │   │   │   └── utils.ts
│   │   │   ├── App.tsx
│   │   │   ├── index.css
│   │   │   └── main.tsx
│   │   ├── components.json
│   │   ├── index.html
│   │   ├── mockupPreviewPlugin.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── potify-high-life/
│       ├── .replit-artifact/
│       │   └── artifact.toml
│       ├── public/
│       │   ├── favicon.svg
│       │   └── robots.txt
│       ├── src/
│       │   ├── components/
│       │   │   ├── ui/
│       │   │   │   ├── accordion.tsx
│       │   │   │   ├── alert-dialog.tsx
│       │   │   │   ├── alert.tsx
│       │   │   │   ├── aspect-ratio.tsx
│       │   │   │   ├── avatar.tsx
│       │   │   │   ├── badge.tsx
│       │   │   │   ├── breadcrumb.tsx
│       │   │   │   ├── button-group.tsx
│       │   │   │   ├── button.tsx
│       │   │   │   ├── calendar.tsx
│       │   │   │   ├── card.tsx
│       │   │   │   ├── carousel.tsx
│       │   │   │   ├── chart.tsx
│       │   │   │   ├── checkbox.tsx
│       │   │   │   ├── collapsible.tsx
│       │   │   │   ├── command.tsx
│       │   │   │   ├── context-menu.tsx
│       │   │   │   ├── dialog.tsx
│       │   │   │   ├── drawer.tsx
│       │   │   │   ├── dropdown-menu.tsx
│       │   │   │   ├── empty.tsx
│       │   │   │   ├── field.tsx
│       │   │   │   ├── form.tsx
│       │   │   │   ├── hover-card.tsx
│       │   │   │   ├── input-group.tsx
│       │   │   │   ├── input-otp.tsx
│       │   │   │   ├── input.tsx
│       │   │   │   ├── item.tsx
│       │   │   │   ├── kbd.tsx
│       │   │   │   ├── label.tsx
│       │   │   │   ├── menubar.tsx
│       │   │   │   ├── navigation-menu.tsx
│       │   │   │   ├── pagination.tsx
│       │   │   │   ├── popover.tsx
│       │   │   │   ├── progress.tsx
│       │   │   │   ├── radio-group.tsx
│       │   │   │   ├── resizable.tsx
│       │   │   │   ├── scroll-area.tsx
│       │   │   │   ├── select.tsx
│       │   │   │   ├── separator.tsx
│       │   │   │   ├── sheet.tsx
│       │   │   │   ├── sidebar.tsx
│       │   │   │   ├── skeleton.tsx
│       │   │   │   ├── slider.tsx
│       │   │   │   ├── sonner.tsx
│       │   │   │   ├── spinner.tsx
│       │   │   │   ├── switch.tsx
│       │   │   │   ├── table.tsx
│       │   │   │   ├── tabs.tsx
│       │   │   │   ├── textarea.tsx
│       │   │   │   ├── toast.tsx
│       │   │   │   ├── toaster.tsx
│       │   │   │   ├── toggle-group.tsx
│       │   │   │   ├── toggle.tsx
│       │   │   │   └── tooltip.tsx
│       │   │   └── error-boundary.tsx
│       │   ├── content/
│       │   │   ├── tests/
│       │   │   │   └── devlog.test.mjs
│       │   │   └── devlogRegistry.ts
│       │   ├── game/
│       │   │   ├── tests/
│       │   │   │   └── store.test.mjs
│       │   │   ├── audio.ts
│       │   │   ├── interact.ts
│       │   │   ├── runtime.ts
│       │   │   ├── store.ts
│       │   │   └── world.ts
│       │   ├── hooks/
│       │   │   ├── use-mobile.tsx
│       │   │   └── use-toast.ts
│       │   ├── lib/
│       │   │   └── utils.ts
│       │   ├── pages/
│       │   │   ├── Devlog.tsx
│       │   │   ├── Game.tsx
│       │   │   ├── devlog.css
│       │   │   └── not-found.tsx
│       │   ├── scene/
│       │   │   ├── Actors.tsx
│       │   │   ├── Character.tsx
│       │   │   ├── GameCanvas.tsx
│       │   │   ├── Plants.tsx
│       │   │   ├── Rooftop.tsx
│       │   │   ├── Town.tsx
│       │   │   └── materials.ts
│       │   ├── ui/
│       │   │   ├── HUD.tsx
│       │   │   ├── Menus.tsx
│       │   │   ├── Title.tsx
│       │   │   └── common.tsx
│       │   ├── App.tsx
│       │   ├── index.css
│       │   └── main.tsx
│       ├── components.json
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
├── docs/
│   ├── canon/
│   │   ├── originals/
│   │   │   ├── POTIFY_CITY_COMPLETE_PUBLIC_WEBSITE.zip
│   │   │   ├── POTIFY_City_Master_Key_Offline_PUBLIC.html
│   │   │   ├── POTIFY_City_Public_Build_Log_Starter.zip
│   │   │   ├── POTIFY_Master_Key_PUBLIC.pdf
│   │   │   ├── POTIFY_Master_Key_PUBLIC.txt
│   │   │   ├── POTIFY_PUBLIC_BUILD_IN_PUBLIC_v0.1.md
│   │   │   └── POTIFY_PUBLIC_INTERACTIVE_MASTER_KEY.html
│   │   └── 2026-11-04-public-master-key-extracted.txt
│   ├── marketing/
│   │   ├── assets/
│   │   │   └── 2026-11-08-potify-city-concept.jpg
│   │   ├── originals/
│   │   │   ├── 2026-11-04/
│   │   │   │   ├── potify_game_vertical_story.png
│   │   │   │   └── potify_game_x_teaser.png
│   │   │   └── 2026-11-08/
│   │   │       ├── Alt_Text.txt
│   │   │       └── Post.txt
│   │   ├── 2026-11-08-original-campaign.md
│   │   ├── ORIGINALS.md
│   │   └── SHA256SUMS
│   ├── BUILD-LOG.md
│   ├── DIRECTORY.md
│   ├── MARKETING.md
│   └── WHITEPAPER.md
├── lib/
│   ├── api-client-react/
│   │   ├── src/
│   │   │   ├── generated/
│   │   │   │   ├── api.schemas.ts
│   │   │   │   └── api.ts
│   │   │   ├── custom-fetch.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api-spec/
│   │   ├── openapi.yaml
│   │   ├── orval.config.ts
│   │   └── package.json
│   ├── api-zod/
│   │   ├── src/
│   │   │   ├── generated/
│   │   │   │   ├── types/
│   │   │   │   │   ├── healthStatus.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── api.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── db/
│       ├── src/
│       │   ├── schema/
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── drizzle.config.ts
│       ├── package.json
│       └── tsconfig.json
├── scripts/
│   ├── src/
│   │   └── hello.ts
│   ├── package.json
│   ├── post-merge.sh
│   └── tsconfig.json
├── .gitignore
├── .npmrc
├── .replit
├── .replitignore
├── README.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── replit.md
├── tsconfig.base.json
└── tsconfig.json
```
