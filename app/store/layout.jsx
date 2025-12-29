import StoreLayout from "@/components/store/StoreLayout";

export const metadata = {
    title: "CrashKart - Store Dashboard",
    description: "CrashKart - Store Dashboard",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <StoreLayout>
                {children}
            </StoreLayout>
        </>
    );
}
