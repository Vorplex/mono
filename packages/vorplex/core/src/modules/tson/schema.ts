import type { TsonAny, TsonAnyDefinition } from './schemas/any';
import type { TsonArray, TsonArrayDefinition } from './schemas/array';
import type { TsonBoolean, TsonBooleanDefinition } from './schemas/boolean';
import type { TsonEnum, TsonEnumDefinition } from './schemas/enum';
import type { TsonNumber, TsonNumberDefinition } from './schemas/number';
import type { TsonObject, TsonObjectDefinition } from './schemas/object';
import type { TsonString, TsonStringDefinition } from './schemas/string';
import type { TsonUnion, TsonUnionDefinition } from './schemas/union';

export type TsonDefinition =
    | TsonEnumDefinition
    | TsonAnyDefinition
    | TsonArrayDefinition
    | TsonBooleanDefinition
    | TsonAnyDefinition
    | TsonNumberDefinition
    | TsonObjectDefinition
    | TsonStringDefinition
    | TsonUnionDefinition;

export type TsonSchema =
    | TsonString
    | TsonNumber
    | TsonBoolean
    | TsonArray
    | TsonEnum
    | TsonObject
    | TsonAny
    | TsonUnion;
