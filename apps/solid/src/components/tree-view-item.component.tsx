import { createContext, JSXElement, useContext } from 'solid-js';

export const TreeViewContext = createContext({ indent: 0 });

export function TreeViewItemFragment(props: { children: (indent: number) => JSXElement }) {
    const context = useContext(TreeViewContext);
    return (
        <TreeViewContext.Provider value={{ indent: context.indent + 1 }}>
            {props.children(context.indent)}
        </TreeViewContext.Provider>
    );
}
