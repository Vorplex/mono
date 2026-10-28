import { MimeType } from '../../consts/mime-type.const';
import { $Path } from '../path/path.util';

export class $MimeType {

    public static fromPath(path: string): string {
        const extension = $Path.getExtension(path ?? '')?.slice(1);
        if (!extension) return 'application/octet-stream';
        return MimeType[extension as keyof typeof MimeType] ?? MimeType[`$${extension}` as keyof typeof MimeType] ?? 'application/octet-stream';
    }

    public static isText(mimeType: string): boolean {
        return mimeType.startsWith('text/') || /[/+](json|xml)$/.test(mimeType) || ['application/javascript', 'application/x-javascript', 'application/yaml'].includes(mimeType);
    }

}
