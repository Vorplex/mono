import { $Tson } from './tson';
import type { TsonDefinition } from './schema';
import { TsonObject } from './schemas/object';
import { TsonType, TypeTson } from './type';

function testObjectSatisfiesShape() {
    interface Point {
        x: number;
        y: number;
    }
    const schema = $Tson.object({
        properties: {
            x: $Tson.number(),
            y: $Tson.number(),
        },
    }) satisfies TypeTson<Point>;
    type type = TsonType<typeof schema>;
    const correct: type = { x: 0, y: 0 };
    // @ts-expect-error: TS2322
    const incorrect: type = {};
}

function testObjectSatisfiesShapeRejectsMissingProperty() {
    interface Point {
        x: number;
        y: number;
    }
    const schema = $Tson.object({
        properties: {
            x: $Tson.number(),
        },
        // @ts-expect-error: TS1360 - missing `y`, doesn't satisfy TypeTson<Point>
    }) satisfies TypeTson<Point>;
}

function testRecordSatisfiesShape() {
    const schema = $Tson.record({
        property: $Tson.string(),
    }) satisfies TypeTson<Record<string, string>>;
    type type = TsonType<typeof schema>;
    const correct: type = { a: 'x', b: 'y' };
    // @ts-expect-error: TS2322
    const incorrect: type = { a: 0 };
}

function testRecordSatisfiesShapeRejectsMismatch() {
    const schema = $Tson.record({
        property: $Tson.number(),
        // @ts-expect-error: TS1360 - $Tson.number() doesn't satisfy TypeTson<Record<string, string>>
    }) satisfies TypeTson<Record<string, string>>;
}

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

function testAnySatisfiesDefinition() {
    const schema = $Tson.any() satisfies TsonDefinition;
    type type = TsonType<typeof schema>;
    { const correct: type = ''; }
    { const correct: type = 0; }
    { const correct: type = { anything: true }; }
}

function testArray() {
    const schema = $Tson.array({ itemDefinition: $Tson.string() });
    type type = TsonType<typeof schema>;
    const correct: type = [''];
    // @ts-expect-error: TS2322
    const incorrect: type = [0];
}

function testReadonlyArray() {
    const schema = $Tson.array({ itemDefinition: $Tson.string(), readonly: true });
    type type = TsonType<typeof schema>;
    const fromLiteral: type = [''];
    const fromMutable: type = ['a'] as string[];
    // @ts-expect-error: TS2339 - readonly array has no push
    fromLiteral.push('x');
    // @ts-expect-error: TS2542 - readonly array index is not assignable
    fromLiteral[0] = 'x';
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

function testBareObject() {
    const schema = $Tson.object();
    type type = TsonType<typeof schema>;
    const correct: type = { a: '', b: 0, c: false, d: { nested: true } };
    // @ts-expect-error: TS2322
    const incorrect: type = 0;
}

function testTsonObjectValueGeneric() {
    const schema = new TsonObject<{ name: string }>({
        type: 'object',
        properties: {
            name: $Tson.string(),
        },
    });
    const [value] = schema.parse({ name: '' });
    if (value) {
        const correct: string = value.name;
        // @ts-expect-error: TS2322
        const incorrect: number = value.name;
    }
}

function testTsonObjectValueGenericRejectsPropertyMismatch() {
    const schema = new TsonObject<{ name: string }>({
        type: 'object',
        properties: {
            // @ts-expect-error: TS2322
            name: $Tson.number(),
        },
    });
}

function testTsonObjectValueGenericChecksDefault() {
    const schema = new TsonObject<{ name: string }>({
        type: 'object',
        default: { value: { name: '' } },
    });
    const incorrect = new TsonObject<{ name: string }>({
        type: 'object',
        default: {
            // @ts-expect-error: TS2322
            value: { name: 0 },
        },
    });
}

function testRecord() {
    const schema = $Tson.record({ property: $Tson.string() });
    type type = TsonType<typeof schema>;
    const correct: type = { a: '', b: '' };
    // @ts-expect-error: TS2322
    const incorrect: type = { a: 0 };
}

function testBareRecord() {
    const schema = $Tson.record();
    type type = TsonType<typeof schema>;
    const correct: type = { a: '', b: 0, c: false, d: { nested: true } };
    // @ts-expect-error: TS2322
    const incorrect: type = 0;
}

function testNestedBareRecord() {
    const ConfigDefinition = $Tson.object({
        properties: {
            element: $Tson.object({
                properties: {
                    hidden: $Tson.boolean({ default: { value: false } }),
                    name: $Tson.string(),
                    bindings: $Tson.record(),
                    events: $Tson.object(),
                },
            }),
        },
    });
    const BranchDefinition = $Tson.object({
        properties: {
            name: $Tson.string(),
            config: ConfigDefinition,
        },
    });

    type Branch = TsonType<typeof BranchDefinition>;
    const correct: Branch = {
        name: '',
        config: {
            element: {
                name: '',
                bindings: {},
                events: {},
            },
        },
    };
    const correctWithBindings: Branch = {
        name: '',
        config: {
            element: {
                name: '',
                bindings: { value: 0 },
                events: { click: 'open' },
            },
        },
    };
    const incorrect: Branch = {
        name: '',
        config: {
            element: {
                name: '',
                // @ts-expect-error: TS2322
                bindings: 0,
                events: {},
            },
        },
    };
    const incorrectEvent: Branch = {
        name: '',
        config: {
            element: {
                name: '',
                bindings: {},
                // @ts-expect-error: TS2322
                events: 0,
            },
        },
    };
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

function testUnionContainingAny() {
    const schema = $Tson.union({ union: [$Tson.string(), $Tson.any()] as const });
    type type = TsonType<typeof schema>;
    { const correct: type = ''; }
    { const correct: type = 0; }
    { const correct: type = { anything: true }; }
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
            $Tson.object({ properties: { kind: $Tson.string(), b: $Tson.number(), c: $Tson.boolean({ default: { value: undefined } }) } }),
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
            offline: $Tson.boolean({ default: { value: undefined } }),
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
                default: { value: undefined },
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

function testRecordOptionalProp() {
    const schema = $Tson.object({
        properties: {
            name: $Tson.string(),
            metadata: $Tson.record({ property: $Tson.any(), default: { value: undefined } }),
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
            data: $Tson.any({ default: { value: null } }),
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
            value: $Tson.union({ union: [$Tson.string(), $Tson.number()] as const, default: { value: undefined } }),
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
