// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered successfully:', registration.scope);
                
                // Check for updates
                registration.update();
                
                // Check for updates periodically (every 5 minutes)
                setInterval(() => {
                    registration.update();
                }, 300000);
            })
            .catch((error) => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });

    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker updated');
        // Don't auto-reload, let user refresh manually
    });
}
