# YGO Card Embed Script - Technical Planning

## Technology Stack

### Core Technologies
- **JavaScript**: Vanilla JS with ES6+ features
  - ES Modules for code organization
  - Async/await for async operations
- **CSS**: Custom styling with responsive design principles
- **HTML**: Dynamic HTML generation for card displays

### External Dependencies
- **YGOPRODeck API**: Source for card data, images, and pricing
  - API Base URL: `https://db.ygoprodeck.com/api/v7`
  - Documentation: [YGOPRODeck API Guide](https://db.ygoprodeck.com/api-guide/)

### Storage
- **LocalStorage**: Client-side persistent cache for card data
  - Cache structure: `{timestamp, cards: {cardName: cardData}}`
  - Cache expiry: 7 days
  - Automatic cache pruning when storage limits are reached
  - Cache versioning with `CACHE_VERSION` for future updates

### No External Libraries
- The project intentionally avoids external libraries to:
  - Minimize load time and dependencies
  - Ensure compatibility with all platforms
  - Keep the codebase simple and maintainable

## Architecture

### Modular Structure
The codebase is organized into modules following the single responsibility principle:

1. **Main Module** (`ygo-embed-v3.js`)
   - Entry point for the application
   - Coordinates all other modules
   - Sets up the shared context

2. **Cache Module** (`modules/cache.js`)
   - Handles localStorage operations
   - Manages data persistence
   - Implements cache expiry and pruning

3. **API Module** (`modules/api.js`)
   - Handles communication with YGOPRODeck API
   - Uses GET requests for card data fetching
   - Implements error handling and timeouts
   - Manages request queue and batching

4. **Card Fetcher Module** (`modules/cardFetcher.js`)
   - Provides functions to fetch individual cards
   - Implements batch fetching
   - Integrates with cache and API modules

5. **Hover Preview Module** (`modules/hoverPreview.js`)
   - Implements card hover functionality
   - Handles desktop and mobile interactions
   - Manages hover positioning

6. **Card Embed Module** (`modules/cardEmbed.js`)
   - Renders detailed card displays
   - Formats card data for presentation
   - Generates HTML for card stats and info

7. **Decklist Renderer Module** (`modules/decklistRenderer.js`)
   - Renders collections of cards by deck section
   - Handles card quantities in multiple formats
   - Creates grid layouts for decks
   - Implements smart card name matching:
     * Name normalization with special character handling
     * Two-stage matching (exact -> partial)
     * Length-based scoring for partial matches
   - Provides clear error visualization
   - Returns processed card data for potential reuse

8. **Content Parser Module** (`modules/contentParser.js`)
   - Converts special markup in content
   - Transforms paragraphs into interactive elements
   - Handles card name variations and case sensitivity
   - Supports multiple quantity formats
   - Provides detailed error messages
   - Implements graceful error recovery

9. **Styles Module** (`modules/styles.js`)
   - Ensures required CSS is loaded
   - Manages style dependencies

10. **Constants Module** (`modules/constants.js`)
    - Defines shared constants
    - Centralizes configuration values
    - Improves maintainability

### Code File Guidelines
- Each module should maintain a single responsibility
- All code files should be 500 lines or less for maintainability
- When a module approaches the line limit, consider further decomposition
- Consistent use of constants across modules
- Standardized error handling and logging approaches

### Component Flow
1. Main module initializes and loads other modules
2. Parse page for card references on load
3. Check localStorage cache for existing data
4. Queue missing cards for batch API requests
5. Process card names with smart matching
6. Render cards with error handling
7. Handle interactive events (hover, click)
8. Save card data to cache periodically and on unload

## Optimization Strategy

### Request Optimization
- Batch API requests to minimize network calls
- Utilize POST requests for multi-card queries
- Implement request timeouts (10s) and abort controllers
- Smart request queuing system with batch processing

### Rendering Optimization
- Use DocumentFragments for batch DOM updates
- Defer non-critical rendering
- Minimize reflows and repaints
- Progressive loading based on viewport visibility

### Cache Management
- Version-tagged cache for easy invalidation
- Smart pruning when localStorage limit is reached (remove oldest 50%)
- Background saving with interval (60s) to avoid blocking UI
- Save on page unload to preserve latest state

## Browser Compatibility

### Target Browsers
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 16+
- Mobile Safari and Chrome for Android

### Feature Requirements
- ES6 support (async/await, template literals)
- ES Modules (import/export)
- localStorage API
- Fetch API with AbortController
- CSS Grid/Flexbox

## Development Workflow

### Versioning Strategy
- Semantic versioning (MAJOR.MINOR.PATCH)
- Version reflected in cache keys for proper invalidation
- Current version: v3.4
- Changes tracked in version history:
  - v3.4: Enhanced deck list rendering with smart card matching
  - v3.3: Switched to GET requests for API calls
  - v3.2: Integrated CSS bundling and automated CDN cache management

### Build Process
- Use esbuild for bundling modules and CSS into distributable files
- CSS is now bundled with JavaScript for simpler deployment
- Build both minified and non-minified versions with CSS included
- Include source maps for debugging
- Maintain both modular version (for development) and bundled version (for distribution)
- Build script: build-esbuild.cjs (Node.js)
- Automated jsDelivr cache purging on file changes

### Testing Strategy
- Manual testing across browsers
- Sample pages for each feature
- Error scenario testing
- Mobile device testing

### Deployment
- Provide bundled version with integrated CSS
- Host on CDN (jsDelivr) for production use
- Automatic cache purging for instant updates
- Document integration process for various CMS platforms

## Future Extensibility

### API Design
- Organized into modules for easier extension
- Allow for configuration options
- Design with extensibility in mind

### Potential Modules
- Card search functionality
- Deck builder integration
- Advanced filtering and sorting
- Card collection management

## Resources & References

### Yu-Gi-Oh! Resources
- [Official Yu-Gi-Oh! Database](https://www.db.yugioh-card.com/)
- [YGOPRODeck](https://ygoprodeck.com/)
- [Yu-Gi-Oh! Wikia](https://yugioh.fandom.com/)

### Technical References
- [MDN Web Docs](https://developer.mozilla.org/)
- [Web Performance Optimization](https://web.dev/performance-optimizing-content-efficiency/)
- [localStorage Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API)
- [JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) 