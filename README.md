# YouTube Jukebox OBIE/X1

A commercial-grade touchscreen music video jukebox with payment integration, YouTube content management, and regulatory compliance.

## Features

- 1280×1024 capacitive touchscreen interface
- Coin payment system (NAMA TS-2 compliant)
- YouTube playlist integration
- Offline resilience with IndexedDB caching
- Bilingual support (Canadian English/French)
- Admin dashboard with diagnostic tools

## Requirements

- Node.js 18+
- Modern browser with Web Serial API support
- Compatible coin reader (USB-HID)
- Display resolution: 1280×1024

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Development

Start the development server with:

```bash
npm run dev
```

This will:
- Watch for TypeScript changes
- Start a local server on port 3000
- Auto-reload on changes

## Deployment to Render.com

1. Push your code to a GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" and select "Web Service"
4. Connect your GitHub repository
5. Configure the service:
   - **Name**: youtube-jukebox
   - **Region**: Choose the closest region to your users
   - **Branch**: main (or your preferred branch)
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `VITE_YOUTUBE_API_KEY`: Your YouTube Data API v3 key
6. Click "Create Web Service"

## Testing

Run the test suite with:

```bash
npm test
```

## Configuration

- YouTube API configuration in `config/youtube.config.ts`
- Security policies in `config/security.config.ts`
- Default playlists are configurable in the YouTube config file

## Admin Access

1. Press Ctrl+Alt+Shift+J to access maintenance mode
2. Enter password (default: admin123)
3. Hold physical button for 3 seconds

## Credits and Payment

- $1 coin = 1 credit
- $2 coin = 3 credits
- Maximum credits: 255

## Security Features

- CSPv3 compliant
- PCI-DSS L3 compliant credit storage
- TLS 1.2+ for API communication
- Device fingerprinting for USB security

## License

ISC License
