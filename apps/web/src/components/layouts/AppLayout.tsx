import { Outlet } from "react-router";
import { Navbar } from "@/components/layouts/Navbar";

export function AppLayout() {
    return (
        <div className="flex flex-col h-dvh">
            <Navbar />
            <div className="flex-1 min-h-0">
                <Outlet />
            </div>
        </div>
    )
}