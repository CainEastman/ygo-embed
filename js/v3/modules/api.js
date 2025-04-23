// API module - handles communication with YGOPRODeck API
// Implements request queue and batch API requests

import { addCardToCache } from './cache.js';
import { API } from './constants.js';

/**
 * Set up the request queue for batched API requests
 * @param {Object} cardCache The card cache
 * @returns {Object} The request queue object
 */
export function setupRequestQueue(cardCache) {
    const requestQueue = {
        pending: [],
        inProgress: false,
        
        add(cardName, resolve, reject) {
            this.pending.push({ cardName, resolve, reject });
            
            if (!this.inProgress) {
                this.processQueue();
            }
        },
        
        async processQueue() {
            if (this.pending.length === 0) {
                this.inProgress = false;
                return;
            }
            
            this.inProgress = true;
            
            // Take a batch of requests from the queue
            const batch = this.pending.splice(0, API.BATCH_SIZE);
            const cardNames = batch.map(item => item.cardName);
            
            try {
                // Check which cards are already in cache
                const missingCards = cardNames.filter(name => !cardCache[name] || !cardCache[name].complete);
                
                if (missingCards.length > 0) {
                    // Fetch missing cards in bulk
                    await this.fetchCardBatch(missingCards);
                }
                
                // Resolve all requests in the batch
                for (const item of batch) {
                    if (cardCache[item.cardName] && cardCache[item.cardName].complete) {
                        item.resolve(cardCache[item.cardName]);
                    } else {
                        // This shouldn't happen if fetchCardBatch worked correctly
                        item.reject(new Error(`Failed to load card: ${item.cardName}`));
                    }
                }
            } catch (error) {
                // If batch request fails, reject all requests in the batch
                for (const item of batch) {
                    item.reject(error);
                }
            }
            
            // Process next batch
            setTimeout(() => this.processQueue(), 50);
        },
        
        async fetchCardBatch(cardNames) {
            const uniqueNames = [...new Set(cardNames.map(name => name.trim()))];
            
            if (uniqueNames.length === 0) return [];
            
            try {
                // Create a controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), API.TIMEOUT);
                
                let response;
                if (uniqueNames.length === 1) {
                    // Single card request - use exact name matching
                    response = await fetch(
                        `${API.BASE_URL}/cardinfo.php?name=${encodeURIComponent(uniqueNames[0])}`,
                        { signal: controller.signal }
                    );
                } else {
                    // Multiple card request - use fname parameter for each card
                    const params = new URLSearchParams();
                    uniqueNames.forEach(name => params.append('fname', name));
                    
                    // Construct URL with multiple fname parameters
                    response = await fetch(`${API.BASE_URL}/cardinfo.php?${params.toString()}`, {
                        method: 'GET',
                        signal: controller.signal
                    });
                }
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`API responded with status ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.data || data.data.length === 0) {
                    throw new Error('No card data found');
                }
                
                // Store all retrieved cards in cache
                data.data.forEach(card => {
                    addCardToCache(cardCache, card);
                });
                
                // Check if we got all the cards we requested
                const missingCards = uniqueNames.filter(name => 
                    !Object.keys(cardCache).some(key => 
                        key.toLowerCase() === name.toLowerCase()
                    )
                );
                
                if (missingCards.length > 0) {
                    console.warn(`⚠️ Some cards were not found in the API: ${missingCards.join(', ')}`);
                }
                
                return data.data;
            } catch (err) {
                console.error(`❌ Batch fetch error for cards: ${uniqueNames.join(', ')}`, err);
                throw err;
            }
        }
    };
    
    return requestQueue;
}

/**
 * Check if the API is available
 * @returns {Promise<boolean>} True if the API is available
 */
export async function checkApiAvailability() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API.BASE_URL}/checkDBVer.php`, {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        return response.ok;
    } catch (err) {
        console.error("API availability check failed:", err);
        return false;
    }
} 
