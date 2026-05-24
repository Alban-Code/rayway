import { z } from "zod";

export const signInSchema = z.object({
    email: z.email("Email invalide"),
    password: z.string().min(1, "Mot de passe requis")
})

export const signUpSchema = z.object({
    email: z.email("Email invalide"),
    password: z.string().min(8, "Mot de passe de 8 caractères minimum requis"),
    name: z.string().min(2, "Au moins 2 caractères")
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>