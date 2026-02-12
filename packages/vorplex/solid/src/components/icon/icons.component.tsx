import { classNames } from '@vorplex/web';
import type { JSX } from 'solid-js';
import { createStyle } from '../../functions/create-style.function';

export type IconPack = {
    Key: string,
    Cube: string;
    FileLines: string;
    Download: string;
    List: string;
    MagnifyingGlassMinus: string;
    MagnifyingGlassPlus: string;
    Rocket: string;
    RulerCombined: string;
    Shapes: string;
    Hand: string;
    RightLeft: string;
    Server: string;
    Globe: string;
    CalenderDays: string;
    Error: string;
    Warning: string;
    AddressCard: string;
    PuzzlePiece: string;
    ObjectGroup: string;
    Tv: string;
    Code: string;
    FileCode: string;
    Cubes: string;
    FolderPlus: string;
    Foursquare: string;
    LayerGroup: string;
    OutlineCircleQuestion: string;
    CircleQuestion: string;
    CubesStacked: string;
    Message: string;
    CloudArrowUp: string;
    ArrowUpRightFromSquare: string;
    PenToSquare: string;
    Sliders: string;
    PaintBrush: string;
    BarsStaggered: string;
    FolderTree: string;
    Star: string;
    StarOutline: string;
    CartPlus: string;
    Equals: string;
    Clock: string;
    ListCheck: string;
    Eye: string;
    EyeSlash: string;
    Comment: string;
    ICursor: string;
    SquareCaretDown: string;
    SquareCaretUp: string;
    Link: string;
    LinkSlash: string;
    SquarePen: string;
    Clone: string;
    Copy: string;
    CodeBranch: string;
    Stopwatch: string;
    PlusCircle: string;
    MinusCircle: string;
    ClipboardList: string;
    Expand: string;
    Swatchbook: string;
    Gears: string;
    Computer: string;
    HouseLaptop: string;
    Desktop: string;
    MagnifyingGlass: string;
    ClipboardQuestion: string;
    Pause: string;
    CircleNodes: string;
    FileCirclePlus: string;
    ArrowRight: string;
    ArrowRightToBracket: string;
    PaperPlane: string;
    Box: string;
    Database: string;
    Diagram: string;
    Screen: string;
    Move: string;
    Circle: string;
    OutlineCircle: string;
    Check: string;
    CheckCircle: string;
    OutlineCheckCircle: string;
    CheckSquare: string;
    TimesCircle: string;
    TimesSquare: string;
    CaretDown: string;
    ChevronDown: string;
    ChevronRight: string;
    ChevronUp: string;
    CaretUp: string;
    CaretRight: string;
    Flag: string;
    Trash: string;
    Plus: string;
    Spinner: string;
    Folder: string;
    File: string;
    Times: string;
    Minus: string;
    MinusSquare: string;
    Square: string;
    Rectangle: string;
    Refresh: string;
    Info: string;
    Bolt: string;
    User: string;
    Gear: string;
    Stack: string;
    Network: string;
    Ellipsis: string;
    History: string;
    Boxes: string;
    Bell: string;
    Play: string;
    Reset: string;
    Test: string;
    SignIn: string;
    Home: string;
    Settings: string;
    Account: string;
    Cursor: string;
    Mouse: string;
    Resize: string;
    Terminal: string;
    Font: string;
    Button: string;
    None: string;
};

if (!document.querySelector('link[data-fontawesome-icons]')) {
    const link = document.createElement('link');
    link.setAttribute('data-fontawesome-icons', '');
    link.href = 'https://unpkg.com/@fortawesome/fontawesome-free@6.1.1/css/all.min.css';
    link.rel = 'stylesheet';
    document.head.append(link);
}

export const IconPacks: { FontAwesome: IconPack } = {
    // https://fontawesome.com/search?ic=free&o=r
    FontAwesome: {
        None: '',
        Key: 'fas fa-fw fa-key',
        Cube: 'fas fa-fw fa-cube',
        FileLines: 'fas fa-fw fa-file-lines',
        Download: 'fas fa-fw fa-download',
        List: 'fas fa-fw fa-list',
        MagnifyingGlassMinus: 'fas fa-fw fa-magnifying-glass-minus',
        MagnifyingGlassPlus: 'fas fa-fw fa-magnifying-glass-plus',
        Rocket: 'fas fa-fw fa-rocket',
        RulerCombined: 'fas fa-fw fa-ruler-combined',
        Shapes: 'fas fa-fw fa-shapes',
        Hand: 'fas fa-fw fa-hand',
        RightLeft: 'fas fa-fw fa-right-left',
        Server: 'fas fa-fw fa-server',
        Globe: 'fas fa-fw fa-globe',
        CalenderDays: 'fas fa-fw fa-calendar-days',
        Error: 'fas fa-fw fa-circle-exclamation',
        Warning: 'fas fa-fw fa-triangle-exclamation',
        AddressCard: 'fas fa-fw fa-address-card',
        PuzzlePiece: 'fas fa-fw fa-puzzle-piece',
        ObjectGroup: 'fas fa-fw fa-object-group',
        Code: 'fas fa-fw fa-code',
        FileCode: 'fas fa-fw fa-file-code',
        Tv: 'fas fa-fw fa-tv',
        Cubes: 'fas fa-fw fa-cube',
        FolderPlus: 'fas fa-folder-plus',
        Foursquare: 'fa-brands fa-foursquare',
        LayerGroup: 'fas fa-layer-group',
        OutlineCircleQuestion: 'fa-regular fa-circle-question',
        CircleQuestion: 'fas fa-circle-question',
        CubesStacked: 'fas fa-cubes-stacked',
        Message: 'fas fa-message',
        CloudArrowUp: 'fas fa-cloud-arrow-up',
        ArrowUpRightFromSquare: 'fas fa-arrow-up-right-from-square',
        PenToSquare: 'fas fa-pen-to-square',
        Sliders: 'fas fa-sliders',
        PaintBrush: 'fas fa-paint-brush',
        BarsStaggered: 'fas fa-bars-staggered',
        FolderTree: 'fas fa-folder-tree',
        Star: 'fa-fw fas fa-star',
        StarOutline: 'fa-fw far fa-star',
        CartPlus: 'fa-fw fas fa-cart-plus',
        Equals: 'fa-fw fas fa-equals',
        Clock: 'fa-fw fas fa-clock',
        ListCheck: 'fa-fw fas fa-list-check',
        Eye: 'fa-fw fas fa-eye',
        EyeSlash: 'fa-fw fas fa-eye-slash',
        Comment: 'fa-fw fas fa-comment',
        ICursor: 'fa-fw fas fa-i-cursor',
        SquareCaretDown: 'fa-fw fas fa-square-caret-down',
        SquareCaretUp: 'fa-fw fas fa-square-caret-up',
        Link: 'fa-fw fas fa-link',
        LinkSlash: 'fa-fw fas fa-link-slash',
        SquarePen: 'fa-fw fas fa-square-pen',
        Clone: 'fa-fw fas fa-clone',
        Copy: 'fa-fw fas fa-copy',
        CodeBranch: 'fa-fw fas fa-code-branch',
        Stopwatch: 'fa-fw fas fa-stopwatch',
        PlusCircle: 'fa-fw fas fa-plus-circle',
        MinusCircle: 'fa-fw fas fa-minus-circle',
        ClipboardList: 'fa-fw fas fa-clipboard-list',
        Expand: 'fa-fw fas fa-expand',
        Swatchbook: 'fa-fw fas fa-swatchbook',
        Gears: 'fw-fw fas fa-gears',
        Computer: 'fa-fw fas fa-computer',
        HouseLaptop: 'fa-fw fas fa-house-laptop',
        Desktop: 'fa-fw fas fa-desktop',
        MagnifyingGlass: 'fa-fw fas fa-magnifying-glass',
        ClipboardQuestion: 'fa-fw fas fa-clipboard-question',
        Pause: 'fa-fw fas fa-pause',
        CircleNodes: 'fa-fw fas fa-circle-nodes',
        FileCirclePlus: 'fa-fw fas fa-file-circle-plus',
        ArrowRight: 'fa-fw fas fa-arrow-right',
        ArrowRightToBracket: 'fa-fw fas fa-arrow-right-to-bracket',
        PaperPlane: 'fa-fw fas fa-paper-plane',
        Box: 'fa-fw fas fa-archive',
        Database: 'fa-fw fas fa-database',
        Diagram: 'fa-fw fas fa-project-diagram',
        Screen: 'fa-fw fas fa-desktop',
        Move: 'fa-fw fas fa-arrows-alt',
        Circle: 'fa-fw fas fa-circle',
        OutlineCircle: 'fa-fw far fa-circle',
        Check: 'fa-fw fas fa-check',
        CheckCircle: 'fa-fw fas fa-check-circle',
        OutlineCheckCircle: 'fa-fw fa-regular fa-check-circle',
        CheckSquare: 'fa-fw fas fa-check-square',
        TimesCircle: 'fa-fw fas fa-times-circle',
        TimesSquare: 'fa-fw fas fa-square-xmark',
        CaretDown: 'fa-fw fas fa-caret-down',
        ChevronDown: 'fa-fw fas fa-chevron-down',
        ChevronRight: 'fa-fw fas fa-chevron-right',
        ChevronUp: 'fa-fw fas fa-chevron-up',
        CaretUp: 'fa-fw fas fa-caret-up',
        CaretRight: 'fa-fw fas fa-caret-right',
        Flag: 'fa-fw fas fa-flag',
        Trash: 'fa-fw fas fa-trash',
        Plus: 'fa-fw fas fa-plus',
        Spinner: 'fa-fw fas fa-circle-notch fa-spin',
        Folder: 'fa-fw fas fa-folder',
        File: 'fa-fw fas fa-file',
        Times: 'fa-fw fas fa-times',
        Minus: 'fa-fw fas fa-minus',
        MinusSquare: 'fa-fw fas fa-square-minus',
        Square: 'fa-fw far fa-square',
        Rectangle: 'fa-fw far fa-square',
        Refresh: 'fa-fw fas fa-sync',
        Info: 'fa-fw fas fa-info-circle',
        Bolt: 'fa-fw fas fa-bolt',
        User: 'fa-fw fas fa-user',
        Gear: 'fa-fw fas fa-cog',
        Stack: 'fa-fw fas fa-layer-group',
        Network: 'fa-fw fas fa-network-wired',
        Ellipsis: 'fa-fw fas fa-ellipsis-h',
        History: 'fa-fw fas fa-history',
        Boxes: 'fa-fw fas fa-boxes',
        Bell: 'fa-fw fas fa-bell',
        Play: 'fa-fw fas fa-play',
        Reset: 'fa-fw fas fa-eraser',
        Test: 'fa-fw fas fa-flask',
        SignIn: 'fa-fw fas fa-sign-in-alt',
        Home: 'fa-fw fas fa-home',
        Settings: 'fa-fw fas fa-cog',
        Account: 'fa-fw fas fa-user-circle',
        Cursor: 'fa-fw fas fa-mouse-pointer',
        Mouse: 'fa-fw fas fa-mouse',
        Resize: 'fa-fw fas fa-expand-arrows-alt',
        Terminal: 'fa-fw fas fa-terminal',
        Font: 'fa-fw fas fa-font',
        Button: 'fa-fw fas fa-ad',
    },
};

export const ActiveIconPack: IconPack = IconPacks.FontAwesome;

const classes = createStyle(() => ({
    icon: {
        display: 'inline-grid',
        justifyContent: 'center',
        alignContent: 'center',
        boxSizing: 'content-box',
        minWidth: '1.25em',
        minHeight: '1.25em',
    },
}));

export function Icon(
    props: {
        icon: keyof IconPack;
        class?: string;
    } & JSX.HTMLAttributes<HTMLDivElement>,
) {
    return (
        <div {...props} class={classNames(classes().icon, props.class)}>
            <i class={ActiveIconPack[props.icon]}></i>
        </div>
    );
}
