import PlaywrightManager from './playwright-manager.js';

async function waitForPlaywright(timeout = 10000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
        if (global.playwright) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Timeout waiting for Playwright to be ready');
}

async function runExample() {
    const manager = new PlaywrightManager();

    try {
        // Start the server
        await manager.startServer();
        
        // Wait for Playwright to be ready
        await waitForPlaywright();
        console.log('Playwright is ready');

        // Example automation task
        await manager.handleSession(async () => {
            try {
                console.log('Starting automation task...');
                
                // Your Playwright MCP commands here
                await global.playwright.navigate({ 
                    url: 'https://example.com',
                    browserType: 'chromium',
                    headless: true,
                    width: 1280,
                    height: 720
                });

                console.log('Navigation complete');

                // Take a screenshot with optimized settings
                await global.playwright.screenshot({
                    name: 'example-screenshot',
                    savePng: false, // Use JPEG for smaller file size
                    width: 1280,
                    height: 720
                });

                console.log('Screenshot taken');

                // Get page content without visual elements
                const text = await global.playwright.get_visible_text({
                    random_string: 'dummy'
                });

                console.log('Page text:', text);
            } catch (error) {
                console.error('Error in automation task:', error);
                throw error;
            }
        });

        // Example of handling multiple sessions
        for (let i = 0; i < 10; i++) {
            await manager.handleSession(async () => {
                console.log(`Running session ${i + 1}`);
                // Your session code here
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        // Clean up
        await manager.stopServer();
    }
}

// Run the example
runExample().catch(console.error); 