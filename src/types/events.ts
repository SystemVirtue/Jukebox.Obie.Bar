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
    'credits-added': {
        amount: number;
        total: number;
    };
    'credits-changed': {
        total: number;
        change: number;
        reason: string;
    };
    'hardware-error': {
        source: string;
        code: string;
        message: string;
    };
    'system-log': {
        time: string;
        level: 'info' | 'error' | 'warning' | 'success';
        message: string;
        category: string;
        formattedMessage: string;
    };
}

export type EventName = keyof EventDetail;
