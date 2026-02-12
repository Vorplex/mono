import { $Tson } from './tson';
import { TsonType } from './type';

function testString() {
    const schema = $Tson.string();
    type type = TsonType<typeof schema>;
    const correct: type = '';
    // @ts-expect-error: TS2322
    const incorrect: type = 0;
}

function testNumber() {
    const schema = $Tson.number();
    type type = TsonType<typeof schema>;
    const correct: type = 0;
    // @ts-expect-error: TS2322
    const incorrect: type = '';
}

function testBoolean() {
    const schema = $Tson.boolean();
    type type = TsonType<typeof schema>;
    const correct: type = true;
    // @ts-expect-error: TS2322
    const incorrect: type = 0;
}

function testArray() {
    const schema = $Tson.array({ itemDefinition: $Tson.string() });
    type type = TsonType<typeof schema>;
    const correct: type = [''];
    // @ts-expect-error: TS2322
    const incorrect: type = [0];
}

function testAnyArray() {
    const schema = $Tson.array();
    type type = TsonType<typeof schema>;
    { const correct: type = ['']; }
    { const correct: type = [0]; }
    {
        // @ts-expect-error: TS2322
        const incorrect: type = 0;
    }
}

function testObject() {
    const schema = $Tson.object({
        properties: { name: $Tson.string() },
    });
    type type = TsonType<typeof schema>;
    const correct: type = {
        name: '',
    };
    // @ts-expect-error: TS2322
    const incorrect: type = {};
}

function testUnion() {
    const schema = $Tson.union({ union: [$Tson.string(), $Tson.number(), $Tson.object({ properties: { name: $Tson.string() } })] as const });
    type type = TsonType<typeof schema>;
    { const correct: type = ''; }
    { const correct: type = 0; }
    { const correct: type = { name: '' }; }
    {
        // @ts-expect-error: TS2322
        const incorrect: type = false;
    }
}

function testObjectOptionalProps() {
    const schema = $Tson.object({
        properties: {
            name: $Tson.string(),
            offline: $Tson.boolean({ default: undefined }),
        }
    });
    type type = TsonType<typeof schema>;
    const correct: type = { name: '' };
    const incorrect: type[] = [
        // @ts-expect-error: TS2322
        {},
        // @ts-expect-error: TS2322
        { name: '', offline: 0 }
    ];
}

