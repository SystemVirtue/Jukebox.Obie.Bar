export declare const SecurityConfig: {
    csp: {
        directives: {
            'default-src': string[];
            'script-src': string[];
            'frame-src': string[];
            'img-src': string[];
            'connect-src': string[];
            'style-src': string[];
            'worker-src': string[];
            'base-uri': string[];
            'form-action': string[];
        };
    };
    serial: {
        allowedVendorIds: number[];
        timeout: number;
        retries: number;
    };
    admin: {
        password: string;
        physicalButtonHoldTime: number;
    };
};
//# sourceMappingURL=security.config.d.ts.map