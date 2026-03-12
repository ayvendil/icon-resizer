# Icon Resizer — Figma Plugin

A Figma plugin tailored for Lucide-based design systems. Automatically generates all icon sizes with correct stroke weights in one click — no more manual resizing.

![Pipeline](pipeline.png)

---

## Features

- Generate all 8 sizes at once from a single icon
- Correct stroke weight applied automatically per size
- Apply a single size to any selected icon
- Auto-rename icons with a size prefix (e.g. `56/air-vent`)
- Detach instances and convert to components in one click
- Fully customizable presets (size, stroke, title, prefix) via Settings
- Settings are saved between sessions via `figma.clientStorage`
- Works with any icon type

---

## Size Presets (default)

| Title         | Size  | Stroke | Prefix |
|---------------|-------|--------|--------|
| Caption       | 12px  | 1.0px  | 12/    |
| Body          | 16px  | 1.5px  | 16/    |
| Title S       | 20px  | 1.8px  | 20/    |
| Title M       | 24px  | 2.5px  | 24/    |
| Title L       | 32px  | 2.8px  | 32/    |
| Title XL      | 40px  | 3.2px  | 40/    |
| Title XXL     | 48px  | 4.5px  | 48/    |
| Title 4XL     | 56px  | 5.2px  | 56/    |

---

## Installation

> ⚠️ Requires **Figma Desktop App** — does not work in the browser.

1. Download or clone this repository
2. Open Figma Desktop
3. Menu → Plugins → Development → **Import plugin from manifest**
4. Select the `manifest.json` file from the folder
5. Run via Menu → Plugins → Development → **Icon Resizer**

---

## How to use

### Generate all sizes
1. Search for an icon in the Lucide library
2. Select the icon on your canvas
3. Open Icon Resizer
4. Click **Generate all sizes →**
5. All 8 sizes appear in a row next to the original with correct parameters

### Apply a single size
1. Select one or more icons
2. Choose the size from the dropdown
3. Click **Apply to selected**

### Finalize icons
Once all sizes are generated, select them all and use the Finalize section:

1. **Detach & Make Components** — detaches Lucide instances and converts each icon into a standalone component
2. **Add Prefix by Size** — renames each icon based on its size (e.g. `air-vent` → `56/air-vent`). The prefix is determined automatically by matching the icon's width to your presets

### Customize presets
The plugin comes with default presets based on a standard type scale, but you can fully customize them to match your own design system.

1. Click the ⚙ icon in the top right
2. Edit any value in the table — Title, Size (px), Stroke (px) or Prefix
3. Click **Save** — changes apply immediately and persist across sessions
4. Click **Reset defaults** to restore the original values at any time

This means the plugin adapts to any design system, not just Lucide.

---

## Full pipeline

1. Search for an icon in the Lucide library
2. Select the icon
3. Open Icon Resizer → **Generate all sizes →**
4. Select all generated icons → **Detach & Make Components**
5. Select all → **Add Prefix by Size**
6. Place icons into your table ✅

---

## Files

```
icon-resizer/
├── manifest.json
├── code.js
├── ui.html
└── README.md
```

---

## Author

Made by Slava Ksendziuk
