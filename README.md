# YGO Card Embed Script

A JavaScript library for embedding Yu-Gi-Oh! cards and decklists in web pages, with hover effects, card details, and responsive layouts.

## Features

- **Individual Card Embeds**: Display single cards with full details, stats and pricing
- **Deck List Visualization**: Show collections of cards organized by deck section
- **Card Hover Previews**: Preview cards when hovering over card names
- **Mobile-Friendly Design**: Responsive layout that works on all devices
- **Local Caching**: Store card data in localStorage to reduce API requests
- **Batch API Requests**: Efficiently load multiple cards with fewer network calls
- **Error Handling**: Improved resilience with timeout handling and error recovery
- **Memory Management**: Smart cache pruning when storage limits are reached
- **Modular Structure**: Code organized into modules for better maintainability

## Usage

### Individual Card Embedding

To embed a single card, create a paragraph with the following format:

```html
<p>embed::Dark Magician</p>
```

This will be transformed into a detailed card display with image, stats, text and pricing.

### Deck List Embedding

To embed a deck list, use the following format:

```html
<p>deck::main::["Blue-Eyes White Dragon", "Dark Magician x2", "Pot of Greed"]</p>
<p>deck::extra::["Blue-Eyes Twin Burst Dragon", "Hieratic Seal Of The Heavenly Spheres"]</p>
<p>deck::side::["Ash Blossom & Joyous Spring x3"]</p>
```

Valid section types are:
- `main`: Main Deck
- `extra`: Extra Deck
- `side`: Side Deck
- `upgrade`: Upgrade suggestions (no header)

### Card References in Content

To create hover previews in content, wrap card names in double brackets:

```html
<div class="dib-post-content">
  <p>Check out this [[Blue-Eyes White Dragon]] card, it's powerful!</p>
</div>
```

## Installation

### Standard Version
1. Download the latest version of `ygo-embed-v3.js` or choose a specific version
2. Include the script in your HTML:

```html
<script src="path/to/ygo-embed-v3.js"></script>
```

### Modular Version
1. Use the modular version for better code organization and maintenance
2. The `js` directory contains all modules
3. Include the main module in your HTML with type="module":

```html
<script type="module" src="path/to/js/ygo-embed-v3.js"></script>
```

The script automatically initializes when the page loads.

## Module Structure

The modular version is organized into the following modules:

- **Main Entry Point** (`js/ygo-embed-v3.js`): Initializes and coordinates all modules
- **Cache Module** (`js/modules/cache.js`): Handles localStorage operations and cache management
- **API Module** (`js/modules/api.js`): Manages communication with the YGOPRODeck API
- **Card Fetcher** (`js/modules/cardFetcher.js`): Provides functions to fetch card data
- **Hover Preview** (`js/modules/hoverPreview.js`): Implements card hover effects
- **Card Embed** (`js/modules/cardEmbed.js`): Renders individual card displays
- **Decklist Renderer** (`js/modules/decklistRenderer.js`): Renders collections of cards by deck section
- **Content Parser** (`js/modules/contentParser.js`): Converts special markup in content
- **Styles** (`js/modules/styles.js`): Handles CSS loading
- **Constants** (`js/modules/constants.js`): Shared constants used across modules

## Version History

- **v1.0**: Basic card embed and hover functionality
- **v2.0**: Added localStorage caching to reduce API calls
- **v3.0**: Added batch API requests, improved error handling, and memory management for better performance with decklists
- **v3.1**: Restructured code into modules for better organization and maintainability

## How It Works

- **Caching**: Card data is stored in localStorage with a 7-day expiry
- **Batch Loading**: Multiple cards are loaded in batches to reduce API calls
- **Queue System**: Requests are queued and processed in batches for efficiency
- **Mobile Detection**: Different interaction methods for desktop and mobile users
- **Responsive Design**: Adapts to different screen sizes and devices

## Credits

- Card data is retrieved from the [YGOPRODeck API](https://db.ygoprodeck.com/api-guide/)
- Developed for Yu-Gi-Oh! deck and card analysis blogging

## License

This project is available for personal use. Card data and images are property of Konami and subject to their terms of use. 