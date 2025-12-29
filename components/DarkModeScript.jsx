export default function DarkModeScript() {
    const themeScript = `
        (function() {
            try {
                const theme = localStorage.getItem('theme');
                
                // Default to light mode unless explicitly set to 'dark'
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    // Ensure light mode is set
                    if (!theme) {
                        localStorage.setItem('theme', 'light');
                    }
                }
            } catch (e) {}
        })();
    `;

    return (
        <script
            dangerouslySetInnerHTML={{ __html: themeScript }}
            suppressHydrationWarning
        />
    );
}
