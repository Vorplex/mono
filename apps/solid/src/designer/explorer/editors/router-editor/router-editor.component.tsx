import { createStyle, useInjector, useStore } from '@vorplex/solid';
import { For } from 'solid-js';
import { ButtonComponent } from '../../../../components/button.component';
import { createTableClasses } from '../../../../components/create-table-classes.function';
import { DropdownFormInputComponent } from '../../../../components/forms/inputs/dropdown.component';
import { TextFormInputComponent } from '../../../../components/forms/inputs/text.component';
import { PlatformService } from '../../../../services/platform.service';

const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridAutoRows: 'max-content',
        gap: '5px',
        overflow: 'auto',
        padding: '10px'
    }
}));

const routesTableClasses = createTableClasses(() => ({
    columns: 'auto auto max-content'
}));

export function RouterEditorComponent() {

    const service = useInjector({
        platform: PlatformService
    });

    const shtml = useStore(service.platform.shtml.state);

    const pageOptions = () => Object.fromEntries(shtml.app.pageIds().map(id => [shtml.pages[id].name(), shtml.pages[id].name()]));

    const setRoutes = (routes: Record<string, string>) => {
        shtml.app.router(Object.keys(routes).length === 0 ? undefined : { routes });
    };

    return (
        <div class={classes().container}>
            <div class={routesTableClasses().table}>
                <div class={routesTableClasses().header}>
                    <div class={routesTableClasses().row}>
                        <div class={routesTableClasses().cell}>Route</div>
                        <div class={routesTableClasses().cell}>Page</div>
                        <div class={routesTableClasses().cell}>
                            <ButtonComponent icon='plus' appearance='flat' onClick={() => {
                                const routes = { ...(shtml.app.router()?.routes ?? {}) };
                                let pattern = '/route';
                                let index = 1;
                                while (pattern in routes) pattern = `/route-${index++}`;
                                routes[pattern] = shtml.app.pageIds().map(id => shtml.pages[id].name())[0] ?? '';
                                setRoutes(routes);
                            }} />
                        </div>
                    </div>
                </div>
                <div class={routesTableClasses().body}>
                    <For each={Object.entries(shtml.app.router()?.routes ?? {})}>
                        {([pattern, page]) => (
                            <div class={routesTableClasses().row}>
                                <div class={routesTableClasses().cell}>
                                    <TextFormInputComponent
                                        value={pattern}
                                        placeholder={'/route/:param'}
                                        onChanged={value => {
                                            if (value === '' || value === pattern) return;
                                            const routes = { ...(shtml.app.router()?.routes ?? {}) };
                                            const page = routes[pattern];
                                            delete routes[pattern];
                                            routes[value] = page;
                                            setRoutes(routes);
                                        }}
                                    />
                                </div>
                                <div class={routesTableClasses().cell}>
                                    <DropdownFormInputComponent
                                        value={page}
                                        placeholder={'[page]'}
                                        options={pageOptions()}
                                        onChange={value => setRoutes({ ...(shtml.app.router()?.routes ?? {}), [pattern]: value ?? '' })}
                                    />
                                </div>
                                <div class={routesTableClasses().cell}>
                                    <ButtonComponent
                                        appearance={'flat'}
                                        icon={'minus'}
                                        onClick={() => {
                                            const routes = { ...(shtml.app.router()?.routes ?? {}) };
                                            delete routes[pattern];
                                            setRoutes(routes);
                                        }}
                                    />
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </div>
        </div>
    );
}
