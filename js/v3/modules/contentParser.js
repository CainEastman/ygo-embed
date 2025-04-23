// Content Parser module - handles converting special markup in content
// Converts deck and card embeds from text to HTML structure

/**
 * Convert all special markup in the content to HTML structure
 */
export function convertMarkup() {
    // Find all paragraph elements
    document.querySelectorAll('p').forEach(p => {
        // Check for card embed format: embed::Card Name
        const matchEmbed = p.textContent.trim().match(/^embed::(.+)$/i);
        
        // Check for decklist format: deck::section::["Card1", "Card2 x2", ...]
        const matchDeck = p.textContent.trim().match(/^deck::(main|extra|side|upgrade)::\[(.*)\]$/i);

        if (matchEmbed) {
            // Convert card embed
            convertCardEmbed(p, matchEmbed[1].trim());
        } else if (matchDeck) {
            // Convert deck list
            convertDeckList(p, matchDeck[1], matchDeck[2]);
        }
    });
}

/**
 * Convert a paragraph to a card embed
 * @param {HTMLElement} p The paragraph element
 * @param {string} cardName The card name
 */
function convertCardEmbed(p, cardName) {
    const wrapper = document.createElement('div');
    wrapper.className = 'ygo-card-embed';
    wrapper.setAttribute('data-card-name', cardName);
    wrapper.innerHTML = '<div class="ygo-loading">Loading card...</div>';
    p.replaceWith(wrapper);
}

/**
 * Convert a paragraph to a decklist
 * @param {HTMLElement} p The paragraph element
 * @param {string} section The deck section (main, extra, side, upgrade)
 * @param {string} cardListStr JSON string array of card names
 */
function convertDeckList(p, section, cardListStr) {
    try {
        // Parse the JSON array of card names
        const names = JSON.parse(`[${cardListStr}]`);
        
        // Create container element
        const container = document.createElement('div');
        container.className = 'ygo-decklist';
        container.setAttribute('data-deck-section', section);
        container.setAttribute('data-card-names', JSON.stringify(names));
        container.innerHTML = '<div class="ygo-loading">Loading deck...</div>';
        
        // Replace the paragraph with the container
        p.replaceWith(container);
    } catch (err) {
        console.error('Error parsing deck list:', err);
        // Add error class to paragraph
        p.classList.add('ygo-error');
        p.innerHTML = `❌ Error parsing deck list: ${err.message}`;
    }
} 