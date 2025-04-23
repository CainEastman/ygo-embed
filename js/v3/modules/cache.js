// Cache module - handles localStorage operations
// Manages card data caching with localStorage

const CACHE_VERSION = 'ygo-cache-v2'; // Updated version
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Initialize card cache from localStorage
 * @returns {Object} The card cache object
 */
export function initCache() {
    try {
        const cachedData = localStorage.getItem(CACHE_VERSION);
        
        if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            
            // Check if cache is still valid (not expired)
            if (parsedCache.timestamp && Date.now() - parsedCache.timestamp < CACHE_EXPIRY) {
                console.log(`✅ Loaded ${Object.keys(parsedCache.cards).length} cached cards from localStorage`);
                return parsedCache.cards;
            } else {
                console.log("⚠️ Card cache expired, creating new cache");
            }
        }
    } catch (err) {
        console.warn("⚠️ Error loading card cache from localStorage", err);
    }
    
    return {}; // Return empty cache if not found or error
}

/**
 * Save cache to localStorage
 * @param {Object} cardCache The card cache to save
 */
export function saveCardCache(cardCache) {
    try {
        const cacheData = {
            timestamp: Date.now(),
            cards: cardCache
        };
        
        localStorage.setItem(CACHE_VERSION, JSON.stringify(cacheData));
        console.log(`✅ Saved ${Object.keys(cardCache).length} cards to cache`);
    } catch (err) {
        console.warn("⚠️ Error saving card cache to localStorage", err);
        
        // If quota exceeded, clear older entries
        if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            try {
                // Keep only the most recently used cards (half of the current cache)
                const keys = Object.keys(cardCache);
                const keysToRemove = keys.slice(0, Math.floor(keys.length / 2));
                
                keysToRemove.forEach(key => delete cardCache[key]);
                
                // Try saving again with reduced cache
                localStorage.setItem(CACHE_VERSION, JSON.stringify({
                    timestamp: Date.now(),
                    cards: cardCache
                }));
                
                console.log("✅ Reduced cache size and saved successfully");
            } catch (e) {
                console.error("❌ Failed to save even with reduced cache", e);
            }
        }
    }
}

/**
 * Get the cache version
 * @returns {string} The current cache version
 */
export function getCacheVersion() {
    return CACHE_VERSION;
}

/**
 * Get the cache expiry time
 * @returns {number} The cache expiry time in milliseconds
 */
export function getCacheExpiry() {
    return CACHE_EXPIRY;
}

/**
 * Get a card from cache
 * @param {Object} cardCache The card cache
 * @param {string} name The card name
 * @returns {Object|null} The card data or null if not found
 */
export function getCardFromCache(cardCache, name) {
    if (cardCache[name] && cardCache[name].complete) {
        return cardCache[name];
    }
    
    // Try case-insensitive search
    const cardName = Object.keys(cardCache).find(
        key => key.toLowerCase() === name.toLowerCase()
    );
    
    if (cardName && cardCache[cardName].complete) {
        return cardCache[cardName];
    }
    
    return null;
}

/**
 * Add a card to cache
 * @param {Object} cardCache The card cache
 * @param {Object} card The card data to add
 */
export function addCardToCache(cardCache, card) {
    const cardName = card.name.trim();
    
    // Store complete card data
    cardCache[cardName] = {
        ...card,
        imgSmall: card.card_images[0].image_url_small,
        imgLarge: card.card_images[0].image_url,
        complete: true
    };
}

/**
 * Clear the entire cache
 */
export function clearCache() {
    try {
        localStorage.removeItem(CACHE_VERSION);
        console.log("✅ Cache cleared successfully");
    } catch (err) {
        console.error("❌ Failed to clear cache", err);
    }
} 