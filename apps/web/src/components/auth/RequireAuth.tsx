import { useSession } from "@/lib/auth-client";
import { Navigate, Outlet } from "react-router";

export function RequireAuth() {
    const { data: session, isPending } = useSession()

    if (isPending) {
        return <div>Loading...</div>
    }

    if (!session) {
        return <Navigate to="/sign-in" replace />
    }

    return <Outlet />
}