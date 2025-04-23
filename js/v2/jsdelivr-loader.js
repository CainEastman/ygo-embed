/**
 * YGO Card Embed Script v2 - jsDelivr Loader
 * 
 * This file contains a script loader that fetches the YGO embed script v2
 * from GitHub via jsDelivr CDN for use with DropInBlog and other platforms.
 */

(function() {
  // Create script element
  const script = document.createElement('script');
  
  // Set source to jsDelivr CDN with correct GitHub repo and path
  script.src = 'https://cdn.jsdelivr.net/gh/CainEastman/ygo-embed/js/v2/ygo-embed-v2.js';
  
  // Add error handling
  script.onerror = function() {
    console.error('Failed to load YGO embed script');
    console.error('Attempted URL: ' + script.src);
  };
  
  // Log success when loaded
  script.onload = function() {
    console.log('✅ YGO embed script successfully loaded from jsDelivr');
  };
  
  // Append to document
  document.head.appendChild(script);
  
  console.log('YGO embed script loading via jsDelivr...');
})(); 