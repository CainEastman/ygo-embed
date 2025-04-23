// Hover Preview module - handles card hover effects
// Provides functionality for card name hover previews

import { getCardFromCache } from './cache.js';

// Detect mobile devices
const isMobile = /Mobi|Android/i.test(navigator.userAgent);
let lastTapped = null;

// Create hover div for card previews
const hoverDiv = document.createElement('div');
Object.assign(hoverDiv.style, {
    position: 'absolute',
    pointerEvents: 'none',
    zIndex: '9999',
    display: 'none',
    maxWidth: '90vw'
});

/**
 * Initialize hover preview system
 * @param {Object} context Context containing card cache and fetch methods
 */
export function setupHoverPreviews(context) {
    const { cardCache, fetchCard } = context;
    
    // Add hover div to body
    document.body.appendChild(hoverDiv);
    
    // Add scroll handler
    window.addEventListener('scroll', () => {
        if (hoverDiv.style.display === 'block' && lastTapped) {
            const rect = lastTapped.getBoundingClientRect();
            hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
            hoverDiv.style.left = '50%';
            hoverDiv.style.transform = 'translateX(-50%)';
        }
    });
    
    // Find all card references in content
    document.querySelectorAll('.dib-post-content p, .dib-post-content li, .dib-post-content h2, .dib-post-content h3, .dib-post-content h4').forEach(node => {
        node.innerHTML = node.innerHTML.replace(/\[\[([^\]]+)\]\]/g, (_, name) => 
            `<span class="hover-card" data-card-name="${name}">${name}</span>`
        );
    });
    
    // Add event listeners to all hover cards
    document.querySelectorAll('.hover-card').forEach(elem => {
        // Mouse enter event
        elem.addEventListener('mouseenter', async function(e) {
            if (isMobile) return;
            await loadHover(this.dataset.cardName, e, cardCache, fetchCard);
        });
        
        // Mouse move event
        elem.addEventListener('mousemove', e => {
            if (!isMobile) positionHover(e);
        });
        
        // Mouse leave event
        elem.addEventListener('mouseleave', () => {
            if (isMobile) return;
            hoverDiv.style.display = 'none';
        });
        
        // Click event
        elem.addEventListener('click', async function(e) {
            e.preventDefault();
            const name = this.dataset.cardName;
            
            try {
                // Ensure card data is loaded
                let card = getCardFromCache(cardCache, name);
                if (!card) {
                    card = await fetchCard(name);
                }
                
                if (isMobile) {
                    if (lastTapped === this) {
                        window.open(card.imgLarge, '_blank');
                        hoverDiv.style.display = 'none';
                        lastTapped = null;
                    } else {
                        lastTapped = this;
                        showHover(card.imgSmall);
                        const rect = this.getBoundingClientRect();
                        hoverDiv.style.top = `${window.scrollY + rect.bottom + 10}px`;
                        hoverDiv.style.left = '50%';
                        hoverDiv.style.transform = 'translateX(-50%)';
                    }
                } else {
                    window.open(card.imgLarge, '_blank');
                }
            } catch (err) {
                console.error(`Failed to load card "${name}"`, err);
            }
        });
    });
    
    // Add document click handler for mobile
    if (isMobile) {
        document.addEventListener('click', (e) => {
            const tappedCard = e.target.closest('.hover-card');
            if (!tappedCard) {
                hoverDiv.style.display = 'none';
                lastTapped = null;
            }
        });
    }
}

/**
 * Load and display hover preview for a card
 * @param {string} name Card name
 * @param {Event} e Event object
 * @param {Object} cardCache Card cache
 * @param {Function} fetchCard Function to fetch card data
 */
async function loadHover(name, e, cardCache, fetchCard) {
    // If we have image URLs cached, show hover immediately
    const card = getCardFromCache(cardCache, name);
    if (card && card.imgSmall) {
        showHover(card.imgSmall);
        if (!isMobile) positionHover(e);
        return;
    }
    
    try {
        const fetchedCard = await fetchCard(name);
        showHover(fetchedCard.imgSmall);
        if (!isMobile) positionHover(e);
    } catch (err) {
        console.error('Error loading hover image:', err);
    }
}

/**
 * Show hover image
 * @param {string} url Image URL
 */
function showHover(url) {
    hoverDiv.innerHTML = `<img src="${url}" style="width:177px;border-radius:8px;box-shadow:0 4px 8px rgba(0,0,0,0.3);">`;
    hoverDiv.style.display = 'block';
}

/**
 * Position hover div based on mouse position
 * @param {Event} e Mouse event
 */
function positionHover(e) {
    const hoverWidth = 200;
    const offset = 15;
    let x = e.clientX + offset;
    let y = e.clientY + offset;
    
    // Keep hover div within viewport
    if (x + hoverWidth > window.innerWidth) x = e.clientX - hoverWidth - offset;
    if (y + 250 > window.innerHeight) y = e.clientY - 250 - offset;
    
    hoverDiv.style.top = `${y + window.scrollY}px`;
    hoverDiv.style.left = `${x + window.scrollX}px`;
    hoverDiv.style.transform = 'none';
} 