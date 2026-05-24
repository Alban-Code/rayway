import { SignInForm } from "./SignInForm"
import { SignUpForm } from "./SignUpForm"

export type AuthMode = "signin" | "signup";

export type AuthFormProps = {
    mode: AuthMode
    onToggleMode: () => void
}

export function AuthForm({ mode, onToggleMode }: AuthFormProps) {
    const isSignIn = mode === "signin"
    return (
        <section className="auth-form-side" >
            <div className="auth-card">
                <div className={"auth-toggle" + (isSignIn ? "" : " signup")}>
                    <div className="thumb" />
                    <button
                        type="button"
                        className={isSignIn ? "on" : ""}
                        onClick={() => !isSignIn && onToggleMode()}
                    >
                        Sign in
                    </button>
                    <button
                        type="button"
                        className={!isSignIn ? "on" : ""}
                        onClick={() => isSignIn && onToggleMode()}
                    >Create Account</button>
                </div>

                {isSignIn ? (
                    <>
                        <div className="auth-title">Welcome back !</div>
                        <div className="auth-sub">
                            No account yet ?{" "}
                            <a onClick={onToggleMode} style={{ cursor: "pointer" }}>Create one</a>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="auth-title">Start a free account !</div>
                        <div className="auth-sub">
                            Already have one?{" "}
                            <a onClick={onToggleMode} style={{ cursor: "pointer" }}>Sign in</a>
                        </div>
                    </>
                )}

                <div className="oauth-row">
                    <button type="button" className="oauth-btn" disabled title="Bientôt disponible">
                        Google
                    </button>
                    <button type="button" className="oauth-btn" disabled title="Bientôt disponible">
                        GitHub
                    </button>
                </div>

                <div className="auth-divider">or with email</div>

                {isSignIn ? <SignInForm /> : <SignUpForm />}

                <div className="auth-foot">
                    Protected by ⌘K Auth · <a href="#">status</a> · <a href="#">privacy</a> · <a href="#">terms</a>
                </div>
            </div>
        </section >
    )
}