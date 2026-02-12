export class $Random {
    /**
     * Returns a random number inclusive to the `min` and `max` number.
     * @param min The minimum value the random number can be.
     * @param max The maximum value the random number can be.
     * @returns A random number inclusive to the `min` and `max` number.
     */
    public static random(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    public static convertSeedToNumber(seed: string) {
        let number = 0;
        for (let i = 0; i < seed.length; i++) {
            number = (number * 31 + seed.charCodeAt(i)) % 100000;
        }
        return number;
    }

    public static generateSeed(length: number) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let seed = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            seed += chars[randomIndex];
        }
        return seed;
    }

    public static seededRandom(seed: string, offset: number = 0): number {
        const number = $Random.convertSeedToNumber(seed + offset);
        const x = Math.sin(number) * 10000;
        return x - Math.floor(x);
    }

    public static normalizeWeights(items: Record<string, number>) {
        const result: Record<string, number> = {};
        const total = Object.values(items).reduce((sum, weight) => sum + weight, 0);
        for (const item in items) {
            result[item] = items[item] / total;
        }
        return result;
    }

    public static getItem(items: Record<string, number>, options?: { seed?: string; seedOffset?: number }): string {
        const random = $Random.seededRandom(options?.seed ?? $Random.generateSeed(10), options?.seedOffset ?? 0);
        const normalizedItems = $Random.normalizeWeights(items);
        const keys = Object.keys(normalizedItems);
        const weights = Object.values(normalizedItems);

        const cumulativeWeights = [];
        let cumulativeSum = 0;
        for (let i = 0; i < weights.length; i++) {
            cumulativeSum += weights[i];
            cumulativeWeights.push(cumulativeSum);
        }

        for (let i = 0; i < cumulativeWeights.length; i++) {
            if (random <= cumulativeWeights[i]) {
                return keys[i];
            }
        }
    }
}
