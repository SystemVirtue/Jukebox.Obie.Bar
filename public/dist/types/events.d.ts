export interface EventDetail {
    error: {
        source: string;
        error: string;
    };
    'video-selected': {
        videoId: string;
    };
    'api-key-rotated': {
        success: boolean;
        error?: string;
    };
    'admin-access': {
        success: boolean;
        reason?: string;
    };
    'emergency-stop': void;
    'system-reset': {
        success: boolean;
    };
}
export type EventName = keyof EventDetail;
//# sourceMappingURL=events.d.ts.map