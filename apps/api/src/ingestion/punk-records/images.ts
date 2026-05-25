import { dirname, join } from "node:path";
import { access, mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as NodeReadableStream } from 'node:stream/web';

async function fileExist(target: string) {
    try {
        await access(target)
        return true
    } catch (error: any) {
        return false
    }
}

export async function downloadImage(url: string, storageKey: string, storageRoot: string): Promise<'downloaded' | 'skipped'> {
    const target = join(storageRoot, storageKey)

    if (await fileExist(target)) {
        return 'skipped'
    } else {
        await mkdir(dirname(target), { recursive: true })

        const res = await fetch(url);
        if (!res.ok || !res.body) {
            throw new Error(`HTTP ${res.status} for ${url}`);
        }

        await pipeline(
            Readable.fromWeb(res.body as NodeReadableStream),       // Web stream → Node stream
            createWriteStream(target),         // écrit sur disque
        );

        return 'downloaded'
    }

}