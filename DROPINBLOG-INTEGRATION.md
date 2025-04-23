# YGO Embed Integration with DropInBlog

This guide explains how to integrate the YGO Embed script with your DropInBlog-powered blog using Smart Snippets™.

## Method 1: Using Smart Snippets™

### Step 1: Access the Smart Snippets™ Feature

1. Log in to your DropInBlog admin account
2. Click on the **More** tab in the top navigation menu
3. Select **Smart Snippets™**

### Step 2: Create a New Snippet

1. Click on the green **Add Snippet** button
2. In the editor that opens, switch to **Code View**
3. Give your snippet a descriptive name like "YGO Card Embed"

### Step 3: Add the Snippet Code

Copy one of the code snippets below and paste it into the editor:

#### Option A: Standard Version (Recommended for most users)

```html
<!-- YGO Card & Decklist Embed Snippet -->

<!-- CSS Styles -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/CainEastman/ygo-embed@main/ygo-embed-v3.css">

<!-- Standard Script Version -->
<script>
    // Load YGO Embed Script
    document.addEventListener('DOMContentLoaded', function() {
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/gh/CainEastman/ygo-embed@main/ygo-embed-v3.js';
        script.defer = true;
        
        // Append to document head
        document.head.appendChild(script);
        
        console.log('YGO Embed script loaded via DropInBlog Smart Snippet');
    });
</script>
```

#### Option B: ES Module Version (For advanced users)

```html
<!-- YGO Card & Decklist Embed Snippet (Modular Version) -->

<!-- CSS Styles -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/CainEastman/ygo-embed@main/ygo-embed-v3.css">

<!-- ES Module Version -->
<script type="module">
    // Import directly from the GitHub repository via jsDelivr
    import 'https://cdn.jsdelivr.net/gh/CainEastman/ygo-embed@main/js/ygo-embed-v3.js';
    
    console.log('YGO Embed modular script loaded via DropInBlog Smart Snippet');
</script>
```

### Step 4: Save the Snippet

Click the **Save** button to save your snippet.

## Using the YGO Embed Features in Your Blog Posts

Now that you've created a Smart Snippet, you can use the YGO Embed features in your blog posts:

### Step 1: Add the Snippet to Your Blog Post

1. Edit the blog post where you want to use YGO Embed
2. Place your cursor where you want to insert the snippet
3. Click on the Smart Snippets™ button in the editor toolbar
4. Select your "YGO Card Embed" snippet
5. The snippet will be inserted into your post

### Step 2: Use the YGO Embed Features

You can now use the following features in your blog post:

#### 1. Individual Card Embed

```
embed::Dark Magician
```

This will display a detailed card with image, stats, text, and pricing.

#### 2. Deck List Embed

```
deck::main::["Blue-Eyes White Dragon", "Dark Magician x2", "Pot of Greed"]
deck::extra::["Blue-Eyes Twin Burst Dragon", "Hieratic Seal Of The Heavenly Spheres"]
deck::side::["Ash Blossom & Joyous Spring x3"]
```

This will display collections of cards organized by deck section.

#### 3. Card References with Hover Previews

Use double brackets around card names to create hover previews:

```
Check out this [[Blue-Eyes White Dragon]] card, it's powerful!
```

## Troubleshooting

If you encounter issues with the YGO Embed script:

1. **Script not loading**: Make sure the Smart Snippet is properly inserted in your post
2. **Cards not displaying**: Check your browser console for errors
3. **Styling issues**: Make sure the CSS file is being loaded properly

## Updates

The YGO Embed script is loaded directly from GitHub via jsDelivr, so you'll automatically get updates when the repository is updated.

## Project Structure

The YGO Embed script is organized in a modular structure:

- **Main Entry Point** (`js/ygo-embed-v3.js`): Initializes and coordinates all modules
- **Cache Module** (`js/v3/modules/cache.js`): Handles localStorage operations and cache management
- **API Module** (`js/v3/modules/api.js`): Manages communication with the YGOPRODeck API
- **Card Fetcher** (`js/v3/modules/cardFetcher.js`): Provides functions to fetch card data
- **Hover Preview** (`js/v3/modules/hoverPreview.js`): Implements card hover effects
- **Card Embed** (`js/v3/modules/cardEmbed.js`): Renders individual card displays
- **Decklist Renderer** (`js/v3/modules/decklistRenderer.js`): Renders collections of cards by deck section
- **Content Parser** (`js/v3/modules/contentParser.js`): Converts special markup in content
- **Styles** (`js/v3/modules/styles.js`): Handles CSS loading
- **Constants** (`js/v3/modules/constants.js`): Shared constants used across modules

## Support

If you need help with the YGO Embed script, please open an issue on the GitHub repository at:
https://github.com/CainEastman/ygo-embed 