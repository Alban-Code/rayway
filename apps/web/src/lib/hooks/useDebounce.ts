import { useEffect, useState } from "react";

export function useDebounce(value: string, delay: number) {

    const [debounceValue, setDebounceValue] = useState<string>(value)

    useEffect(() => {
        const t = setTimeout(() => setDebounceValue(value), delay)
        return () => clearTimeout(t)
    }, [value, delay])

    return debounceValue
}