import { type TsonDefinition } from '@vorplex/core';
import { defineComponent, useInjector } from '@vorplex/solid';
import { ButtonComponent } from '../../../../../components/button.component';
import { ModalService } from '../../../../../services/modal.service';

export const BindingButton = defineComponent((props: { value: string, locals: Record<string, TsonDefinition>, accepts: TsonDefinition }) => {

    const service = useInjector({ modal: ModalService });

    return (
        <ButtonComponent
            icon={'braces'}
            title={'Bind value'}
            onClick={async () => {
            }}
        />
    );
});

