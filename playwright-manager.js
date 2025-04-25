import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import net from 'net';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class PlaywrightManager {
    constructor() {
        this.serverProcess = null;
        this.sessionCount = 0;
        this.maxSessionsBeforeRestart = 5;
        this.userDataDir = this.getUserDataDir();
        this.port = 8932; // Use a different port
    }

    getUserDataDir() {
        const platform = os.platform();
        const homeDir = os.homedir();
        
        switch(platform) {
            case 'win32':
                return path.join(process.env.USERPROFILE, 'AppData', 'Local', 'ms-playwright', 'mcp-chrome-profile');
            case 'darwin':
                return path.join(homeDir, 'Library', 'Caches', 'ms-playwright', 'mcp-chrome-profile');
            default: // linux
                return path.join(homeDir, '.cache', 'ms-playwright', 'mcp-chrome-profile');
        }
    }

    async findAvailablePort(startPort = 8932) {
        const isPortAvailable = (port) => {
            return new Promise((resolve) => {
                const server = net.createServer();
                server.once('error', () => resolve(false));
                server.once('listening', () => {
                    server.close();
                    resolve(true);
                });
                server.listen(port);
            });
        };

        let port = startPort;
        while (!(await isPortAvailable(port))) {
            port++;
        }
        return port;
    }

    async startServer() {
        if (this.serverProcess) {
            console.log('Server already running');
            return;
        }

        // Find an available port
        this.port = await this.findAvailablePort();
        console.log(`Using port ${this.port}`);

        // Clear user data directory if it exists
        if (fs.existsSync(this.userDataDir)) {
            fs.rmSync(this.userDataDir, { recursive: true, force: true });
            console.log('Cleared browser user data directory');
        }

        // Start the server with optimized configuration
        const isWindows = process.platform === 'win32';
        const command = isWindows ? 'npx.cmd' : 'npx';
        
        this.serverProcess = spawn(command, [
            '@playwright/mcp@latest',
            '--vision',
            '--headless',
            `--port=${this.port}`
        ], {
            stdio: 'pipe',
            shell: isWindows
        });

        console.log('Started Playwright MCP server');

        // Handle server output
        this.serverProcess.stdout.on('data', (data) => {
            console.log(`Server output: ${data}`);
        });

        this.serverProcess.stderr.on('data', (data) => {
            console.error(`Server error: ${data}`);
        });

        // Handle process errors
        this.serverProcess.on('error', (error) => {
            console.error('Server process error:', error);
        });

        // Handle process exit
        this.serverProcess.on('exit', (code, signal) => {
            console.log(`Server process exited with code ${code} and signal ${signal}`);
            this.serverProcess = null;
        });

        // Wait for server to be ready
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async stopServer() {
        if (this.serverProcess) {
            this.serverProcess.kill();
            this.serverProcess = null;
            console.log('Stopped Playwright MCP server');
        }
    }

    async restartServer() {
        await this.stopServer();
        await this.startServer();
        this.sessionCount = 0;
    }

    async handleSession(callback) {
        try {
            // Check if we need to restart the server
            if (this.sessionCount >= this.maxSessionsBeforeRestart) {
                console.log('Session limit reached, restarting server...');
                await this.restartServer();
            }

            // Increment session count
            this.sessionCount++;

            // Execute the callback (your Playwright automation code)
            await callback();

        } catch (error) {
            if (error.message.includes('conversation too long')) {
                console.log('Conversation too long error detected, restarting server...');
                await this.restartServer();
                // Retry the callback once
                await callback();
            } else {
                throw error;
            }
        }
    }

    // Utility method to check server status
    isServerRunning() {
        return this.serverProcess !== null && !this.serverProcess.killed;
    }

    getPort() {
        return this.port;
    }
}

// Export the manager
export default PlaywrightManager; 