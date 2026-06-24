import type { TsonAny, TsonAnyDefinition } from './schemas/any';
import type { TsonArray, TsonArrayDefinition } from './schemas/array';
import type { TsonBoolean, TsonBooleanDefinition } from './schemas/boolean';
import type { TsonEnum, TsonEnumDefinition } from './schemas/enum';
import type { TsonNumber, TsonNumberDefinition } from './schemas/number';
import type { TsonObject, TsonObjectDefinition } from './schemas/object';
import type { TsonRecord, TsonRecordDefinition } from './schemas/record';
import type { TsonRef, TsonRefDefinition } from './schemas/ref';
import type { TsonString, TsonStringDefinition } from './schemas/string';
import type { TsonUnion, TsonUnionDefinition } from './schemas/union';

export type TsonDefinition =
    | TsonEnumDefinition
    | TsonAnyDefinition
    | TsonArrayDefinition
    | TsonBooleanDefinition
    | TsonNumberDefinition
    | TsonObjectDefinition
    | TsonRecordDefinition
    | TsonRefDefinition
    | TsonStringDefinition
    | TsonUnionDefinition;

export type TsonSchema =
    | TsonString
    | TsonNumber
    | TsonBoolean
    | TsonArray
    | TsonEnum
    | TsonObject
    | TsonRecord
    | TsonAny
    | TsonRef
    | TsonUnion;
