// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered successfully:', registration.scope);
                
                // Check for updates periodically
                setInterval(() => {
                    registration.update();
                }, 60000); // Check every minute
            })
            .catch((error) => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });

    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker updated');
    });
}
