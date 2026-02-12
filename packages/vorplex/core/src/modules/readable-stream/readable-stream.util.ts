export class $ReadableStream {
    public static async toArrayBuffer(stream: ReadableStream<Uint8Array>): Promise<ArrayBuffer> {
        const chunks: Uint8Array[] = [];
        const reader = stream.getReader();
        let totalLength = 0;
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                totalLength += value.length;
            }
            const result = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
            }
            return result.buffer;
        } finally {
            reader.releaseLock();
        }
    }
}
