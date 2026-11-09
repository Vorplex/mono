---
name: drx
description: Build, convert, review, and fix DRX applications. Use for any work on DRX markup (<x-app>, <x-page>, <x-component> and the other <x-*> nodes), or for turning an HTML/CSS/JavaScript app or a product request into DRX. The DRX documentation is the language reference; this skill is the practice guide.
---

# Working with DRX

This skill is the practice guide. The DRX documentation is the language reference and the source of truth; it wins whenever the two differ. Load it first (step 0) and read the documentation of every DRX feature you use before writing it, rather than relying on remembered syntax.

An app can live in one file or be split across files with `<x-import>`; it is the same DRX either way. Keep the structure you find unless you are asked to change it.

## Workflow

### 0. Load the reference

If the DRX documentation is not already in your context, read it from https://vorplex.github.io/mono/drx/index.md: the concepts and the page for every node you will use, following their links.

### 1. Establish the contract

For a conversion, inspect the entire source app before changing its architecture. Record:

- every screen, overlay, responsive state, and navigation path;
- visible text, CSS, icons, fonts, assets, and native element choices;
- interactions, keyboard behavior, validation, empty/loading/error states, persistence, timers, and downloads;
- data shapes, generators, transformations, API calls, and storage keys.

For a new app, turn the request into the same inventory. Resolve important ambiguity from the available context; ask only when a missing choice would materially change the result.

### 2. Choose ownership

Assign each concern to the narrowest owner whose lifetime matches it:

- App: persistent shell and state that survives page mounts.
- Page: a screen or independently mounted view and its transient presentation state.
- Component: a genuinely reusable, isolated widget with a small property/event surface.
- Service: reusable business rules, transformations, formatting, validation, persistence, or data access.

Prefer an inline template or page over a component when reuse and isolation do not justify the property/event boundary. Prefer app variables and services for coordination; do not couple pages by reaching into another page instance.

### 3. Re-architect declaratively

Translate responsibilities rather than lines:

- mutable UI state becomes owner-scoped variables;
- render functions become templates and bindings;
- conditional and repeated DOM construction becomes DRX template control flow;
- event listeners attached to rendered elements become template handlers;
- business operations and data transformations become service methods;
- owner scripts orchestrate presentation: respond to interaction, call services, update variables, navigate, focus, measure, and manage overlays.

Port algorithms and generators, not their current output. Preserve observable behavior and data semantics even when the implementation shape changes.

### 4. Preserve the product

Unless the request explicitly changes them:

- keep user-visible text, CSS rules, class names, native controls, asset choices, and breakpoints;
- retain loading, error, invalid, empty, disabled, hover, focus, keyboard, and responsive behavior;
- retain persistence keys and the intended lifetime of state across reloads, navigation, and modal reopening;
- relocate styles to the correct owner without casually redesigning them.

### 5. Verify

Verify with what your environment provides: the running app where you can run it, and DRX's validation problems. Finish only when:

- the app starts without errors or DRX problems;
- all screens, routes, overlays, and responsive layouts are reachable;
- primary flows and empty, invalid, loading, and error states work;
- persistence and reset behavior match the contract;
- displayed text and appearance match the source or request;
- every DRX feature you used has been checked against its documentation;
- the architecture standards below hold.

When exact fidelity matters, compare the original and the DRX app at the same viewports and through the same user journeys.

## Architecture standards

Treat **must** rules as review failures. Treat **prefer** rules as defaults that may be overridden for a concrete reason.

### State and updates

- **Must:** Put state that drives rendering in DRX variables owned at the lifetime where it belongs.
- **Must:** Update collections and objects immutably. Use updater functions when the next value depends on the current value.
- **Prefer:** Compute derived values instead of synchronizing duplicate state. Store a derived value only when it has an independent lifecycle or snapshot meaning.
- **Prefer:** Keep lasting state at app scope and ephemeral interaction state at page or component scope.

### Logic and I/O

- **Prefer:** Put business rules, calculations, validation, formatting, persistence, API access, `fetch`, and web storage behind services, keeping owner scripts focused on presentation. Direct I/O from an owner script is fine when it is small and owner-specific.
- **Must:** Keep services independent of owner state and the DOM. Pass values in and return results out.
- **Prefer:** Let an interaction follow `handler -> service -> variable update -> template reaction`.

### Templates and DOM

- **Must:** Use DRX's own features for what they cover (templates, bindings, control flow, routing, state, scoped styles) instead of re-implementing them in script.
- **Prefer:** Keep handlers to a call or a simple write. Move multi-step presentation work into an owner method.
- **Must:** Limit DOM access to work templates cannot perform, such as focus, measurement, scrolling, and third-party widget integration.
- **Must:** Add global listeners and timers during the owner's lifecycle and remove or clear them when that owner unmounts.
- **Must:** Never let untrusted data become markup, styles, or code.
- **Prefer:** Choose names that don't shadow a local or global that a template or handler needs.

### Pages, components, and coordination

- **Prefer:** Use pages for screens and shell regions; use components only for reusable isolated widgets.
- **Must:** Coordinate owners through app state, services, navigation, and component events rather than `window` state or cross-page method calls.
