// Card Embed module - handles rendering of individual card embeds
// Provides functionality to render detailed card displays

/**
 * Render all card embeds on the page
 * @param {Object} context Context containing card cache and fetch methods
 */
export function renderCardEmbeds(context) {
    const { fetchCard } = context;
    
    document.querySelectorAll('.ygo-card-embed').forEach(async embedDiv => {
        const cardName = embedDiv.getAttribute('data-card-name');
        try {
            const card = await fetchCard(cardName);
            renderCardEmbed(embedDiv, card);
        } catch (err) {
            console.error('Error loading card:', err);
            embedDiv.innerHTML = `<div class="ygo-error">❌ Error loading card: ${cardName}</div>`;
        }
    });
}

/**
 * Render a single card embed
 * @param {HTMLElement} embedDiv The div to render the card into
 * @param {Object} card The card data
 */
function renderCardEmbed(embedDiv, card) {
    const imgUrl = card.card_images[0].image_url;

    const container = document.createElement('div');
    container.className = 'ygo-embed-container';

    // Create image container
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
    img.loading = 'lazy'; // Lazy load images

    imgLink.appendChild(img);
    imgContainer.appendChild(imgLink);
    container.appendChild(imgContainer);

    // Create details container
    const details = document.createElement('div');
    details.className = 'ygo-card-details';

    // Format description text
    const descHTML = card.desc.replace(/\n/g, '<br><br>');

    // Generate card stats grid
    let statsHTML = generateCardStats(card);

    // Generate price information
    const priceHTML = generatePriceInfo(card);

    // Set details HTML
    details.innerHTML = 
        `<h4 class="ygo-card-name">${card.name}</h4>
        ${statsHTML}
        <p class="ygo-card-oracle-text">${descHTML}</p>
        ${priceHTML}`;

    container.appendChild(details);
    embedDiv.innerHTML = '';
    embedDiv.appendChild(container);
}

/**
 * Generate HTML for card stats
 * @param {Object} card The card data
 * @returns {string} HTML for card stats
 */
function generateCardStats(card) {
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
    return statsHTML;
}

/**
 * Generate HTML for price information
 * @param {Object} card The card data
 * @returns {string} HTML for price information
 */
function generatePriceInfo(card) {
    const tcgPrice = card.card_prices?.[0]?.tcgplayer_price || 'N/A';
    const mkPrice = card.card_prices?.[0]?.cardmarket_price || 'N/A';

    return `<p class="ygo-card-price">
        <strong>TCGplayer:</strong> $${tcgPrice}<br>
        <strong>Cardmarket:</strong> €${mkPrice}
    </p>`;
} 