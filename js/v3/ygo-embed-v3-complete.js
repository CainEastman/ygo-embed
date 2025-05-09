// == YGO Embed and Decklist Script v3.0 ==
// Enhanced with localStorage persistence and batch API requests

document.addEventListener('DOMContentLoaded', async function () {
    console.log("✅ YGO embed script v3.0 loaded");
  
    // --- CSS Loading ---
    if (!document.getElementById('ygo-embed-styles')) {
        const link = document.createElement('link');
        link.id = 'ygo-embed-styles';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'js/v3/ygo-embed-v3.css';
        document.head.appendChild(link);
        console.log("✅ YGO embed styles loaded");
    }
  
    // --- Improved Caching with localStorage ---
    const CACHE_VERSION = 'ygo-cache-v2'; // Updated version
    const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const API_BASE_URL = 'https://db.ygoprodeck.com/api/v7';
    const REQUEST_BATCH_SIZE = 10; // Maximum number of cards to request at once
    const REQUEST_TIMEOUT = 10000; // 10 seconds timeout for API requests
    
    // Initialize card cache from localStorage
    const cardCache = initializeCardCache();
    
    function initializeCardCache() {
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
    
    // Save cache to localStorage
    function saveCardCache() {
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
    
    // Improved request queue system with proper error handling
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
            const batch = this.pending.splice(0, REQUEST_BATCH_SIZE);
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
            // For multiple cards, use the fname parameter which accepts fuzzy matching
            // This is more efficient than multiple API calls
            const uniqueNames = [...new Set(cardNames)].map(name => name.trim());
            
            if (uniqueNames.length === 0) return [];
            
            try {
                // Create a controller for timeout
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
                
                let response;
                if (uniqueNames.length === 1) {
                    // Single card request - use exact name matching
                    response = await fetch(
                        `${API_BASE_URL}/cardinfo.php?name=${encodeURIComponent(uniqueNames[0])}`,
                        { signal: controller.signal }
                    );
                } else {
                    // Multiple card request - we'll use a POST request to handle larger batches
                    // This is more efficient than multiple GET requests
                    const params = new URLSearchParams();
                    uniqueNames.forEach(name => params.append('fname', name));
                    
                    response = await fetch(`${API_BASE_URL}/cardinfo.php`, {
                        method: 'POST',
                        body: params,
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
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
                    const cardName = card.name.trim();
                    
                    // Store complete card data
                    cardCache[cardName] = {
                        ...card,
                        imgSmall: card.card_images[0].image_url_small,
                        imgLarge: card.card_images[0].image_url,
                        complete: true
                    };
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
    
    // Periodically save cache to localStorage
    const saveInterval = 60000; // Save every minute
    const saveIntervalId = setInterval(saveCardCache, saveInterval);
    
    // Save cache before page unload
    window.addEventListener('beforeunload', saveCardCache);

    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    let lastTapped = null;

    const hoverDiv = document.createElement('div');
    Object.assign(hoverDiv.style, {
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: '9999',
        display: 'none',
        maxWidth: '90vw'
    });
    document.body.appendChild(hoverDiv);

    window.addEventListener('scroll', () => {
        if (hoverDiv.style.display === 'block' && lastTapped) {
            const rect = lastTapped.getBoundingClientRect();
            hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
            hoverDiv.style.left = '50%';
            hoverDiv.style.transform = 'translateX(-50%)';
        }
    });

    // Convert decklist text to HTML structure
    document.querySelectorAll('p').forEach(p => {
        const matchEmbed = p.textContent.trim().match(/^embed::(.+)$/i);
        const matchDeck = p.textContent.trim().match(/^deck::(main|extra|side|upgrade)::\[(.*)\]$/i);

        if (matchEmbed) {
            const cardName = matchEmbed[1].trim();
            const wrapper = document.createElement('div');
            wrapper.className = 'ygo-card-embed';
            wrapper.setAttribute('data-card-name', cardName);
            wrapper.innerHTML = '<div class="ygo-loading">Loading card...</div>';
            p.replaceWith(wrapper);
        } else if (matchDeck) {
            const section = matchDeck[1];
            const names = JSON.parse(`[${matchDeck[2]}]`);
            const container = document.createElement('div');
            container.className = 'ygo-decklist';
            container.setAttribute('data-deck-section', section);
            container.setAttribute('data-card-names', JSON.stringify(names));
            container.innerHTML = '<div class="ygo-loading">Loading deck...</div>';
            p.replaceWith(container);
        }
    });

    // Enhanced card fetching with batching and caching
    async function fetchCard(name) {
        // Return from cache if available
        if (cardCache[name] && cardCache[name].complete) {
            return cardCache[name];
        }
        
        // Use promise to work with the request queue system
        return new Promise((resolve, reject) => {
            requestQueue.add(name, resolve, reject);
        });
    }

    // Fetch multiple cards at once and return array of card data
    async function fetchCards(cardNames) {
        // Filter out cards that are already in cache
        const uniqueNames = [...new Set(cardNames.map(name => name.trim()))];
        const cachedCards = uniqueNames.filter(name => cardCache[name] && cardCache[name].complete)
            .map(name => cardCache[name]);
        
        const uncachedNames = uniqueNames.filter(name => !cardCache[name] || !cardCache[name].complete);
        
        if (uncachedNames.length === 0) {
            return cachedCards;
        }
        
        try {
            // Create an array of promises, one for each uncached card
            const cardPromises = uncachedNames.map(name => fetchCard(name));
            
            // Wait for all card fetch operations to complete
            const fetchedCards = await Promise.all(cardPromises);
            
            // Combine cached and newly fetched cards
            return [...cachedCards, ...fetchedCards];
        } catch (err) {
            console.error('Error batch fetching cards:', err);
            throw err;
        }
    }

    // Hover preview setup
    function setupHoverPreviews() {
        document.querySelectorAll('.dib-post-content p, .dib-post-content li, .dib-post-content h2, .dib-post-content h3, .dib-post-content h4').forEach(node => {
            node.innerHTML = node.innerHTML.replace(/\[\[([^\]]+)\]\]/g, (_, name) => `<span class="hover-card" data-card-name="${name}">${name}</span>`);
        });

        document.querySelectorAll('.hover-card').forEach(elem => {
            elem.addEventListener('mouseenter', async function (e) {
                if (isMobile) return;
                await loadHover(this.dataset.cardName, e);
            });

            elem.addEventListener('mousemove', e => {
                if (!isMobile) positionHover(e);
            });

            elem.addEventListener('mouseleave', () => {
                if (isMobile) return;
                hoverDiv.style.display = 'none';
            });

            elem.addEventListener('click', async function (e) {
                e.preventDefault();
                const name = this.dataset.cardName;
                
                try {
                    // Ensure card data is loaded
                    if (!cardCache[name] || !cardCache[name].complete) {
                        await fetchCard(name);
                    }
                    
                    if (isMobile) {
                        if (lastTapped === this) {
                            window.open(cardCache[name].imgLarge, '_blank');
                            hoverDiv.style.display = 'none';
                            lastTapped = null;
                        } else {
                            lastTapped = this;
                            showHover(cardCache[name].imgSmall);
                            const rect = this.getBoundingClientRect();
                            hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
                            hoverDiv.style.left = '50%';
                            hoverDiv.style.transform = 'translateX(-50%)';
                        }
                    } else {
                        window.open(cardCache[name].imgLarge, '_blank');
                    }
                } catch (err) {
                    console.error(`Failed to load card "${name}"`, err);
                }
            });
        });
    }

    async function loadHover(name, e) {
        // If we have image URLs cached, show hover immediately
        if (cardCache[name] && cardCache[name].imgSmall) {
            showHover(cardCache[name].imgSmall);
            if (!isMobile) positionHover(e);
            return;
        }
        
        try {
            const card = await fetchCard(name);
            showHover(card.imgSmall);
            if (!isMobile) positionHover(e);
        } catch (err) {
            console.error('Error loading hover image:', err);
        }
    }

    function showHover(url) {
        hoverDiv.innerHTML = `<img src="${url}" style="width:177px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.3);">`;
        hoverDiv.style.display = 'block';
    }

    function positionHover(e) {
        const hoverWidth = 200;
        const offset = 15;
        let x = e.clientX + offset;
        let y = e.clientY + offset;
        if (x + hoverWidth > window.innerWidth) x = e.clientX - hoverWidth - offset;
        if (y + 250 > window.innerHeight) y = e.clientY - 250 - offset;
        hoverDiv.style.top = `${y + window.scrollY}px`;
        hoverDiv.style.left = `${x + window.scrollX}px`;
        hoverDiv.style.transform = 'none';
    }

    setupHoverPreviews();

    if (isMobile) {
        document.addEventListener('click', (e) => {
            const tappedCard = e.target.closest('.hover-card');
            if (!tappedCard) {
                hoverDiv.style.display = 'none';
                lastTapped = null;
            }
        });
    }

    // Full card embeds
    document.querySelectorAll('.ygo-card-embed').forEach(async embedDiv => {
        const cardName = embedDiv.getAttribute('data-card-name');
        try {
            const card = await fetchCard(cardName);

            const imgUrl = card.card_images[0].image_url;

            const container = document.createElement('div');
            container.className = 'ygo-embed-container';

            const imgContainer = document.createElement('div');
            imgContainer.className = 'ygo-card-image-container';

            const imgLink = document.createElement('a');
            imgLink.href = imgUrl;
            imgLink.target = '_blank';
            imgLink.rel = 'noopener nofollow';

            const img = document.createElement('img');
            img.className = 'ygo-card-image';
            img.src = imgUrl;
            img.alt = card.name;

            imgLink.appendChild(img);
            imgContainer.appendChild(imgLink);
            container.appendChild(imgContainer);

            const details = document.createElement('div');
            details.className = 'ygo-card-details';

            const descHTML = card.desc.replace(/\n/g, '<br><br>');

            let statsHTML = `<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;margin-bottom:12px;">`;
            statsHTML += `<div><strong>Type:</strong> ${card.type}</div>`;

            if (card.type.includes("Monster")) {
                statsHTML += `<div><strong>Attribute:</strong> ${card.attribute || 'N/A'}</div>`;
                statsHTML += `<div><strong>Typing:</strong> ${card.race}</div>`;
                statsHTML += `<div><strong>Level/Rank:</strong> ${card.level || card.rank || 'N/A'}</div>`;
                statsHTML += `<div><strong>ATK:</strong> ${card.atk !== undefined ? card.atk : 'N/A'}</div>`;
                if (card.linkval !== undefined) {
                    statsHTML += `<div><strong>Link:</strong> ${card.linkval}</div>`;
                } else {
                    statsHTML += `<div><strong>DEF:</strong> ${card.def !== undefined ? card.def : 'N/A'}</div>`;
                }
            }

            statsHTML += `</div>`;

            const tcgPrice = card.card_prices?.[0]?.tcgplayer_price || 'N/A';
            const mkPrice = card.card_prices?.[0]?.cardmarket_price || 'N/A';

            const priceHTML = 
                `<p class="ygo-card-price">
                    <strong>TCGplayer:</strong> $${tcgPrice}<br>
                    <strong>Cardmarket:</strong> €${mkPrice}
                </p>`;

            details.innerHTML = 
                `<h4 class="ygo-card-name">${card.name}</h4>
                ${statsHTML}
                <p class="ygo-card-oracle-text">${descHTML}</p>
                ${priceHTML}`;

            container.appendChild(details);
            embedDiv.innerHTML = '';
            embedDiv.appendChild(container);
        } catch (err) {
            console.error('Error loading card:', err);
            embedDiv.innerHTML = `<div class="ygo-error">❌ Error loading card: ${cardName}</div>`;
        }
    });

    // Decklist render with improved batch loading
    document.querySelectorAll('.ygo-decklist').forEach(async section => {
        const titleMap = {
            main: 'Main Deck',
            extra: 'Extra Deck',
            side: 'Side Deck',
            upgrade: null
        };
        const deckType = section.getAttribute('data-deck-section');
        const names = JSON.parse(section.getAttribute('data-card-names'));
        const container = document.createElement('div');
        container.className = 'ygo-deck-section';
        if (titleMap[deckType]) {
            container.innerHTML = `<h3 class="ygo-deck-title">${titleMap[deckType]}</h3>`;
        }
        const grid = document.createElement('div');
        grid.className = 'ygo-decklist-grid';
        
        // Extract all card names and quantities
        const cardsToFetch = [];
        const cardQuantities = {};
        
        for (let entry of names) {
            const [name, qtyStr] = entry.split(/\sx(\d+)$/);
            const cardName = name.trim();
            const qty = parseInt(qtyStr) || 1;
            
            cardsToFetch.push(cardName);
            cardQuantities[cardName] = qty;
        }
        
        try {
            // Fetch all cards in the decklist at once
            const allCards = await fetchCards(cardsToFetch);
            
            // Map the cards by name for easy lookup
            const cardsByName = {};
            allCards.forEach(card => {
                cardsByName[card.name.trim()] = card;
            });
            
            // Create DOM elements for each card
            for (let cardName of cardsToFetch) {
                // Find the card by name (case-insensitive matching)
                const card = cardsByName[cardName] || 
                            Object.values(cardsByName).find(c => 
                                c.name.toLowerCase() === cardName.toLowerCase());
                
                if (!card) {
                    console.warn(`❌ Could not find card: ${cardName}`);
                    continue;
                }
                
                const qty = cardQuantities[cardName];
                
                // Create card elements
                for (let i = 0; i < qty; i++) {
                    const cardDiv = document.createElement('div');
                    cardDiv.className = 'ygo-decklist-card';
                
                    const img = document.createElement('img');
                    img.src = card.card_images[0].image_url_small;
                    img.alt = cardName;
                    img.title = cardName;
                    img.style.cursor = 'zoom-in';
                    img.addEventListener('click', () => window.open(card.card_images[0].image_url, '_blank'));
                
                    const nameLink = document.createElement('a');
                    nameLink.textContent = cardName;
                    nameLink.href = card.card_images[0].image_url;
                    nameLink.target = '_blank';
                    nameLink.rel = 'noopener nofollow';
                    nameLink.style.display = 'block';
                    nameLink.style.marginTop = '4px';
                    nameLink.style.color = '#fff';
                    nameLink.style.textDecoration = 'none';
                    nameLink.style.cursor = 'pointer';
                
                    cardDiv.appendChild(img);
                    cardDiv.appendChild(nameLink);
                    grid.appendChild(cardDiv);
                }
            }
            
            container.appendChild(grid);
            section.innerHTML = '';
            section.appendChild(container);
        } catch (err) {
            console.error('Error loading decklist:', err);
            section.innerHTML = `<div class="ygo-error">❌ Error loading decklist: ${err.message}</div>`;
        }
    });
    
    // Save cache on page unload
    window.addEventListener('unload', () => {
        clearInterval(saveIntervalId);
        saveCardCache();
    });
});