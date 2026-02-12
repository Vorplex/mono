import { $Enum } from './enum.util';

enum SampleEnumA {
    A = 'A',
    B = 'B',
    C = 'C',
}
enum SampleEnum1 {
    A,
    B,
    C,
}

describe($Enum.name, () => {
    describe($Enum.getFlags.name, () => {
        it('should return flags of value', () => {
            expect($Enum.getFlags(SampleEnum1, 0)).toEqual(['A']);
            expect($Enum.getFlags(SampleEnum1, 1)).toEqual(['A', 'B']);
            expect($Enum.getFlags(SampleEnum1, 2)).toEqual(['A', 'C']);
            expect($Enum.getFlags(SampleEnum1, 3)).toEqual(['A', 'B', 'C']);
        });
    });

    describe($Enum.getItems.name, () => {
        it('should return all items of enum', () => {
            expect($Enum.getItems(SampleEnumA)).toEqual([
                { key: 'A', value: 'A' },
                { key: 'B', value: 'B' },
                { key: 'C', value: 'C' },
            ]);
            expect($Enum.getItems(SampleEnum1)).toEqual([
                { key: 'A', value: 0 },
                { key: 'B', value: 1 },
                { key: 'C', value: 2 },
            ]);
        });
    });

    describe($Enum.getKeys.name, () => {
        it('should return all keys of enum', () => {
            expect($Enum.getKeys(SampleEnumA)).toEqual(['A', 'B', 'C']);
            expect($Enum.getKeys(SampleEnum1)).toEqual(['A', 'B', 'C']);
        });
    });

    describe($Enum.getValue.name, () => {
        it('should return the value associate with the key', () => {
            expect($Enum.getValue(SampleEnumA, 'A')).toEqual('A');
            expect($Enum.getValue(SampleEnum1, 'A')).toEqual(0);
        });
    });

    describe($Enum.getValueKey.name, () => {
        it('should return the key associate with the value', () => {
            expect($Enum.getValueKey(SampleEnumA, 'A')).toEqual('A');
            expect($Enum.getValueKey(SampleEnum1, 0)).toEqual('A');
            expect($Enum.getValueKey(SampleEnum1, 'D')).toEqual(null);
            expect($Enum.getValueKey(SampleEnum1, 3)).toEqual(3);
        });
    });

    describe($Enum.getValues.name, () => {
        it('should return all values of enum', () => {
            expect($Enum.getValues(SampleEnumA)).toEqual(['A', 'B', 'C']);
            expect($Enum.getValues(SampleEnum1)).toEqual([0, 1, 2]);
        });
    });

    describe($Enum.hasFlag.name, () => {
        it('should return true if value includes flag', () => {
            expect($Enum.hasFlag(SampleEnum1.B, SampleEnum1.A)).toEqual(true);
            expect($Enum.hasFlag(SampleEnum1.B, SampleEnum1.B)).toEqual(true);
            expect($Enum.hasFlag(SampleEnum1.B, SampleEnum1.C)).toEqual(false);
        });
    });

    describe($Enum.isEnum.name, () => {
        it('should return true if the value is a valid enum', () => {
            expect($Enum.isEnum(SampleEnumA)).toEqual(true);
            expect($Enum.isEnum(SampleEnum1)).toEqual(true);
            expect($Enum.isEnum({})).toEqual(true);
            expect($Enum.isEnum({ A: 0 })).toEqual(false);
            expect($Enum.isEnum({ 0: 'A' })).toEqual(false);
            expect($Enum.isEnum([])).toEqual(false);
            expect($Enum.isEnum(0)).toEqual(false);
            expect($Enum.isEnum('')).toEqual(false);
            expect($Enum.isEnum(false)).toEqual(false);
            expect($Enum.isEnum(() => {})).toEqual(false);
        });
    });

    describe($Enum.isNumeric.name, () => {
        it('should return true if value is a valid numeric enum', () => {
            expect($Enum.isNumeric(SampleEnumA)).toEqual(false);
            expect($Enum.isNumeric(SampleEnum1)).toEqual(true);
        });
    });

    describe($Enum.isNonNumeric.name, () => {
        it('should return true if value is a valid non-numeric enum', () => {
            expect($Enum.isNonNumeric(SampleEnumA)).toEqual(true);
            expect($Enum.isNonNumeric(SampleEnum1)).toEqual(false);
        });
    });

    describe($Enum.removeFlag.name, () => {
        it('should remove the flag from the value', () => {
            expect($Enum.removeFlag(SampleEnum1.B, SampleEnum1.B)).toEqual(0);
            expect($Enum.removeFlag(SampleEnum1.B | SampleEnum1.C, SampleEnum1.B)).toEqual(SampleEnum1.C);
        });
    });

    describe($Enum.toggleFlag.name, () => {
        it('should toggle the flag from the value', () => {
            expect($Enum.toggleFlag(SampleEnum1.B | SampleEnum1.C, SampleEnum1.B)).toEqual(SampleEnum1.C);
            expect($Enum.toggleFlag(SampleEnum1.C, SampleEnum1.B)).toEqual(SampleEnum1.B | SampleEnum1.C);
        });
    });
});
