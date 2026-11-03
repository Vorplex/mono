import { $Cipher } from './cipher.util';

describe($Cipher.name, () => {
    const secret = 'a-long-random-secret';
    const payload = { workspaceId: '42', ref: 'feature/login', nested: { count: 1 } };

    describe($Cipher.encrypt.name, () => {
        it('should produce a url safe value', async () => {
            const value = await $Cipher.encrypt(secret, 'share', payload, 60000);
            expect(value).toMatch(/^[A-Za-z0-9_-]+$/);
        });
        it('should produce a different value each time', async () => {
            const first = await $Cipher.encrypt(secret, 'share', payload, 60000);
            const second = await $Cipher.encrypt(secret, 'share', payload, 60000);
            expect(first).not.toEqual(second);
        });
    });

    describe($Cipher.decrypt.name, () => {
        function test(args: { it: string; secret: string; purpose: string; lifetime: number; value?: (value: string) => string; expected: unknown }) {
            it(args.it, async () => {
                const encrypted = await $Cipher.encrypt(secret, 'share', payload, args.lifetime);
                const value = args.value ? args.value(encrypted) : encrypted;
                const result = await $Cipher.decrypt(args.secret, args.purpose, value);
                expect(result).toEqual(args.expected);
            });
        }

        test({
            it: 'should decrypt what it encrypted',
            secret,
            purpose: 'share',
            lifetime: 60000,
            expected: payload,
        });
        test({
            it: 'should not decrypt with another purpose',
            secret,
            purpose: 'refresh',
            lifetime: 60000,
            expected: undefined,
        });
        test({
            it: 'should not decrypt with another secret',
            secret: 'another-secret',
            purpose: 'share',
            lifetime: 60000,
            expected: undefined,
        });
        test({
            it: 'should not decrypt a tampered value',
            secret,
            purpose: 'share',
            lifetime: 60000,
            value: value => `${value.slice(0, -2)}${value.endsWith('AA') ? 'BB' : 'AA'}`,
            expected: undefined,
        });
        test({
            it: 'should not decrypt an expired value',
            secret,
            purpose: 'share',
            lifetime: -1,
            expected: undefined,
        });
        test({
            it: 'should not decrypt garbage',
            secret,
            purpose: 'share',
            lifetime: 60000,
            value: () => 'not-a-value',
            expected: undefined,
        });
        test({
            it: 'should not decrypt an empty value',
            secret,
            purpose: 'share',
            lifetime: 60000,
            value: () => '',
            expected: undefined,
        });
    });
});
