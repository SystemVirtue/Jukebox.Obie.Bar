// Thumbnail prefetch worker
self.addEventListener('message', async (event) => {
    const { thumbnailUrls } = event.data;
    
    try {
        await Promise.all(thumbnailUrls.map(async (url) => {
            const cache = await caches.open('thumbnail-cache');
            const response = await fetch(url);
            if (response.ok) {
                await cache.put(url, response);
                self.postMessage({ status: 'cached', url });
            }
        }));
    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
});
