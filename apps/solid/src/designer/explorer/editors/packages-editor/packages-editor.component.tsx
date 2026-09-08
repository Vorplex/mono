import { JsDelivr, NPM } from '@vorplex/compiler';
import { $String, Task } from '@vorplex/core';
import { createStyle, defineRemountingComponent, useInjector, useStore } from '@vorplex/solid';
import { createMemo, createSignal, Match, Switch } from 'solid-js';
import { parse, stringify } from 'yaml';
import { ButtonComponent } from '../../../../components/button.component';
import { RadioButtonComponent } from '../../../../components/radio-button.component';
import { MonacoComponent } from '../../../../components/script-editor/monaco.component';
import { ModalService } from '../../../../services/modal.service';
import { PlatformService } from '../../../../services/platform.service';


const classes = createStyle(() => ({
    container: {
        display: 'grid',
        gridTemplateRows: 'max-content auto',
        gap: '5px',
        height: '100%',
        overflow: 'hidden'
    },
    header: {
        display: 'grid',
        gridTemplateColumns: 'auto max-content',
        gap: '5px'
    },
    tabs: {
        justifySelf: 'start'
    }
}));

export const PackagesEditorComponent = defineRemountingComponent((props: { scopeId: string }) => {

    const service = useInjector({
        platform: PlatformService,
        modal: ModalService
    });

    const drx = useStore(service.platform.drx.state);
    const scope = drx.app.id() === props.scopeId ? drx.app : drx.components[props.scopeId];

    const tabs = ['packages', 'dependency-tree', 'dependency-list'] as const;
    const [selectedTab, setSelectedTab] = createSignal<typeof tabs[number]>('packages');

    const packagesYaml = createMemo(() => stringify(scope.packages() ?? {}));
    const dependencyTreeYaml = createMemo(() => (scope.dependencyTree() ? stringify(scope.dependencyTree()) : ''));
    const dependencyListYaml = createMemo(() => (scope.dependencyTree() ? stringify(NPM.flattenDependencyTree(scope.dependencyTree())) : ''));

    return (
        <div class={classes().container}>
            <div class={classes().header}>
                <RadioButtonComponent
                    class={classes().tabs}
                    options={tabs.map(tab => ({ value: tab, label: $String.titleCase(tab) }))}
                    value={selectedTab()}
                    onChange={tab => setSelectedTab(tab)}
                />
                <ButtonComponent
                    label={'Install'}
                    onClick={async () => {
                        const packages = scope.packages() ?? {};
                        const task = new Task('Resolve Dependency Tree');
                        service.modal.showTask(task);
                        const tree = await NPM.resolveDependencyTree(packages, {
                            getPackageJson: (name, version) => JsDelivr.getPackageJson(name, version),
                            resolveVersion: (name, semanticVersion) => JsDelivr.resolveVersion(name, semanticVersion)
                        }, task);
                        scope.dependencyTree(tree);
                        setSelectedTab('dependency-tree');
                    }}
                />
            </div>
            <Switch>
                <Match when={selectedTab() === 'packages'}>
                    <MonacoComponent language={'yaml'} value={packagesYaml()} onChange={value => scope.packages(parse(value))} />
                </Match>
                <Match when={selectedTab() === 'dependency-tree'}>
                    <MonacoComponent language={'yaml'} readonly value={dependencyTreeYaml()} />
                </Match>
                <Match when={selectedTab() === 'dependency-list'}>
                    <MonacoComponent language={'yaml'} readonly value={dependencyListYaml()} />
                </Match>
            </Switch>
        </div>
    );
});
