import { Instance } from './instance.type';
import { Type } from './type.type';

const a: Instance<Type<string>> = '';
const b: Instance<{ name: Type<string> }> = { name: '' };
const c: Instance<[Type<string>, Type<number>]> = ['', 2];
