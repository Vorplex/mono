export const Unit = {
    Bytes: {
        b: 1,
        kb: 1024,
        mb: 1024 * 1024,
        gb: 1024 * 1024 * 1024,
        tb: 1024 * 1024 * 1024 * 1024,
    },
    Length: {
        mm: 1,
        cm: 10,
        m: 1000,
        km: 1000000,
    },
    Time: {
        ms: 1,
        s: 1000,
        m: 60000,
        h: 3600000,
        d: 86400000,
    },
} as const;
