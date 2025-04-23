// Card Fetcher module - handles retrieval of card data
// Provides functions to fetch individual cards and batches of cards

import { getCardFromCache } from './cache.js';

/**
 * Fetch a single card by name
 * @param {string} name The card name to fetch
 * @param {Object} cardCache The card cache
 * @param {Object} requestQueue The request queue
 * @returns {Promise<Object>} The card data
 */
export async function fetchCard(name, cardCache, requestQueue) {
    // Check cache first
    const cachedCard = getCardFromCache(cardCache, name);
    if (cachedCard) {
        return cachedCard;
    }
    
    // Use promise to work with the request queue system
    return new Promise((resolve, reject) => {
        requestQueue.add(name, resolve, reject);
    });
}

/**
 * Fetch multiple cards at once
 * @param {Array<string>} cardNames Array of card names to fetch
 * @param {Object} cardCache The card cache
 * @param {Object} requestQueue The request queue
 * @returns {Promise<Array<Object>>} Array of card data
 */
export async function fetchCards(cardNames, cardCache, requestQueue) {
    // Filter out cards that are already in cache
    const uniqueNames = [...new Set(cardNames.map(name => name.trim()))];
    const cachedCards = uniqueNames
        .filter(name => getCardFromCache(cardCache, name) !== null)
        .map(name => getCardFromCache(cardCache, name));
    
    const uncachedNames = uniqueNames.filter(name => 
        getCardFromCache(cardCache, name) === null
    );
    
    if (uncachedNames.length === 0) {
        return cachedCards;
    }
    
    try {
        // Create an array of promises, one for each uncached card
        const cardPromises = uncachedNames.map(name => 
            fetchCard(name, cardCache, requestQueue)
        );
        
        // Wait for all card fetch operations to complete
        const fetchedCards = await Promise.all(cardPromises);
        
        // Combine cached and newly fetched cards
        return [...cachedCards, ...fetchedCards];
    } catch (err) {
        console.error('Error batch fetching cards:', err);
        throw err;
    }
}

/**
 * Search for cards by fuzzy name matching
 * @param {string} query The search query
 * @param {Object} cardCache The card cache
 * @param {Object} requestQueue The request queue
 * @returns {Promise<Array<Object>>} Array of matched card data
 */
export async function searchCards(query, cardCache, requestQueue) {
    // First, check if we have any matches in the cache
    const lowerQuery = query.toLowerCase();
    const cacheMatches = Object.keys(cardCache)
        .filter(name => name.toLowerCase().includes(lowerQuery))
        .map(name => cardCache[name]);
    
    if (cacheMatches.length > 0) {
        return cacheMatches;
    }
    
    // If no matches in cache, do an API search
    try {
        // Use a specialized function for search that doesn't use the queue
        // This is because search results are not cached individually
        const card = await fetchCard(query, cardCache, requestQueue);
        return [card];
    } catch (err) {
        console.error(`Search failed for query: ${query}`, err);
        return [];
    }
} 