# YGO Embed v3 Module Documentation

A modular JavaScript library for embedding Yu-Gi-Oh! cards and decklists in web pages.

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

## Installation

### CDN Usage (Recommended)
```html
<script type="module">
  import { YGOEmbed } from 'https://cdn.jsdelivr.net/gh/DawnbrandBots/ygo-embed@latest/js/v3/ygo-embed-v3.js';
  const embed = new YGOEmbed();
  embed.init();
</script>
```

### Local Installation
```html
<script type="module" src="path/to/js/ygo-embed-v3.js"></script>
```

### Standard Version
```html
<script src="path/to/dist/ygo-embed-v3.min.js"></script>
```

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

### DropInBlog Integration
For proper integration with DropInBlog's content management system:

1. Ensure the script loads after DropInBlog content:
```html
<!-- DropInBlog content container -->
<div class="dib-post-content">
  <!-- Blog content with card references -->
  <p>Check out this [[Dark Magician]] card!</p>
</div>

<!-- YGO Embed initialization -->
<script type="module">
  // Initialize after page load
  window.addEventListener('load', () => {
    import { YGOEmbed } from 'https://cdn.jsdelivr.net/gh/DawnbrandBots/ygo-embed@latest/js/v3/ygo-embed-v3.js';
    const embed = new YGOEmbed();
    embed.init();
  });
</script>
```

2. For dynamic content updates:
```javascript
// After DropInBlog content updates
const embed = new YGOEmbed();
embed.init();
```

This ensures that card references are properly processed after DropInBlog has finished rendering its content.

## Module Structure

The library is organized into the following modules:

- **Main Entry Point** (`ygo-embed-v3.js`): Coordinates all modules
- **Cache Module** (`modules/cache.js`): Handles localStorage operations
- **API Module** (`modules/api.js`): Manages YGOPRODeck API communication
- **Card Fetcher** (`modules/cardFetcher.js`): Provides functions to fetch card data
- **Hover Preview** (`modules/hoverPreview.js`): Implements card hover functionality
- **Card Embed** (`modules/cardEmbed.js`): Renders detailed card displays
- **Decklist Renderer** (`modules/decklistRenderer.js`): Renders collections of cards
- **Content Parser** (`modules/contentParser.js`): Converts special markup
- **Styles** (`modules/styles.js`): Manages CSS loading
- **Constants** (`modules/constants.js`): Shared constants

## Development Setup

1. Clone the repository:
```bash
git clone https://github.com/DawnbrandBots/ygo-embed.git
cd ygo-embed
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Browser Compatibility

The library is compatible with all modern browsers that support ES modules:

- Chrome 61+
- Firefox 60+
- Safari 10.1+
- Edge 16+
- Opera 48+

For older browsers, use the standard version which includes necessary polyfills.

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