import { $Object } from '../object/object.util';
import { $Reflection } from '../reflection/utils/reflection.util';

export type JsonFilter<T = any> = (value: T) => boolean;

export type JsonFilterOperator<TArg = any, TValue = any> = (arg: TArg, options: JsonFilterOptions) => JsonFilter<TValue>;
export type JsonFilterOperators = { [operator: string]: JsonFilterOperator };

export const JsonFilters = {
    query:
        <T = any, TT = any>(selector: (value: T) => TT, operator: JsonFilter<TT>) =>
        (value: T) =>
            operator(selector(value)),
    and:
        <T = any>(...operators: JsonFilter<T>[]) =>
        (value: T) =>
            operators.every((arg) => arg(value)),
    or:
        <T = any>(...operators: JsonFilter<T>[]) =>
        (value: T) =>
            operators.some((arg) => arg(value)),
    not:
        <T = any>(operator: JsonFilter<T>) =>
        (value: T) =>
            !operator(value),
    equals: (arg: string | number | Date) => (value: any) => value === arg || String(value).toLowerCase() === String(arg).toLowerCase(),
    length: (arg: number) => (value: any) => (Array.isArray(value) ? value.length === arg : typeof value === 'object' ? Object.keys(value).length === arg : String(value).length === arg),
    contains: (arg: string | number) => (value: any) => value === arg || String(value).toLowerCase().includes(String(arg).toLowerCase()),
    starts: (arg: string | number | Date) => (value: any) => value === arg || String(value).toLowerCase().startsWith(String(arg).toLowerCase()),
    ends: (arg: string | number | Date) => (value: any) => value === arg || String(value).toLowerCase().endsWith(String(arg).toLowerCase()),
    greater: (arg: number | Date) => (value: any) => {
        switch ($Reflection.getSimpleTypeName(value)) {
            case 'array':
                return value.length > Number(arg);
            case 'string':
                return String(value).length > Number(arg);
            case 'number':
                return Number(value) > Number(arg);
            case 'date':
                return new Date(value) > new Date(arg);
        }
    },
    less: (arg: number | Date) => (value: any) => {
        switch ($Reflection.getSimpleTypeName(value)) {
            case 'array':
                return value.length < Number(arg);
            case 'string':
                return String(value).length < Number(arg);
            case 'number':
                return Number(value) < Number(arg);
            case 'date':
                return new Date(value) < new Date(arg);
        }
    },
};

export const JsonFilterOperators: JsonFilterOperators = {
    and: (arg: any[], options: JsonFilterOptions) => JsonFilters.and(...arg.map((arg) => jsonFilter(arg, { ...options, operator: 'and' }))),
    or: (arg: any[], options: JsonFilterOptions) => JsonFilters.or(...arg.map((arg) => jsonFilter(arg, { ...options, operator: 'or' }))),
    not: (arg: any, options: JsonFilterOptions) => JsonFilters.not(jsonFilter(arg, options)),
    equals: JsonFilters.equals,
    contains: JsonFilters.contains,
    starts: JsonFilters.starts,
    ends: JsonFilters.ends,
    greater: JsonFilters.greater,
    less: JsonFilters.less,
};

export type JsonFilterOptions = {
    operatorPrefix: string;
    operator: 'or' | 'and';
    operators: { [operator: string]: JsonFilterOperator };
};

export const DefaultJsonFilterOptions: JsonFilterOptions = {
    operatorPrefix: '$',
    operator: 'and',
    operators: JsonFilterOperators,
};

export type JsonFilterQuery =
    | { [property: string]: JsonFilterQuery }
    | {
          $and?: JsonFilterQuery[];
          $or?: JsonFilterQuery[];
          $not?: JsonFilterQuery;
          $equals?: string | number | Date;
          $contains?: string | number;
          $starts?: string | number | Date;
          $ends?: string | number | Date;
          $greater?: number | Date;
          $less?: number | Date;
      };

export function jsonFilter<TQuery = JsonFilterQuery>(query: TQuery, options: Partial<JsonFilterOptions> = {}): JsonFilter {
    options = $Object.getDefaults(options, DefaultJsonFilterOptions);
    const filters: JsonFilter[] = [];
    for (const property in query) {
        const value = query[property];
        let filter: JsonFilter;
        if (property.startsWith(options.operatorPrefix)) {
            const operator = options.operators[property.substring(1)];
            if (operator) {
                filter = operator(value, options as JsonFilterOptions);
            } else {
                throw new Error(`Unknown operator '${property.substring(1)}'`);
            }
        } else {
            filter = JsonFilters.query((item) => item[property], jsonFilter(value, options as JsonFilterOptions));
        }
        filters.push(filter);
    }
    return options.operator === 'and' ? JsonFilters.and(...filters) : JsonFilters.or(...filters);
}
