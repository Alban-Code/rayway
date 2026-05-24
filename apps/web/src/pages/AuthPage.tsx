import { useLocation, useNavigate } from "react-router";
import { AuthHero } from "@/components/auth/AuthHero";
import { AuthForm, type AuthMode } from "@/components/auth/AuthForm";

export function AuthPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const mode: AuthMode = location.pathname === "/sign-up" ? "signup" : "signin";

    function toggleMode() {
        navigate(mode === "signin" ? "/sign-up" : "/sign-in")
    }

    return (<div className="auth-stage">
        <AuthHero />
        <AuthForm mode={mode} onToggleMode={toggleMode} />
    </div>)
}