# Vibin Apparel — Design Spec Files

This folder contains structured design specification files (JSON) for every clothing product in the SS26 Drop 01 collection.

## Files

| File | Product | Price | Slug |
|------|---------|-------|------|
| `pullover-hoodie.json` | Vibin Pullover Hoodie | $75 | `pullover-hoodie` |
| `zip-up-hoodie.json` | Vibin Zip-Up Hoodie | $85 | `zip-up-hoodie` |
| `tech-shorts.json` | Vibin Tech Shorts | $45 | `tech-shorts` |
| `cargo-shorts.json` | Vibin Urban Cargo Shorts | $65 | `cargo-shorts` |
| `joggers.json` | Vibin Joggers | $65 | `joggers` |
| `snapback.json` | Vibin Snapback Cap | $35 | `snapback` |

## Schema

Each file includes:
- `product` — full product name
- `sku_prefix` — SKU naming convention
- `collection` — drop/season
- `fabric` — material composition and weight
- `fit` — silhouette description
- `sizes` — available sizes
- `colorways` — name, hex, and Pantone reference per colorway
- `branding` — placement, technique, artwork, size, and color for every logo hit
- `pockets` — pocket types, count, and hardware
- `mockup_views` — required angles for product photography/mockups
- `price` / `compare_price` — retail pricing
- `slug` — URL slug matching Supabase `products` table

## Kita's line (coming soon, not buyable)

Designs by Kita (a director, so her calls are final). On Nov 19, 2026 she posted her 23 picks, numbered 01 to 23,
and Josias said to add all of them. Spec files only: no `products` rows, no product page, no Add to Bag.
`price` stays `"TBD"` until Josias sets it. Material, dimensions, weight, care, vendor, MOQ, lead time and ship date
are `"TBD"` until a vendor proof is in. No ship date in public copy before that, and no Curv name, logo or photos anywhere.

Photos: Kita's files come by email as `kita-NN.webp`, matching her numbers (`photo_slots` in each file). A photo goes
in `public/products/<slug>/` and its name goes in `images` (the first one is the Shop tile). **A piece with no photo
stays off /shop**, so no tile is ever blank. 09 is the cream keychain on the chocolate tote, so it is the cream
keychain's second photo; 11 to 13 are the one plush keychain in 12 colors.

/shop shows them under Totes, Keychains, Charms and Lanyards, after Top Picks.

| Kita # | File | Product | Variants | Slug |
|------|------|---------|----------|------|
| 01 | `kita-tote.json` | Vibin Tote, Chocolate | Chocolate / Cream VIBIN | `vibin-tote-chocolate` |
| 02 | `kita-tote-lime.json` | Vibin Tote, Lime | Lime / Black VIBIN | `vibin-tote-lime` |
| 03 | `kita-tote-plum.json` | Vibin Tote, Plum | Plum / Fuchsia VIBIN | `vibin-tote-plum` |
| 04 | `kita-tote-burgundy.json` | Vibin Tote, Burgundy | Burgundy / Black VIBIN | `vibin-tote-burgundy` |
| 05 | `kita-tote-all-burgundy.json` | Vibin Tote, All Burgundy | All Burgundy / Black VIBIN | `vibin-tote-all-burgundy` |
| 06 | `kita-tote-black.json` | Vibin Tote, Black | Black / White VIBIN | `vibin-tote-black` |
| 07 | `kita-tote-royal-blue.json` | Vibin Tote, Royal Blue | Royal Blue / Sky Blue VIBIN | `vibin-tote-royal-blue` |
| 08, 09 | `kita-cream-keychain.json` | Vibin Bubble Keychain, Cream | Cream | `vibin-keychain-cream` |
| 10 | `kita-inverted-bubble-keychain.json` | Vibin Bubble Keychain, Inverted | Chocolate / Cream | `vibin-bubble-keychain-inverted` |
| 11, 12, 13 | `kita-plush-bubble-keychain.json` | Vibin Plush Bubble Keychain | Black, White, Brown, Pink, Leopard Print, Lime Green, Zebra Print, Red, Yellow, Purple, Gold, Silver | `vibin-plush-bubble-keychain` |
| 14 | `kita-leather-bubble-keychain.json` | Vibin Leather Bubble Keychain | Chocolate, Tan, Black | `vibin-leather-bubble-keychain` |
| 15 | `kita-pin-charm-gold.json` | Vibin Safety Pin Charm, Gold | Gold | `vibin-pin-charm-gold` |
| 16 | `kita-pin-charm-silver.json` | Vibin Safety Pin Charm, Silver & Rose Gold | Silver, Rose Gold | `vibin-pin-charm-silver` |
| 17 | `kita-pin-charm-chocolate.json` | Vibin Safety Pin Charm, Chocolate & Black | Chocolate / Black | `vibin-pin-charm-chocolate` |
| 18 | `kita-pin-charm-glam.json` | Vibin Safety Pin Charm, Glam Beads | Glam Beads | `vibin-pin-charm-glam` |
| 19 | `kita-pin-charm-crystal-tag.json` | Vibin Safety Pin Charm, Crystal with Tag | Crystal / Tag | `vibin-pin-charm-crystal-tag` |
| 20 | `kita-pin-charm-crystal.json` | Vibin Safety Pin Charm, Crystal | Crystal | `vibin-pin-charm-crystal` |
| 21 | `kita-lanyard-chain.json` | Vibin Chain Phone Lanyard | Gold, Black, Silver, Rose Gold | `vibin-lanyard-chain` |
| 22 | `kita-lanyard-tether.json` | Vibin Phone Tether Lanyard | Standard | `vibin-lanyard-tether` |
| 23 | `kita-lanyard-spring.json` | Vibin Lanyard, Spring | Spring | `vibin-lanyard-spring` |
| not in her 23 | `kita-tote-chains.json` | Vibin Tote Chain | Gold, Silver, Diamond | `vibin-tote-chain` |
| not in her 23 | `kita-star-keychain.json` | Vibin Star Keychain | Metal, Clear Acrylic | `vibin-star-keychain` |
| not in her 23 | `kita-magnetic-charms.json` | Vibin Magnetic Charms | Standard | `vibin-magnetic-charms` |

Tote Chain, Star Keychain and Magnetic Charms came before her 23 picks. They stay as files, hidden until they have a photo.
Glitter keychains are on hold, so they have no file yet.

## Josias' Top picks (coming soon, not buyable)

Ranked by Josias on Nov 18, 2026. Spec files only: no `products` rows, so there is no price, no product page and
no Add to Bag. They show on /shop under "Top Picks" with a "Price coming soon" label and a notify-me box.
Every image is a mockup and is labeled as one. A file goes in `public/products/<slug>/` and its name goes in
`images`. Until then the tile shows "Photo coming soon".

| File | Product | Slug | Photos needed |
|------|---------|------|---------------|
| `top-gasoline-hoodie.json` | Vibin Hoodie, Gasoline Turquoise | `vibin-hoodie-gasoline` | turquoise hoodie mockup |
| `top-move-different-tee.json` | Move Different Tee | `move-different-tee` | Move Different tee mockup |
| `top-windbreaker.json` | Vibin Windbreaker | `vibin-windbreaker` | windbreaker mockup |
| `top-first-layer-kit.json` | First Layer Kit | `first-layer-kit` | box inside, box lid, box lifestyle |

Also from the Top picks, wired but waiting on their files: the Tech Short clean back view
(`public/products/tech-short/tech-short-back-clean.webp`, never the v1 back with the flap) and the Drop 01 flatlay
as the /drop/01 hero (`public/drop01/flatlay-hero.webp`). Tags / QR stay as hang-tag detail and the favicon is
not a product.
