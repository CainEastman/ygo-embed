// == YGO Embed and Decklist Script v3.1 ==
// Fixed with improved error handling, CSS loading, and compatibility

// Make our function global and available immediately
window.ygoCardEmbed = function() {
    console.log("✅ YGO embed function called manually");
    processCardLinks();
};

// Immediately invoked function to avoid polluting global namespace
(function() {
    console.log("✅ YGO embed script v3.1 loaded");
  
    // --- CSS Loading with absolute path ---
    if (!document.getElementById('ygo-embed-styles')) {
        const link = document.createElement('link');
        link.id = 'ygo-embed-styles';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        // Use GitHub URL for CSS
        link.href = 'https://cdn.jsdelivr.net/gh/CainEastman/ygo-embed@main/ygo-embed-v3.css';
        document.head.appendChild(link);
        
        // Also add inline styles as a fallback
        const inlineStyles = document.createElement('style');
        inlineStyles.id = 'ygo-embed-inline-styles';
        inlineStyles.textContent = `
            .ygo-card-link {
                display: inline-block;
                position: relative;
                margin: 0 5px;
                transition: transform 0.2s ease;
                vertical-align: middle;
                z-index: 10;
            }
            
            .ygo-card-link:hover {
                transform: scale(1.5);
                z-index: 20;
            }
            
            .ygo-card-image {
                width: 75px;
                height: auto;
                border-radius: 3px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
            }
            
            /* Responsive adjustments */
            @media screen and (max-width: 768px) {
                .ygo-card-image {
                    width: 60px;
                }
                
                .ygo-card-link:hover {
                    transform: scale(1.3);
                }
            }
            
            @media screen and (max-width: 480px) {
                .ygo-card-image {
                    width: 45px;
                }
                
                .ygo-card-link:hover {
                    transform: scale(1.2);
                }
            }
            
            /* Card reference styling */
            p a.ygo-card-link {
                text-decoration: none !important;
                border-bottom: none !important;
            }
        `;
        document.head.appendChild(inlineStyles);
        console.log("✅ YGO embed styles loaded");
    }
  
    // --- Improved Caching with localStorage ---
    const CACHE_VERSION = 'ygo-cache-v3';
    const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const API_BASE_URL = 'https://db.ygoprodeck.com/api/v7';
    const REQUEST_BATCH_SIZE = 10; // Maximum number of cards to request at once
    const REQUEST_TIMEOUT = 15000; // 15 seconds timeout for API requests
  
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
        
        try {
            const cardLink = document.createElement('a');
            cardLink.href = `https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=${cardData.id}`;
            cardLink.target = '_blank';
            cardLink.rel = 'noopener noreferrer';
            cardLink.className = 'ygo-card-link';
            
            const cardImage = document.createElement('img');
            cardImage.src = cardData.card_images[0].image_url;
            cardImage.alt = cardData.name;
            cardImage.className = 'ygo-card-image';
            cardImage.loading = 'lazy'; // Add lazy loading for better performance
            cardLink.appendChild(cardImage);
            
            return cardLink;
        } catch (error) {
            console.error('❌ Error creating card element:', error);
            return null;
        }
    }
  
    // Function to find and process all card links in the content
    function processCardLinks() {
        try {
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
                // Only process nodes that are visible and not in scripts/styles
                const parentElement = currentNode.parentElement;
                if (parentElement && 
                    parentElement.offsetParent !== null && 
                    !['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(parentElement.tagName)) {
                    textNodesToProcess.push(currentNode);
                }
            }
            
            // Process text nodes in batches to improve performance
            if (textNodesToProcess.length > 0) {
                console.log(`✅ Found ${textNodesToProcess.length} text nodes with card references`);
                processTextNodeBatch(textNodesToProcess);
            } else {
                console.log('⚠️ No card references found in the page');
            }
        } catch (error) {
            console.error('❌ Error processing card links:', error);
        }
    }
    
    // Process text nodes in batches
    function processTextNodeBatch(textNodes) {
        try {
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
        } catch (error) {
            console.error('❌ Error processing text nodes:', error);
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
                        if (response.status === 400) {
                            // Card not found case - handle gracefully
                            console.warn(`⚠️ Card not found: ${cardName}`);
                            return { data: [] };
                        }
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
        try {
            // Group matches by text node to process them together
            const matchesByNode = {};
            
            cardMatches.forEach(match => {
                // Using node value as a crude ID
                const nodeId = match.textNode.nodeValue + '_' + match.textNode.parentNode.tagName;
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
                
                // Skip if the parent node is no longer in the DOM
                if (!textNode.parentNode) {
                    console.log('⚠️ Parent node no longer in DOM, skipping');
                    return;
                }
                
                // Sort matches in reverse order to prevent index shifting
                matches.sort((a, b) => b.startIndex - a.startIndex);
                
                let newContent = textNode.nodeValue;
                const fragments = document.createDocumentFragment();
                let lastIndex = newContent.length;
                
                matches.forEach(match => {
                    // Get the text after this match
                    const textAfter = newContent.substring(match.endIndex, lastIndex);
                    if (textAfter) {
                        const textNode = document.createTextNode(textAfter);
                        fragments.prepend(textNode);
                    }
                    
                    // Create and insert card element if card data exists
                    if (cardsData[match.cardName]) {
                        const cardElement = createCardElement(cardsData[match.cardName]);
                        if (cardElement) {
                            fragments.prepend(cardElement);
                        } else {
                            // If card element couldn't be created, keep the original text
                            const originalText = document.createTextNode(match.fullMatch);
                            fragments.prepend(originalText);
                        }
                    } else {
                        // Keep the original text for cards that weren't found
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
        } catch (error) {
            console.error('❌ Error replacing card references:', error);
        }
    }
    
    // Retry mechanism for initial processing
    function runWithRetry(fn, maxRetries = 3, delay = 1000) {
        let retries = 0;
        
        function attempt() {
            fn().catch(error => {
                console.error(`❌ Error, attempt ${retries + 1}:`, error);
                retries++;
                if (retries < maxRetries) {
                    setTimeout(attempt, delay);
                }
            });
        }
        
        attempt();
    }
    
    // Entry point - run immediately after DOM is ready
    function init() {
        // If DOM is already loaded, run now, otherwise wait for the event
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(processCardLinks, 500); // Small delay to ensure content is loaded
            });
        } else {
            // DOM is already loaded
            setTimeout(processCardLinks, 500); // Small delay to ensure content is loaded
        }
        
        // Also run on window load event for any dynamic content
        window.addEventListener('load', function() {
            setTimeout(function() {
                processCardLinks(); // Run again to catch any missed content
            }, 1000);
        });
    }
    
    // Start the script
    init();
})();

// Add a fallback initialization for cases where the automatic run fails
setTimeout(function() {
    if (window.ygoCardEmbed) {
        window.ygoCardEmbed();
        console.log("✅ Fallback initialization triggered");
    }
}, 3000); // 3 second fallback 