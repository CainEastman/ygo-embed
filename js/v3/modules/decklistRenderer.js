// Deck List Renderer module - handles rendering deck lists with card images and details
// Provides functionality to display deck sections with proper layout and error handling

/**
 * Render all decklists on the page
 * @param {Object} context Context containing card cache and fetch methods
 */
export function renderDecklists(context) {
    const { fetchCards } = context;
    
    document.querySelectorAll('.ygo-decklist').forEach(async section => {
        const titleMap = {
            main: 'Main Deck',
            extra: 'Extra Deck', 
            side: 'Side Deck',
            upgrade: null
        };
        
        const deckType = section.getAttribute('data-deck-section');
        const names = JSON.parse(section.getAttribute('data-card-names'));
        
        try {
            await renderDeckSection(section, names, deckType, titleMap, fetchCards);
        } catch (err) {
            console.error('Error loading decklist:', err);
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
    return name
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special chars except hyphen
        .replace(/\s+/g, ' ')     // Normalize whitespace
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
    
    // Try exact match first
    const exactMatch = availableCards.find(card => 
        normalizeCardName(card.name) === normalized
    );
    if (exactMatch) return exactMatch;
    
    // Try partial matches
    const partialMatches = availableCards.filter(card => {
        const cardNorm = normalizeCardName(card.name);
        return cardNorm.includes(normalized) || normalized.includes(cardNorm);
    });
    
    // Return closest match by length if any found
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
    try {
        // Create section container
        const sectionEl = document.createElement('div');
        sectionEl.className = `ygo-deck-section ygo-deck-${section}`;
        sectionEl.innerHTML = `<h3>${section.toUpperCase()} DECK</h3>`;
        
        // Process each card entry
        const processedCards = cardList.map(entry => {
            try {
                const { name, quantity } = parseQuantity(entry);
                const card = findBestMatch(name, availableCards);
                
                if (!card) {
                    console.warn(`Card not found: ${name}`);
                    return {
                        name,
                        quantity,
                        error: true,
                        html: `<div class="ygo-card-missing">
                            <span class="ygo-card-name">${name}</span>
                            <span class="ygo-card-quantity">x${quantity}</span>
                            <span class="ygo-error-msg">Card not found</span>
                        </div>`
                    };
                }
                
                return {
                    ...card,
                    quantity,
                    html: `<div class="ygo-card-entry" data-card-id="${card.id}">
                        <img src="${card.image_url}" alt="${card.name}" loading="lazy">
                        <div class="ygo-card-details">
                            <span class="ygo-card-name">${card.name}</span>
                            <span class="ygo-card-quantity">x${quantity}</span>
                        </div>
                    </div>`
                };
            } catch (err) {
                console.error('Error processing card entry:', err);
                return {
                    name: entry,
                    error: true,
                    html: `<div class="ygo-card-error">
                        <span class="ygo-error-msg">${err.message}</span>
                    </div>`
                };
            }
        });
        
        // Add cards to section
        const cardsHtml = processedCards.map(card => card.html).join('');
        sectionEl.innerHTML += `<div class="ygo-cards">${cardsHtml}</div>`;
        
        // Add section to container
        container.appendChild(sectionEl);
        
        // Return processed cards for potential further use
        return processedCards;
    } catch (err) {
        console.error('Error rendering deck section:', err);
        container.innerHTML += `<div class="ygo-error">❌ Error rendering ${section} deck: ${err.message}</div>`;
        return [];
    }
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