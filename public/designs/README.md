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

## Kita's tote and keychain line (coming soon, not buyable)

Designs by Kita, approved by Josias. These are spec files only: no `products` rows, so nothing shows in the shop
or can be checked out. `price` stays `"TBD"` until Josias sets it (the `products.price` column needs a number).
Material, dimensions, weight, care, vendor, MOQ, lead time and ship date are `"TBD"` until a vendor proof is in.
No ship date goes in public copy before that, and no Curv name, logo or photos anywhere.

| File | Product | SKU prefix | Variants | Slug |
|------|---------|-----------|----------|------|
| `kita-tote.json` | Vibin Tote | VB-BAG-TOTE | Chocolate / Cream VIBIN | `vibin-tote-chocolate` |
| `kita-tote-chains.json` | Vibin Tote Chain | VB-ACC-CHAIN | Gold, Silver, Diamond | `vibin-tote-chain` |
| `kita-cream-keychain.json` | Vibin Keychain, Cream | VB-KEY-CRM | Cream | `vibin-keychain-cream` |
| `kita-plush-bubble-keychain.json` | Vibin Plush Bubble Keychain | VB-KEY-PLSH | 12 colors | `vibin-plush-bubble-keychain` |
| `kita-leather-bubble-keychain.json` | Vibin Leather Bubble Keychain | VB-KEY-LTHR | Chocolate, Tan, Black | `vibin-leather-bubble-keychain` |
| `kita-star-keychain.json` | Vibin Star Keychain | VB-KEY-STAR | Metal, Clear Acrylic | `vibin-star-keychain` |
| `kita-magnetic-charms.json` | Vibin Magnetic Charms | VB-ACC-MAG | TBD | `vibin-magnetic-charms` |

Glitter keychains are on hold, so they have no file yet.
