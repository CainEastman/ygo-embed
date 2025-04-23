# YGO Embed - Yu-Gi-Oh! Card & Decklist Embed Script

A modular JavaScript library for embedding Yu-Gi-Oh! cards and decklists in web pages, with hover effects, card details, and responsive layouts.

![Yu-Gi-Oh! Card Example](https://ms.yugipedia.com//thumb/1/16/DarkMagician-SDMY-EN-C-1E.png/300px-DarkMagician-SDMY-EN-C-1E.png)

## Features

- **Card Embeds**: Display single cards with full details, stats and pricing
- **Deck Lists**: Show collections of cards organized by deck sections
- **Hover Previews**: Preview cards when hovering over card names
- **Mobile Support**: Responsive layouts that work on all devices
- **Caching**: LocalStorage cache reduces API requests
- **Modular Structure**: Well-organized code using ES modules

## Usage

### Individual Card Embedding

```html
<p>embed::Dark Magician</p>
```

### Deck List Embedding

```html
<p>deck::main::["Blue-Eyes White Dragon", "Dark Magician x2", "Pot of Greed"]</p>
<p>deck::extra::["Blue-Eyes Twin Burst Dragon", "Hieratic Seal Of The Heavenly Spheres"]</p>
```

### Card References

```html
<div class="dib-post-content">
  <p>Check out this [[Blue-Eyes White Dragon]] card, it's powerful!</p>
</div>
```

## Installation

### ES Module Version (Recommended)
```html
<script type="module" src="path/to/js/ygo-embed-v3.js"></script>
```

### Standard Version
```html
<script src="path/to/dist/ygo-embed-v3.min.js"></script>
```

## Module Structure

The library is organized into the following modules:

- **Main Entry Point** (`ygo-embed-v3.js`): Coordinates all modules
- **Cache Module** (`v3/modules/cache.js`): Handles localStorage operations
- **API Module** (`v3/modules/api.js`): Manages YGOPRODeck API communication
- **Card Fetcher** (`v3/modules/cardFetcher.js`): Provides functions to fetch card data
- **Hover Preview** (`v3/modules/hoverPreview.js`): Implements card hover functionality
- **Card Embed** (`v3/modules/cardEmbed.js`): Renders detailed card displays
- **Decklist Renderer** (`v3/modules/decklistRenderer.js`): Renders collections of cards
- **Content Parser** (`v3/modules/contentParser.js`): Converts special markup
- **Styles** (`v3/modules/styles.js`): Manages CSS loading
- **Constants** (`v3/modules/constants.js`): Shared constants

## Development

1. Clone the repository
2. Navigate to the project directory
3. Open index.html to view the demo

## Credits

- Card data is retrieved from the [YGOPRODeck API](https://db.ygoprodeck.com/api-guide/)
- Card images are property of Konami

## License

MIT License - See LICENSE file for details 