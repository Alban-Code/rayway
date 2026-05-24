import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router"
import { Mail, Lock, ArrowRight } from "lucide-react"
import { useState } from "react"
import { signIn } from "@/lib/auth-client"
import { signInSchema, type SignInInput } from "@/lib/auth-schemas"

export function SignInForm() {

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SignInInput>({ resolver: zodResolver(signInSchema) })

    const navigate = useNavigate();
    const [serverError, setServerError] = useState<string | null>(null);

    async function onSubmit(values: SignInInput) {
        setServerError(null);

        const { error } = await signIn.email({ email: values.email, password: values.password });

        if (error) {
            setServerError(error.message ?? "Sign-in Failed");
            return
        }

        navigate("/account")
    }

    return (
        <form className="field-group" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="field">
                <div className="lbl">Email</div>
                <div className={`input ${errors.email ? "has-error" : ""}`}>
                    <Mail size={14} />
                    <input type="email" autoComplete="email" placeholder="you@grandline.com" {...register("email")} />
                </div>
                {errors.email && <div className="help err">{errors.email.message}</div>}
            </div>

            <div className="field">
                <div className="lbl">
                    Password <a>Forgot?</a>
                </div>
                <div className={`input ${errors.password ? "has-error" : ""}`}>
                    <Lock size={14} />
                    <input
                        type="password"
                        autoComplete="current-password"
                        {...register("password")}
                    />
                </div>
                {errors.password && <div className="help err">{errors.password.message}</div>}
            </div>

            {serverError && <div className="help err">{serverError}</div>}

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Signing in…" : <>Sign in <ArrowRight size={14} /></>}
            </button>
        </form>
    )
}