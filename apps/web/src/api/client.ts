const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

export class ApiError extends Error {
    status: number;
    body?: unknown;

    constructor(status: number, message: string, body?: unknown) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}/api${path}`, {
        ...init,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(init?.headers ?? {})
        }
    });

    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new ApiError(res.status, body?.message ?? res.statusText, body);
    }

    return res.json() as Promise<T>;
}