import fs from 'fs';
import os from 'os';
import path from 'path';

const cursorConfigPath = path.join(os.homedir(), '.cursor', 'config.json');

// Read the current config
let config = {};
if (fs.existsSync(cursorConfigPath)) {
    const configContent = fs.readFileSync(cursorConfigPath, 'utf8');
    config = JSON.parse(configContent);
}

// Update the config
config.mcpServers = config.mcpServers || {};
config.mcpServers.playwright = {
    url: "http://localhost:8932/sse"
};

// Save the updated config
fs.writeFileSync(cursorConfigPath, JSON.stringify(config, null, 2));
console.log('Updated Cursor configuration with Playwright MCP server settings'); 