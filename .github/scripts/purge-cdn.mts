const paths = [
    '@vorplex/drx@latest',
    '@vorplex/drx@latest/+esm',
    '@vorplex/drx@latest/dist/standalone/drx.js',
    '@vorplex/drx@latest/dist/standalone/runtime.js',
    '@vorplex/drx@latest/dist/standalone/pwa-service-worker.js'
];

let failed = false;

for (const path of paths) {
    const url = `https://purge.jsdelivr.net/npm/${path}`;
    try {
        const response = await fetch(url);
        const body = await response.text();
        console.log(`${response.ok ? 'OK' : 'FAILED'} ${response.status} ${url}\n${body}\n`);
        if (!response.ok) failed = true;
    } catch (error) {
        console.error(`FAILED ${url}\n${error}\n`);
        failed = true;
    }
}

if (failed) process.exit(1);
