'use client'
import { usePathname } from 'next/navigation'
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotEnhanced from "@/components/ChatbotEnhanced";
import OfflinePage from "./offline/page";
import AuthSync from "@/components/AuthSync";

export default function PublicLayout({ children }) {
    const pathname = usePathname()
    const isSupport = pathname === '/support'

    return (
        <>
            <AuthSync />
            <OfflinePage />
            <Navbar />
            {children}
            {!isSupport && <Footer />}
            <ChatbotEnhanced />
        </>
    );
}
