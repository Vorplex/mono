import { $Tson } from '../tson';
import { TsonRecord } from './record';

describe(TsonRecord.name, () => {
    describe(TsonRecord.prototype.accepts.name, () => {
        it('should accept any record definition when no property schema is defined', () => {
            const schema = new TsonRecord();

            const result = schema.accepts($Tson.record({ property: $Tson.string() }));

            expect(result).toBe(true);
        });

        it('should reject bare record definitions when a property schema is required', () => {
            const schema = new TsonRecord({ type: 'record', property: $Tson.string() });

            const result = schema.accepts($Tson.record());

            expect(result).toBe(false);
        });

        it('should reject mismatched property schemas', () => {
            const schema = new TsonRecord({ type: 'record', property: $Tson.string() });

            const result = schema.accepts($Tson.record({ property: $Tson.number() }));

            expect(result).toBe(false);
        });
    });
});
