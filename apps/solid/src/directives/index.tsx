import { ContextMenuDirective, ContextMenuDirectiveProps } from './context-menu.directive';
import { DraggableDirective, DraggableDirectiveProps, DropzoneDirective, DropzoneDirectiveProps } from './draggable.directive';
import { PopoverDirective, PopoverDirectiveProps } from './popover.directive';
import { TooltipDirective, TooltipDirectiveProps } from './tooltip.directive';

window['TooltipDirective'] = TooltipDirective;
window['ContextMenuDirective'] = ContextMenuDirective;
window['DraggableDirective'] = DraggableDirective;
window['DropzoneDirective'] = DropzoneDirective;
window['PopoverDirective'] = PopoverDirective;

declare module "solid-js" {
    namespace JSX {
        interface Directives {
            TooltipDirective: TooltipDirectiveProps;
            ContextMenuDirective: ContextMenuDirectiveProps,
            DraggableDirective: DraggableDirectiveProps,
            DropzoneDirective: DropzoneDirectiveProps,
            PopoverDirective: PopoverDirectiveProps,
        }
    }
}
