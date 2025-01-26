import AdminNavbar from "@/app/components/AdminNavbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <AdminNavbar />
            <main>{children}</main>
        </div>
    );
}
