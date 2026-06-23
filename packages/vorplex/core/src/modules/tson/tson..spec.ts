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

function testSingleMemberUnion() {
    const schema = $Tson.union({ union: [$Tson.string()] as const });
    type type = TsonType<typeof schema>;
    { const correct: type = ''; }
    {
        // @ts-expect-error: TS2322
        const incorrect: type = 0;
    }
}

function testArrayOfUnion() {
    const schema = $Tson.array({ itemDefinition: $Tson.union({ union: [$Tson.string(), $Tson.number()] as const }) });
    type type = TsonType<typeof schema>;
    { const correct: type = ['', 0]; }
    {
        // @ts-expect-error: TS2322
        const incorrect: type = [false];
    }
}

function testUnionOfArrays() {
    const schema = $Tson.union({
        union: [
            $Tson.array({ itemDefinition: $Tson.string() }),
            $Tson.array({ itemDefinition: $Tson.number() }),
        ] as const,
    });
    type type = TsonType<typeof schema>;
    { const correct: type[] = [[''], [0]]; }
    {
        // @ts-expect-error: TS2322
        const incorrect: type = [true];
    }
}

function testUnionContainingArrayOfUnion() {
    const schema = $Tson.union({
        union: [
            $Tson.array({ itemDefinition: $Tson.union({ union: [$Tson.string(), $Tson.number()] as const }) }),
            $Tson.boolean(),
        ] as const,
    });
    type type = TsonType<typeof schema>;
    { const correct: type[] = [['', 0], true]; }
    {
        // @ts-expect-error: TS2322
        const incorrect: type = [true];
    }
}

function testUnionOfUnion() {
    const schema = $Tson.union({
        union: [
            $Tson.union({ union: [$Tson.string(), $Tson.number()] as const }),
            $Tson.boolean(),
        ] as const,
    });
    type type = TsonType<typeof schema>;
    { const correct: type[] = ['', 0, true]; }
    {
        // @ts-expect-error: TS2322
        const incorrect: type = {};
    }
}

function testUnionOfObjectShapes() {
    const schema = $Tson.union({
        union: [
            $Tson.object({ properties: { kind: $Tson.string(), a: $Tson.string() } }),
            $Tson.object({ properties: { kind: $Tson.string(), b: $Tson.number(), c: $Tson.boolean({ default: undefined }) } }),
        ] as const,
    });
    type type = TsonType<typeof schema>;
    { const correct: type[] = [{ kind: 'a', a: '' }, { kind: 'b', b: 0 }, { kind: 'b', b: 0, c: true }]; }
    {
        // @ts-expect-error: TS2322
        const incorrect: type = { kind: 'a' };
    }
}

function testUnionWithManyMembers() {
    const schema = $Tson.union({
        union: [
            $Tson.string(),
            $Tson.number(),
            $Tson.boolean(),
            $Tson.array({ itemDefinition: $Tson.string() }),
            $Tson.object({ properties: { name: $Tson.string() } }),
            $Tson.enum({ flags: ['a', 'b'] }),
        ] as const,
    });
    type type = TsonType<typeof schema>;
    const correct: type[] = ['', 0, true, [''], { name: '' }, 'a', 'b'];
    {
        // @ts-expect-error: TS2322
        const incorrect: type = {};
    }
}

function testDeeplyNestedUnion() {
    const schema = $Tson.object({
        properties: {
            items: $Tson.array({
                itemDefinition: $Tson.union({
                    union: [
                        $Tson.object({
                            properties: {
                                tag: $Tson.string(),
                                value: $Tson.union({ union: [$Tson.string(), $Tson.number()] as const }),
                            },
                        }),
                        $Tson.boolean(),
                    ] as const,
                }),
            }),
        },
    });
    type type = TsonType<typeof schema>;
    const correct: type = {
        items: [
            { tag: 'a', value: '' },
            { tag: 'b', value: 0 },
            true,
        ],
    };
    {
        // @ts-expect-error: TS2322
        const incorrect: type = { items: [{ tag: 'a', value: false }] };
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

function testNestedObjectOptionalProp() {
    const schema = $Tson.object({
        properties: {
            name: $Tson.string(),
            parentBranch: $Tson.object({
                default: undefined,
                properties: {
                    id: $Tson.string(),
                },
            }),
        }
    });
    type type = TsonType<typeof schema>;
    const correct: type[] = [
        { name: '' },
        { name: '', parentBranch: { id: '' } },
    ];
    // @ts-expect-error: TS2322
    const incorrect: type = {};
}

function testBareObjectOptionalProp() {
    const schema = $Tson.object({
        properties: {
            name: $Tson.string(),
            metadata: $Tson.object({ default: undefined }),
        }
    });
    type type = TsonType<typeof schema>;
    const correct: type[] = [
        { name: '' },
        { name: '', metadata: { anything: '' } },
    ];
    // @ts-expect-error: TS2322
    const incorrect: type = {};
}

function testAnyOptionalProp() {
    const schema = $Tson.object({
        properties: {
            name: $Tson.string(),
            data: $Tson.any({ default: null }),
        }
    });
    type type = TsonType<typeof schema>;
    const correct: type[] = [
        { name: '' },
        { name: '', data: 'anything' },
    ];
    // @ts-expect-error: TS2322
    const incorrect: type = {};
}

function testUnionOptionalProp() {
    const schema = $Tson.object({
        properties: {
            name: $Tson.string(),
            value: $Tson.union({ union: [$Tson.string(), $Tson.number()] as const, default: undefined }),
        }
    });
    type type = TsonType<typeof schema>;
    const correct: type[] = [
        { name: '' },
        { name: '', value: '' },
        { name: '', value: 0 },
    ];
    // @ts-expect-error: TS2322
    const incorrect: type = {};
}

