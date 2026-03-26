  <img src="assets/128x128.svg" alt="Icon Rescissor" width="80">
</div>

# Icon Rescissor

*A Figma plugin that turns raw icons into production-ready components — resize, scale stroke weights, generate size sets, and export tokens in seconds.*


<div align="center">
  <img src="assets/screenshots/ads 1.png" alt="Icon Rescissor — Resize tab with icon selected" width="700">
</div>

---

## Features

- **Three stroke modes** — Preset values from your table, Scale (proportional to icon size with live calculator), or Lock (leave stroke untouched)
- **Auto Layout output** — Generated icon sets land in horizontal Auto Layout frames, not static sections
- **Component Set generation** — Two-step flow converts any icon into a full Figma Component Set with size variants
- **Proportional resize** — Non-square icons scale correctly without distortion
- **Drag to reorder** — reorder size presets by dragging rows in the Presets panel
- **Batch rename with patterns** — define `{size}/{name}`, `{label}/{name}`, or any structure; live preview shows the result before you apply
- **Export JSON & CSS tokens** — Select any number of icons and copy their size and stroke data in one click
- **Library presets** — Built-in stroke tables for Lucide, Phosphor, Tabler, and Heroicons

---

## Installation

1. Open Figma → **Plugins** → **Browse plugins in Community**
2. Search for **Icon Rescissor**
3. Click **Install**

Or run locally:

```bash
git clone https://github.com/your-username/icon-rescissor.git
```

Then in Figma: **Plugins → Development → Import plugin from manifest** → select `manifest.json`.

---

## Usage

### Resize

Select one or more icons, pick a target size from the dropdown, and click **Apply size**.

- **Proportional** — preserves aspect ratio for non-square icons
- **Duplicate** — places a resized copy next to the original instead of resizing in place



### Scale Set

Select a source icon and click **Generate all sizes →** to produce a full icon set in an Auto Layout frame.

**Stroke modes:**

| Mode | Behaviour |
|------|-----------|
| Preset | Uses stroke values from your preset table |
| Scale | Calculates stroke proportionally from a base size and stroke — edit the Base fields or let the plugin sync from your selection |
| Lock | Leaves stroke exactly as-is |

Enable **Component Set** to generate a Figma Component Set with `Size=` variants instead of a plain frame.

<div align="center">
  <img src="assets/screenshots/ads 2.png" alt="Icon Rescissor — Scale Set tab with stroke presets" width="700">
</div>

### Finalize

After generating, use the Finalize section to clean up:

- **Detach & Make Components** — detaches instances and converts each icon to a proper Figma component
- **Rename icons** — applies your rename pattern to all selected icons based on their pixel size

### Rename pattern

Set your naming structure in **Presets → Rename pattern**. Three tokens are available:

| Token | Value |
|-------|-------|
| `{name}` | Base icon name (last segment after `/`) |
| `{size}` | Icon width in px — append `px` directly: `{size}px` → `24px` |
| `{label}` | Label from your preset table (e.g. `Large`) |

A live preview updates as you type. Click token buttons to insert at cursor position.

### Export

Click the **↓** icon in the header to open the Export panel. Select any icons on canvas — the counter updates automatically.

- **Export → JSON** — array of `{ name, size, stroke }` objects
- **Export → CSS tokens** — `:root {}` block with `--icon-{name}-size` and `--icon-{name}-stroke` variables

Both copy directly to clipboard.

<div align="center">
  <img src="assets/screenshots/ads 3.png" alt="Icon Rescissor — Export panel with icons selected" width="700">
</div>

### Presets

Click the **≡** icon to open Presets. Customize size labels, pixel values, and stroke weights. Changes save automatically between sessions.

Switch between **Lucide**, **Phosphor**, **Tabler**, and **Heroicons** to load library-specific stroke tables. Editing any value switches to **Default** mode automatically. Drag rows to reorder sizes.

---

## Preset defaults

| Label  | Size | Stroke |
|--------|------|--------|
| Micro  | 12px | 1.0    |
| Small  | 16px | 1.5    |
| Base   | 20px | 1.8    |
| Medium | 24px | 2.5    |
| Large  | 32px | 2.8    |
| XL     | 40px | 3.2    |
| XXL    | 48px | 4.5    |
| Max    | 56px | 5.2    |

---

## Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

```bash
git clone https://github.com/your-username/icon-rescissor.git
# Import manifest.json into Figma as a development plugin
# Edit code.js and ui.html — Figma hot-reloads on save
```


