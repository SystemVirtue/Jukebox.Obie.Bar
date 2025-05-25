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
