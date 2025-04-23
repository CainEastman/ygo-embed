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
        // Improved quantity parsing regex
        const match = entry.match(/^(.+?)(?:\s*x\s*(\d+))?$/i);
        if (!match) continue;
        
        const cardName = match[1].trim();
        const qty = parseInt(match[2]) || 1;
        
        cardsToFetch.push(cardName);
        cardQuantities[cardName.toLowerCase()] = qty; // Store with lowercase key
    }
    
    try {
        // Fetch all cards in the decklist at once
        const allCards = await fetchCards(cardsToFetch);
        
        // Map the cards by normalized name for easy lookup
        const cardsByName = {};
        allCards.forEach(card => {
            if (!card) return;
            // Store with multiple name variations
            const normalizedName = card.name.toLowerCase().trim();
            cardsByName[normalizedName] = card;
            // Store without punctuation
            const noPunctName = normalizedName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            cardsByName[noPunctName] = card;
        });
        
        // Create DOM elements for each card
        for (let cardName of cardsToFetch) {
            const normalizedName = cardName.toLowerCase().trim();
            const noPunctName = normalizedName.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
            
            // Try different name variations
            const card = cardsByName[normalizedName] || 
                        cardsByName[noPunctName] ||
                        Object.values(cardsByName).find(c => 
                            c.name.toLowerCase().includes(normalizedName) ||
                            normalizedName.includes(c.name.toLowerCase())
                        );
            
            if (!card) {
                console.warn(`❌ Could not find card: ${cardName}`);
                continue;
            }
            
            const qty = cardQuantities[normalizedName] || 1;
            
            // Create card elements
            for (let i = 0; i < qty; i++) {
                const cardElement = createCardElement(card, cardName);
                grid.appendChild(cardElement);
            }
        }
        
        container.appendChild(grid);
        section.innerHTML = '';
        section.appendChild(container);
    } catch (err) {
        console.error('Error loading decklist:', err);
        section.innerHTML = `<div class="ygo-error">❌ Error loading decklist: ${err.message}</div>`;
    }
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