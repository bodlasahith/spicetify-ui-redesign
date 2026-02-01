# Spicetify Extension — Playbar Toggle + UI Redesign

A single Spicetify extension that replaces the default playbar and adds multiple UI enhancements across the app. It includes a custom playbar, discography carousel, library overlay, and a custom sidebar.

## What’s Included

### 1) Custom Playbar (full replacement)

- Replaces the default Spotify playbar
- Custom controls (play/pause, prev/next, shuffle, repeat, queue, lyrics, PiP, fullscreen)
- Custom progress bar with drag-to-seek
- Custom volume slider with dynamic icons
- Track info popup with clickable title/artist and context menu

### 2) Playbar Toggle (UI rearrangements)

- Toggle button to swap or rearrange built-in controls
- On/off state tracking
- Fully customizable swap/move logic

### 3) Artist Discography Carousel

- Custom horizontal carousel on artist pages
- Numbered chips (1, 2, 3, …) to avoid placeholder album names
- Lazy hydration: album details fetched on-demand with a long delay
- Centralized request controller to reduce 429s
- Optional paged fallback using the public artist albums endpoint

### 4) Custom Library Overlay

- “Browse”/Library overlay with curated category tiles
- Uses live DOM links when available
- Smooth carousel layout for categories

### 5) Custom Sidebar

- Categories for Liked Songs, Playlists, Albums, Podcasts & Shows
- Uses Spotify internal APIs when available
- Falls back to DOM extraction when API access is unavailable
- Searchable and expandable folders

---

## Installation

### Prerequisites

- Node.js + npm
- Spicetify CLI installed and configured

### Setup

1. Copy this folder to your Spicetify extensions directory:
   - Linux/macOS: ~/.config/spicetify/Extensions/spicetify-playbar-toggle
   - Windows: %APPDATA%\spicetify\Extensions\spicetify-playbar-toggle

2. Install dependencies:

   ```bash
   cd spicetify-playbar-toggle
   npm install
   ```

3. Build the extension:

   ```bash
   npm run build
   ```

4. Apply with Spicetify:

   ```bash
   spicetify apply
   ```

5. Restart Spotify

---

## Development

```bash
npm run watch
```

---

## Discography Pipeline (Rate‑limit safe)

All Spotify requests are centralized in src/discographyController.ts to prevent 429s:

- ArtistView (single request)
- Lazy hydration (on click, after long delay)
- Abort on artist change to avoid overlap
- Optional paging via /v1/artists/{id}/albums

---

## Customization

Edit src/app.tsx and modify these functions:

### applyRearrangements()

```ts
function applyRearrangements(): void {
  swapElements('[data-testid="lyrics-button"]', '[data-testid="control-button-queue"]');
  moveElementAfter('[data-testid="pip-toggle-button"]', '[data-testid="fullscreen-mode-button"]');
}
```

### revertRearrangements()

```ts
function revertRearrangements(): void {
  swapElements('[data-testid="control-button-queue"]', '[data-testid="lyrics-button"]');
}
```

### Available button selectors

- [data-testid="lyrics-button"] — Lyrics
- [data-testid="control-button-queue"] — Queue
- [data-testid="pip-toggle-button"] — Mini Player
- [data-testid="fullscreen-mode-button"] — Fullscreen
- [data-testid="control-button-repeat"] — Repeat
- [data-restore-focus-key="device_picker"] — Device Picker

### Available layout helpers

- swapElements(selector1, selector2)
- moveElementAfter(elementSelector, referenceSelector)
- moveElementBefore(elementSelector, referenceSelector)

---

## Build Output

Compiled file: marketplace/playbar-toggle.js

---

## Credits

Inspired by https://www.youtube.com/watch?v=suhEIUapSJQ
