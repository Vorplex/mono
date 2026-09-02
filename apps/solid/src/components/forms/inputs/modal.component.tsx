import { Portal, useInjector } from '@vorplex/solid';
import { ModalService } from '../../../services/modal.service';
import { ButtonComponent } from '../../button.component';
import { ModalComponentProps } from '../../modal.component';

export interface ModalFormInput {
    disabled?: boolean;
    modal: (modal: { resolve: (value?: any) => void, portal: Portal }) => ModalComponentProps;
}

export function ModalFormInputComponent(props: ModalFormInput) {
    const services = useInjector({
        modal: ModalService
    });

    return (
        <ButtonComponent
            icon={'square-arrow-out-up-right'}
            onClick={() => {
                services.modal.show({
                    modal: props.modal
                });
            }}
        />
    );
}
