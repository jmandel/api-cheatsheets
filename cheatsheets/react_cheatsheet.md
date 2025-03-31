## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of React, a JavaScript library for building user interfaces. It covers core concepts like components, JSX, state, props, context, refs, and effects, as well as built-in APIs, Hooks, DOM manipulation, server rendering, and development tooling, based *exclusively* on the provided documentation snippets. It is designed to help an LLM agent quickly grasp the fundamentals and advanced features necessary to start working with React code.

---

## React Cheatsheet

### Core Concepts

#### Components

*   **Definition:** Reusable UI elements. JavaScript functions that return markup (JSX).
*   **Naming:** Must start with a capital letter (e.g., `MyComponent`). HTML tags are lowercase (e.g., `div`).
*   **Structure:** Apps are built from nested components, forming a tree structure.
*   **Root Component:** The top-level component of an app or a section of UI.
*   **Purity:** Components must be pure functions:
    *   Mind their own business (no side effects during render).
    *   Same inputs (props, state, context) produce the same output (JSX).
    *   Do not mutate props, state, or context.
*   **Rendering:** React calls components to determine the UI structure. It happens on initial load and when state/props change.
*   **Commit:** After rendering, React modifies the DOM to match the returned JSX.
*   **Calling:** Never call component functions directly (e.g., `MyComponent()`). Use JSX syntax (`<MyComponent />`). React orchestrates calling them.

#### JSX (JavaScript XML)

*   **Syntax Extension:** Allows writing HTML-like markup inside JavaScript.
*   **Rules:**
    *   Return a single root element (use `<div>...</div>` or `<>...</>` Fragment).
    *   Close all tags (e.g., `<img />`, `<li>...</li>`).
    *   Use `camelCase` for most HTML/SVG attributes (e.g., `className` instead of `class`, `strokeWidth` instead of `stroke-width`). `aria-*` and `data-*` are exceptions (use dashes).
*   **Embedding JavaScript:** Use curly braces `{}` to embed JavaScript expressions within JSX, either as text content or as attribute values (replacing quotes).
*   **"Double Curlies":** `style={{ key: value }}` is just a JavaScript object literal inside JSX curly braces. Style property names use `camelCase` (e.g., `backgroundColor`).

#### Props (Properties)

*   **Passing:** Pass information from parent to child components like HTML attributes (`<MyComponent propName={value} />`). Any JavaScript value can be passed (strings, numbers, objects, arrays, functions, JSX).
*   **Reading:** Access props inside the child component function signature using destructuring: `function MyComponent({ propName }) { ... }`. Or access via the single `props` object argument: `function MyComponent(props) { props.propName ... }`.
*   **`children` Prop:** Content nested inside a component tag (`<Card><Avatar /></Card>`) is passed as the `children` prop to the parent (`Card`). Useful for visual wrappers.
*   **Default Values:** Specify default prop values using destructuring default assignment: `function Avatar({ size = 100 }) { ... }`. Used if the prop is missing or `undefined`. Not used for `null` or `0`.
*   **Spread Syntax:** Forward all parent props to a child using `{...props}`. Use with restraint; often indicates a need for component extraction or using `children`.
*   **Immutability:** Props are read-only snapshots in time. A component cannot change its props. To change props, the *parent* must pass different props.

#### State (Component Memory)

*   **Purpose:** Lets components "remember" information between renders (e.g., input values, active image index).
*   **Declaration:** Use the `useState` Hook at the top level of a component.
    ```js
    import { useState } from 'react';
    // ...
    const [stateVariable, setStateFunction] = useState(initialState);
    ```
*   **`useState` Returns:** An array with two items:
    1.  The current state value for that render.
    2.  A `set` function to update the state and trigger a re-render.
*   **Updating State:** Call the `set` function (e.g., `setCount(count + 1)`). This requests a re-render. The state variable in the *current* render does not change.
*   **Batching:** React batches multiple state updates within a single event handler for performance. Re-rendering happens only *after* the event handler completes.
*   **Updater Functions:** To update state based on the previous state, especially multiple times in one event, pass a function: `setCount(c => c + 1)`. React queues these functions and applies them in order during the next render.
*   **Isolation:** State is local and private to the component instance. Rendering the same component twice creates two independent states.
*   **Immutability:** Treat state variables (especially objects and arrays) as read-only. Instead of mutating them, *replace* them with new objects/arrays when updating. Use spread syntax (`...`) for copying.
*   **Choosing Structure:**
    *   Group related state that often changes together.
    *   Avoid contradictions (e.g., `isSending` and `isSent` both true). Use a single state variable representing the status (e.g., `'typing'`, `'sending'`, `'sent'`).
    *   Avoid redundant state: Calculate values from props or other state during render if possible. Don't mirror props in state unless intentionally ignoring updates.
    *   Avoid duplication: Store IDs instead of full objects if the object is already present elsewhere (e.g., in an array).
    *   Avoid deep nesting: Flatten ("normalize") state structure if updates become complex. Use Immer library for easier immutable updates.

#### Conditional Rendering

*   **Control Flow:** Handled by standard JavaScript (`if`, `&&`, `? :`).
*   **`if` statement:** Conditionally return different JSX trees. Return `null` to render nothing.
    ```js
    if (isLoggedIn) {
      return <AdminPanel />;
    } else {
      return <LoginForm />;
    }
    ```
*   **Ternary operator (`? :`)**: Use inside JSX for conditional expressions.
    ```js
    <div>{isLoggedIn ? <AdminPanel /> : <LoginForm />}</div>
    ```
*   **Logical AND operator (`&&`)**: Use inside JSX to render something *only if* the condition is true.
    ```js
    <div>{isLoggedIn && <AdminPanel />}</div>
    ```
    *   Pitfall: Don't use numbers on the left side; `0 && <Something />` renders `0`. Use `count > 0 && ...` instead.
*   **Variables:** Assign JSX to a variable conditionally using `if` or `switch`, then embed the variable in JSX using `{}`.
    ```js
    let content;
    if (isLoggedIn) {
      content = <AdminPanel />;
    } else {
      content = <LoginForm />;
    }
    return <div>{content}</div>;
    ```

#### Rendering Lists

*   **Data Storage:** Store lists of data in JavaScript arrays and objects.
*   **Transformation:** Use array methods like `map()` to transform data arrays into arrays of JSX elements.
    ```js
    const listItems = people.map(person => <li key={person.id}>{person.name}</li>);
    return <ul>{listItems}</ul>;
    ```
*   **Filtering:** Use `filter()` to create new arrays containing only items that pass a test.
    ```js
    const chemists = people.filter(person => person.profession === 'chemist');
    ```
*   **`key` Prop:** Essential for list items. Must be a string or number that uniquely identifies an item *among its siblings*.
    *   Helps React identify items during insertion, deletion, or reordering.
    *   Should be stable and come from your data (e.g., database ID).
    *   Don't use array index unless the list is static (no reordering, insertion, deletion).
    *   Don't generate keys on the fly (e.g., `Math.random()`).
    *   `key` is used by React internally and is not passed as a prop to the component. Pass IDs as a separate prop if needed.
    *   Fragments (`<>...</>`) don't accept keys directly; use `<Fragment key={...}>...</Fragment>`.

#### Responding to Events

*   **Event Handlers:** Functions defined inside components, triggered by user interactions (click, hover, etc.).
*   **Passing:** Pass event handlers as props to JSX tags (e.g., `onClick={handleClick}`).
*   **Naming Convention:** `handleEventName` for function definition, `onEventName` for prop name.
*   **Passing vs. Calling:** Pass the function reference (`onClick={handleClick}`), don't call it (`onClick={handleClick()}`). For inline handlers, use arrow functions: `onClick={() => alert('...')}`.
*   **Accessing Props:** Event handlers defined inside a component can access its props.
*   **Passing Handlers as Props:** Parent components can define handlers and pass them down to children.
*   **Event Propagation:** Events "bubble" up the tree from child to parent.
*   **Stopping Propagation:** Call `e.stopPropagation()` on the event object `e` received by the handler.
*   **Preventing Default Behavior:** Call `e.preventDefault()` on the event object `e` to stop default browser actions (e.g., form submission reloading the page).
*   **Side Effects:** Event handlers are the primary place for side effects (changing state, making requests). They don't need to be pure.

#### Context

*   **Purpose:** Passes data deep down the tree without explicit prop drilling.
*   **Creation:** Use `createContext(defaultValue)` outside components.
    ```js
    import { createContext } from 'react';
    const ThemeContext = createContext('light'); // 'light' is the default
    ```
*   **Provider:** Wrap children in `<SomeContext.Provider value={value}>` to provide a context value to the tree below.
    ```js
    <ThemeContext.Provider value="dark">
      <Page />
    </ThemeContext.Provider>
    ```
*   **Reading:** Use the `useContext(SomeContext)` Hook in any child component to read the value from the *closest* provider above.
    ```js
    import { useContext } from 'react';
    // ...
    const theme = useContext(ThemeContext);
    ```
*   **Updating:** Combine context with state. Hold the state in a parent component and pass the state value *and* the state setter function down via context value (often as an object).
*   **Overriding:** Wrap a part of the tree in another provider with a different value to override the context for that subtree.
*   **Alternatives:** Prefer passing props or JSX as `children` before resorting to context.
*   **Use Cases:** Theming, current user, routing, global state management (often with `useReducer`).

#### Refs

*   **Purpose:** Reference values that are not needed for rendering (e.g., DOM nodes, timeout IDs). Changing a ref does *not* trigger a re-render.
*   **Declaration:** Use the `useRef(initialValue)` Hook at the top level. Returns a mutable ref object with a single property: `current`.
    ```js
    import { useRef } from 'react';
    // ...
    const inputRef = useRef(null);
    ```
*   **Accessing Value:** Read or write the value using `ref.current`.
*   **DOM Manipulation:** Pass a ref to a JSX tag's `ref` attribute (`<input ref={inputRef} />`). React sets `ref.current` to the DOM node after commit. Use this for imperative actions like focusing, scrolling, measuring.
*   **Accessing Another Component's DOM:** Components don't expose DOM nodes by default. Use `forwardRef` in the child component to receive a `ref` and forward it to a specific DOM node inside.
*   **Imperative Handle:** Use `useImperativeHandle` *with* `forwardRef` to expose a custom object with specific methods, instead of the full DOM node. Limits exposure.
*   **Ref Callback:** Pass a function to the `ref` attribute (`ref={(node) => { ... }}`). React calls it with the DOM node when attached, and calls the returned cleanup function (or the callback again with `null` if no cleanup is returned) when detached. Useful for managing lists of refs.
*   **`createRef`:** Legacy API primarily for class components. Always returns a new ref object on each render. Prefer `useRef` in function components.
*   **Caveats:**
    *   Don't read or write `ref.current` during rendering (except for lazy initialization). Do it in event handlers or Effects.
    *   Avoid overusing refs; prefer props for declarative logic.
    *   Avoid modifying DOM nodes managed by React unless you know React has no reason to update that part.

#### Effects

*   **Purpose:** Synchronize a component with an external system (network, DOM, third-party libraries, timers, browser APIs). Run *after* rendering and commit.
*   **Declaration:** Use the `useEffect(setup, dependencies?)` Hook at the top level.
    ```js
    import { useEffect } from 'react';
    // ...
    useEffect(() => {
      // Setup code runs after commit
      const connection = createConnection(serverUrl, roomId);
      connection.connect();
      // Optional cleanup function
      return () => {
        connection.disconnect();
      };
    }, [serverUrl, roomId]); // Dependencies
    ```
*   **Setup Function:** Contains the logic to connect/synchronize. May optionally return a cleanup function.
*   **Cleanup Function:** Contains the logic to disconnect/stop/undo the setup. Runs before the Effect runs again with changed dependencies, and once when the component unmounts.
*   **Dependencies Array:**
    *   Controls when the Effect re-runs.
    *   Must include *all* reactive values (props, state, component body variables/functions) read by the setup code.
    *   `[]` (empty array): Effect runs only once on mount, cleanup runs on unmount.
    *   `[dep1, dep2]`: Effect runs on mount and after any re-render where `dep1` or `dep2` have changed (compared using `Object.is`).
    *   Omitted: Effect runs after *every* render. Avoid this unless intentional.
*   **Lifecycle:** Effects have a separate lifecycle from components (start/stop synchronization), which can happen multiple times. Think in terms of synchronization cycles, not mount/update/unmount.
*   **Strict Mode:** Runs setup and cleanup one extra time in development to help find bugs related to missing cleanup.
*   **Server Rendering:** Effects only run on the client.
*   **Timing:** `useEffect` runs *after* the browser repaints the screen. If you need to block paint (e.g., for layout measurement), use `useLayoutEffect`.
*   **Removing Dependencies:** Don't just remove a dependency from the array if the linter complains. Change the code so the dependency is *actually* unnecessary (e.g., move values outside the component, inside the Effect, use updater functions, use Effect Events).
*   **Effect Events (`useEffectEvent` - Experimental):** Extract non-reactive logic from an Effect. Allows reading latest props/state without adding them as dependencies. Call only from inside Effects; don't pass them around.
*   **When *Not* to Use Effects:**
    *   Transforming data for rendering (calculate during render, use `useMemo` if expensive).
    *   Handling user events (use event handlers).
    *   Resetting state on prop change (use `key` prop or calculate during render).
    *   Adjusting state on prop change (calculate during render if possible, or update state during render carefully).
    *   Sharing logic between event handlers (extract a regular function).
    *   Passing data to parent (lift state up instead).
    *   Subscribing to external stores (use `useSyncExternalStore`).
    *   Initializing the application (run code at module level or outside components).

#### Custom Hooks

*   **Purpose:** Reuse stateful logic between components.
*   **Naming:** Must start with `use` followed by a capital letter (e.g., `useOnlineStatus`).
*   **Definition:** Regular JavaScript functions that can call other Hooks (including built-in ones and other custom Hooks).
*   **Isolation:** Each call to a custom Hook gets its own isolated state. Custom Hooks share logic, not state itself.
*   **Reactivity:** Receive latest props/state on every render because they re-run with the component.
*   **Usage:** Call them at the top level of components or other custom Hooks.
*   **When to Create:** Extract repetitive logic, especially logic involving Effects, into custom Hooks to make components more declarative and focused on intent. Avoid overly generic "lifecycle" Hooks like `useMount`.

### Built-in Components

*   **`<Fragment>` (`<>...</>`):** Groups multiple elements without adding an extra node to the DOM. Use `<Fragment key={...}>` if a key is needed (e.g., in lists).
*   **`<Profiler id onRender={...}>`:** Measures rendering performance of a React tree programmatically. Disabled in production by default. Use React DevTools for interactive profiling.
*   **`<Suspense fallback={...}>`:** Displays a fallback UI (e.g., spinner) until children have finished loading. Activated by Suspense-enabled data sources (framework fetching, `lazy`, `use`). Coordinates reveal timing for nested content. Can prevent hiding already-revealed content during non-urgent updates ([Transitions](#transitions)). Handles server rendering errors.
*   **`<StrictMode>`:** Enables extra development-only checks to find common bugs (impure rendering, missing Effect cleanup, deprecated APIs). Wrap the entire app or specific parts.

### Built-in Hooks

#### State Hooks

*   **`useState(initialState)`:** Declares a state variable. Returns `[value, setValue]`. [Details](#state-component-memory)
*   **`useReducer(reducer, initialArg, init?)`:** Declares state managed by a reducer function. Returns `[state, dispatch]`. Useful for complex state logic. [Details](#reducers)

#### Context Hooks

*   **`useContext(SomeContext)`:** Reads and subscribes to context. Requires a context object from `createContext`. [Details](#context)

#### Ref Hooks

*   **`useRef(initialValue)`:** Declares a ref. Returns a mutable object `{ current: ... }`. Does not trigger re-renders on change. Used for DOM manipulation or holding values not needed for rendering. [Details](#refs)
*   **`useImperativeHandle(ref, createHandle, dependencies?)`:** Customizes the handle exposed by a component's ref. Used with `forwardRef`. [Details](#imperative-handle)

#### Effect Hooks

*   **`useEffect(setup, dependencies?)`:** Connects a component to an external system. Runs after commit. [Details](#effects)
*   **`useLayoutEffect(setup, dependencies?)`:** Fires before the browser repaints. Use for measuring layout. Blocks paint. Prefer `useEffect`.
*   **`useInsertionEffect(setup, dependencies?)`:** Fires before DOM mutations. Primarily for CSS-in-JS libraries to inject styles.

#### Performance Hooks

*   **`useMemo(calculateValue, dependencies)`:** Caches the result of an expensive calculation. Re-runs only if dependencies change.
*   **`useCallback(fn, dependencies)`:** Caches a function definition. Useful for passing down to memoized children or as Effect dependencies. Equivalent to `useMemo(() => fn, dependencies)`.
*   **`useTransition()`:** Marks state updates as non-blocking Transitions. Returns `[isPending, startTransition]`. Allows UI to stay responsive during heavy updates. Prevents hiding already-revealed content during Suspense.
*   **`useDeferredValue(value)`:** Defers updating a part of the UI. Returns a value that "lags behind" the original value, allowing urgent updates to render first. Useful for performance optimizations like keeping inputs responsive while lists/charts update.

#### Other Hooks

*   **`useDebugValue(value, format?)`:** Adds a label to custom Hooks in React DevTools.
*   **`useId()`:** Generates unique IDs stable across server/client. Used for accessibility attributes (`aria-*`, `htmlFor`). Not for list keys.
*   **`useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?)`:** Subscribes to an external store (outside React state). Handles server rendering and hydration. Preferred over `useEffect` for external stores.
*   **`useActionState(action, initialState, permalink?)`:** Manages state based on the result of a form action. Returns `[state, formAction, isPending]`. Integrates with Server Functions and progressive enhancement.

### Built-in APIs

*   **`createContext(defaultValue)`:** Creates a context object for use with `useContext` and `<Context.Provider>`.
*   **`forwardRef(render)`:** (Deprecated in React 19) Lets a component receive a `ref` and forward it to a child. Use `ref` as a prop instead.
*   **`lazy(load)`:** Declares a lazy-loaded component. Use with dynamic `import()` and `<Suspense>`. Component code loads only when first rendered.
*   **`memo(Component, arePropsEqual?)`:** Memoizes a component, skipping re-renders if props are shallowly equal. Use for performance optimization.
*   **`startTransition(action)`:** Marks state updates inside `action` as non-blocking Transitions. Similar to `useTransition` but without `isPending` state. Can be used outside components.
*   **`use(resource)`:** Reads the value of a resource (Promise or context). Can be called conditionally. Suspends if a Promise is pending. Preferred over `useContext` for flexibility.
*   **`cache(fn)` (RSC only):** Caches the result of a data fetch or computation in Server Components. Invalidated per request.
*   **`experimental_taintObjectReference(message, object)` (RSC only, Experimental):** Prevents an object instance (e.g., user data) from being passed to Client Components.
*   **`experimental_taintUniqueValue(message, lifetime, value)` (RSC only, Experimental):** Prevents a unique value (e.g., token, key) from being passed to Client Components. `value` must be string, bigint, or TypedArray. `lifetime` is an object indicating how long the value should be tainted.
*   **`isValidElement(value)`:** Checks if `value` is a React element (result of JSX or `createElement`). Not for checking if a value is a renderable React node.
*   **`createElement(type, props, ...children)`:** Alternative to JSX for creating React elements.
*   **`cloneElement(element, props, ...children)`:** Creates a new React element using another as a starting point, overriding props/children. Uncommon; prefer render props or context.
*   **`Children` API:** Utilities (`map`, `forEach`, `count`, `only`, `toArray`) for manipulating the opaque `children` prop structure. Uncommon; prefer alternatives like passing arrays as props or render props.
*   **`act(async actFn)`:** Test helper to wrap renders and interactions, ensuring updates are processed before assertions. Use with `async/await`.

### React DOM APIs

#### Client (`react-dom/client`)

*   **`createRoot(domNode, options?)`:** Creates a root to render a React app inside a browser DOM node. Used for client-rendered apps or apps without existing server HTML. Returns a root object with `render` and `unmount` methods.
    *   `root.render(reactNode)`: Renders JSX into the root DOM node. Updates the DOM if called again.
    *   `root.unmount()`: Destroys the React tree in the root.
*   **`hydrateRoot(domNode, reactNode, options?)`:** Attaches React to existing HTML previously generated by `react-dom/server`. Used for server-rendered or statically generated apps. Expects client/server output to match. Returns a root object with `render` and `unmount` methods.

#### Server (`react-dom/server`)

*   **`renderToPipeableStream(reactNode, options?)` (Node.js only):** Renders a React tree to a pipeable Node.js Stream. Supports streaming and Suspense.
*   **`renderToReadableStream(reactNode, options?)` (Web Streams):** Renders a React tree to a Readable Web Stream. Supports streaming and Suspense. Use in Deno, Cloudflare workers, etc.
*   **`renderToString(reactNode, options?)` (Legacy):** Renders a React tree to an HTML string. Does not support streaming. Waits for no data. Limited Suspense support (renders fallbacks immediately).
*   **`renderToStaticMarkup(reactNode, options?)` (Legacy):** Renders a non-interactive React tree to an HTML string. Output cannot be hydrated. Useful for static page generators or emails.

#### Static (`react-dom/static`)

*   **`prerender(reactNode, options?)` (Web Streams):** Renders a React tree to static HTML using a Web Stream. Waits for all data (Suspense) before resolving. For static site generation (SSG).
*   **`prerenderToNodeStream(reactNode, options?)` (Node.js only):** Renders a React tree to static HTML using a Node.js Stream. Waits for all data (Suspense) before resolving. For SSG.

#### Other (`react-dom`)

*   **`createPortal(children, domNode, key?)`:** Renders `children` into a different DOM node, outside the parent's DOM hierarchy but inside the parent's React tree (for context, event bubbling). Useful for modals, tooltips.
*   **`flushSync(callback)`:** Forces React to flush updates inside `callback` synchronously. Updates DOM immediately. Use sparingly; can hurt performance.

#### Resource Preloading (`react-dom`)

*   **`prefetchDNS(href)`:** Hints browser to perform DNS lookup for a domain.
*   **`preconnect(href)`:** Hints browser to connect to a server (DNS lookup, TCP handshake, TLS negotiation).
*   **`preload(href, options)`:** Hints browser to download a resource (stylesheet, font, image, script). Use `options.as` to specify type.
*   **`preloadModule(href, options)`:** Hints browser to download an ESM module. Use `options.as: 'script'`.
*   **`preinit(href, options)`:** Hints browser to download *and execute* a script (`as: 'script'`) or download *and insert* a stylesheet (`as: 'style'`). Requires `precedence` for styles.
*   **`preinitModule(href, options)`:** Hints browser to download *and execute* an ESM module (`as: 'script'`).

### Built-in DOM Components (`react-dom/components`)

React supports all standard HTML and SVG elements.

#### Common Props (All Elements)

*   `children`: Content inside the element.
*   `dangerouslySetInnerHTML={{ __html: '...' }}`: Insert raw HTML. Use with extreme caution (XSS risk). Don't use with `children`.
*   `ref`: Attach a ref (from `useRef`, `createRef`, or callback) to access the DOM node.
*   `key`: Specifies identity among siblings (for lists).
*   `style`: Pass a JS object with camelCased CSS properties (e.g., `{ fontWeight: 'bold' }`). Numbers are assumed `px` unless unitless.
*   `className`: Specifies CSS class(es).
*   `suppressContentEditableWarning={true}`: Suppress warning when using `children` with `contentEditable={true}`.
*   `suppressHydrationWarning={true}`: Suppress hydration mismatch warning for attributes/content of this element (one level deep).
*   Standard HTML attributes (`id`, `title`, `lang`, `tabIndex`, etc.) - use `camelCase` for most (e.g., `tabIndex` not `tabindex`).
*   ARIA attributes (`aria-*`).
*   Custom data attributes (`data-*`).
*   Event handlers (`onClick`, `onMouseEnter`, etc.) - use `camelCase`. [Event object](#react-event-object) is a synthetic wrapper.

#### Form Components

*   **`<input>`:** Renders various input types (`text`, `checkbox`, `radio`, `number`, `file`, etc.).
    *   Controlled: Use `value` (for text-like inputs) or `checked` (for checkbox/radio) with `onChange`.
    *   Uncontrolled: Use `defaultValue` or `defaultChecked` for initial values.
    *   `name`: Essential for form submission.
*   **`<select>`:** Renders a dropdown.
    *   Controlled: Use `value` (string for single select, array for `multiple={true}`) with `onChange`.
    *   Uncontrolled: Use `defaultValue`.
    *   Nest `<option>` or `<optgroup>` components inside.
*   **`<option>`:** Renders an option within `<select>`. Use `value` prop. `label` prop defines meaning. `disabled` prop disables selection. (React doesn't use the `selected` attribute).
*   **`<textarea>`:** Renders a multiline text input.
    *   Controlled: Use `value` with `onChange`.
    *   Uncontrolled: Use `defaultValue`.
    *   Do not pass children; use `value` or `defaultValue`.
*   **`<form>`:** Renders a form.
    *   `action`: URL (string) for standard HTML submission, or a function (client function or Server Function) for handling submission in React.
    *   `onSubmit`: Event handler called when form is submitted *if* `action` is not a function. Call `e.preventDefault()` to prevent full page reload.
    *   If `action` is a function, React handles submission automatically.
*   **`<progress>`:** Renders a progress indicator. Use `value` (0 to `max`) and `max` (defaults to 1). `value={null}` for indeterminate state.

#### Resource and Metadata Components

*   **`<link>`:** Renders a `<link>` tag. React moves it to `<head>` in most cases.
    *   `rel="stylesheet"`: Requires `precedence` prop. Component suspends while loading. React de-duplicates links with same `href`.
    *   `rel="preload"` / `rel="modulepreload"`: Requires `as` prop.
    *   Other `rel` values (e.g., `icon`, `canonical`) are supported.
*   **`<meta>`:** Renders a `<meta>` tag. React moves it to `<head>` unless `itemProp` is present.
*   **`<script>`:** Renders a `<script>` tag.
    *   `src="..." async={true}`: React moves to `<head>` and de-duplicates based on `src`.
    *   Inline script (`<script>...</script>`): Rendered in place, not moved or de-duplicated.
*   **`<style>`:** Renders a `<style>` tag.
    *   Requires `href` (unique identifier) and `precedence` props to opt into moving to `<head>` and de-duplication. Does not suspend.
*   **`<title>`:** Renders a `<title>` tag. React moves it to `<head>`. Render only one. Pass title text as children (must be a single string).

#### Custom HTML Elements

*   Render tags with dashes (e.g., `<my-element>`) or built-in tags with an `is="..."` prop.
*   Props are serialized as string attributes.
*   Use `class` instead of `className`, `for` instead of `htmlFor`.

#### SVG Components

*   All standard SVG elements are supported (e.g., `<svg>`, `<path>`, `<circle>`).
*   Use `camelCase` for attributes (e.g., `strokeWidth` not `stroke-width`).
*   Namespaced attributes are written without colons (e.g., `xlinkHref` not `xlink:href`).

### Server Components Concepts

*   **Server Components:** Render ahead of time (build or request time) in a separate environment. Cannot use state or Effects. Can access server-side resources (filesystem, DB). Code is *not* sent to the client.
*   **Client Components:** Render on the client. Marked with `'use client'` directive at the top of the module file. Can use state, Effects, browser APIs. Code *is* sent to the client.
*   **Server Functions:** Async functions marked with `'use server'` directive (either at function or module level). Defined on the server, but can be called from the client via network request managed by React. Used for mutations/actions. Arguments/return values must be serializable.
*   **Directives:**
    *   `'use client'`: Marks a module and its dependencies as client code. Defines server-client boundary.
    *   `'use server'`: Marks functions as Server Functions callable from the client, or marks an entire module's exports as Server Functions.
*   **Serializable Types:** Data passed from Server to Client Components (props) or between Client/Server via Server Functions must be serializable (primitives, plain objects/arrays with serializable values, Date, Map, Set, FormData, TypedArray, ArrayBuffer, Server Functions, JSX). Functions (unless Server Functions), classes, Symbols (unless global) are not serializable.

### Development Tools & Setup

*   **Editor Setup:** Recommended features:
    *   Linting: Use ESLint with `eslint-plugin-react-hooks` to enforce Rules of Hooks.
    *   Formatting: Use Prettier for consistent code style. Disable ESLint formatting rules (`eslint-config-prettier`).
*   **TypeScript:** Use `.tsx` extension for files with JSX. Add `@types/react` and `@types/react-dom` for type definitions. Define prop types using `interface` or `type`. Types for Hooks are mostly inferred.
*   **React Developer Tools:** Browser extension to inspect components, props, state, and profile performance. Standalone version available.
*   **React Compiler (Beta):** Build-time tool for automatic memoization. Requires Babel plugin (`babel-plugin-react-compiler`). Includes ESLint plugin (`eslint-plugin-react-compiler`) highly recommended for all projects to find Rules of React violations. Supports React 17+ via `react-compiler-runtime` package and `target` config. Can be used on libraries (ship compiled code). Use `"use no memo";` directive to opt-out specific components/hooks temporarily.

### Versioning & Release Channels

*   **Stable (`latest` on npm):** Follows Semantic Versioning (semver). Recommended for most apps. Major versions for breaking changes, minor for features, patch for critical bugfixes.
*   **Canary (`canary` on npm):** Tracks `main` branch. Pre-release. Use for frameworks or integration testing. *Must pin exact versions.* May contain breaking changes between releases. New features/breaking changes announced on blog as they land in Canary.
*   **Experimental (`experimental` on npm):** Tracks `main` branch with feature flags enabled. For testing upcoming features. Unstable, frequent breaking changes. Not for production.

### Community & History

*   **Blog:** Official source for updates, releases, deprecations.
*   **Versions Page:** Lists previous major/minor releases.
*   **Team Page:** Lists current React team members at Meta and contributors.
*   **Acknowledgements Page:** Recognizes past significant contributors.
*   **Conferences/Meetups:** Lists community events.
*   **Translations:** Documentation available in multiple languages.
*   **Code of Conduct:** Based on Contributor Covenant.
*   **Support Forums:** Stack Overflow (`reactjs` tag), DEV, Hashnode, Reactiflux Discord, Reddit (`r/reactjs`).

### Warnings & Deprecations

*   **Invalid Prop Warnings:** Check spelling (e.g., `aria-labelledby`), use `role` not `aria-role`, use valid ARIA props.
*   **Unknown Prop Warning:** Avoid forwarding unintended props (`{...props}`). Use object destructuring (`const { propToUse, ...rest } = props;`) or delete props from a copied object. Use custom `data-*` attributes if needed. Ensure custom component names start with uppercase.
*   **Rules of Hooks Warning:** Only call Hooks at the top level of function components or custom Hooks. Fixes usually involve moving Hook calls outside conditions/loops/nested functions. Also check for mismatching React/ReactDOM versions or duplicate React copies.
*   **`react-dom/test-utils` Deprecation:** `act` moved to `react`. Other APIs removed. Migrate tests to React Testing Library.
*   **`react-test-renderer` Deprecation:** Package deprecated. Migrate tests to React Testing Library. `react-test-renderer/shallow` removed; use `react-shallow-renderer` directly if needed (reconsider shallow rendering).
*   **Special Props Warning (`key`, `ref`):** These are used by React and not passed as props. Pass the values via different prop names if needed by the child.
*   **Create React App (CRA):** Deprecated. Migrate to a recommended framework or a build tool like Vite, Parcel, Rsbuild.
*   **Removed APIs (React 19):** `findDOMNode`, `hydrate`, `render`, `unmountComponentAtNode`, `renderToNodeStream`, `renderToStaticNodeStream`, `createFactory`, legacy Context APIs, string refs, `propTypes`/`defaultProps` on functions.
*   **Deprecated APIs (React 19):** `element.ref` (use `element.props.ref`), `react-test-renderer`, `<Context.Provider>` (use `<Context>`), `forwardRef` (pass `ref` as prop).


## Rules of React

*   **Components and Hooks must be pure:** Idempotent, no side effects in render, don't mutate props/state/context/Hook args/Hook return values/values used in JSX. Local mutation during render is okay.
*   **React calls Components and Hooks:** Don't call components or Hooks directly as functions. Use JSX for components. Call Hooks only inside components or other Hooks. Don't pass Hooks as values.
*   **Rules of Hooks:**
    *   Only call Hooks at the top level (not in loops, conditions, nested functions, try/catch).
    *   Only call Hooks from React function components or custom Hooks.

```

```