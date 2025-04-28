import AdminNavbar from "@/app/components/AdminNavbar";
import Chatbot from "@/components/Chatbot"
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 dark:from-gray-900 dark:to-gray-800 relative">
            <AdminNavbar />
            <main className="lg:ml-64 p-4">{children}</main> {/* Ajout de lg:ml-64 pour les grands écrans */}
            <Chatbot userRole="admin" title="Assistant Admin" />
        </div>
    );
}
