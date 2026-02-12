import { $Tson } from './tson';

describe($Tson.name, () => {
    describe($Tson.any, () => {
        it('should return any definition', () => {
            const result = $Tson.any();
            expect(result).toEqual({ type: 'any' });
        });
    });

    describe($Tson.parse, () => {
        it('should return parsed any definition', () => {
            const result = $Tson.parse($Tson.any());
        });
    });
});
