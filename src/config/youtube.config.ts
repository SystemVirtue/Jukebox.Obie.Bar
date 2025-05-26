// Import environment variables with Vite's import.meta.env
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || 'YOUR-API-KEY';

export const YouTubeConfig = {
    playlists: [
        'PLN9QqCogPsXLAtgvLQ0tvpLv820R7PQsM',
        'PLN9QqCogPsXLsv5D5ZswnOSnRIbGU80IS',
        'PLN9QqCogPsXKZsYwYEpHKUhjCJlvVB44h',
        'PLN9QqCogPsXIqfwdfe4hf3qWM1mFweAXP',
        'PLN9QqCogPsXJCgeL_iEgYnW6Rl_8nIUUH'
    ],
    api: {
        baseUrl: 'https://www.googleapis.com/youtube/v3',
        endpoints: {
            playlistItems: '/playlistItems',
            videos: '/videos'
        },
        params: {
            part: 'snippet',
            maxResults: 50,
            key: YOUTUBE_API_KEY
        }
    },
    player: {
        height: 720,
        width: 1280,
        playerVars: {
            controls: 1,
            playsinline: 1,
            modestbranding: 1,
            rel: 0
        }
    }
};
