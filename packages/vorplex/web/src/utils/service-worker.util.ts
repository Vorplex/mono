export class $ServiceWorker {

    public static async load(scriptURL: string, options?: RegistrationOptions): Promise<ServiceWorker | null> {
        if (!navigator.serviceWorker) return null;
        const register = async () => {
            try {
                const registration = await navigator.serviceWorker.register(scriptURL, options);
                console.log('Service Worker registered:', registration.scope);
                return registration.active;
            } catch (error) {
                console.error('Service Worker registration failed:', scriptURL, error);
                return null;
            }
        };
        if (document.readyState === 'complete') return register();
        return new Promise((resolve) => {
            window.addEventListener('load', () => register().then(resolve), { once: true });
        });
    }

    public static async unregisterAll(): Promise<void> {
        if (!navigator.serviceWorker) return;
        console.log('Uninstalling all service workers');
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
            try {
                await registration.unregister();
                console.log('Service Worker unregistered', registration.scope);
            } catch (error) {
                console.error('Failed to unregister service worker:', error);
            }
        }
    }

}
