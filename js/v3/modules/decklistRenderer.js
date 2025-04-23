// Decklist Renderer module - handles rendering of deck lists
// Provides functionality to render collections of cards organized by deck section

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
 * Render a single deck section
 * @param {HTMLElement} section The section element to render into
 * @param {Array<string>} names Array of card names with quantities
 * @param {string} deckType The type of deck section (main, extra, side, upgrade)
 * @param {Object} titleMap Map of deck types to titles
 * @param {Function} fetchCards Function to fetch card data
 */
async function renderDeckSection(section, names, deckType, titleMap, fetchCards) {
    const container = document.createElement('div');
    container.className = 'ygo-deck-section';
    
    // Add section title if applicable
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
            const cardElement = createCardElement(card, cardName);
            grid.appendChild(cardElement);
        }
    }
    
    container.appendChild(grid);
    section.innerHTML = '';
    section.appendChild(container);
}

/**
 * Create a card element for the decklist
 * @param {Object} card The card data
 * @param {string} cardName The original card name from the list
 * @returns {HTMLElement} The card element
 */
function createCardElement(card, cardName) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'ygo-decklist-card';

    const img = document.createElement('img');
    img.src = card.card_images[0].image_url_small;
    img.alt = cardName;
    img.title = cardName;
    img.loading = 'lazy'; // Lazy load images
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
    
    // Add card type class for styling
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