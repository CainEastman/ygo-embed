// Constants module - shared constants used across modules

/**
 * API constants
 */
export const API = {
    BASE_URL: 'https://db.ygoprodeck.com/api/v7',
    BATCH_SIZE: 10,
    TIMEOUT: 10000 // 10 seconds
};

/**
 * Cache constants
 */
export const CACHE = {
    VERSION: 'ygo-cache-v2',
    EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    SAVE_INTERVAL: 60000 // 1 minute
};

/**
 * CSS class names
 */
export const CSS_CLASSES = {
    CARD_EMBED: 'ygo-card-embed',
    DECKLIST: 'ygo-decklist',
    HOVER_CARD: 'hover-card',
    LOADING: 'ygo-loading',
    ERROR: 'ygo-error',
    MONSTER_CARD: 'ygo-monster-card',
    SPELL_CARD: 'ygo-spell-card',
    TRAP_CARD: 'ygo-trap-card'
};

/**
 * Regex patterns
 */
export const REGEX = {
    CARD_EMBED: /^embed::(.+)$/i,
    DECKLIST: /^deck::(main|extra|side|upgrade)::\[(.*)\]$/i,
    CARD_REFERENCE: /\[\[([^\]]+)\]\]/g,
    CARD_QUANTITY: /\sx(\d+)$/
}; 