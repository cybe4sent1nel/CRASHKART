import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import { SessionProvider } from "@/components/SessionProvider";
import NavigationProgress from "@/components/NavigationProgress";
import CookiePopup from "@/components/CookiePopup";
import FeedbackPopup from "@/components/FeedbackPopup";
import StyledComponentsRegistry from "@/lib/registry";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "CrashKart - Your Ultimate Gadget Shopping Destination",
    description: "CrashKart is an e-commerce platform offering the latest gadgets, electronics, and accessories. Shop securely with fast delivery, easy returns, and 24/7 customer support.",
    icons: {
        icon: "/logo.bmp",
        shortcut: "/logo.bmp",
        apple: "/logo.bmp",
    },
    verification: {
        google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script src="https://sdk.cashfree.com/js/v3/cashfree.js" defer></script>
                <script src="/register-sw.js" defer></script>
            </head>
            <body className={`${outfit.className} antialiased`}>
                <StyledComponentsRegistry>
                    <SessionProvider>
                        <StoreProvider>
                            <Toaster />
                            <NavigationProgress />
                            <CookiePopup />
                            <FeedbackPopup />
                            {children}
                        </StoreProvider>
                    </SessionProvider>
                </StyledComponentsRegistry>
            </body>
        </html>
    );
}
