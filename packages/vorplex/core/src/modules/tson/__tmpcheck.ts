import { $Tson } from './tson';
import type { TsonType } from './type';

const a = $Tson.object({
    properties: {
        id: $Tson.object({ default: undefined })
    }
});
type A = TsonType<typeof a>;
const b: A = {};
