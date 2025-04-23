(() => {
  // js/v3/modules/cache.js
  var CACHE_VERSION = "ygo-cache-v2";
  var CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1e3;
  function initCache() {
    try {
      const cachedData = localStorage.getItem(CACHE_VERSION);
      if (cachedData) {
        const parsedCache = JSON.parse(cachedData);
        if (parsedCache.timestamp && Date.now() - parsedCache.timestamp < CACHE_EXPIRY) {
          console.log(`\u2705 Loaded ${Object.keys(parsedCache.cards).length} cached cards from localStorage`);
          return parsedCache.cards;
        } else {
          console.log("\u26A0\uFE0F Card cache expired, creating new cache");
        }
      }
    } catch (err) {
      console.warn("\u26A0\uFE0F Error loading card cache from localStorage", err);
    }
    return {};
  }
  function saveCardCache(cardCache) {
    try {
      const cacheData = {
        timestamp: Date.now(),
        cards: cardCache
      };
      localStorage.setItem(CACHE_VERSION, JSON.stringify(cacheData));
      console.log(`\u2705 Saved ${Object.keys(cardCache).length} cards to cache`);
    } catch (err) {
      console.warn("\u26A0\uFE0F Error saving card cache to localStorage", err);
      if (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED") {
        try {
          const keys = Object.keys(cardCache);
          const keysToRemove = keys.slice(0, Math.floor(keys.length / 2));
          keysToRemove.forEach((key) => delete cardCache[key]);
          localStorage.setItem(CACHE_VERSION, JSON.stringify({
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
    if (cardCache[name] && cardCache[name].complete) {
      return cardCache[name];
    }
    const cardName = Object.keys(cardCache).find(
      (key) => key.toLowerCase() === name.toLowerCase()
    );
    if (cardName && cardCache[cardName].complete) {
      return cardCache[cardName];
    }
    return null;
  }
  function addCardToCache(cardCache, card) {
    const cardName = card.name.trim();
    cardCache[cardName] = {
      ...card,
      imgSmall: card.card_images[0].image_url_small,
      imgLarge: card.card_images[0].image_url,
      complete: true
    };
  }

  // js/v3/modules/api.js
  var API_BASE_URL = "https://db.ygoprodeck.com/api/v7";
  var REQUEST_BATCH_SIZE = 10;
  var REQUEST_TIMEOUT = 1e4;
  function setupRequestQueue(cardCache) {
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
        const batch = this.pending.splice(0, REQUEST_BATCH_SIZE);
        const cardNames = batch.map((item) => item.cardName);
        try {
          const missingCards = cardNames.filter((name) => !cardCache[name] || !cardCache[name].complete);
          if (missingCards.length > 0) {
            await this.fetchCardBatch(missingCards);
          }
          for (const item of batch) {
            if (cardCache[item.cardName] && cardCache[item.cardName].complete) {
              item.resolve(cardCache[item.cardName]);
            } else {
              item.reject(new Error(`Failed to load card: ${item.cardName}`));
            }
          }
        } catch (error) {
          for (const item of batch) {
            item.reject(error);
          }
        }
        setTimeout(() => this.processQueue(), 50);
      },
      async fetchCardBatch(cardNames) {
        const uniqueNames = [...new Set(cardNames)].map((name) => name.trim());
        if (uniqueNames.length === 0) return [];
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
          let response;
          if (uniqueNames.length === 1) {
            response = await fetch(
              `${API_BASE_URL}/cardinfo.php?name=${encodeURIComponent(uniqueNames[0])}`,
              { signal: controller.signal }
            );
          } else {
            const params = new URLSearchParams();
            uniqueNames.forEach((name) => params.append("fname", name));
            response = await fetch(`${API_BASE_URL}/cardinfo.php`, {
              method: "POST",
              body: params,
              headers: {
                "Content-Type": "application/x-www-form-urlencoded"
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
            throw new Error("No card data found");
          }
          data.data.forEach((card) => {
            addCardToCache(cardCache, card);
          });
          const missingCards = uniqueNames.filter(
            (name) => !Object.keys(cardCache).some(
              (key) => key.toLowerCase() === name.toLowerCase()
            )
          );
          if (missingCards.length > 0) {
            console.warn(`\u26A0\uFE0F Some cards were not found in the API: ${missingCards.join(", ")}`);
          }
          return data.data;
        } catch (err) {
          console.error(`\u274C Batch fetch error for cards: ${uniqueNames.join(", ")}`, err);
          throw err;
        }
      }
    };
    return requestQueue;
  }

  // js/v3/modules/cardFetcher.js
  async function fetchCard(name, cardCache, requestQueue) {
    const cachedCard = getCardFromCache(cardCache, name);
    if (cachedCard) {
      return cachedCard;
    }
    return new Promise((resolve, reject) => {
      requestQueue.add(name, resolve, reject);
    });
  }
  async function fetchCards(cardNames, cardCache, requestQueue) {
    const uniqueNames = [...new Set(cardNames.map((name) => name.trim()))];
    const cachedCards = uniqueNames.filter((name) => getCardFromCache(cardCache, name) !== null).map((name) => getCardFromCache(cardCache, name));
    const uncachedNames = uniqueNames.filter(
      (name) => getCardFromCache(cardCache, name) === null
    );
    if (uncachedNames.length === 0) {
      return cachedCards;
    }
    try {
      const cardPromises = uncachedNames.map(
        (name) => fetchCard(name, cardCache, requestQueue)
      );
      const fetchedCards = await Promise.all(cardPromises);
      return [...cachedCards, ...fetchedCards];
    } catch (err) {
      console.error("Error batch fetching cards:", err);
      throw err;
    }
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
    let statsHTML = `<div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:8px;margin-bottom:12px;">`;
    statsHTML += `<div><strong>Type:</strong> ${card.type}</div>`;
    if (card.type.includes("Monster")) {
      statsHTML += `<div><strong>Attribute:</strong> ${card.attribute || "N/A"}</div>`;
      statsHTML += `<div><strong>Typing:</strong> ${card.race}</div>`;
      statsHTML += `<div><strong>Level/Rank:</strong> ${card.level || card.rank || "N/A"}</div>`;
      statsHTML += `<div><strong>ATK:</strong> ${card.atk !== void 0 ? card.atk : "N/A"}</div>`;
      if (card.linkval !== void 0) {
        statsHTML += `<div><strong>Link:</strong> ${card.linkval}</div>`;
      } else {
        statsHTML += `<div><strong>DEF:</strong> ${card.def !== void 0 ? card.def : "N/A"}</div>`;
      }
    }
    statsHTML += `</div>`;
    return statsHTML;
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
    const { fetchCards: fetchCards2 } = context;
    document.querySelectorAll(".ygo-decklist").forEach(async (section) => {
      const titleMap = {
        main: "Main Deck",
        extra: "Extra Deck",
        side: "Side Deck",
        upgrade: null
      };
      const deckType = section.getAttribute("data-deck-section");
      const names = JSON.parse(section.getAttribute("data-card-names"));
      try {
        await renderDeckSection(section, names, deckType, titleMap, fetchCards2);
      } catch (err) {
        console.error("Error loading decklist:", err);
        section.innerHTML = `<div class="ygo-error">\u274C Error loading decklist: ${err.message}</div>`;
      }
    });
  }
  async function renderDeckSection(section, names, deckType, titleMap, fetchCards2) {
    const container = document.createElement("div");
    container.className = "ygo-deck-section";
    if (titleMap[deckType]) {
      container.innerHTML = `<h3 class="ygo-deck-title">${titleMap[deckType]}</h3>`;
    }
    const grid = document.createElement("div");
    grid.className = "ygo-decklist-grid";
    const cardsToFetch = [];
    const cardQuantities = {};
    for (let entry of names) {
      const [name, qtyStr] = entry.split(/\sx(\d+)$/);
      const cardName = name.trim();
      const qty = parseInt(qtyStr) || 1;
      cardsToFetch.push(cardName);
      cardQuantities[cardName] = qty;
    }
    const allCards = await fetchCards2(cardsToFetch);
    const cardsByName = {};
    allCards.forEach((card) => {
      cardsByName[card.name.trim()] = card;
    });
    for (let cardName of cardsToFetch) {
      const card = cardsByName[cardName] || Object.values(cardsByName).find((c) => c.name.toLowerCase() === cardName.toLowerCase());
      if (!card) {
        console.warn(`\u274C Could not find card: ${cardName}`);
        continue;
      }
      const qty = cardQuantities[cardName];
      for (let i = 0; i < qty; i++) {
        const cardElement = createCardElement(card, cardName);
        grid.appendChild(cardElement);
      }
    }
    container.appendChild(grid);
    section.innerHTML = "";
    section.appendChild(container);
  }
  function createCardElement(card, cardName) {
    const cardDiv = document.createElement("div");
    cardDiv.className = "ygo-decklist-card";
    const img = document.createElement("img");
    img.src = card.card_images[0].image_url_small;
    img.alt = cardName;
    img.title = cardName;
    img.loading = "lazy";
    img.style.cursor = "zoom-in";
    img.addEventListener("click", () => window.open(card.card_images[0].image_url, "_blank"));
    const nameLink = document.createElement("a");
    nameLink.textContent = cardName;
    nameLink.href = card.card_images[0].image_url;
    nameLink.target = "_blank";
    nameLink.rel = "noopener nofollow";
    nameLink.style.display = "block";
    nameLink.style.marginTop = "4px";
    nameLink.style.color = "#fff";
    nameLink.style.textDecoration = "none";
    nameLink.style.cursor = "pointer";
    if (card.type) {
      if (card.type.includes("Monster")) {
        cardDiv.classList.add("ygo-monster-card");
      } else if (card.type.includes("Spell")) {
        cardDiv.classList.add("ygo-spell-card");
      } else if (card.type.includes("Trap")) {
        cardDiv.classList.add("ygo-trap-card");
      }
    }
    cardDiv.appendChild(img);
    cardDiv.appendChild(nameLink);
    return cardDiv;
  }

  // js/v3/modules/contentParser.js
  function convertMarkup() {
    document.querySelectorAll("p").forEach((p) => {
      const matchEmbed = p.textContent.trim().match(/^embed::(.+)$/i);
      const matchDeck = p.textContent.trim().match(/^deck::(main|extra|side|upgrade)::\[(.*)\]$/i);
      if (matchEmbed) {
        convertCardEmbed(p, matchEmbed[1].trim());
      } else if (matchDeck) {
        convertDeckList(p, matchDeck[1], matchDeck[2]);
      }
    });
  }
  function convertCardEmbed(p, cardName) {
    const wrapper = document.createElement("div");
    wrapper.className = "ygo-card-embed";
    wrapper.setAttribute("data-card-name", cardName);
    wrapper.innerHTML = '<div class="ygo-loading">Loading card...</div>';
    p.replaceWith(wrapper);
  }
  function convertDeckList(p, section, cardListStr) {
    try {
      const names = JSON.parse(`[${cardListStr}]`);
      const container = document.createElement("div");
      container.className = "ygo-decklist";
      container.setAttribute("data-deck-section", section);
      container.setAttribute("data-card-names", JSON.stringify(names));
      container.innerHTML = '<div class="ygo-loading">Loading deck...</div>';
      p.replaceWith(container);
    } catch (err) {
      console.error("Error parsing deck list:", err);
      p.classList.add("ygo-error");
      p.innerHTML = `\u274C Error parsing deck list: ${err.message}`;
    }
  }

  // js/v3/modules/styles-generated.js
  var styles = `/* == YGO Embed and Decklist Styles v3.0 == */

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
    font-family: Arial, sans-serif;
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
} `;
  var styles_generated_default = styles;

  // js/v3/modules/styles.js
  function loadStyles() {
    if (!document.getElementById("ygo-embed-styles")) {
      const style = document.createElement("style");
      style.id = "ygo-embed-styles";
      style.textContent = styles_generated_default;
      document.head.appendChild(style);
      console.log("\u2705 YGO embed styles loaded");
    }
  }

  // js/v3/ygo-embed-v3-modular.js
  document.addEventListener("DOMContentLoaded", async function() {
    console.log("\u2705 YGO embed script v3.0 loaded");
    loadStyles();
    const cardCache = initCache();
    const requestQueue = setupRequestQueue(cardCache);
    const context = {
      cardCache,
      requestQueue,
      fetchCard: (name) => fetchCard(name, cardCache, requestQueue),
      fetchCards: (names) => fetchCards(names, cardCache, requestQueue)
    };
    const saveInterval = 6e4;
    const saveIntervalId = setInterval(() => saveCardCache(cardCache), saveInterval);
    window.addEventListener("beforeunload", () => saveCardCache(cardCache));
    convertMarkup();
    setupHoverPreviews(context);
    renderCardEmbeds(context);
    renderDecklists(context);
    window.addEventListener("unload", () => {
      clearInterval(saveIntervalId);
      saveCardCache(cardCache);
    });
  });
})();
//# sourceMappingURL=ygo-embed-v3-bundled.js.map
