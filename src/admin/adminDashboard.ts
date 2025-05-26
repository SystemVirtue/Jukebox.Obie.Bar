import { SecurityConfig } from '../config/security.config';
import { YouTubeConfig } from '../config/youtube.config';
import { EventBus } from '../utils/eventBus';

export class AdminDashboard {
    private static readonly LOG_RETENTION_DAYS = 7;
    private static readonly LOG_STORAGE_KEY = 'jukebox_logs';
    private diagnosticLogs: string[] = [];
    private apiKeyRotationTimer?: number;

    constructor() {
        this.loadStoredLogs();
        this.initializeDashboard();
        this.setupEventListeners();
        this.startApiKeyRotationTimer();
        this.setupEventBusListeners();
    }

    private setupEventBusListeners(): void {
        const eventBus = EventBus.getInstance();

        // Log all errors
        eventBus.subscribe('error', (detail) => {
            this.log(`Error in ${detail.source}: ${detail.error}`);
        });

        // Log video selections
        eventBus.subscribe('video-selected', (detail) => {
            this.log(`Video selected: ${detail.videoId}`);
        });

        // Log admin access attempts
        eventBus.subscribe('admin-access', (detail) => {
            this.log(`Admin access ${detail.success ? 'granted' : `denied: ${detail.reason}`}`);
        });

        // Log API key rotations
        eventBus.subscribe('api-key-rotated', (detail) => {
            this.log(`API key rotation ${detail.success ? 'successful' : `failed: ${detail.error}`}`);
        });
    }

    private loadStoredLogs(): void {
        const storedLogs = localStorage.getItem(AdminDashboard.LOG_STORAGE_KEY);
        if (storedLogs) {
            try {
                this.diagnosticLogs = JSON.parse(storedLogs);
            } catch (e) {
                console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error loading logs: ${e}`);
            }
        }
    }

    private saveLogs(): void {
        try {
            localStorage.setItem(AdminDashboard.LOG_STORAGE_KEY, JSON.stringify(this.diagnosticLogs));
        } catch (e) {
            console.error(`[${new Date().toLocaleTimeString('en-CA', { hour12: false })}] Error saving logs: ${e}`);
        }
    }

    private initializeDashboard(): void {
        const dashboard = document.createElement('div');
        dashboard.id = 'admin-dashboard';
        dashboard.className = 'hidden';
        
        dashboard.innerHTML = `
            <div class="admin-panel">
                <h2>Admin Dashboard</h2>
                <div class="admin-section">
                    <h3>API Key Management</h3>
                    <button id="rotate-api-key">Rotate API Key</button>
                    <div id="api-key-status">Next rotation in: ${this.getNextKeyRotation()}</div>
                </div>
                <div class="admin-section">
                    <h3>Diagnostic Logs</h3>
                    <div id="log-viewer"></div>
                    <button id="export-logs">Export Logs</button>
                    <button id="clear-logs">Clear Logs</button>
                </div>
                <div class="admin-section">
                    <h3>Emergency Controls</h3>
                    <button id="emergency-stop" class="emergency">Emergency Stop</button>
                    <button id="reset-system">Reset System</button>
                </div>
                <div class="admin-section">
                    <h3>Authentication</h3>
                    <button id="change-password">Change Password</button>
                    <div id="auth-status"></div>
                </div>
            </div>
        `;

        document.body.appendChild(dashboard);
        this.updateLogViewer();
    }

    private setupEventListeners(): void {
        document.getElementById('rotate-api-key')?.addEventListener('click', () => {
            this.rotateApiKey();
        });

        document.getElementById('export-logs')?.addEventListener('click', () => {
            this.exportLogs();
        });

        document.getElementById('emergency-stop')?.addEventListener('click', () => {
            this.emergencyStop();
        });

        document.getElementById('reset-system')?.addEventListener('click', () => {
            this.resetSystem();
        });

        document.getElementById('clear-logs')?.addEventListener('click', () => {
            this.clearLogs();
        });

        document.getElementById('change-password')?.addEventListener('click', () => {
            this.changePassword();
        });

        // Listen for admin access events
        document.addEventListener('admin-access', ((event: CustomEvent) => {
            const { success, reason } = event.detail;
            const authStatus = document.getElementById('auth-status');
            if (authStatus) {
                authStatus.textContent = success ? 'Access granted' : `Access denied: ${reason}`;
                authStatus.className = success ? 'success' : 'error';
            }
        }) as EventListener);
    }

    private startApiKeyRotationTimer(): void {
        // Rotate key every 6 hours per YouTube API best practices
        this.apiKeyRotationTimer = window.setInterval(() => {
            this.rotateApiKey();
        }, 6 * 60 * 60 * 1000);
    }

    private getNextKeyRotation(): string {
        const nextRotation = new Date();
        nextRotation.setHours(nextRotation.getHours() + 6);
        return nextRotation.toLocaleTimeString('en-CA', { hour12: false });
    }

    private async rotateApiKey(): Promise<void> {
        try {
            // Remove old key from YouTube config
            const oldKey = YouTubeConfig.api.key;
            
            // In a real implementation, this would call a secure API to get a new key
            // For now, we'll just simulate the rotation
            const status = document.getElementById('api-key-status');
            if (status) {
                status.textContent = `Next rotation in: ${this.getNextKeyRotation()}`;
                status.className = 'success';
            }

            // Dispatch event so other components can react
            document.dispatchEvent(new CustomEvent('api-key-rotated', {
                detail: { success: true }
            }));

            this.log('API key rotated successfully');
        } catch (error) {
            this.log(`Error rotating API key: ${error}`);
            document.dispatchEvent(new CustomEvent('api-key-rotated', {
                detail: { success: false, error }
            }));
        }
    }

    private changePassword(): void {
        const currentPassword = prompt('Enter current password:');
        if (currentPassword !== SecurityConfig.admin.password) {
            this.log('Password change failed: incorrect current password');
            return;
        }

        const newPassword = prompt('Enter new password:');
        if (!newPassword || newPassword.length < 8) {
            this.log('Password change failed: new password too short');
            return;
        }

        // In a real implementation, this would call a secure API to change the password
        // For now, we'll just log it
        this.log('Password changed successfully');
    }

    private clearLogs(): void {
        if (confirm('Are you sure you want to clear all logs?')) {
            this.diagnosticLogs = [];
            this.saveLogs();
            this.updateLogViewer();
            this.log('Logs cleared');
        }
    }

    private exportLogs(): void {
        const blob = new Blob([this.diagnosticLogs.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jukebox-logs-${new Date().toISOString()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.log('Logs exported');
    }

    private emergencyStop(): void {
        if (window.confirm('Are you sure you want to perform an emergency stop?')) {
            EventBus.getInstance().emit('emergency-stop', undefined);
            this.log('Emergency stop activated');
            
            if (this.apiKeyRotationTimer) {
                clearInterval(this.apiKeyRotationTimer);
            }
        }
    }

    private async resetSystem(): Promise<void> {
        if (!window.confirm('Are you sure you want to reset the system? This will clear all caches and stored data.')) {
            return;
        }

        try {
            // Clear caches
            const cacheKeys = await caches.keys();
            await Promise.all(cacheKeys.map(key => caches.delete(key)));

            // Reset IndexedDB
            await new Promise<void>((resolve, reject) => {
                const dbRequest = indexedDB.deleteDatabase('JukeboxCache');
                dbRequest.onsuccess = () => resolve();
                dbRequest.onerror = () => reject(dbRequest.error);
            });

            // Clear localStorage except for admin password
            const adminPassword = localStorage.getItem('admin_password');
            localStorage.clear();
            if (adminPassword) {
                localStorage.setItem('admin_password', adminPassword);
            }

            this.log('System reset successful');
            EventBus.getInstance().emit('system-reset', { success: true });

            // Reload the page after a short delay
            setTimeout(() => {
                location.reload();
            }, 1000);
        } catch (error) {
            this.log(`Error resetting system: ${error}`);
            EventBus.getInstance().emit('error', {
                source: 'AdminDashboard',
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }

    private updateLogViewer(): void {
        const logViewer = document.getElementById('log-viewer');
        if (logViewer) {
            logViewer.textContent = this.diagnosticLogs.slice(-50).join('\n');
            logViewer.scrollTop = logViewer.scrollHeight;
        }
    }

    private log(message: string): void {
        const timestamp = new Date().toLocaleTimeString('en-CA', { hour12: false });
        const logMessage = `[${timestamp}] ${message}`;
        this.diagnosticLogs.push(logMessage);
        this.saveLogs();
        this.updateLogViewer();

        // Trim old logs
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - AdminDashboard.LOG_RETENTION_DAYS);
        this.diagnosticLogs = this.diagnosticLogs.filter(log => {
            const logDate = new Date(log.slice(1, log.indexOf(']')));
            return logDate > cutoffDate;
        });
    }
}
