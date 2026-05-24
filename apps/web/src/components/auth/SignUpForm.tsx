import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router"
import { signUp } from "@/lib/auth-client"
import { signUpSchema, type SignUpInput } from "@/lib/auth-schemas"
import { useState } from "react"
import { Mail, Lock, ArrowRight, User } from "lucide-react"

function pwScore(p: string): 0 | 1 | 2 | 3 | 4 {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s as 0 | 1 | 2 | 3 | 4;
}

const LVL_LABEL = ["empty", "weak", "fair", "good", "strong"] as const;

export function SignUpForm() {
    const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<SignUpInput>({ resolver: zodResolver(signUpSchema) })

    const password = watch("password", "")
    const score = pwScore(password)

    const navigate = useNavigate()
    const [serverError, setServerError] = useState<string | null>(null)

    async function onSubmit(values: SignUpInput) {
        setServerError(null);

        const { error } = await signUp.email({ email: values.email, name: values.name, password: values.password })

        if (error) {
            setServerError(error.message ?? "Sign-up failed");
            return;
        }

        navigate("/account")
    }

    return (
        <form className="field-group" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="field">
                <div className="lbl">Name</div>
                <div className={`input ${errors.name ? "has-error" : ""}`}>
                    <User size={14} />
                    <input type="text" autoComplete="name" placeholder="Monkey D. Luffy" {...register("name")} />
                </div>
                {errors.name && <div className="help err">{errors.name.message}</div>}
            </div>

            <div className="field">
                <div className="lbl">Email</div>
                <div className={`input ${errors.email ? "has-error" : ""}`}>
                    <Mail size={14} />
                    <input type="email" autoComplete="email" placeholder="you@grandline.com" {...register("email")} />
                </div>
                {errors.email && <div className="help err">{errors.email.message}</div>}
            </div>

            <div className="field">
                <div className="lbl">Password</div>
                <div className={`input ${errors.password ? "has-error" : ""}`}>
                    <Lock size={14} />
                    <input
                        type="password"
                        autoComplete="new-password"
                        {...register("password")}
                    />
                </div>

                <div className={`strength lvl${score}`}>
                    <div className="bars">
                        <div className="b" />
                        <div className="b" />
                        <div className="b" />
                        <div className="b" />
                    </div>
                    <div className="lbl-row">
                        <span className="l">strength</span>
                        <span className="r">{LVL_LABEL[score]}</span>
                    </div>
                </div>

                {errors.password && <div className="help err">{errors.password.message}</div>}
            </div>

            {serverError && <div className="help err">{serverError}</div>}

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? "Creating the account" : <>Create account <ArrowRight size={14} /></>}
            </button>
        </form>
    )
}