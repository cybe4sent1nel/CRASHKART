'use client'
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ChatbotEnhanced from "@/components/ChatbotEnhanced";
import OfflinePage from "./offline/page";
import AuthSync from "@/components/AuthSync";

export default function PublicLayout({ children }) {

    return (
        <>
            <AuthSync />
            <OfflinePage />
            <Navbar />
            {children}
            <Footer />
            <ChatbotEnhanced />
        </>
    );
}
