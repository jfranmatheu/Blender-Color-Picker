# Superhive Market product page: Color Picker

Product page: https://superhivemarket.com/products/color-picker

## Short description / tagline

A fast color picker that pops up right under your mouse in Texture, Vertex and Weight Paint. Free and open source; buy it here to support the developer.

## Build

Build the zip to upload to the store with:

```bash
python store/tools/build.py
```

It writes `store/build/ColorPicker_v<version>_Blender_5.0+.zip` (git ignores that folder). Upload that zip as the product file.

## Images (upload in this order)

1. `images/01_cover.png` (cover / thumbnail)
2. `images/02_free-download.png`
3. `images/03_support.png`
4. `images/04_layouts.png`
5. `images/05_features.png`

## Description

Use [`description.html`](description.html). Superhive only keeps plain body elements (no `<head>`, styles or comments), so the file contains just those: paste the whole file into Superhive's description editor (HTML mode). Most of the content is in images, made with the same look as the rest of the graphics.

Its images load from this repository on GitHub, so they only appear once these files are pushed to `main`.

## Documentation

Use [`docs.html`](docs.html) for the documentation tab or section. Like the description, it's plain body HTML: paste the whole file.

It's generated from [`DOCS.md`](../../DOCS.md): after editing `DOCS.md`, rebuild it from the repository root with:

```bash
python store/tools/build_docs_html.py
```
