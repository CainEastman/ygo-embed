// Styles module - handles loading CSS styles
// Ensures the required CSS is loaded

// Import the CSS file
import styles from './styles-generated.js';

/**
 * Load the CSS styles for YGO embeds
 */
export function loadStyles() {
    if (!document.getElementById("ygo-embed-styles")) {
        const style = document.createElement('style');
        style.id = "ygo-embed-styles";
        style.textContent = styles;
        document.head.appendChild(style);
        console.log("✅ YGO embed styles loaded");
    }
} 