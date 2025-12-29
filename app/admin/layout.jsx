import AdminLayout from "@/components/admin/AdminLayout";

export const metadata = {
    title: "CrashKart - Admin",
    description: "CrashKart - Admin",
};

export default function RootAdminLayout({ children }) {

    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
        </>
    );
}
