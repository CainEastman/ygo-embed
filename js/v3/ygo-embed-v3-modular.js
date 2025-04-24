// == YGO Embed and Decklist Script v3.0 ==
// Enhanced with localStorage persistence and batch API requests
// Main entry point - loads all modules

// Import modules
import { initCache, saveCardCache, getCardFromCache } from './modules/cache.js';
import { setupRequestQueue } from './modules/api.js';
import { fetchCard, fetchCards } from './modules/cardFetcher.js';
import { setupHoverPreviews } from './modules/hoverPreview.js';
import { renderCardEmbeds } from './modules/cardEmbed.js';
import { renderDecklists } from './modules/decklistRenderer.js';
import { loadStyles } from './modules/styles.js';

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