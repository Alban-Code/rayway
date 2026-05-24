import { useSession, signOut } from "@/lib/auth-client";
import { useNavigate } from "react-router";
import { useState } from "react";

export function AccountPage() {
    const { data: session, isPending, error } = useSession();
    const navigate = useNavigate()
    const [isSigningOut, setIsSigningOut] = useState(false)

    async function handleSignOut() {
        setIsSigningOut(true)

        await signOut()

        navigate("/sign-in")
    }

    if (isPending) {
        return <div>Loading...</div>
    }

    const user = session!.user

    return (
        <div className="account-page">
            <h1>Account</h1>

            <div className="panel">
                <div className="account-row">
                    <span className="k">Name</span>
                    <span className="v">{user.name}</span>
                </div>
                <div className="account-row">
                    <span className="k">Email</span>
                    <span className="v">{user.email}</span>
                </div>
                <div className="account-row">
                    <span className="k">Verified</span>
                    <span className="v">{user.emailVerified ? "Yes" : "No"}</span>
                </div>
                <div className="account-row">
                    <span className="k">Member since</span>
                    <span className="v">
                        {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>

            <div className="account-actions">
                <button
                    type="button"
                    className="btn secondary"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                >
                    {isSigningOut ? "Signing out…" : "Sign out"}
                </button>
            </div>
        </div>
    )
}