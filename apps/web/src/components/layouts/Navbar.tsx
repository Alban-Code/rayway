import { signOut, useSession } from "@/lib/auth-client"
import { Link, NavLink } from "react-router"
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
        "text-sm font-medium transition-colors hover:text-foreground",
        isActive ? "text-foreground" : "text-muted-foreground",
    )

export function Navbar() {

    const { data } = useSession();

    return (
        <nav className="app-chrome flex shrink-0 items-center justify-between h-14 px-6">
            <NavLink to="/" className="app-chrome__brand text-lg font-bold tracking-tight">Rayway</NavLink>

            <div className="flex items-center gap-6">
                <NavLink to="/" end className={navLinkClass}>Home</NavLink>
                <NavLink to="/cards" className={navLinkClass}>Cards</NavLink>
            </div>

            <div className="flex items-center gap-2">
                {data ? (
                    <>
                        <NavLink to="/account" className={navLinkClass}>Profile</NavLink>
                        <Button variant="ghost" size="sm" onClick={() => signOut()}>Sign out</Button>
                    </>
                ) : (
                    <Button asChild variant="ghost" size="sm">
                        <Link to="/sign-in">Sign In</Link>
                    </Button>
                )}
            </div>
        </nav>
    )
}