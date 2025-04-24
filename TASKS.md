# YGO Embed Script - Tasks & Enhancements

## Critical Fixes

- [x] **Fix Decklist API Issues**: Resolve error "Failed to load card" in main/extra/upgrade decks
  - [x] Debug API call parameters and formatting
  - [x] Improve case-insensitive card name matching
  - [x] Add fallback alternative card name lookup
  - [x] Implement card alias handling for OCG/TCG differences

- [x] **Timeout Handling**: Improve resilience when API is slow or unavailable
  - [x] Add better visual feedback during loading
  - [x] Create graceful fallback for when cards can't be loaded

## Performance Optimizations

- [x] **Throttle Event Handlers**:
  - [x] Add debounce to scroll events
  - [x] Implement throttling for mousemove events

- [x] **Lazy Loading**:
  - [x] Only load card images when they enter viewport
  - [x] Implement progressive loading for decklists (load visible cards first)

- [x] **DOM Operation Batching**:
  - [x] Use DocumentFragment for batch DOM updates
  - [x] Optimize CSS reflows during decklist rendering

- [x] **Code Organization**:
  - [x] Restructure into modular components
  - [x] Use ES modules for better maintainability
  - [x] Extract reusable functions into dedicated modules
  - [x] Remove unnecessary contentParser module
  - [ ] Standardize the use of constants across all modules
  - [ ] Consolidate duplicate event listeners for page unload

## Features to Add

- [x] **Card Type-Based Styling**:
  - [x] Different background colors based on card type (Monster, Spell, Trap)
  - [ ] Visual indicators for card rarity

- [ ] **Export Functionality**:
  - [ ] Add button to export deck as text format
  - [ ] Create shareable URL for decklists

- [ ] **Card Comparison**:
  - [ ] Allow side-by-side comparison of two cards
  - [ ] Compare stats between cards

- [ ] **Search Integration**:
  - [ ] Add search field to lookup cards
  - [ ] Autocomplete for card names

- [x] **Mobile Enhancements**:
  - [x] Improve tap interactions
  - [x] Add long-press functionality for mobile
  - [x] Better card preview on small screens

- [x] **Configuration Options**:
  - [x] Make card preview size/style configurable
  - [x] Allow custom CSS theming

## Testing & Maintenance

- [x] **Cross-Browser Testing**:
  - [x] Test on Chrome, Firefox, Safari, Edge
  - [x] Verify mobile browser compatibility

- [x] **Error Monitoring**:
  - [x] Add better error reporting
  - [x] Create analytics for tracking usage

- [x] **Documentation**:
  - [x] Create full API documentation
  - [x] Add more usage examples
  - [x] Document modular structure

- [ ] **Bundle & Distribution**:
  - [x] Create minified production version
  - [x] Generate source maps
  - [x] Set up proper versioning
  - [x] Implement esbuild bundling process
  - [x] Create build scripts for automation

## Long-Term Plans

- [ ] **Card Set Integration**:
  - [ ] Show which sets a card belongs to
  - [ ] Display set symbols

- [ ] **Ruling Integration**:
  - [ ] Display official rulings for cards
  - [ ] Link to ruling sources

- [ ] **Localization**:
  - [ ] Support multiple languages
  - [ ] OCG/TCG naming variants

## Active Issues

### Decklist Rendering Bug (High Priority)
- **Issue**: Decklists not rendering on live site using v3 bundled file
- **URL**: https://gatheringgames.co.uk/community/blog/yu-gi-oh-blue-eyes-white-destiny-structure-deck-beginners-guide
- **Context**: Introduced in v3 when adding batch API calls
- **Status**: Fixed in v3.3
- **Fix Details**: 
  - Changed batch API requests from POST to GET
  - Fixed API endpoint URL construction with multiple fname parameters
  - Removed duplicate constant declarations
  - Updated module imports to use proper constant structure
- **Changes Made**:
  - Updated api.js to use GET requests with proper URL parameters
  - Fixed constant imports from constants.js
  - Generated new v3.3 bundles with fixes
- **Next Steps**:
  - Deploy new v3.3 bundles to CDN
  - Update live site to use v3.3 version
  - Monitor for any remaining issues

## Completed Tasks 
- [x] Removed contentParser module as it was no longer needed (v3.13)
- [x] Fixed decklist rendering issues with GET requests (v3.11)
- [x] Integrated CSS bundling for simpler deployment (v3.10)
- [x] Added smart card name matching for better results (v3.12) 