// == YGO Embed and Decklist Script v3.0 ==
// Enhanced with localStorage persistence and batch API requests
// Main entry point - loads all modules

// Import modules
import { initCache, saveCardCache, getCardCache } from './v3/modules/cache.js';
import { setupRequestQueue } from './v3/modules/api.js';
import { fetchCard, fetchCards } from './v3/modules/cardFetcher.js';
import { setupHoverPreviews } from './v3/modules/hoverPreview.js';
import { renderCardEmbeds } from './v3/modules/cardEmbed.js';
import { renderDecklists } from './v3/modules/decklistRenderer.js';
import { convertMarkup } from './v3/modules/contentParser.js';
import { loadStyles } from './v3/modules/styles.js';

// Main initialization function
document.addEventListener('DOMContentLoaded', async function () {
    console.log("✅ YGO embed script v3.0 loaded");
    
    // Load CSS
    loadStyles();
    
    // Initialize cache
    const cardCache = initCache();
    
    // Setup request queue
    const requestQueue = setupRequestQueue(cardCache);
    
    // Setup context for all modules
    const context = {
        cardCache,
        requestQueue,
        fetchCard: (name) => fetchCard(name, cardCache, requestQueue),
        fetchCards: (names) => fetchCards(names, cardCache, requestQueue)
    };
    
    // Set up periodic cache saving
    const saveInterval = 60000; // Save every minute
    const saveIntervalId = setInterval(() => saveCardCache(cardCache), saveInterval);
    
    // Save cache before page unload
    window.addEventListener('beforeunload', () => saveCardCache(cardCache));
    
    // Parse content and convert special markup
    convertMarkup();
    
    // Setup hover previews
    setupHoverPreviews(context);
    
    // Render card embeds
    renderCardEmbeds(context);
    
    // Render decklists
    renderDecklists(context);
    
    // Save cache on page unload
    window.addEventListener('unload', () => {
        clearInterval(saveIntervalId);
        saveCardCache(cardCache);
    });
}); 