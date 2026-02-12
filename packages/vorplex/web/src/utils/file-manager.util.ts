export type FileDialogOptions = {
    mimeTypes?: string[];
    multiple?: boolean;
};

export class $FileManager {

    public static showDialog(options?: Partial<FileDialogOptions>): Promise<File[]> {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            if (options) {
                input.accept = options.mimeTypes?.join(',') ?? '';
                input.multiple = !!options.multiple;
            }
            input.click();
            input.onchange = (event: any) => resolve(Array.from(event.target.files));
        });
    }

    public static readText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsText(file);
        });
    }

    public static readBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    }

    public static readBytes(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.readAsArrayBuffer(file);
        });
    }

    public static async toObjectUrl(file: File): Promise<string> {
        return URL.createObjectURL(file);
    }

    public static download(file: string, content: Blob | string) {
        const downloadLink = document.createElement('a');
        const blob = content instanceof Blob ? content : new Blob([content], { type: 'text/plain' });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.setAttribute('download', file);
        downloadLink.click();
        downloadLink.remove();
        URL.revokeObjectURL(downloadLink.href);
    }

}
