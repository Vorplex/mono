import { createStyle, InjectorContext } from '@vorplex/solid';
import { render } from 'solid-js/web';
import { PlatformInjector } from './consts/platform.injector';
import { Theme } from './consts/theme';
import { DesignerComponent } from './designer/designer.component';
import './directives/index';
import { PlatformService } from './services/platform.service';

createStyle(() => ({
    _: {
        '*': {
            padding: '0px',
            margin: '0px',
            boxSizing: 'border-box',
            outline: 'none',
            userSelect: 'none'
        },
        'html, body': {
            display: 'grid',
            overflow: 'hidden',
            width: '100vw',
            height: '100vh',
            background: Theme().background.color,
            color: Theme().background.text,
            '::-webkit-scrollbar': {
                width: '5px',
                height: '5px',
            },
            '::-webkit-scrollbar-track': {
                background: Theme().outline.primary,
                WebkitBoxShadow: `inset 0 0 6px rgba(0,0,0,0.3)`,
            },
            '::-webkit-scrollbar-thumb': {
                background: Theme().info.outline,
                borderRadius: '10px',
                WebkitBoxShadow: `inset 0 0 6px rgba(0,0,0,0.3)`,
            },
            fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            fontSize: '12px',
        },
        button: {
            fontSize: '1rem'
        },
        'input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none'
        }
    }
}));

InjectorContext.defaultValue = PlatformInjector;

function App() {
    return (
        <DesignerComponent />
    );
}

async function bootstrap() {
    const service = PlatformInjector.map({
        platform: PlatformService
    });
    await service.platform.fetch();
    render(() => (
        <InjectorContext.Provider value={PlatformInjector}>
            <App />
        </InjectorContext.Provider>
    ), document.body!);
}

bootstrap().catch(console.error)
