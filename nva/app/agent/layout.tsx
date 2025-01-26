import AgentNavbar from "@/app/components/AgentNavbar";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
    return (
        <div>
            <AgentNavbar />
            <main>{children}</main>
        </div>
    );
}
