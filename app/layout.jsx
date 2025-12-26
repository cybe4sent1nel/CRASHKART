import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import StoreProvider from "@/app/StoreProvider";
import { SessionProvider } from "@/components/SessionProvider";
import NavigationProgress from "@/components/NavigationProgress";
import OfflineDetector from "@/components/OfflineDetector";
import DarkModeScript from "@/components/DarkModeScript";
import CookiePopup from "@/components/CookiePopup";
import FeedbackPopup from "@/components/FeedbackPopup";
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
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <DarkModeScript />
            </head>
            <body className={`${outfit.className} antialiased`}>
                <SessionProvider>
                    <StoreProvider>
                        <Toaster />
                        <NavigationProgress />
                        <OfflineDetector />
                        <CookiePopup />
                        <FeedbackPopup />
                        {children}
                    </StoreProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
