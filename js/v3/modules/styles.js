// Styles module - handles loading CSS styles
// Ensures the required CSS is loaded

/**
 * Load the CSS styles for YGO embeds
 */
export function loadStyles() {
    // Check if styles are already loaded
    if (!document.getElementById('ygo-embed-styles')) {
        // Create link element for stylesheet
        const link = document.createElement('link');
        link.id = 'ygo-embed-styles';
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'ygo-embed-v3.css';
        
        // Append to head
        document.head.appendChild(link);
        console.log("✅ YGO embed styles loaded");
    }
} 