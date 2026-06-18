export function buildImageUrl(key: string | null | undefined): string | null {
    if (!key) return null;
    return `${process.env.IMAGE_BASE_URL}/${key}`
}