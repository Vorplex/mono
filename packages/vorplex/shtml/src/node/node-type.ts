export enum NodeType {
    App = 'X-APP',
    Page = 'X-PAGE',
    Packages = 'X-PACKAGES',
    Variable = 'X-VARIABLE',
    Router = 'X-ROUTER',
    Definition = 'X-TYPE',
    Service = 'X-SERVICE',
    Asset = 'X-ASSET',
    RouterRoute = 'X-ROUTE',
    Component = 'X-COMPONENT',
    If = 'X-IF',
    For = 'X-FOR',
    Element = 'ELEMENT',
    Text = '#text',
    ComponentProperty = 'X-PROPERTY',
    ComponentEvent = 'X-EVENT',
    ComponentInstance = 'X-COMPONENT-INSTANCE',
    PageContainer = 'X-PAGE-CONTAINER',
    Icon = 'X-ICON',
    Api = 'X-API',
    ApiEndpoint = 'X-ENDPOINT',
    ApiParameter = 'X-PARAMETER',
    ApiHeader = 'X-HEADER',
    ApiBody = 'X-BODY',
    ApiResponse = 'X-RESPONSE'
}

// Structural tags that are addressed as their own named entities elsewhere in the document -- never
// rendered content, so a page/component's template walk skips them entirely.
export const NON_TEMPLATE_TAGS = new Set<string>([
    NodeType.App,
    NodeType.Page,
    NodeType.Packages,
    NodeType.Variable,
    NodeType.Router,
    NodeType.Definition,
    NodeType.Service,
    NodeType.Asset,
    NodeType.RouterRoute,
    NodeType.Component,
    NodeType.ComponentProperty,
    NodeType.ComponentEvent,
    NodeType.Api,
    'SCRIPT',
    'STYLE'
]);
