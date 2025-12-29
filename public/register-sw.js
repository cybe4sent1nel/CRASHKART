// Register Service Worker with force update
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // First, unregister all existing service workers to clear cache
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (let registration of registrations) {
                registration.unregister().then(() => {
                    console.log('🗑️ Old Service Worker unregistered');
                });
            }
        });

        // Wait a moment then register the new service worker
        setTimeout(() => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('✅ Service Worker registered successfully:', registration.scope);
                    
                    // Force immediate update check
                    registration.update();
                    
                    // Check for updates periodically
                    setInterval(() => {
                        registration.update();
                    }, 60000); // Check every minute
                })
                .catch((error) => {
                    console.log('❌ Service Worker registration failed:', error);
                });
        }, 1000);
    });

    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker updated - reloading page');
        window.location.reload();
    });
}
