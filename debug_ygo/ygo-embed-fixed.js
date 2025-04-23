// == YGO Embed and Decklist Script v3.0 (FIXED) ==
// Enhanced with localStorage persistence and batch API requests

// Make our function global and available immediately
window.ygoCardEmbed = function() {
    console.log("✅ YGO embed function called manually");
    processCardLinks();
};

// Run immediately but also handle DOM content loaded
(function() {
    console.log("✅ YGO embed script v3.0 (FIXED) loaded");
  
    // --- CSS Loading with absolute path ---
    if (!document.getElementById('ygo-embed-styles')) {
        const link = document.createElement('link');
        link.id = 'ygo-embed-styles';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'https://cdn.jsdelivr.net/gh/CainEastman/ygo-embed@main/ygo-embed-v3.css';
        document.head.appendChild(link);
        console.log("✅ YGO embed styles loaded with absolute path");
    }
  
    // --- Improved Caching with localStorage ---
    const CACHE_VERSION = 'ygo-cache-v2';
    const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const API_BASE_URL = 'https://db.ygoprodeck.com/api/v7';
    const REQUEST_BATCH_SIZE = 10; // Maximum number of cards to request at once
    const REQUEST_TIMEOUT = 10000; // 10 seconds timeout for API requests
  
    // --- Helper Functions ---
    function getFromCache(cardName) {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_VERSION) || '{}');
            const cachedData = cache[cardName];
            
            if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
                console.log(`✅ Card found in cache: ${cardName}`);
                return cachedData.data;
            }
            return null;
        } catch (error) {
            console.error('❌ Error retrieving from cache:', error);
            return null;
        }
    }
  
    function saveToCache(cardName, data) {
        try {
            const cache = JSON.parse(localStorage.getItem(CACHE_VERSION) || '{}');
            cache[cardName] = {
                data: data,
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_VERSION, JSON.stringify(cache));
            console.log(`✅ Card saved to cache: ${cardName}`);
        } catch (error) {
            console.error('❌ Error saving to cache:', error);
        }
    }
  
    // Helper function to create card elements
    function createCardElement(cardData) {
        if (!cardData) return null;
        
        const cardLink = document.createElement('a');
        cardLink.href = `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=${cardData.id}`;
        cardLink.target = '_blank';
        cardLink.rel = 'noopener noreferrer';
        cardLink.className = 'ygo-card-link';
        
        const cardImage = document.createElement('img');
        cardImage.src = cardData.card_images[0].image_url;
        cardImage.alt = cardData.name;
        cardImage.className = 'ygo-card-image';
        cardLink.appendChild(cardImage);
        
        return cardLink;
    }
  
    // Function to process all card links in the content
    function processCardLinks() {
        // Find all text nodes containing [[CardName]] format
        const textNodeWalker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
            { acceptNode: node => node.textContent.includes('[[') && node.textContent.includes(']]') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
        );
        
        const textNodesToProcess = [];
        let currentNode;
        
        // Collect all text nodes
        while (currentNode = textNodeWalker.nextNode()) {
            textNodesToProcess.push(currentNode);
        }
        
        // Process text nodes in batches to improve performance
        if (textNodesToProcess.length > 0) {
            console.log(`✅ Found ${textNodesToProcess.length} text nodes with card references`);
            processTextNodeBatch(textNodesToProcess);
        } else {
            console.log('❌ No card references found in the page');
        }
    }
    
    // Process text nodes in batches
    function processTextNodeBatch(textNodes) {
        const cardNames = new Set(); // To collect unique card names
        const cardMatches = []; // To track all matches and their text nodes
        
        // Extract card names and track where they appear
        textNodes.forEach(textNode => {
            const text = textNode.textContent;
            const regex = /\[\[(.*?)\]\]/g;
            let match;
            
            while ((match = regex.exec(text)) !== null) {
                const cardName = match[1].trim();
                cardNames.add(cardName);
                
                cardMatches.push({
                    textNode: textNode,
                    cardName: cardName,
                    fullMatch: match[0],
                    startIndex: match.index,
                    endIndex: match.index + match[0].length
                });
            }
        });
        
        if (cardNames.size === 0) return;
        
        console.log(`✅ Found ${cardNames.size} unique card names to look up`);
        
        // Process cards
        const cardsToFetch = [];
        const cachedCards = {};
        
        // Check cache first
        cardNames.forEach(cardName => {
            const cachedData = getFromCache(cardName);
            if (cachedData) {
                cachedCards[cardName] = cachedData;
            } else {
                cardsToFetch.push(cardName);
            }
        });
        
        // Process cached cards immediately
        if (Object.keys(cachedCards).length > 0) {
            console.log(`✅ Processing ${Object.keys(cachedCards).length} cards from cache`);
            replaceCardReferences(cardMatches, cachedCards);
        }
        
        // Fetch remaining cards in batches
        if (cardsToFetch.length > 0) {
            console.log(`✅ Fetching ${cardsToFetch.length} cards from API`);
            fetchCardBatches(cardsToFetch, 0, {}, cardMatches);
        }
    }
    
    // Fetch cards in batches
    function fetchCardBatches(cardNameList, startIndex, fetchedCards, cardMatches) {
        if (startIndex >= cardNameList.length) {
            // All batches processed
            replaceCardReferences(cardMatches, fetchedCards);
            return;
        }
        
        const endIndex = Math.min(startIndex + REQUEST_BATCH_SIZE, cardNameList.length);
        const batchToFetch = cardNameList.slice(startIndex, endIndex);
        
        console.log(`✅ Fetching batch of ${batchToFetch.length} cards...`);
        
        const promises = batchToFetch.map(cardName => {
            return fetchCard(cardName)
                .then(cardData => {
                    if (cardData) {
                        fetchedCards[cardName] = cardData;
                        saveToCache(cardName, cardData);
                    }
                })
                .catch(error => {
                    console.error(`❌ Error fetching ${cardName}:`, error);
                });
        });
        
        Promise.all(promises)
            .then(() => {
                // Fetch next batch
                fetchCardBatches(cardNameList, endIndex, fetchedCards, cardMatches);
            })
            .catch(error => {
                console.error('❌ Error processing batch:', error);
                // Try to continue with next batch anyway
                fetchCardBatches(cardNameList, endIndex, fetchedCards, cardMatches);
            });
    }
    
    // Fetch a single card from the API
    function fetchCard(cardName) {
        return new Promise((resolve, reject) => {
            const encodedName = encodeURIComponent(cardName);
            const url = `${API_BASE_URL}/cardinfo.php?name=${encodedName}`;
            
            // Add timeout to fetch
            const timeoutId = setTimeout(() => {
                reject(new Error(`Timeout fetching card: ${cardName}`));
            }, REQUEST_TIMEOUT);
            
            fetch(url)
                .then(response => {
                    clearTimeout(timeoutId);
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.data && data.data.length > 0) {
                        resolve(data.data[0]);
                    } else {
                        console.warn(`⚠️ Card not found: ${cardName}`);
                        resolve(null);
                    }
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    console.error(`❌ Error fetching card ${cardName}:`, error);
                    reject(error);
                });
        });
    }
    
    // Replace card references in the DOM
    function replaceCardReferences(cardMatches, cardsData) {
        // Group matches by text node to process them together
        const matchesByNode = {};
        
        cardMatches.forEach(match => {
            const nodeId = match.textNode.nodeValue; // Using node value as a crude ID
            if (!matchesByNode[nodeId]) {
                matchesByNode[nodeId] = {
                    textNode: match.textNode,
                    matches: []
                };
            }
            matchesByNode[nodeId].matches.push(match);
        });
        
        // Process each text node
        Object.values(matchesByNode).forEach(nodeInfo => {
            const { textNode, matches } = nodeInfo;
            
            // Sort matches in reverse order to prevent index shifting
            matches.sort((a, b) => b.startIndex - a.startIndex);
            
            let newContent = textNode.nodeValue;
            const fragments = document.createDocumentFragment();
            let lastIndex = newContent.length;
            
            matches.forEach(match => {
                if (!cardsData[match.cardName]) return; // Skip if card data is missing
                
                // Get the text after this match
                const textAfter = newContent.substring(match.endIndex, lastIndex);
                if (textAfter) {
                    const textNode = document.createTextNode(textAfter);
                    fragments.prepend(textNode);
                }
                
                // Create and insert card element
                const cardElement = createCardElement(cardsData[match.cardName]);
                if (cardElement) {
                    fragments.prepend(cardElement);
                } else {
                    // If card element couldn't be created, keep the original text
                    const originalText = document.createTextNode(match.fullMatch);
                    fragments.prepend(originalText);
                }
                
                lastIndex = match.startIndex;
            });
            
            // Add any remaining text at the beginning
            if (lastIndex > 0) {
                const textBefore = newContent.substring(0, lastIndex);
                if (textBefore) {
                    const textNode = document.createTextNode(textBefore);
                    fragments.prepend(textNode);
                }
            }
            
            // Replace the original text node with our fragments
            if (textNode.parentNode) {
                textNode.parentNode.replaceChild(fragments, textNode);
            }
        });
        
        console.log("✅ Card references have been processed and replaced");
    }
    
    // If DOM is already loaded, run now, otherwise wait for the event
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(processCardLinks, 500); // Small delay to ensure content is loaded
        });
    } else {
        // DOM is already loaded
        setTimeout(processCardLinks, 500); // Small delay to ensure content is loaded
    }
})();

// Run when window loads to catch any dynamically loaded content
window.addEventListener('load', function() {
    setTimeout(function() {
        window.ygoCardEmbed(); // Run the card embed function
    }, 1000); // Wait 1 second to make sure all content is loaded
}); 