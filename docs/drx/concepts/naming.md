# Naming

Every `name` you declare is camelCase: a lowercase letter followed by letters and digits, such as `userCard`, `todoApi` or `priority`. Names are referenced from expressions and from namespaces like `ui.userCard`, so a `-`, `.`, space or leading capital would break them.

| Applies to                                                                                                                                  |                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `<x-page>`, `<x-component>`, `<x-variable>`, `<x-type>`, `<x-service>`, `<x-asset>`, `<x-api>`, `<x-endpoint>`, `<x-property>`, `<x-event>` | Yes                                                               |
| `<x-library>` names                                                                                                                         | Yes                                                               |
| `<x-parameter>` and `<x-header>` names                                                                                                      | No -- they are sent over the wire as written, e.g. `Content-Type` |
| `<x-icon>` names                                                                                                                            | No -- they name a built-in icon, e.g. `chevron-down`              |

## Files

When an app is split into files, each declaration's file or folder is named after it in kebab-case: the `userCard` component is written to `components/user-card/component.html`, and the `todoApi` api to `apis/todo-api/api.html`.
