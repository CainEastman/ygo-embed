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
- **Error Handling**: Graceful fallbacks for missing cards
- **Customization**: Configurable display options
- **Fast Loading**: Optimized for performance
- **Browser Support**: Works in all modern browsers

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

### CDN Usage (Recommended)
```html
<script type="module">
  import { YGOEmbed } from 'https://cdn.jsdelivr.net/gh/DawnbrandBots/ygo-embed@latest/js/v3/ygo-embed-v3.js';
  const embed = new YGOEmbed();
  embed.init();
</script>
```

### DropInBlog Integration
When integrating with DropInBlog, ensure proper initialization by:

1. Place the YGO Embed script after the DropInBlog content:
```html
<!-- DropInBlog content -->
<div class="dib-post-content">
  <!-- Your blog content with card references -->
</div>

<!-- YGO Embed script -->
<script type="module">
  // Wait for DropInBlog content to be fully loaded
  window.addEventListener('load', () => {
    import { YGOEmbed } from 'https://cdn.jsdelivr.net/gh/DawnbrandBots/ygo-embed@latest/js/v3/ygo-embed-v3.js';
    const embed = new YGOEmbed();
    embed.init();
  });
</script>
```

2. For dynamic content loading, reinitialize after content updates:
```javascript
const embed = new YGOEmbed();
// Call after DropInBlog content updates
embed.init();
```

### Local Installation
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

## Building from Source

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Find the built files in the `dist` directory

## Version History

### v3.56
- Removed hardcoded font-family to inherit from site styles
- Fixed cursor styles for deck list card names and images
- Improved spacing in deck lists
- Fixed blog content spacing issues
- Added specific targeting for deck list elements
- Optimized CSS selectors for better compatibility

### v3.0.0
- Complete rewrite using ES modules
- Added deck list support
- Improved mobile responsiveness
- Added localStorage caching
- New hover preview system

### v2.0.0
- Added card pricing information
- Improved error handling
- Better browser compatibility

### v1.0.0
- Initial release
- Basic card embedding
- Simple hover effects

## Credits

- Card data is retrieved from the [YGOPRODeck API](https://db.ygoprodeck.com/api-guide/)
- Card images are property of Konami

## License

All Rights Reserved

This software is proprietary and confidential. No part of this software may be reproduced, distributed, or transmitted in any form or by any means, without the prior written permission of the copyright holder.

The software is provided "as is", without warranty of any kind, express or implied. 