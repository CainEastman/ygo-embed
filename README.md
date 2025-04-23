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
- **Bundled CSS**: Styles are now bundled with JavaScript for simpler deployment
- **Automatic CDN Updates**: Integrated jsDelivr cache purging for instant updates

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

## Building from Source

This project uses esbuild to bundle the modular JavaScript files and CSS into a single distributable file.

### Prerequisites
- Node.js (14.x or higher recommended)
- npm or yarn

### Setup
1. Clone the repository:
   ```
   git clone https://github.com/CainEastman/ygo-embed.git
   cd ygo-embed
   ```

2. Install dependencies:
   ```
   npm install
   ```

### Building
Run the build script:
```
npm run build
```

This will generate two versions in the `dist` directory:
- `ygo-embed-v3.3.min.js`: Minified version for production use (includes CSS)
- `ygo-embed-v3.3.js`: Non-minified version for development/debugging (includes CSS)

### Manual Build Command
If you prefer to run esbuild directly:
```
npx esbuild js/v3/ygo-embed-v3-modular.js --bundle --minify --sourcemap --format=iife --outfile=dist/ygo-embed-v3.3.min.js
```

## Module Structure

The modular version is organized into the following modules:

- **Main Entry Point** (`js/ygo-embed-v3.js`): Initializes and coordinates all modules
- **Cache Module** (`js/v3/modules/cache.js`): Handles localStorage operations and cache management
- **API Module** (`js/v3/modules/api.js`): Manages communication with the YGOPRODeck API
- **Card Fetcher** (`js/v3/modules/cardFetcher.js`): Provides functions to fetch card data
- **Hover Preview** (`js/v3/modules/hoverPreview.js`): Implements card hover effects
- **Card Embed** (`js/v3/modules/cardEmbed.js`): Renders individual card displays
- **Decklist Renderer** (`js/v3/modules/decklistRenderer.js`): Renders collections of cards by deck section
- **Content Parser** (`js/v3/modules/contentParser.js`): Converts special markup in content
- **Styles** (`js/v3/modules/styles.js`): Handles CSS loading
- **Constants** (`js/v3/modules/constants.js`): Shared constants used across modules

## Version History

- **v1.0**: Basic card embed and hover functionality
- **v2.0**: Added localStorage caching to reduce API calls
- **v3.0**: Added batch API requests, improved error handling, and memory management
- **v3.1**: Restructured code into modules for better organization
- **v3.2**: Integrated CSS bundling and automated CDN cache management
- **v3.3**: Fixed decklist rendering with corrected batch API requests

## How It Works

- **Caching**: Card data is stored in localStorage with a 7-day expiry
- **Batch Loading**: Multiple cards are loaded in batches to reduce API calls
- **Queue System**: Requests are queued and processed in batches for efficiency
- **Mobile Detection**: Different interaction methods for desktop and mobile users
- **Responsive Design**: Adapts to different screen sizes and devices

## CDN Usage

You can use jsDelivr CDN to serve the YGO Embed files without hosting them yourself. Since CSS is now bundled with the JavaScript, you only need to include one file:

```html
<!-- JavaScript (Minified) - includes CSS -->
<script src="https://cdn.jsdelivr.net/gh/CainEastman/ygo-embed@main/dist/ygo-embed-v3.3.min.js"></script>
```

### About jsDelivr CDN Cache

This repository includes an automatic cache purging system that ensures the CDN always serves the latest version of your files:

- A GitHub Action workflow runs whenever changes are pushed to the main branch
- The action automatically purges the jsDelivr cache when changes are made to the `js` or `dist` directories
- Cache purging happens immediately after successful pushes to the main branch
- Without this action, jsDelivr typically caches files from the `@main` branch for up to 12 hours

If you need to manually purge the cache, you can:
1. Use the [jsDelivr Purge Tool](https://www.jsdelivr.net/tools/purge)
2. Trigger the purge workflow manually through GitHub Actions

## Credits

- Card data is retrieved from the [YGOPRODeck API](https://db.ygoprodeck.com/api-guide/)
- Developed for Yu-Gi-Oh! deck and card analysis blogging

## License

This project is available for personal use. Card data and images are property of Konami and subject to their terms of use. 