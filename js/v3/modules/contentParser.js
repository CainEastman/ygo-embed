// Content Parser module - handles parsing of card embeds and deck lists
// Provides functionality to convert special markup into embeddable elements

const DECK_LIST_REGEX = /^deck::(main|extra|side|upgrade)::\[(.*)\]$/;
const CARD_EMBED_REGEX = /^embed::(.+)$/;

/**
 * Convert special markup in paragraphs to card embeds and deck lists
 * @param {HTMLElement} container The container element to process
 */
export function convertMarkup(container) {
    // Process all paragraphs
    container.querySelectorAll('p').forEach(p => {
        const text = p.textContent.trim();
        
        // Try deck list format first
        const deckMatch = text.match(DECK_LIST_REGEX);
        if (deckMatch) {
            try {
                convertDeckList(p, deckMatch[1], deckMatch[2]);
            } catch (err) {
                console.error('Error parsing deck list:', err);
                p.innerHTML = `<div class="ygo-error">❌ Error parsing deck list: ${err.message}</div>`;
            }
            return;
        }
        
        // Try card embed format
        const embedMatch = text.match(CARD_EMBED_REGEX);
        if (embedMatch) {
            try {
                convertCardEmbed(p, embedMatch[1]);
            } catch (err) {
                console.error('Error parsing card embed:', err);
                p.innerHTML = `<div class="ygo-error">❌ Error parsing card embed: ${err.message}</div>`;
            }
        }
    });
}

/**
 * Convert a paragraph to a deck list container
 * @param {HTMLElement} p The paragraph element
 * @param {string} section The deck section (main/extra/side/upgrade)
 * @param {string} cardList The comma-separated list of cards
 */
function convertDeckList(p, section, cardList) {
    // Parse the card list, handling various formats
    let cards;
    try {
        // First try parsing as JSON
        cards = JSON.parse(cardList);
    } catch (e) {
        // If JSON parse fails, try comma-separated format
        cards = cardList.split(',')
            .map(entry => entry.trim())
            .filter(entry => entry.length > 0);
    }
    
    if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error('Invalid deck list format - must be JSON array or comma-separated list');
    }
    
    // Create deck list container
    const container = document.createElement('div');
    container.className = 'ygo-decklist';
    container.setAttribute('data-deck-section', section);
    container.setAttribute('data-card-names', JSON.stringify(cards));
    
    // Replace paragraph with container
    p.parentNode.replaceChild(container, p);
}

/**
 * Convert a paragraph to a card embed
 * @param {HTMLElement} p The paragraph element
 * @param {string} cardName The card name to embed
 */
function convertCardEmbed(p, cardName) {
    if (!cardName || cardName.trim().length === 0) {
        throw new Error('Card name cannot be empty');
    }
    
    // Create card embed container
    const container = document.createElement('div');
    container.className = 'ygo-card-embed';
    container.setAttribute('data-card-name', cardName.trim());
    
    // Replace paragraph with container
    p.parentNode.replaceChild(container, p);
} 