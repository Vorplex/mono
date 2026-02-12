import { $Date } from '../date/date.util';
import { type JsonFilter, JsonFilters, jsonFilter } from './json-filter.function';

const TestData = {
    numbers: [-10, -1, 0, 1, 10],
    arrays: [[0], [0, 0], [0, 0, 0]],
    strings: ['A', 'B', 'C', 'D', 'Rudi', 'Stefan', 'Carel'],
    dates: [$Date.addDays(new Date(), -1), new Date(), $Date.addDays(new Date(), 1)],
    objects: [
        {
            name: 'Rudi',
            age: 23,
        },
        {
            name: 'Stefan',
            age: 25,
        },
        {
            name: 'Carel',
            age: 28,
            child: {
                name: 'Piet',
            },
        },
    ],
};

const { equals, and, contains, ends, greater, length, less, not, or, query, starts } = JsonFilters;

const test = (data: any[], filter: JsonFilter, expected: any[]) => {
    const result = data.filter(filter);
    expect(result).toEqual(expected);
};

describe(jsonFilter.name, () => {
    it('should filter query', () => {
        test(
            TestData.objects,
            query((object) => object.name, equals('Rudi')),
            [TestData.objects[0]],
        );
    });
    it('should filter not', () => {
        test(TestData.numbers, not(equals(0)), [-10, -1, 1, 10]);
    });
    it('should filter and', () => {
        test(TestData.numbers, and(greater(0), equals(1)), [1]);
    });
    it('should filter or', () => {
        test(TestData.numbers, or(greater(0), equals(1)), [1, 10]);
    });
    it('should filter equals', () => {
        test(TestData.numbers, equals(1), [1]);
        test(TestData.strings, equals('A'), ['A']);
    });
    it('should filter contains', () => {
        test(TestData.numbers, contains(10), [-10, 10]);
        test(TestData.strings, contains('a'), ['A', 'Stefan', 'Carel']);
    });
    it('should filter starts', () => {
        test(TestData.numbers, starts(1), [1, 10]);
        test(TestData.strings, starts('a'), ['A']);
    });
    it('should filter ends', () => {
        test(TestData.numbers, ends(1), [-1, 1]);
        test(TestData.strings, ends('n'), ['Stefan']);
    });
    it('should filter greater', () => {
        test(TestData.arrays, greater(2), [[0, 0, 0]]);
        test(TestData.numbers, greater(1), [10]);
        test(TestData.strings, greater(4), ['Stefan', 'Carel']);
        test(TestData.dates, greater(TestData.dates[1]), [TestData.dates[2]]);
    });
    it('should filter less', () => {
        test(TestData.arrays, less(2), [[0]]);
        test(TestData.numbers, less(1), [-10, -1, 0]);
        test(TestData.strings, less(4), ['A', 'B', 'C', 'D']);
        test(TestData.dates, less(TestData.dates[1]), [TestData.dates[0]]);
    });
    it('should filter length', () => {
        test(TestData.arrays, length(2), [[0, 0]]);
        test(TestData.numbers, length(1), [0, 1]);
        test(TestData.strings, length(4), ['Rudi']);
    });
    it('should filter', () => {
        test(
            TestData.objects,
            jsonFilter({
                $or: [
                    {
                        name: {
                            $equals: 'Rudi',
                        },
                    },
                    {
                        name: {
                            $equals: 'Carel',
                        },
                    },
                ],
            }),
            [TestData.objects[0], TestData.objects[2]],
        );
    });
});
