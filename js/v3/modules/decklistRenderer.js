// Deck List Renderer module - handles rendering deck lists with card images and details
// Provides functionality to display deck sections with proper layout and error handling

/**
 * Render all decklists on the page
 * @param {Object} context Context containing card cache and fetch methods
 */
export function renderDecklists(context) {
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

/**
 * Normalize a card name for comparison
 * @param {string} name The card name to normalize
 * @returns {string} The normalized card name
 */
function normalizeCardName(name) {
    return name.toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, ' ')     // Normalize spaces
        .trim();
}

/**
 * Parse quantity from a deck list entry
 * @param {string} entry The deck list entry (e.g. "Dark Magician x3" or "3x Blue-Eyes")
 * @returns {{name: string, quantity: number}} The parsed name and quantity
 */
function parseQuantity(entry) {
    const match = entry.match(/^(?:(\d+)\s*x\s*(.+)|(.+?)\s*x\s*(\d+)|(.+))$/i);
    if (!match) {
        throw new Error(`Invalid card entry format: ${entry}`);
    }
    
    // Handle different formats
    const name = (match[2] || match[3] || match[5] || '').trim();
    const quantity = parseInt(match[1] || match[4] || '1', 10);
    
    return { name, quantity };
}

/**
 * Find best matching card from available cards
 * @param {string} searchName The card name to search for
 * @param {Array<Object>} availableCards Array of card objects with names
 * @returns {Object|null} The best matching card or null if no match
 */
function findBestMatch(searchName, availableCards) {
    const normalized = normalizeCardName(searchName);
    const exactMatch = availableCards.find(
        (card) => normalizeCardName(card.name) === normalized
    );
    if (exactMatch) return exactMatch;
    const partialMatches = availableCards.filter((card) => {
        const cardNorm = normalizeCardName(card.name);
        return cardNorm.includes(normalized) || normalized.includes(cardNorm);
    });
    if (partialMatches.length > 0) {
        return partialMatches.reduce((best, current) => {
            const bestDiff = Math.abs(normalizeCardName(best.name).length - normalized.length);
            const currentDiff = Math.abs(normalizeCardName(current.name).length - normalized.length);
            return currentDiff < bestDiff ? current : best;
        });
    }
    return null;
}

/**
 * Render a deck section with card images and details
 * @param {HTMLElement} container The deck list container element
 * @param {string} section The deck section name
 * @param {Array<string>} cardList List of card entries
 * @param {Array<Object>} availableCards Array of available card objects
 */
export async function renderDeckSection(container, section, cardList, availableCards) {
    console.log(`Rendering section ${section} with cards:`, cardList);
    console.log('Available cards:', availableCards);

    const sectionElement = document.createElement('div');
    sectionElement.className = 'ygo-deck-section';
    
    if (section) {
        const sectionTitle = document.createElement('h3');
        sectionTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1) + ' Deck';
        sectionElement.appendChild(sectionTitle);
    }

    const cardEntries = [];
    for (const entry of cardList) {
        try {
            const { quantity, name } = parseQuantity(entry);
            console.log(`Processing card: ${name} (Quantity: ${quantity})`);
            
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
                console.log('Card data:', cardData);
                cardEntries.push({
                    html: `<div class="ygo-card-entry ygo-card-missing">
                            <div class="ygo-card-placeholder">
                                <span class="ygo-card-quantity">${quantity}x</span>
                            </div>
                            <div class="ygo-card-details">
                                <span class="ygo-card-name">${name}</span>
                                <span class="ygo-card-error">Card not found</span>
                            </div>
                        </div>`
                });
                continue;
            }

            // Handle both direct card objects and nested card objects
            const card = cardData.card || cardData;
            const imgUrl = card.imgSmall || card.card_images?.[0]?.image_url_small;
            
            console.log(`Found card:`, card);
            
            cardEntries.push({
                html: `<div class="ygo-card-entry" data-card-id="${card.id}">
                        <img src="${imgUrl}" alt="${card.name}" loading="lazy">
                        <div class="ygo-card-details">
                            <span class="ygo-card-quantity">${quantity}x</span>
                            <span class="ygo-card-name">${card.name}</span>
                            ${generateCardStats(card)}
                        </div>
                    </div>`,
                name: card.name
            });
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
    return cardEntries;
}

/**
 * Create a card element for the decklist
 * @param {Object} card Card data from API
 * @param {string} cardName Original card name from decklist
 * @returns {HTMLElement} Card element
 */
function createCardElement(card, cardName) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'ygo-decklist-card';
    
    const img = document.createElement('img');
    img.src = card.card_images[0].image_url_small;
    img.alt = cardName;
    img.title = cardName;
    img.loading = 'lazy';
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
    
    if (card.type) {
        if (card.type.includes('Monster')) {
            cardDiv.classList.add('ygo-monster-card');
        } else if (card.type.includes('Spell')) {
            cardDiv.classList.add('ygo-spell-card');
        } else if (card.type.includes('Trap')) {
            cardDiv.classList.add('ygo-trap-card');
        }
    }
    
    cardDiv.appendChild(img);
    cardDiv.appendChild(nameLink);
    return cardDiv;
}