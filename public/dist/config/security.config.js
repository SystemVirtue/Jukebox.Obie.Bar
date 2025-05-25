export const SecurityConfig = {
    csp: {
        directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", 'https://www.youtube.com', 'https://www.googleapis.com'],
            'frame-src': ['https://www.youtube.com'],
            'img-src': ["'self'", 'https://i.ytimg.com', 'https://img.youtube.com'],
            'connect-src': ["'self'", 'https://www.googleapis.com'],
            'style-src': ["'self'", "'unsafe-inline'"],
            'worker-src': ["'self'"],
            'base-uri': ["'self'"],
            'form-action': ["'none'"]
        }
    },
    serial: {
        allowedVendorIds: [0x067b], // Replace with actual vendor ID
        timeout: 5000,
        retries: 3
    },
    admin: {
        password: 'admin123', // Should be environment variable in production
        physicalButtonHoldTime: 3000 // 3 seconds
    }
};
//# sourceMappingURL=security.config.js.map