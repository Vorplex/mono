import { render } from 'solid-js/web';

function App() {
    return (
        <></>
    );
}

async function bootstrap() {
    render(() => <App />, document.body);
}

bootstrap().catch(console.error)
