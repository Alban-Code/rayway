import { useSession } from "@/lib/auth-client"
import { Navigate, Outlet } from "react-router"

export function RedirectIfAuth() {
    const { data: session, isPending } = useSession()

    if (isPending) {
        return <div>Loading...</div>
    }

    if (session) {
        return <Navigate to="/account" replace />
    }

    return <Outlet />
}