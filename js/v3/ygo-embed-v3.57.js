(() => {
  // js/v3/modules/utils.js
  function normalizeCardName(name) {
    return name.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, ' ')     // Normalize spaces
        .trim();
  }

  // js/v3/modules/cache.js
  var CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1e3;
  function initCache() {
    try {
      const cachedData = localStorage.getItem(CACHE.VERSION);
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);
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
    return {};
  }
  function saveCardCache(cardCache) {
    try {
      const cacheData = {
        timestamp: Date.now(),
        cards: cardCache
      };
      localStorage.setItem(CACHE.VERSION, JSON.stringify(cacheData));
      console.log(`✅ Saved ${Object.keys(cardCache).length} cards to cache`);
    } catch (err) {
      console.warn("\u26A0\uFE0F Error saving card cache to localStorage", err);
      if (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED") {
        try {
          const keys = Object.keys(cardCache);
          const keysToRemove = keys.slice(0, Math.floor(keys.length / 2));
          keysToRemove.forEach((key) => delete cardCache[key]);
          localStorage.setItem(CACHE.VERSION, JSON.stringify({
            timestamp: Date.now(),
            cards: cardCache
          }));
          console.log("\u2705 Reduced cache size and saved successfully");
        } catch (e) {
          console.error("\u274C Failed to save even with reduced cache", e);
        }
      }
    }
  }
  function getCardFromCache(cardCache, name) {
    const searchName = name.trim();
    
    // Try exact match first
    if (cardCache[searchName] && cardCache[searchName].complete) {
        return cardCache[searchName];
    }
    
    // Try normalized match
    const normalizedName = normalizeCardName(searchName);
    if (cardCache[normalizedName] && cardCache[normalizedName].complete) {
        return cardCache[normalizedName];
    }
    
    // Try case-insensitive match
    const cardName = Object.keys(cardCache).find(
        key => key.toLowerCase() === searchName.toLowerCase()
    );
    if (cardName && cardCache[cardName].complete) {
      return cardCache[cardName];
    }
    
    return null;
  }
  function addCardToCache(cardCache, card) {
    const cardName = card.name.trim();
    const cardData = {
      ...card,
        imgSmall: card.card_images?.[0]?.image_url_small,
        imgLarge: card.card_images?.[0]?.image_url,
      complete: true
    };
    
    // Add both the exact name and normalized name to cache
    cardCache[cardName] = cardData;
    cardCache[normalizeCardName(cardName)] = cardData;
    
    console.log(`Added to cache: ${cardName}`, cardData);
  }

  // js/v3/modules/constants.js
  const API = {
    BASE_URL: "https://db.ygoprodeck.com/api/v7",
    BATCH_SIZE: 20,  // Increased batch size
    TIMEOUT: 15000   // Increased timeout to 15 seconds
  };
  var CACHE = {
    VERSION: "ygo-cache-v3.52",
    EXPIRY: 7 * 24 * 60 * 60 * 1e3,
    // 7 days in milliseconds
    SAVE_INTERVAL: 6e4
    // 1 minute
  };

  // js/v3/modules/api.js
  function setupRequestQueue(cardCache) {
    const requestQueue = {
      pending: [],
      inProgress: false,
        async add(cardName, resolve, reject) {
        this.pending.push({ cardName, resolve, reject });
        if (!this.inProgress) {
                await this.processQueue();
        }
      },
      async processQueue() {
        if (this.pending.length === 0) {
          this.inProgress = false;
          return;
        }
            
        this.inProgress = true;
        const batch = this.pending.splice(0, API.BATCH_SIZE);
            const cardNames = batch.map(item => item.cardName);
            
        try {
                console.log('Processing batch:', cardNames);
                const cards = await fetchCardBatch(cardNames);
                
                // Add cards to cache
                cards.forEach(card => addCardToCache(cardCache, card));
                
                // Resolve promises
          for (const item of batch) {
                    const card = getCardFromCache(cardCache, item.cardName);
                    if (card) {
                        item.resolve(card);
            } else {
              item.reject(new Error(`Failed to load card: ${item.cardName}`));
            }
          }
        } catch (error) {
                console.error('Batch processing error:', error);
          for (const item of batch) {
            item.reject(error);
          }
        }
            
            // Process next batch
            setTimeout(() => this.processQueue(), 50);
        }
    };
    
    return requestQueue;
  }

  // js/v3/modules/cardFetcher.js
  function parseQuantity(entry) {
    // Remove any extra whitespace and quotes
    entry = entry.trim().replace(/^["'](.*)["']$/, '$1').trim();
    
    // Handle "Card Name x3" format (case insensitive)
    const xMatch = entry.match(/^(.+?)\s*x\s*(\d+)$/i);
    if (xMatch) {
        const name = xMatch[1].trim();
        const quantity = parseInt(xMatch[2], 10);
        console.log(`Parsed "x" format: "${entry}" -> name: "${name}", quantity: ${quantity}`);
        return { quantity, name };
    }
    
    // Handle "3x Card Name" format (case insensitive)
    const prefixMatch = entry.match(/^(\d+)\s*x?\s+(.+)$/i);
    if (prefixMatch) {
        const quantity = parseInt(prefixMatch[1], 10);
        const name = prefixMatch[2].trim();
        console.log(`Parsed prefix format: "${entry}" -> name: "${name}", quantity: ${quantity}`);
        return { quantity, name };
  }

    // If no quantity specified, return 1
    console.log(`No quantity found: "${entry}" -> name: "${entry}", quantity: 1`);
      return {
        quantity: 1, 
        name: entry.trim() 
      };
  }
  async function fetchCard(name, cardCache, requestQueue) {
    try {
      const { quantity, name: cardName } = parseQuantity(name);
      const cachedCard = getCardFromCache(cardCache, cardName);
      
      if (cachedCard) {
        return { ...cachedCard, quantity };
      }

      return new Promise((resolve, reject) => {
        requestQueue.add(cardName, 
          (card) => resolve({ ...card, quantity }), 
          (error) => reject(error)
        );
      });
    } catch (err) {
      console.error(`❌ Error fetching card "${name}":`, err);
      throw err;
    }
  }
  async function fetchCards(cardNames, cardCache, requestQueue) {
    console.log('Fetching cards:', cardNames);
    const uniqueNames = new Set();
    const quantities = new Map();
    
    // Parse quantities and collect unique names
    cardNames.forEach(entry => {
      try {
        const { quantity, name } = parseQuantity(entry);
            console.log(`Parsed entry: "${entry}" -> quantity: ${quantity}, name: "${name}"`);
        uniqueNames.add(name);
        quantities.set(name, (quantities.get(name) || 0) + quantity);
      } catch (err) {
        console.warn(`⚠️ Error parsing card entry: ${entry}`, err);
        uniqueNames.add(entry.trim());
        quantities.set(entry.trim(), 1);
      }
    });

    console.log('Unique names:', [...uniqueNames]);
    console.log('Quantities:', Object.fromEntries(quantities));

    // Filter out cards that are already in cache
    const uncachedNames = [...uniqueNames].filter(
      name => !getCardFromCache(cardCache, name)
    );

    console.log('Uncached names:', uncachedNames);

    // Fetch uncached cards
    if (uncachedNames.length > 0) {
      const promises = uncachedNames.map(name =>
        new Promise((resolve, reject) => {
          requestQueue.add(name, resolve, reject);
        })
      );

      try {
        await Promise.all(promises);
      } catch (err) {
        console.error("❌ Error fetching cards:", err);
      }
    }

    // Return results with quantities
    const results = [...uniqueNames].map(name => {
        const card = getCardFromCache(cardCache, name);
        console.log(`Result for "${name}":`, card);
        return {
      name,
      quantity: quantities.get(name) || 1,
            card
        };
    });

    console.log('Final results:', results);
    return results;
  }

  // js/v3/modules/hoverPreview.js
  var isMobile = /Mobi|Android/i.test(navigator.userAgent);
  var lastTapped = null;
  var hoverDiv = document.createElement("div");
  Object.assign(hoverDiv.style, {
    position: "absolute",
    pointerEvents: "none",
    zIndex: "9999",
    display: "none",
    maxWidth: "90vw"
  });
  function setupHoverPreviews(context) {
    const { cardCache, fetchCard: fetchCard2 } = context;
    document.body.appendChild(hoverDiv);
    window.addEventListener("scroll", () => {
      if (hoverDiv.style.display === "block" && lastTapped) {
        const rect = lastTapped.getBoundingClientRect();
        hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
        hoverDiv.style.left = "50%";
        hoverDiv.style.transform = "translateX(-50%)";
      }
    });
    document.querySelectorAll(".dib-post-content p, .dib-post-content li, .dib-post-content h2, .dib-post-content h3, .dib-post-content h4").forEach((node) => {
      node.innerHTML = node.innerHTML.replace(
        /\[\[([^\]]+)\]\]/g,
        (_, name) => `<span class="hover-card" data-card-name="${name}">${name}</span>`
      );
    });
    document.querySelectorAll(".hover-card").forEach((elem) => {
      elem.addEventListener("mouseenter", async function(e) {
        if (isMobile) return;
        await loadHover(this.dataset.cardName, e, cardCache, fetchCard2);
      });
      elem.addEventListener("mousemove", (e) => {
        if (!isMobile) positionHover(e);
      });
      elem.addEventListener("mouseleave", () => {
        if (isMobile) return;
        hoverDiv.style.display = "none";
      });
      elem.addEventListener("click", async function(e) {
        e.preventDefault();
        const name = this.dataset.cardName;
        try {
          let card = getCardFromCache(cardCache, name);
          if (!card) {
            card = await fetchCard2(name);
          }
          if (isMobile) {
            if (lastTapped === this) {
              window.open(card.imgLarge, "_blank");
              hoverDiv.style.display = "none";
              lastTapped = null;
            } else {
              lastTapped = this;
              showHover(card.imgSmall);
              const rect = this.getBoundingClientRect();
              hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
              hoverDiv.style.left = "50%";
              hoverDiv.style.transform = "translateX(-50%)";
            }
          } else {
            window.open(card.imgLarge, "_blank");
          }
        } catch (err) {
          console.error(`Failed to load card "${name}"`, err);
        }
      });
    });
    if (isMobile) {
      document.addEventListener("click", (e) => {
        const tappedCard = e.target.closest(".hover-card");
        if (!tappedCard) {
          hoverDiv.style.display = "none";
          lastTapped = null;
        }
      });
    }
  }
  async function loadHover(name, e, cardCache, fetchCard2) {
    const card = getCardFromCache(cardCache, name);
    if (card && card.imgSmall) {
      showHover(card.imgSmall);
      if (!isMobile) positionHover(e);
      return;
    }
    try {
      const fetchedCard = await fetchCard2(name);
      showHover(fetchedCard.imgSmall);
      if (!isMobile) positionHover(e);
    } catch (err) {
      console.error("Error loading hover image:", err);
    }
  }
  function showHover(url) {
    hoverDiv.innerHTML = `<img src="${url}" style="width:177px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.3);">`;
    hoverDiv.style.display = "block";
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
    hoverDiv.style.transform = "none";
  }

  // js/v3/modules/cardEmbed.js
  function renderCardEmbeds(context) {
    const { fetchCard: fetchCard2 } = context;
    document.querySelectorAll(".ygo-card-embed").forEach(async (embedDiv) => {
      const cardName = embedDiv.getAttribute("data-card-name");
      try {
        const card = await fetchCard2(cardName);
        renderCardEmbed(embedDiv, card);
      } catch (err) {
        console.error("Error loading card:", err);
        embedDiv.innerHTML = `<div class="ygo-error">\u274C Error loading card: ${cardName}</div>`;
      }
    });
  }
  function renderCardEmbed(embedDiv, card) {
    const imgUrl = card.card_images[0].image_url;
    const container = document.createElement("div");
    container.className = "ygo-embed-container";
    const imgContainer = document.createElement("div");
    imgContainer.className = "ygo-card-image-container";
    const imgLink = document.createElement("a");
    imgLink.href = imgUrl;
    imgLink.target = "_blank";
    imgLink.rel = "noopener nofollow";
    const img = document.createElement("img");
    img.className = "ygo-card-image";
    img.src = imgUrl;
    img.alt = card.name;
    img.loading = "lazy";
    imgLink.appendChild(img);
    imgContainer.appendChild(imgLink);
    container.appendChild(imgContainer);
    const details = document.createElement("div");
    details.className = "ygo-card-details";
    const descHTML = card.desc.replace(/\n/g, "<br><br>");
    let statsHTML = generateCardStats(card);
    const priceHTML = generatePriceInfo(card);
    details.innerHTML = `<h4 class="ygo-card-name">${card.name}</h4>
        ${statsHTML}
        <p class="ygo-card-oracle-text">${descHTML}</p>
        ${priceHTML}`;
    container.appendChild(details);
    embedDiv.innerHTML = "";
    embedDiv.appendChild(container);
  }
  function generateCardStats(card) {
    if (card.type.toLowerCase().includes('monster')) {
      return `<div class="ygo-card-stats">
                <span class="ygo-card-type">${card.type}</span>
                <span class="ygo-card-attribute">${card.attribute || ''}</span>
                ${card.level ? `<span class="ygo-card-level">Level ${card.level}</span>` : ''}
                ${card.atk !== undefined ? `<span class="ygo-card-atk">ATK/${card.atk}</span>` : ''}
                ${card.type.toLowerCase().includes('link') ? 
                  `<span class="ygo-card-def">LINK-${card.linkval}</span>` : 
                  card.def !== undefined ? `<span class="ygo-card-def">DEF/${card.def}</span>` : ''}
              </div>`;
      } else {
      return `<div class="ygo-card-stats">
                <span class="ygo-card-type">${card.type}</span>
                ${card.race ? `<span class="ygo-card-race">${card.race}</span>` : ''}
              </div>`;
      }
  }
  function generatePriceInfo(card) {
    const tcgPrice = card.card_prices?.[0]?.tcgplayer_price || "N/A";
    const mkPrice = card.card_prices?.[0]?.cardmarket_price || "N/A";
    return `<p class="ygo-card-price">
        <strong>TCGplayer:</strong> $${tcgPrice}<br>
        <strong>Cardmarket:</strong> \u20AC${mkPrice}
    </p>`;
  }

  // js/v3/modules/decklistRenderer.js
  function renderDecklists(context) {
    const { fetchCards } = context;
    document.querySelectorAll(".ygo-decklist").forEach(async (section) => {
      const deckType = section.getAttribute("data-deck-section");
        const cardList = [];
        
        // Parse the HTML list
        section.querySelectorAll("li").forEach(li => {
            const text = li.textContent.trim();
            // Check if there's a quantity specified (e.g., "3x Card Name")
            const match = text.match(/^(\d+)x\s+(.+)$/);
            if (match) {
                const [_, quantity, cardName] = match;
                cardList.push(`${cardName} x${quantity}`);
            } else {
                cardList.push(text); // No quantity specified, use as is
            }
        });
      
      try {
            const cards = await fetchCards(cardList);
            await renderDeckSection(section, deckType, cardList, cards);
      } catch (err) {
        console.error("Error loading decklist:", err);
        section.innerHTML = `<div class="ygo-error">❌ Error loading decklist: ${err.message}</div>`;
      }
    });
  }
  async function renderDeckSection(container, section, cardList, availableCards) {
    console.log(`Rendering deck section ${section}`);
      
    const sectionElement = document.createElement('div');
    sectionElement.className = 'ygo-deck-section';
    
    const cardEntries = [];
    for (const entry of cardList) {
        try {
            const { quantity, name } = parseQuantity(entry);
            
            // Try exact match first
            let cardData = availableCards.find(c => 
                c.name.toLowerCase() === name.toLowerCase() ||
                c.card?.name.toLowerCase() === name.toLowerCase()
            );
            
            // If no exact match, try fuzzy match
            if (!cardData) {
                cardData = availableCards.find(c => {
                    const cardName = (c.name || c.card?.name || '').toLowerCase();
                    const searchName = name.toLowerCase();
                    return cardName.includes(searchName) || searchName.includes(cardName);
                });
            }
            
            if (!cardData || (!cardData.card && !cardData.imgSmall)) {
                console.warn(`⚠️ Card not found: ${name}`);
                // Add placeholder for each copy
                for (let i = 0; i < quantity; i++) {
                    cardEntries.push({
                        html: `<div class="ygo-card-entry ygo-card-missing">
                                <div class="ygo-card-placeholder"></div>
                                <div class="ygo-card-details">
                                    <span class="ygo-card-name">${name}</span>
                                    <span class="ygo-card-error">Card not found</span>
                                </div>
                            </div>`
                    });
                }
                continue;
            }

            // Handle both direct card objects and nested card objects
            const card = cardData.card || cardData;
            const imgUrl = card.imgSmall || card.card_images?.[0]?.image_url_small;
            const largeImgUrl = card.imgLarge || card.card_images?.[0]?.image_url;
            
            // Add an entry for each copy of the card
            for (let i = 0; i < quantity; i++) {
                cardEntries.push({
                    html: `<div class="ygo-card-entry" data-card-id="${card.id}">
                            <a href="${largeImgUrl}" target="_blank">
                                <img src="${imgUrl}" alt="${card.name}" loading="lazy">
                            </a>
                            <div class="ygo-card-details">
                                <a href="${largeImgUrl}" target="_blank" class="ygo-card-name">
                                    ${card.name}
                                </a>
                            </div>
                        </div>`,
                    name: card.name
                });
            }
        } catch (err) {
            console.error(`❌ Error rendering card entry: ${entry}`, err);
        }
    }

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'ygo-cards';
    cardsContainer.innerHTML = cardEntries.map(entry => entry.html).join('');
    sectionElement.appendChild(cardsContainer);
    
    container.innerHTML = ''; // Clear the container
    container.appendChild(sectionElement);
    console.log(`✅ Rendered ${cardEntries.length} cards in section ${section}`);
    return cardEntries;
  }

  // js/v3/modules/styles-generated.js
  const styles = `/* == YGO Embed and Decklist Styles v3.0 == */

.ygo-embed-container {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-direction: row;
    background-color: #394042;
    border-radius: 8px;
    padding: 16px;
    margin: 16px 0;
    border: 2px solid #5c696d;
    color: #ffffff;
}

@media (max-width: 600px) {
    .ygo-embed-container {
        flex-direction: column;
        align-items: center;
    }
}

.ygo-card-image-container {
    flex: 0 0 auto;
    text-align: center;
}

.ygo-card-image {
    width: 250px;
    height: 364px;
    object-fit: cover;
    cursor: zoom-in;
    border: none;
    display: block;
    margin: 0 auto;
}

.ygo-card-details {
    line-height: 1.5;
    color: #ffffff;
    flex: 1;
}

.ygo-card-name {
    margin: 0 0 8px;
    font-size: 1.2em;
    color: #ffffff;
}

.ygo-card-type-line,
.ygo-card-oracle-text,
.ygo-card-price {
    margin: 4px 0;
    color: #ffffff;
}

.ygo-card-price {
    font-size: 0.9em;
}

.hover-card {
    color: #d8232f;
    font-weight: bold;
    cursor: pointer;
    text-decoration: none;
}

.hover-card:hover {
    opacity: 0.8;
}

.ygo-decklist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
    margin: 12px 0;
    padding: 0;
}

.ygo-decklist-card {
    text-align: center;
    font-size: 0.8em;
    line-height: 1.3;
}

.ygo-decklist-card img {
    width: 100%;
    max-width: 120px;
    height: auto;
    border-radius: 2px !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    margin-bottom: 4px;
    display: block;
    margin-left: auto;
    margin-right: auto;
    cursor: zoom-in;
}

.ygo-decklist-card .card-qty {
    display: block;
    margin-top: 2px;
    font-weight: bold;
    color: #fff;
}

.ygo-decklist-card a {
    color: #fff;
    text-decoration: none;
    font-weight: bold;
    display: block;
    margin-top: 4px;
    cursor: pointer;
}

.ygo-loading {
    text-align: center;
    padding: 20px;
    color: #fff;
    font-style: italic;
}

.ygo-error {
    color: #ff6b6b;
    padding: 10px;
    border-left: 3px solid #ff6b6b;
    margin: 10px 0;
    font-size: 0.9em;
}

/* New Card Stats Styles */
.ygo-card-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 8px 0;
    font-size: 0.9em;
}

.ygo-card-stats span {
    background: rgba(255, 255, 255, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
    color: #fff;
}

.ygo-card-type {
    font-weight: bold;
    background: rgba(255, 255, 255, 0.2) !important;
}

.ygo-card-attribute {
    color: #ff6b6b !important;
}

.ygo-card-level {
    color: #ffd700 !important;
}

.ygo-card-atk, .ygo-card-def {
    font-family: monospace;
    background: rgba(255, 255, 255, 0.15) !important;
}

.ygo-card-race {
    font-style: italic;
}

/* Deck List Styles with maximum specificity */
.dib-post-content .ygo-deck-section,
.dib-post-content > div > .ygo-deck-section,
.dib-post-content > p > .ygo-deck-section,
.dib-post-content div.ygo-deck-section,
.dib-post-content > * > .ygo-deck-section {
    margin: 24px 0 32px 0 !important;  /* Increased bottom margin to 32px */
    padding: 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
    max-width: none !important;
}

/* Last deck section should have extra bottom margin */
.dib-post-content .ygo-deck-section:last-of-type,
.dib-post-content > div > .ygo-deck-section:last-of-type,
.dib-post-content div.ygo-deck-section:last-of-type {
    margin-bottom: 40px !important;
}

/* First deck section should have less top margin if it follows a heading */
.dib-post-content h1 + .ygo-deck-section,
.dib-post-content h2 + .ygo-deck-section,
.dib-post-content h3 + .ygo-deck-section,
.dib-post-content h4 + .ygo-deck-section,
.dib-post-content h5 + .ygo-deck-section,
.dib-post-content h6 + .ygo-deck-section {
    margin-top: 16px !important;
}

/* Target any DIB container that has our deck section */
.dib-post-content div:has(.ygo-deck-section),
.dib-post-content p:has(.ygo-deck-section),
.dib-post-content > div:has(> .ygo-deck-section),
.dib-post-content > p:has(> .ygo-deck-section) {
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
    width: 100% !important;
}

/* Reset margins and padding ONLY for deck section containers */
.dib-post-content > div.ygo-deck-section,
.dib-post-content > p.ygo-deck-section {
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
}

/* Force spacing between consecutive deck sections */
.dib-post-content .ygo-deck-section + .ygo-deck-section {
    margin-top: 2px !important;
}

/* Target the grid container with maximum specificity */
.dib-post-content .ygo-deck-section .ygo-cards,
.dib-post-content div.ygo-deck-section .ygo-cards,
.dib-post-content > div > .ygo-deck-section .ygo-cards {
    display: grid !important;
    grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
    gap: 12px 4px !important;  /* Increased vertical gap */
    margin: 2px 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: none !important;
}

/* Card entry styles with maximum specificity */
.dib-post-content .ygo-deck-section .ygo-card-entry,
.dib-post-content div.ygo-deck-section .ygo-card-entry {
    margin: 0 0 16px 0 !important;  /* Increased bottom margin */
    padding: 0 !important;
    text-align: center !important;
    width: 100% !important;
}

/* Image styles with maximum specificity and shadow removal */
.dib-post-content .ygo-deck-section .ygo-card-entry img,
.dib-post-content div.ygo-deck-section .ygo-card-entry img,
.dib-post-content .ygo-deck-section .ygo-card-entry a > img,
.dib-post-content div.ygo-deck-section .ygo-card-entry a > img,
.dib-post-content [class*="dib"] .ygo-deck-section img,
.dib-post-content [class*="dib"] .ygo-card-entry img {
    width: 100% !important;
    max-width: 100px !important;
    height: auto !important;
    margin: 0 auto !important;
    padding: 0 !important;
    display: block !important;
    border-radius: 2px !important;
    box-shadow: none !important;
    -webkit-box-shadow: none !important;
    -moz-box-shadow: none !important;
    filter: none !important;
    -webkit-filter: none !important;
    transform: none !important;
    -webkit-transform: none !important;
    border: none !important;
    cursor: zoom-in !important;
}

/* Ensure links have the same cursor */
.dib-post-content .ygo-deck-section .ygo-card-entry a,
.dib-post-content div.ygo-deck-section .ygo-card-entry a,
.dib-post-content [class*="dib"] .ygo-card-entry a {
    box-shadow: none !important;
    -webkit-box-shadow: none !important;
    -moz-box-shadow: none !important;
    filter: none !important;
    -webkit-filter: none !important;
    transform: none !important;
    -webkit-transform: none !important;
    text-decoration: none !important;
}

/* Separate cursor styles for images and text */
.dib-post-content .ygo-deck-section .ygo-card-entry a:has(img) {
    cursor: zoom-in !important;
}

.dib-post-content .ygo-deck-section .ygo-card-entry a.ygo-card-name {
    cursor: pointer !important;
}

/* Card name styles with maximum specificity */
.dib-post-content .ygo-deck-section .ygo-card-entry .ygo-card-name,
.dib-post-content div.ygo-deck-section .ygo-card-entry .ygo-card-name {
    font-size: 0.85em !important;
    line-height: 1.4 !important;  /* Increased line height */
    margin: 6px 0 0 0 !important;  /* Increased top margin */
    padding: 0 4px !important;  /* Added horizontal padding */
    display: block !important;
    text-align: center !important;
    color: #ffffff !important;
    min-height: 2.8em !important;  /* Set minimum height for 2 lines */
}

/* Mobile adjustments */
@media (max-width: 768px) {
    .dib-post-content .ygo-deck-section .ygo-cards,
    .dib-post-content div.ygo-deck-section .ygo-cards {
        grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    }
}

@media (max-width: 480px) {
    .dib-post-content .ygo-deck-section .ygo-cards,
    .dib-post-content div.ygo-deck-section .ygo-cards {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
}

/* Additional overrides for DIB containers containing our components */
.dib-post-content > div[class*="dib"]:has(.ygo-deck-section),
.dib-post-content > p[class*="dib"]:has(.ygo-deck-section) {
    margin: 0 !important;
    padding: 0 !important;
    max-width: none !important;
    width: 100% !important;
}

/* Reset spacing ONLY for deck section components */
.dib-post-content .ygo-deck-section *,
.dib-post-content .ygo-cards *,
.dib-post-content .ygo-card-entry * {
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    max-width: none !important;
}

/* Add back normal spacing for regular blog content */
.dib-post-content p:not(:has(.ygo-deck-section, .ygo-card-embed)) {
    margin: 1em 0 !important;
}

.dib-post-content h1, 
.dib-post-content h2, 
.dib-post-content h3, 
.dib-post-content h4, 
.dib-post-content h5, 
.dib-post-content h6 {
    margin: 1.5em 0 0.5em !important;
}

.dib-post-content ul:not(.ygo-cards),
.dib-post-content ol {
    margin: 1em 0 !important;
    padding-left: 2em !important;
}

.dib-post-content li:not(.ygo-card-entry) {
    margin: 0.5em 0 !important;
}
`;

  // Add styles to document
  if (!document.getElementById("ygo-embed-styles")) {
    const styleSheet = document.createElement("style");
    styleSheet.id = "ygo-embed-styles";
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    console.log("✅ YGO embed styles loaded");
  }

  // js/v3/modules/contentParser.js
  var CARD_EMBED_REGEX = /^embed::(.+)$/;

  function convertMarkup(container) {
    container.querySelectorAll("p").forEach((p) => {
        const text = p.textContent.trim();
        const embedMatch = text.match(CARD_EMBED_REGEX);
        if (embedMatch) {
            try {
                convertCardEmbed(p, embedMatch[1]);
            } catch (err) {
                console.error("Error parsing card embed:", err);
                p.innerHTML = `<div class="ygo-error">❌ Error parsing card embed: ${err.message}</div>`;
            }
        }
    });
  }

  function convertCardEmbed(p, cardName) {
    if (!cardName || cardName.trim().length === 0) {
        throw new Error("Card name cannot be empty");
    }
    const container = document.createElement("div");
    container.className = "ygo-card-embed";
    container.setAttribute("data-card-name", cardName.trim());
    p.parentNode.replaceChild(container, p);
  }

  // Wait for DropInBlog content to be ready
  const waitForDropInBlog = () => {
    return new Promise((resolve) => {
      const check = () => {
        const dibContent = document.querySelector('.dib-post-content');
        if (dibContent) {
          console.log('✅ DropInBlog content ready');
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  };

  // Main initialization function
  const init = async () => {
    try {
      // Wait for DropInBlog content
      await waitForDropInBlog();
      
      // Initialize cache and request queue
      const cardCache = initCache();
      const requestQueue = setupRequestQueue(cardCache);
      
      // Setup context for all modules
      const context = {
        cardCache,
        requestQueue,
        fetchCard: (name) => fetchCard(name, cardCache, requestQueue),
        fetchCards: (names) => fetchCards(names, cardCache, requestQueue)
      };
      
      // Setup periodic cache saving
      const saveInterval = CACHE.SAVE_INTERVAL;
      const saveIntervalId = setInterval(() => saveCardCache(cardCache), saveInterval);
      
      // Save cache before page unload
      window.addEventListener('beforeunload', () => saveCardCache(cardCache));
      
      // Convert card embeds in DropInBlog content
      const dibContent = document.querySelector('.dib-post-content');
      if (dibContent) {
        convertMarkup(dibContent);
      }
      
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
      
      console.log('✅ YGO embed script initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing YGO embed script:', error);
    }
  };

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // js/v3/modules/api.js
  async function fetchCardBatch(cardNames) {
    const uniqueNames = [...new Set(cardNames.map(name => {
        // Clean the name and remove quantity indicators
        return name.replace(/\s*x\s*\d+$/i, '').trim();
    }))];
    
    if (uniqueNames.length === 0) return [];
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API.TIMEOUT);
    
    console.log('Fetching batch:', uniqueNames);
    
    // Fetch cards one by one for more accurate results
    const allCards = [];
    for (const name of uniqueNames) {
        try {
            // Try exact name match first
            let params = new URLSearchParams({
                name: name,  // Use exact name matching first
            });
            
            let url = `${API.BASE_URL}/cardinfo.php?${params.toString()}`;
            console.log(`Fetching card "${name}" with exact match from:`, url);
            
            let response = await fetch(url, {
                method: 'GET',
                signal: controller.signal
            });
            
            // If exact match fails, try fuzzy search
            if (!response.ok) {
                params = new URLSearchParams({
                    fname: name,  // Fallback to fuzzy name matching
                });
                
                url = `${API.BASE_URL}/cardinfo.php?${params.toString()}`;
                console.log(`Retrying card "${name}" with fuzzy match from:`, url);
                
                response = await fetch(url, {
                    method: 'GET',
                    signal: controller.signal
                });
            }
            
            if (response.ok) {
                const data = await response.json();
                if (data.data && data.data.length > 0) {
                    // Try exact match first (case-insensitive)
                    let bestMatch = data.data.find(card => 
                        card.name.toLowerCase() === name.toLowerCase()
                    );
                    
                    // If no exact match, try fuzzy match
                    if (!bestMatch) {
                        const nameParts = name.toLowerCase().split(/[,&]/);
                        bestMatch = data.data.find(card => {
                            const cardName = card.name.toLowerCase();
                            // Check if all parts of the search name are in the card name
                            return nameParts.every(part => 
                                cardName.includes(part.trim())
                            );
                        });
                    }
                    
                    // If still no match, take the first result
                    if (!bestMatch) {
                        bestMatch = data.data[0];
                    }
                    
                    allCards.push(bestMatch);
                    console.log(`Found card "${name}":`, bestMatch);
                } else {
                    console.warn(`No results found for card "${name}"`);
                }
            } else {
                console.warn(`Failed to fetch card "${name}": ${response.status}`);
            }
        } catch (err) {
            console.error(`Error fetching card "${name}":`, err);
        }
        
        // Add a small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    clearTimeout(timeoutId);
    return allCards;
  }
})();
//# sourceMappingURL=ygo-embed-v3.4.js.map
