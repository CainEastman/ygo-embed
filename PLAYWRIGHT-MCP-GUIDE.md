# Playwright MCP Server Guide

This guide explains how to use the optimized Playwright MCP server setup that handles the "conversation too long" error and provides robust session management.

## Table of Contents
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Installation

1. Install the required dependencies:
```bash
npm install @playwright/mcp@latest @playwright/test playwright
```

2. Install Chromium browser:
```bash
npm run playwright:install
```

## Configuration

### Project Structure
```
your-project/
├── playwright-manager.js    # Server management class
├── example-usage.js        # Example implementation
├── update-cursor-config.js # Cursor configuration updater
└── package.json           # Project dependencies
```

### Cursor Configuration
Run the configuration updater to set up Cursor with the correct MCP server settings:
```bash
node update-cursor-config.js
```

This will update your Cursor configuration (`~/.cursor/config.json`) with:
```json
{
  "mcpServers": {
    "playwright": {
      "url": "http://localhost:8932/sse"
    }
  }
}
```

## Usage

### Basic Usage

1. Import the PlaywrightManager:
```javascript
import PlaywrightManager from './playwright-manager.js';
```

2. Create a new instance:
```javascript
const manager = new PlaywrightManager();
```

3. Start the server and handle sessions:
```javascript
try {
    await manager.startServer();
    
    await manager.handleSession(async () => {
        // Your Playwright commands here
        await global.playwright.navigate({ 
            url: 'https://example.com',
            browserType: 'chromium',
            headless: true
        });
    });
} finally {
    await manager.stopServer();
}
```

### Session Management

The PlaywrightManager automatically:
- Restarts the server after 5 sessions
- Handles "conversation too long" errors
- Cleans up browser data between sessions
- Uses dynamic port allocation

Example of multiple sessions:
```javascript
for (let i = 0; i < 10; i++) {
    await manager.handleSession(async () => {
        console.log(`Running session ${i + 1}`);
        // Your automation code here
    });
}
```

### Optimized Settings

The server runs with:
- Vision mode enabled
- Headless mode
- Optimized viewport (1280x720)
- Compressed screenshot format
- Dynamic port allocation

## Error Handling

The PlaywrightManager includes built-in error handling for:

1. **Conversation Too Long**:
   - Automatically restarts the server
   - Retries the failed operation
   - Maintains session count

2. **Port Conflicts**:
   - Automatically finds available ports
   - Handles port release on server stop

3. **Resource Cleanup**:
   - Cleans user data directory
   - Properly terminates processes
   - Handles unexpected shutdowns

## Preventing Conversation Length Issues

Our implementation includes several key features to prevent and handle the "conversation too long" errors in Cursor:

### 1. Automatic Server Management
The PlaywrightManager implements automatic server restarts and session management:
```javascript
class PlaywrightManager {
    constructor() {
        this.sessionCount = 0;
        this.maxSessionsBeforeRestart = 5;  // Restart every 5 sessions
        this.userDataDir = this.getUserDataDir();
    }

    async handleSession(callback) {
        try {
            // Auto-restart if session limit reached
            if (this.sessionCount >= this.maxSessionsBeforeRestart) {
                await this.restartServer();
            }
            this.sessionCount++;
            await callback();
        } catch (error) {
            if (error.message.includes('conversation too long')) {
                await this.restartServer();
                await callback(); // Retry once
            }
        }
    }
}
```

### 2. Optimized Server Configuration
The server runs with settings that minimize data transfer:
```javascript
this.serverProcess = spawn(command, [
    '@playwright/mcp@latest',
    '--vision',        // Use vision mode for efficient interaction
    '--headless',      // Reduce memory usage
    `--port=${this.port}`
]);
```

### 3. Data Management Strategies
- **Regular Cleanup**: Browser data is cleared between restarts
- **Dynamic Port Allocation**: Prevents port conflicts on restarts
- **Session Tracking**: Monitors and limits session length

### 4. Best Practices for Long Operations

1. **Break Down Large Tasks**:
```javascript
// Instead of:
await manager.handleSession(async () => {
    for (const item of largeDataSet) { /* ... */ }
});

// Do this:
for (const item of largeDataSet) {
    await manager.handleSession(async () => {
        // Process single item
    });
}
```

2. **Optimize Screenshot Usage**:
```javascript
// Efficient screenshot configuration
await global.playwright.screenshot({
    name: 'example',
    savePng: false,     // Use JPEG
    width: 1280,        // Reasonable size
    height: 720
});
```

3. **Handle Long-Running Operations**:
```javascript
async function processLargeDataSet(items) {
    const manager = new PlaywrightManager();
    try {
        await manager.startServer();
        
        // Process in chunks
        const chunkSize = 50;
        for (let i = 0; i < items.length; i += chunkSize) {
            const chunk = items.slice(i, i + chunkSize);
            
            await manager.handleSession(async () => {
                for (const item of chunk) {
                    // Process item
                }
            });
            
            // Force restart every 200 items
            if (i % 200 === 0) {
                await manager.restartServer();
            }
        }
    } finally {
        await manager.stopServer();
    }
}
```

### 5. Monitoring and Debugging

Track server status and session health:
```javascript
// Check server status
if (manager.isServerRunning()) {
    console.log(`Server running on port ${manager.getPort()}`);
    console.log(`Current session count: ${manager.sessionCount}`);
}

// Monitor session limits
if (manager.sessionCount >= manager.maxSessionsBeforeRestart - 1) {
    console.log('Warning: Approaching session limit, restart imminent');
}
```

### 6. Error Recovery

The system automatically handles conversation length errors:
1. Detects the error condition
2. Restarts the server cleanly
3. Retries the failed operation
4. Maintains session count
5. Cleans up resources

Example error handling:
```javascript
try {
    await manager.handleSession(async () => {
        // Your code here
    });
} catch (error) {
    if (error.message.includes('conversation too long')) {
        console.log('Session restarted due to length limit');
        // Handle any cleanup or logging
    } else {
        throw error; // Re-throw other errors
    }
}
```

## Best Practices

1. **Session Management**:
   ```javascript
   // Always use handleSession for operations
   await manager.handleSession(async () => {
       // Your code here
   });
   ```

2. **Resource Cleanup**:
   ```javascript
   try {
       // Your code here
   } finally {
       await manager.stopServer();
   }
   ```

3. **Screenshot Optimization**:
   ```javascript
   await global.playwright.screenshot({
       name: 'example',
       savePng: false, // Use JPEG for smaller size
       width: 1280,
       height: 720
   });
   ```

4. **Error Handling**:
   ```javascript
   try {
       await manager.handleSession(async () => {
           // Your code
       });
   } catch (error) {
       console.error('Session error:', error);
       // Handle specific errors
   }
   ```

## Troubleshooting

### Common Issues and Solutions

1. **Server Won't Start**:
   - Check if port is in use
   - Verify Playwright installation
   - Check system permissions

2. **Conversation Too Long Error**:
   - Reduce session complexity
   - Split operations into smaller sessions
   - Check screenshot sizes

3. **Browser Launch Failed**:
   - Run `npm run playwright:install`
   - Check system requirements
   - Verify browser installation

4. **Port Already in Use**:
   - The manager will automatically find a new port
   - Manual fix: Change starting port in PlaywrightManager constructor

### Debugging

Enable verbose logging:
```javascript
const manager = new PlaywrightManager();
manager.debug = true; // If you implement debug mode
```

Check server status:
```javascript
if (manager.isServerRunning()) {
    console.log(`Server running on port ${manager.getPort()}`);
}
```

## Advanced Configuration

### Custom Port Range
```javascript
class PlaywrightManager {
    constructor(options = {}) {
        this.startPort = options.startPort || 8932;
        // ... other initialization
    }
}
```

### Session Limits
```javascript
const manager = new PlaywrightManager();
manager.maxSessionsBeforeRestart = 10; // Default is 5
```

### Custom Timeouts
```javascript
await waitForPlaywright(15000); // 15 seconds timeout
```

## Contributing

Feel free to submit issues and enhancement requests! 