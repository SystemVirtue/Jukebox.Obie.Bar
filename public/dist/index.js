import { UIController } from './jukebox/uiController.js';
import { AdminDashboard } from './admin/adminDashboard.js';
import { SecurityConfig } from './config/security.config.js';
// Set up Content Security Policy
const meta = document.createElement('meta');
meta.httpEquiv = 'Content-Security-Policy';
meta.content = Object.entries(SecurityConfig.csp.directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
document.head.appendChild(meta);
// Initialize the jukebox
document.addEventListener('DOMContentLoaded', () => {
    const uiController = new UIController('player-container');
    const adminDashboard = new AdminDashboard();
    // Set up error handling
    window.onerror = (msg, url, line, col, error) => {
        console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error: ${msg} at ${url}:${line}:${col}`);
        return false;
    };
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Unhandled Promise Rejection: ${event.reason}`);
    });
});
//# sourceMappingURL=index.js.map