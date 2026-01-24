# Playbar Control Extension

A combined Spicetify extension that adds a toggle button to the playbar which controls UI rearrangements.

## Features

- **Toggle Button** - Interactive circle icon in the playbar
- **UI Rearrangement** - Click the toggle to swap or rearrange playbar buttons
- **Default Behavior** - Swaps Lyrics and Queue buttons when toggled
- **State Tracking** - Green when active, gray when inactive
- **Revertible** - Toggle back to original layout
- **Fully Customizable** - Easy to modify which buttons get rearranged

## Installation

### Prerequisites

- Node.js and npm installed
- Spicetify CLI installed and configured

### Setup

1. Copy this folder to your Spicetify extensions directory:
   - Linux/macOS: `~/.config/spicetify/Extensions/spicetify-playbar-toggle`
   - Windows: `%APPDATA%\spicetify\Extensions\spicetify-playbar-toggle`

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

5. Restart Spotify to see the changes

## Development

To develop with hot reload:

```bash
npm run watch
```

## How It Works

- **Toggle OFF** (gray): Original playbar layout
- **Toggle ON** (green): UI rearrangements applied (swaps Lyrics ↔ Queue)
- **Click** to switch between states

## Customization

Edit `src/app.tsx` and modify these functions:

### `applyRearrangements()`

Called when toggle is turned ON. Add your customizations here:

```typescript
function applyRearrangements(): void {
  // Add more swaps or moves
  swapElements('[data-testid="lyrics-button"]', '[data-testid="control-button-queue"]');
  moveElementAfter('[data-testid="pip-toggle-button"]', '[data-testid="fullscreen-mode-button"]');
}
```

### `revertRearrangements()`

Called when toggle is turned OFF. Revert changes to original state:

```typescript
function revertRearrangements(): void {
  // Swap back
  swapElements('[data-testid="control-button-queue"]', '[data-testid="lyrics-button"]');
}
```

## Available Button Selectors

- `[data-testid="lyrics-button"]` - Lyrics
- `[data-testid="control-button-queue"]` - Queue
- `[data-testid="pip-toggle-button"]` - Mini Player
- `[data-testid="fullscreen-mode-button"]` - Fullscreen
- `[data-testid="control-button-repeat"]` - Repeat
- `[data-restore-focus-key="device_picker"]` - Device Picker

## Available Functions

### `swapElements(selector1, selector2)`

Swaps the positions of two elements

### `moveElementAfter(elementSelector, referenceSelector)`

Moves an element to appear after another element

### `moveElementBefore(elementSelector, referenceSelector)`

Moves an element to appear before another element

## Build Output

The compiled extension is output to the `marketplace/` directory as `playbar-toggle.js`.
