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
