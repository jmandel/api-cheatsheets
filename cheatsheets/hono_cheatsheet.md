## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of Hono, a small, simple, and ultrafast web framework built on Web Standards. It covers core concepts, API usage, middleware, routing, validation, JSX, RPC, testing, and platform-specific details based *only* on the provided documentation. It is designed to help you quickly understand and start using Hono for building web applications and APIs across various JavaScript runtimes.

---

## Hono Cheatsheet

Hono (🔥 flame in Japanese) is a small, simple, ultrafast web framework using Web Standards APIs, enabling it to run on Cloudflare Workers, Fastly Compute, Deno, Bun, Vercel, Netlify, AWS Lambda, Lambda@Edge, Node.js, and more.

### Core Features

*   **Ultrafast:** Uses high-performance routers like `RegExpRouter`.
*   **Lightweight:** Tiny footprint (e.g., `hono/tiny` preset < 14kB), zero dependencies.
*   **Multi-runtime:** Code runs consistently across various JavaScript environments.
*   **Batteries Included:** Built-in middleware, custom middleware support, helpers.
*   **Developer Experience (DX):** Clean APIs, first-class TypeScript support, RPC mode for type-safe client-server interaction.

### Use Cases

*   Web APIs
*   Backend server proxies
*   CDN front-ends
*   Edge applications
*   Base server for libraries
*   Full-stack applications

### Quick Start

Use `create-hono` to scaffold a project for a specific platform:

```sh
# npm
npm create hono@latest my-app
# yarn
yarn create hono my-app
# pnpm
pnpm create hono@latest my-app
# bun
bun create hono@latest my-app
# deno
deno init --npm hono@latest my-app
```

### Hello World Example (Cloudflare Workers)

```typescript
// src/index.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// Module Worker syntax (recommended)
export default app

// Service Worker syntax (alternative)
// app.fire()
```

---

### Hono App Instance (`app`)

The main object for defining routes and middleware.

#### Initialization

```typescript
import { Hono } from 'hono'
import { RegExpRouter } from 'hono/router/reg-exp-router'

// Basic
const app = new Hono()

// Strict mode (default: true). If false, `/hello` matches `/hello/`.
const appStrictOff = new Hono({ strict: false })

// Specify router (default: SmartRouter)
const appWithRegExp = new Hono({ router: new RegExpRouter() })

// Generics for Env Bindings and Context Variables
type Env = {
  Bindings: { TOKEN: string, MY_KV: KVNamespace }
  Variables: { user: User }
}
const typedApp = new Hono<Env>()
```

#### Routing Methods

Define handlers for specific HTTP methods and paths.

```typescript
// Specific methods
app.get('/', (c) => c.text('GET'))
app.post('/', (c) => c.text('POST'))
app.put('/', (c) => c.text('PUT'))
app.delete('/', (c) => c.text('DELETE'))
// ... other HTTP methods

// Any method
app.all('/any', (c) => c.text('Any Method'))

// Custom method or multiple methods/paths
app.on('PURGE', '/cache', (c) => c.text('PURGE /cache'))
app.on(['PUT', 'DELETE'], '/post', (c) => c.text('PUT or DELETE /post'))
app.on('GET', ['/hello', '/ja/hello'], (c) => c.text('Hello'))

// Wildcards and Parameters (See Routing section)
app.get('/user/:id', (c) => c.text(`User ${c.req.param('id')}`))
app.get('/posts/*', (c) => c.text('Posts wildcard'))

// Chaining
app.get('/endpoint', (c) => c.text('GET'))
  .post((c) => c.text('POST'))
  .delete((c) => c.text('DELETE'))
```

#### Middleware Registration (`app.use`)

Apply middleware to all routes or specific paths.

```typescript
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

// Apply logger to all routes
app.use(logger())

// Apply CORS to routes under /api/
app.use('/api/*', cors())

// Apply middleware only to POST requests under /admin/
app.post('/admin/*', async (c, next) => {
  // Middleware logic before handler
  await next()
  // Middleware logic after handler
})
```

#### Grouping and Mounting

*   `app.route(pathPrefix, subApp)`: Mount routes from another Hono instance under a prefix.
    ```typescript
    // books.ts
    const booksApp = new Hono()
    booksApp.get('/', (c) => c.text('List Books')) // Handles GET /books
    booksApp.get('/:id', (c) => c.text(`Get Book ${c.req.param('id')}`)) // Handles GET /books/:id
    export default booksApp

    // index.ts
    import books from './books'
    app.route('/books', books)
    // Or mount at root (handlers in booksApp must include full path e.g., /books)
    // app.route('/', books)
    ```
*   `app.basePath(path)`: Set a base path for all routes defined *after* this call within the same Hono instance.
    ```typescript
    const api = new Hono().basePath('/api')
    api.get('/users', ...) // Handles GET /api/users
    app.route('/', api) // Mount the api routes
    ```
*   `app.mount(path, externalHandler)`: Mount applications from other frameworks (e.g., itty-router).
    ```typescript
    import { Router as IttyRouter } from 'itty-router'
    const ittyRouter = IttyRouter()
    ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
    app.mount('/itty-router', ittyRouter.handle) // Handles GET /itty-router/hello
    ```

#### Error Handling

*   `app.notFound(handler)`: Customize the 404 Not Found response.
    ```typescript
    app.notFound((c) => c.text('Custom Not Found', 404))
    ```
*   `app.onError(handler)`: Handle errors thrown during request processing.
    ```typescript
    import { HTTPException } from 'hono/http-exception'
    app.onError((err, c) => {
      console.error(`${err}`)
      if (err instanceof HTTPException) {
        return err.getResponse()
      }
      return c.text('Internal Server Error', 500)
    })
    ```

#### Execution & Testing

*   `app.fire()`: Adds a global `fetch` event listener (for Service Worker environments).
*   `app.fetch(request, env, ctx)`: The main entry point for processing requests. Used by platform adapters.
    ```typescript
    // Cloudflare Workers Module Worker export
    export default {
      fetch: app.fetch
    }
    // Or simply: export default app
    ```
*   `app.request(pathOrRequest, options, env)`: Useful for testing. Sends a request to the app and returns a `Response`.
    ```typescript
    // Simple GET
    const res = await app.request('/hello')
    expect(res.status).toBe(200)

    // POST with body
    const postRes = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Post' }),
      headers: { 'Content-Type': 'application/json' }
    })
    expect(postRes.status).toBe(201)

    // Pass mock environment variables
    const envRes = await app.request('/config', {}, { API_KEY: 'test-key' })
    ```

---

### Context (`c`)

The `Context` object provides methods for handling requests and responses within a handler or middleware.

#### Request Access (`c.req`)

Instance of `HonoRequest`. See [HonoRequest (`c.req`)](#honorequest-creq) section for details.

```typescript
app.get('/user-agent', (c) => {
  const ua = c.req.header('User-Agent')
  return c.text(`UA: ${ua}`)
})

app.get('/posts/:id', (c) => {
  const id = c.req.param('id')
  const format = c.req.query('format')
  // ...
})
```

#### Response Methods

*   `c.body(data, status?, headers?)`: Returns a raw HTTP response. `data` can be `string`, `ArrayBuffer`, `ReadableStream`, etc.
    ```typescript
    c.header('X-Message', 'Hi')
    c.status(201)
    return c.body('Created content')
    // Equivalent shortcut:
    // return c.body('Created content', 201, { 'X-Message': 'Hi' })
    ```
*   `c.text(text, status?, headers?)`: Returns `text/plain` response.
    ```typescript
    return c.text('Plain text response')
    ```
*   `c.json(object, status?, headers?)`: Returns `application/json` response.
    ```typescript
    return c.json({ message: 'Success', data: [1, 2, 3] })
    ```
*   `c.html(htmlContent, status?, headers?)`: Returns `text/html` response. `htmlContent` can be a string or JSX.
    ```typescript
    return c.html('<h1>Hello HTML</h1>')
    // With JSX: return c.html(<h1>Hello JSX</h1>)
    ```
*   `c.redirect(location, status?)`: Redirects the client. Default status is 302.
    ```typescript
    return c.redirect('/new-location') // 302 Found
    return c.redirect('/permanent-location', 301) // 301 Moved Permanently
    ```
*   `c.notFound()`: Returns a 404 Not Found response (uses `app.notFound` if defined).
    ```typescript
    if (!user) {
      return c.notFound()
    }
    ```
*   `c.header(name, value)`: Sets a response header.
*   `c.status(statusCode)`: Sets the HTTP status code.

#### Response Object Access (`c.res`)

Access the `Response` object directly, often used in middleware after `await next()`.

```typescript
app.use(async (c, next) => {
  await next()
  // Modify response after handler runs
  if (c.res) {
    c.res.headers.append('X-Middleware-Processed', 'true')
  }
})
```

#### Context Variables (`c.set`/`c.get`/`c.var`)

Store and retrieve arbitrary data within the lifecycle of a single request. Useful for passing data between middleware.

```typescript
// Define Variable types for type safety
type Env = { Variables: { message: string; userId: number } }
const app = new Hono<Env>()

// Middleware sets a variable
app.use(async (c, next) => {
  c.set('message', 'Hono is cool!')
  c.set('userId', 123)
  await next()
})

// Handler gets the variable
app.get('/', (c) => {
  const msg = c.get('message') // Type: string
  const userId = c.get('userId') // Type: number
  // Access via c.var (proxy to c.get)
  const msgFromVar = c.var.message
  return c.text(`Message: ${msg}, User: ${userId}`)
})

// Extend ContextVariableMap for global type awareness (e.g., in libraries)
declare module 'hono' {
  interface ContextVariableMap {
    customData: { id: string }
  }
}
// Now c.get('customData') or c.var.customData is typed
```

#### Rendering (`c.setRenderer`/`c.render`)

Define a layout template using `c.setRenderer` in middleware and render content into it using `c.render` in handlers. Typically used with JSX.

```typescript
// Middleware sets the renderer
app.use('/pages/*', async (c, next) => {
  c.setRenderer((content, props) => { // props defined by ContextRenderer extension
    return c.html(
      <html>
        <head><title>{props.title || 'Default Title'}</title></head>
        <body>
          <header>My Site</header>
          <main>{content}</main>
        </body>
      </html>
    )
  })
  await next()
})

// Handler renders content into the layout
app.get('/pages/about', (c) => {
  return c.render('This is the about page.', { title: 'About Us' })
})

// Extend ContextRenderer for type-safe props
declare module 'hono' {
  interface ContextRenderer {
    (content: string | Promise<string>, props: { title?: string }): Response | Promise<Response>
  }
}
```

#### Platform/Environment Access

*   `c.env`: Access environment bindings (Cloudflare Workers vars, KV, D1, R2; Node.js `process.env` via adapter; Deno `Deno.env`, etc.). Requires Generics `<{ Bindings: ... }>` for type safety.
    ```typescript
    // Cloudflare Worker example
    type Env = { Bindings: { MY_KV: KVNamespace, SECRET_KEY: string } }
    const app = new Hono<Env>()
    app.get('/kv/:key', async (c) => {
      const key = c.req.param('key')
      const value = await c.env.MY_KV.get(key)
      const secret = c.env.SECRET_KEY
      return c.json({ key, value, secret })
    })
    ```
*   `c.executionCtx` (Cloudflare Workers): Access the `ExecutionContext` for tasks like `waitUntil`.
    ```typescript
    app.post('/data', async (c) => {
      const data = await c.req.json()
      c.executionCtx.waitUntil(c.env.KV.put('lastData', JSON.stringify(data)))
      return c.text('Data received')
    })
    ```
*   `c.event` (Cloudflare Workers - Service Worker syntax): Access the `FetchEvent`.

#### Error Property (`c.error`)

Contains the error object if a handler or downstream middleware throws an error. Accessible in upstream middleware.

```typescript
app.use(async (c, next) => {
  await next()
  if (c.error) {
    console.error('Error occurred:', c.error)
    // Potentially modify response based on error
  }
})
```

---

### HonoRequest (`c.req`)

Represents the incoming HTTP request, wrapping the standard `Request` object.

*   `c.req.param(key)`: Get a single path parameter value.
*   `c.req.param()`: Get all path parameters as an object.
    ```typescript
    // Route: /users/:userId/books/:bookId
    app.get('/users/:userId/books/:bookId', (c) => {
      const userId = c.req.param('userId') // string | undefined
      const params = c.req.param()         // { userId: string, bookId: string }
      // ...
    })
    ```
*   `c.req.query(key)`: Get a single query string parameter value.
*   `c.req.query()`: Get all query string parameters as an object.
    ```typescript
    // Request: /search?q=hono&limit=10
    app.get('/search', (c) => {
      const query = c.req.query('q') // string | undefined
      const allQueries = c.req.query() // { q: string, limit: string }
      // ...
    })
    ```
*   `c.req.queries(key)`: Get multiple query string parameter values as an array.
    ```typescript
    // Request: /items?tags=a&tags=b
    app.get('/items', (c) => {
      const tags = c.req.queries('tags') // string[] | undefined => ['a', 'b']
      // ...
    })
    ```
*   `c.req.header(key)`: Get a single request header value.
*   `c.req.header()`: Get all request headers as a record (keys are **lowercase**).
    ```typescript
    app.get('/', (c) => {
      const contentType = c.req.header('Content-Type')
      const allHeaders = c.req.header() // { 'content-type': '...', 'user-agent': '...' }
      // Note: To get 'X-Custom-Header', use c.req.header('X-Custom-Header'), not allHeaders['X-Custom-Header']
      // ...
    })
    ```
*   `c.req.parseBody(options?)`: Parse `multipart/form-data` or `application/x-www-form-urlencoded` body. Returns `Promise<Record<string, string | File | (string | File)[]>>`.
    *   Options:
        *   `all: boolean`: If true, values with the same name become arrays. Default `false`.
        *   `dot: boolean`: If true, parses dot notation keys into nested objects. Default `false`.
    ```typescript
    app.post('/upload', async (c) => {
      // FormData: { name: "Hono", file: File }
      const body = await c.req.parseBody()
      const name = body['name'] // string
      const file = body['file'] // File
      // FormData: { images[]: File, images[]: File }
      const bodyMulti = await c.req.parseBody()
      const images = bodyMulti['images[]'] // (string | File)[]
      // FormData: { user.name: "Hono", user.email: "..." }
      const bodyDot = await c.req.parseBody({ dot: true })
      // bodyDot is { user: { name: "Hono", email: "..." } }
    })
    ```
*   `c.req.json()`: Parse `application/json` body. Returns `Promise<any>`.
*   `c.req.text()`: Parse `text/plain` body. Returns `Promise<string>`.
*   `c.req.arrayBuffer()`: Get body as `ArrayBuffer`. Returns `Promise<ArrayBuffer>`.
*   `c.req.blob()`: Get body as `Blob`. Returns `Promise<Blob>`.
*   `c.req.formData()`: Get body as `FormData`. Returns `Promise<FormData>`.
*   `c.req.valid(target)`: Get validated data (from `validator` middleware). `target` can be `'form'`, `'json'`, `'query'`, `'header'`, `'cookie'`, `'param'`. Returns `Promise<DataType>`.
    ```typescript
    // After zValidator('query', schema)
    app.get('/search', (c) => {
        const { q, limit } = c.req.valid('query')
        // ...
    })
    ```
*   `c.req.routePath`: Get the matched route path pattern (e.g., `/users/:id`).
*   `c.req.matchedRoutes`: Get an array of matched route objects `{ path, handler, method }`. Useful for debugging.
*   `c.req.routeIndex`: Index of the route that responded within `matchedRoutes`.
*   `c.req.path`: The request pathname (e.g., `/users/123`).
*   `c.req.url`: The full request URL string.
*   `c.req.method`: The request HTTP method (`GET`, `POST`, etc.).
*   `c.req.raw`: The raw underlying `Request` object.

---

### Routing

Define how the application responds to client requests based on method and path.

#### Path Parameters

*   `:name`: Capture a segment (e.g., `/users/:id`). Access via `c.req.param('id')`.
*   `:name?`: Optional parameter (e.g., `/files/:filename?`). Matches `/files` and `/files/image.png`.
*   `:name{[0-9]+}`: Parameter with regex constraint (e.g., `/posts/:id{[0-9]+}`).
*   `:name{.+\\.png}`: Parameter including slashes (e.g., `/images/:filepath{.+\\.jpg}`).

#### Wildcards

*   `*`: Matches any sequence of characters within a segment or across multiple segments.
    *   `/posts/*`: Matches `/posts/a`, `/posts/a/b`, but not `/posts`.
    *   `/files/*/details`: Matches `/files/a/details`, `/files/b/c/details`.

#### Route Registration Order & Priority

*   Routes are matched in the order they are registered.
*   More specific routes should be registered before less specific ones or wildcards.
    ```typescript
    app.get('/users/me', ...) // Register specific route first
    app.get('/users/:id', ...) // Then the general parameter route
    app.get('*', ...)          // Wildcard fallback last
    ```
*   Middleware defined with `app.use()` runs before handlers defined later for the same path.
*   Once a handler returns a `Response`, processing stops (subsequent matching routes are ignored). Use `await next()` in middleware to continue processing.

#### Hostname Routing

Requires custom `getPath` function during Hono initialization.

```typescript
const app = new Hono({
  // Prepend hostname to the path for routing
  getPath: (req) => req.url.replace(/^https?:\/([^?]+).*$/, '$1')
})

app.get('site1.example.com/home', ...)
app.get('site2.example.com/home', ...)

// Route based on Host header
const appHostHeader = new Hono({
  getPath: (req) =>
    '/' +
    req.headers.get('host') +
    req.url.replace(/^https?:\/\/[^/]+(\/[^?]*).*/, '$1'),
})
appHostHeader.get('/www1.example.com/hello', ...)
```

---

### Middleware

Functions executed before or after route handlers, used for logging, authentication, data processing, etc.

#### Concept

Middleware forms an "onion" structure around the handler. Code before `await next()` runs on the way in, code after runs on the way out.

```typescript
app.use(async (c, next) => {
  // Runs before the handler
  const startTime = Date.now()
  console.log(`Request Start: ${c.req.method} ${c.req.url}`)

  await next() // Calls the next middleware or the handler

  // Runs after the handler
  if (c.res) {
    const duration = Date.now() - startTime
    c.res.headers.set('X-Response-Time', `${duration}ms`)
    console.log(`Request End: Status ${c.res.status}`)
  }
})
```

#### Creating Custom Middleware

*   Inline:
    ```typescript
    app.use('/admin/*', async (c, next) => {
      const authHeader = c.req.header('Authorization')
      if (!authHeader || !isValidAuth(authHeader)) {
        return c.text('Unauthorized', 401)
      }
      await next()
    })
    ```
*   Using `createMiddleware` (from `hono/factory`) for reusability and type safety:
    ```typescript
    import { createMiddleware } from 'hono/factory'

    type AuthVariables = { Variables: { userId: string } }

    const authMiddleware = createMiddleware<AuthVariables>(async (c, next) => {
      // ... validation logic ...
      c.set('userId', 'user-123') // Set context variable
      await next()
    })

    app.use('/protected/*', authMiddleware)

    app.get('/protected/profile', (c) => {
      const userId = c.var.userId // Access typed variable
      return c.json({ userId, message: 'Your profile' })
    })
    ```

#### Built-in Middleware (Examples)

Import from `hono/{middleware-name}`.

*   `basicAuth`: Basic HTTP authentication.
*   `bearerAuth`: Bearer token authentication.
*   `cache`: HTTP Caching using Cache API.
*   `compress`: Response compression (gzip, deflate).
*   `cors`: Cross-Origin Resource Sharing headers.
*   `csrf`: CSRF protection using Origin header check.
*   `etag`: ETag header generation and handling.
*   `jwt`: JWT verification.
*   `logger`: Request/response logging.
*   `prettyJson`: Pretty-print JSON responses via query param.
*   `secureHeaders`: Set various security-related headers.
*   `timing`: Server-Timing header metrics.
*   `bodyLimit`: Limit request body size.
*   `ipRestriction`: Restrict access based on IP address.
*   `methodOverride`: Override HTTP method via form/header/query.
*   `requestId`: Generate and add a unique request ID.
*   `trailingSlash`: Append or trim trailing slashes.
*   `jsxRenderer`: Simplified JSX rendering with layouts.
*   `timeout`: Set request timeout.
*   `languageDetector`: Detect user language.
*   `contextStorage`: Store Context in AsyncLocalStorage.
*   `combine`: Combine multiple middleware (`some`, `every`, `except`).

```typescript
import { Hono } from 'hono'
import { etag } from 'hono/etag'
import { logger } from 'hono/logger'
import { secureHeaders } from 'hono/secure-headers'

const app = new Hono()
app.use(logger(), etag(), secureHeaders()) // Chain middleware

app.get('/', (c) => c.text('Hello with middleware!'))
```

#### Third-Party Middleware

Available for various functionalities (Auth providers, Validators, OpenAPI, GraphQL, Sentry, etc.). Typically installed separately.

---

### Exception Handling (`HTTPException`)

Use `HTTPException` for expected errors (e.g., authentication failure, bad request).

#### Throwing Exceptions

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

app.post('/resource', async (c, next) => {
  const authorized = await checkAuth(c.req.header('Authorization'))
  if (!authorized) {
    // Throw with status and custom message
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  try {
    await processRequest(c)
  } catch (e) {
    // Include original error cause
    throw new HTTPException(500, { message: 'Processing failed', cause: e })
  }

  await next()
})

// Throw with a custom Response object
app.get('/custom-error', (c) => {
  const errorResponse = new Response('Custom Unauthorized Body', {
    status: 401,
    headers: { 'X-Error-Type': 'CustomAuth' }
  })
  throw new HTTPException(401, { res: errorResponse })
})
```

#### Handling Exceptions (`app.onError`)

Catch thrown `HTTPException` (and other errors) globally.

```typescript
app.onError((err, c) => {
  if (err instanceof HTTPException) {
    // Use the custom message or response from the exception
    return err.getResponse()
  }
  // Handle other unexpected errors
  console.error('Unexpected Error:', err)
  return c.text('An unexpected error occurred', 500)
})
```

---

### Presets (`hono`, `hono/quick`, `hono/tiny`)

Provide pre-configured router setups for different use cases. Import `Hono` from the desired preset path.

*   **`hono` (Default):**
    *   `import { Hono } from 'hono'`
    *   Router: `SmartRouter` (uses `RegExpRouter` + `TrieRouter`)
    *   Best for: Most use cases, long-running servers (Node.js, Deno, Bun), environments with persistent isolates (Cloudflare Workers). Balances registration speed and high dispatch performance.
*   **`hono/quick`:**
    *   `import { Hono } from 'hono/quick'`
    *   Router: `SmartRouter` (uses `LinearRouter` + `TrieRouter`)
    *   Best for: Environments initializing per request (Fastly Compute). Prioritizes fast route registration.
*   **`hono/tiny`:**
    *   `import { Hono } from 'hono/tiny'`
    *   Router: `PatternRouter`
    *   Best for: Resource-constrained environments where bundle size is critical. Smallest footprint.

---

### Routers

Hono offers multiple router implementations:

*   **`RegExpRouter`:** Extremely fast, compiles routes into a single large regex. Default in `hono` preset (via `SmartRouter`). May not support all complex patterns.
*   **`TrieRouter`:** Uses a Trie tree algorithm. Faster than traditional linear routers, supports all patterns. Used as fallback in `SmartRouter`.
*   **`SmartRouter`:** Default router. Selects the best underlying router (`RegExpRouter` or `TrieRouter`) based on registered routes for optimal performance.
*   **`LinearRouter`:** Very fast route registration, slower dispatch than `RegExpRouter`. Used in `hono/quick`. Ideal for FaaS environments initializing frequently.
*   **`PatternRouter`:** Smallest router, simple pattern matching. Used in `hono/tiny`.

---

### Web Standards

*   Hono is built entirely on Web Standards APIs (Fetch API: `Request`, `Response`, `Headers`, `URL`, `URLSearchParams`, etc.).
*   This ensures compatibility across runtimes supporting these standards (Cloudflare Workers, Deno, Bun, Fastly Compute, etc.).
*   Adapters (like `@hono/node-server`) bridge compatibility for environments like Node.js.

---

### Helpers

Utility functions imported from `hono/{helper}` or platform-specific paths.

*   **`hono/accepts`**: Handle `Accept-*` headers (`accepts()`).
*   **`hono/adapter`**: Runtime detection (`getRuntimeKey()`) and environment variable access (`env()`).
*   **`hono/cookie`**: Manage cookies (`getCookie`, `setCookie`, `deleteCookie`, `getSignedCookie`, `setSignedCookie`).
    ```typescript
    import { getCookie, setCookie } from 'hono/cookie'
    app.get('/cookie-test', (c) => {
      const value = getCookie(c, 'mycookie')
      setCookie(c, 'newcookie', 'hello', { path: '/', secure: true, maxAge: 3600 })
      return c.text(`Cookie value: ${value}`)
    })
    ```
*   **`hono/css`**: CSS-in-JS(X) (`css`, `cx`, `keyframes`, `<Style />`). Experimental.
*   **`hono/dev`**: Development utilities (`showRoutes()`, `getRouterName()`).
*   **`hono/factory`**: Create middleware and handlers with type safety (`createFactory()`, `createMiddleware()`, `createHandlers()`).
*   **`hono/html`**: Tagged template literal for HTML (`html`, `raw`).
    ```typescript
    import { html, raw } from 'hono/html'
    app.get('/html-helper', (c) => {
      const content = '<em>Raw HTML</em>'
      return c.html(html`<h1>Title</h1><p>${raw(content)}</p>`)
    })
    ```
*   **`hono/jwt`**: JWT signing, verification, decoding (`sign`, `verify`, `decode`).
*   **`hono/proxy`**: Proxy requests (`proxy()`).
*   **`hono/ssg`**: Static Site Generation utilities (`toSSG`, `ssgParams`, `disableSSG`, `onlySSG`).
*   **`hono/streaming`**: Streaming responses (`stream`, `streamText`, `streamSSE`).
    ```typescript
    import { streamText } from 'hono/streaming'
    app.get('/stream', (c) => {
      return streamText(c, async (stream) => {
        await stream.writeln('Starting...')
        await stream.sleep(1000)
        await stream.writeln('Finished.')
      })
    })
    ```
*   **`hono/testing`**: Testing client (`testClient()`).
*   **`hono/websocket`**: Server-side WebSocket handling (via platform adapters like `hono/cloudflare-workers`, `hono/deno`, `hono/bun`).
*   **`hono/{platform}/conninfo`**: Get connection info (`getConnInfo()`).

---

### JSX (`hono/jsx`)

Write UI components using JSX syntax, renderable on server or client.

#### Setup

*   `tsconfig.json`:
    ```json
    {
      "compilerOptions": {
        "jsx": "react-jsx", // or "preserve"
        "jsxImportSource": "hono/jsx"
      }
    }
    ```
*   Or use pragmas in `.tsx` files:
    ```typescript
    /** @jsx jsx */
    /** @jsxImportSource hono/jsx */
    ```
*   For Deno, use `deno.json`:
    ```json
    {
      "compilerOptions": {
        "jsx": "react-jsx", // Use react-jsx for useRequestContext
        "jsxImportSource": "hono/jsx"
      }
    }
    ```

#### Basic Usage

```tsx
/** @jsx jsx */
/** @jsxImportSource hono/jsx */
import { Hono } from 'hono'
import type { FC } from 'hono/jsx'

const app = new Hono()

const Layout: FC<{ title: string }> = ({ title, children }) => (
  <html>
    <head><title>{title}</title></head>
    <body>{children}</body>
  </html>
)

const Greet: FC<{ name: string }> = ({ name }) => <h1>Hello, {name}!</h1>

app.get('/', (c) => {
  return c.html(
    <Layout title="Homepage">
      <Greet name="Hono User" />
      <ul>
        {[1, 2, 3].map(i => <li>Item {i}</li>)}
      </ul>
    </Layout>
  )
})
```

#### Features

*   **Fragments:** `<></>` or `<Fragment></Fragment>`.
*   **`PropsWithChildren`:** Type helper for components accepting children.
*   **`dangerouslySetInnerHTML`:** Insert raw HTML `{ __html: '...' }`.
*   **`memo()`:** Memoize components.
*   **`createContext`, `useContext`, `Provider`:** Share data across component tree.
*   **Async Components:** Use `async`/`await` directly in components. `c.html()` awaits automatically.
    ```tsx
    const DataFetcher: FC = async () => {
      const data = await fetchData()
      return <div>Data: {data}</div>
    }
    app.get('/data', (c) => c.html(<DataFetcher />))
    ```
*   **`Suspense` (Experimental):** Requires `hono/jsx/streaming`. Renders fallback while async components load. Use with `renderToReadableStream`.
    ```tsx
    import { Suspense, renderToReadableStream } from 'hono/jsx/streaming'
    app.get('/suspense-demo', (c) => {
      const stream = renderToReadableStream(
        <Suspense fallback={<div>Loading...</div>}>
          <AsyncComponent />
        </Suspense>
      )
      return c.body(stream, { headers: { 'Content-Type': 'text/html; charset=UTF-8' }})
    })
    ```
*   **`ErrorBoundary` (Experimental):** Catch errors in child components, render fallback.
*   **Integration with `html` helper:** Embed `html` literal results in JSX.
*   **JSX Renderer Middleware (`hono/jsx-renderer`):** Define layouts easily, access context via `useRequestContext()`.

---

### JSX DOM (`hono/jsx/dom`)

Client-side JSX runtime for interactive UIs. Very small footprint.

#### Setup

*   `tsconfig.json` or build tool config: `"jsxImportSource": "hono/jsx/dom"`.

#### Usage

```tsx
/** @jsx jsx */
/** @jsxImportSource hono/jsx/dom */
import { useState } from 'hono/jsx'
import { render } from 'hono/jsx/dom'

function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}

render(<Counter />, document.getElementById('app'))
```

#### Features

*   `render(component, container)`: Mount component in DOM element.
*   React-compatible Hooks: `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`, `useReducer`, `useContext`, etc.
*   View Transitions API helpers: `startViewTransition()`, `useViewTransition()`. Experimental.

---

### RPC (Remote Procedure Call)

Type-safe communication between Hono server and client (`hono/client`).

#### Server Setup

1.  Use a validator (e.g., `@hono/zod-validator`) for input types.
2.  Return JSON responses using `c.json()`. Specify status codes for type inference.
3.  Assign the route definition to a variable.
4.  Export the `typeof` the route/app variable (`AppType`).

```typescript
// server.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const postsRoute = app.post(
  '/posts',
  zValidator('json', z.object({ title: z.string(), content: z.string() })),
  async (c) => {
    const newPost = c.req.valid('json')
    // ... save post ...
    const savedPost = { id: '123', ...newPost }
    return c.json({ success: true, post: savedPost }, 201) // Use c.json, specify status
  }
)

const getPostRoute = app.get('/posts/:id', async (c) => {
  const { id } = c.req.param()
  const post = await db.getPost(id)
  if (!post) {
    return c.json({ success: false, error: 'Not Found' }, 404) // Use c.json for errors too
  }
  return c.json({ success: true, post }, 200)
})

// Combine routes if needed for AppType
const routes = app.route('/', postsRoute).route('/', getPostRoute)

export type AppType = typeof routes // Export the type of the combined routes/app
export default app
```

#### Client Setup (`hono/client`)

1.  Import `hc` and the `AppType` from the server.
2.  Create a client instance: `const client = hc<AppType>('http://server-url')`.
3.  Call API endpoints using `client.path[param].$method(payload?, options?)`.

```typescript
// client.ts
import { hc } from 'hono/client'
import type { AppType } from './server' // Import server type

const client = hc<AppType>('http://localhost:8787')

async function createPost() {
  const res = await client.posts.$post({
    json: { // Matches zValidator target ('json')
      title: 'My Hono Post',
      content: 'This is content.'
    }
  })

  if (!res.ok) {
    console.error('Failed to create post:', await res.text())
    return
  }

  // Type-safe JSON response based on server's c.json() return
  const data = await res.json()
  if (data.success) { // Type narrowed based on status code potentially
     console.log('Created Post ID:', data.post.id) // data.post is typed
  }
}

async function getPost(id: string) {
  const res = await client.posts[':id'].$get({ // Use literal ':id' for param segment
    param: { id: id } // Matches path parameter name
  })

  if (res.status === 404) {
    const errorData = await res.json() // Type: { success: false, error: string }
    console.error(errorData.error)
    return
  }

  if (res.ok) {
     const data = await res.json() // Type: { success: true, post: PostType }
     console.log('Post Title:', data.post.title)
  }
}
```

#### RPC Features

*   **Type Safety:** Input (`json`, `form`, `query`, `param`) and output (`c.json` return value) types are inferred.
*   **Status Code Inference:** Client can narrow response type based on status code if specified in `c.json()`.
*   **Path Parameters:** Use literal parameter names (e.g., `client.users[':id']`).
*   **Headers/`init`:** Pass custom headers or fetch `RequestInit` options.
    ```typescript
    await client.posts.$get({}, { headers: { 'X-API-Key': '...' } })
    const controller = new AbortController()
    await client.posts.$get({}, { init: { signal: controller.signal } })
    ```
*   **`$url()`:** Get the URL object for an endpoint.
    ```typescript
    const url = client.posts[':id'].$url({ param: { id: '123' } }) // URL object for /posts/123
    ```
*   **File Uploads:** Send `File` objects in `form` data.
*   **Custom Fetch:** Provide a custom `fetch` implementation to `hc`.
*   **Type Inference Helpers:** `InferRequestType<typeof client.endpoint.$method>`, `InferResponseType<typeof client.endpoint.$method, StatusCode?>`.
*   **Larger Applications:** Chain routes using `app.route()` when defining the exported `AppType` for correct inference.
*   **Known Issues:** IDE performance can degrade with many routes; mitigate using TS project references, compiling types, or splitting clients. Ensure matching Hono versions between client/server.

---

### Validation

Validate incoming request data (query params, body, headers, etc.).

#### Manual Validator (`hono/validator`)

```typescript
import { validator } from 'hono/validator'
import { HTTPException } from 'hono/http-exception'

// Validate query parameters
app.get(
  '/search',
  validator('query', (value, c) => {
    const q = value['q']
    if (!q || typeof q !== 'string' || q.length < 3) {
      // Return a Response to halt processing
      return c.text('Invalid query parameter "q"', 400)
      // Or throw HTTPException
      // throw new HTTPException(400, { message: 'Invalid query parameter "q"' })
    }
    // Return validated/sanitized data
    return { q: q.trim() }
  }),
  (c) => {
    const { q } = c.req.valid('query') // Access validated data
    return c.text(`Searching for: ${q}`)
  }
)

// Validate JSON body
app.post(
  '/items',
  validator('json', (value, c) => {
    if (!value || typeof value.name !== 'string' || typeof value.price !== 'number') {
      return c.json({ error: 'Invalid JSON body' }, 400)
    }
    return { name: value.name, price: value.price } // Return validated data
  }),
  (c) => {
    const { name, price } = c.req.valid('json')
    // ... create item ...
    return c.json({ message: 'Item created', name, price }, 201)
  }
)
```

*   **Targets:** `'form'`, `'json'`, `'query'`, `'header'`, `'param'`, `'cookie'`.
*   Callback receives `value` (parsed data) and `c` (Context).
*   Return a `Response` or throw `HTTPException` on validation failure.
*   Return the validated data object on success.
*   Access validated data in handler via `c.req.valid(target)`.
*   **Note:** For `json`, `Content-Type: application/json` header is required. For `header`, use lowercase header names as keys (e.g., `value['user-agent']`).

#### Zod Validator Middleware (`@hono/zod-validator`)

Recommended approach using Zod schemas.

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const querySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
})

const postSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(10),
})

app.get(
  '/posts',
  zValidator('query', querySchema), // Apply validator middleware
  (c) => {
    const { page, limit } = c.req.valid('query') // Access validated & typed data
    // ... fetch posts with pagination ...
    return c.json({ page, limit, posts: [...] })
  }
)

app.post(
  '/posts',
  zValidator('json', postSchema),
  (c) => {
    const { title, body } = c.req.valid('json')
    // ... create post ...
    return c.json({ message: 'Post created', title }, 201)
  }
)
```

---

### Platform Adapters & Guides

Hono provides adapters and specific functions for seamless integration with various platforms.

*   **Cloudflare Workers:**
    *   Entrypoint: `export default app` or `export default { fetch: app.fetch }` (Module Worker). `app.fire()` (Service Worker).
    *   Bindings: Access via `c.env`. Use generics `Hono<{ Bindings: ... }>` for types.
    *   WebSocket: `import { upgradeWebSocket } from 'hono/cloudflare-workers'`.
    *   Static Assets: Configure in `wrangler.toml`, served automatically.
    *   Testing: Use `@cloudflare/vitest-pool-workers`.
*   **Cloudflare Pages:**
    *   Entrypoint: Export `handle` from `hono/cloudflare-pages`. Typically in `functions/api/[[route]].ts`.
    *   Middleware: Use `handleMiddleware` from `hono/cloudflare-pages` in `functions/_middleware.ts`.
    *   Bindings: Access via `c.env`. Configure in dashboard for production, `wrangler.toml` for local dev via Vite plugin.
    *   Client-side JS: Integrate using Vite.
*   **Deno:**
    *   Entrypoint: `Deno.serve(app.fetch)` or `Deno.serve({ port: ... }, app.fetch)`.
    *   Static Files: `import { serveStatic } from 'hono/deno'`.
    *   Testing: Use `Deno.test` and `@std/assert`.
    *   Specifiers: Use `jsr:@hono/hono` or `npm:hono`. Use `npm:` for better type inference with npm-based middleware.
*   **Bun:**
    *   Entrypoint: `export default { fetch: app.fetch, port: 3000, websocket? }`.
    *   Static Files: `import { serveStatic } from 'hono/bun'`.
    *   WebSocket: `import { createBunWebSocket } from 'hono/bun'`.
    *   Testing: Use `bun:test`.
*   **Node.js (`@hono/node-server`):**
    *   Requires Node >= 18.14.1 / 19.7.0 / 20.0.0.
    *   Entrypoint: `import { serve } from '@hono/node-server'; serve(app)` or `serve({ fetch: app.fetch, port: 3000 })`.
    *   Static Files: `import { serveStatic } from '@hono/node-server/serve-static'`.
    *   Raw APIs: Access `http.IncomingMessage`/`http.ServerResponse` via `c.env.incoming`/`c.env.outgoing`. Use `HttpBindings` type.
    *   HTTP/2: Pass `createServer` / `createSecureServer` to `serve`.
*   **AWS Lambda (`hono/aws-lambda`):**
    *   Entrypoint: `import { handle, streamHandle } from 'hono/aws-lambda'; export const handler = handle(app)` (or `streamHandle` for streaming).
    *   Event/Context: Access via `c.env`. Use `LambdaEvent`, `LambdaContext` types.
    *   Binary Data: Set `Content-Type` header; adapter handles base64 encoding.
*   **Lambda@Edge (`hono/lambda-edge`):**
    *   Entrypoint: `import { handle } from 'hono/lambda-edge'; export const handler = handle(app)`.
    *   Callback: Access CloudFront callback via `c.env.callback`.
*   **Vercel (`hono/vercel`):**
    *   Entrypoint (Edge): `import { handle } from 'hono/vercel'; export const GET = handle(app); export const runtime = 'edge'`.
    *   Entrypoint (Node.js): Use `@hono/node-server/vercel` adapter. Set `export const runtime = 'nodejs'`. Disable helpers `NODEJS_HELPERS=0`.
*   **Netlify (`hono/netlify`):**
    *   Entrypoint: `import { handle } from 'jsr:@hono/hono/netlify'; export default handle(app)` in `netlify/edge-functions/index.ts`.
    *   Context: Access Netlify context via `c.env.context`.
*   **Alibaba Cloud FC (`hono-alibaba-cloud-fc3-adapter`):**
    *   Entrypoint: `import { handle } from 'hono-alibaba-cloud-fc3-adapter'; export const handler = handle(app)`.
*   **Azure Functions (`@marplex/hono-azurefunc-adapter`):**
    *   Entrypoint: `import { azureHonoHandler } from '@marplex/hono-azurefunc-adapter'; app.http('trigger', { ..., handler: azureHonoHandler(honoApp.fetch) })`.
*   **Supabase Edge Functions:**
    *   Entrypoint: `import { Hono } from 'jsr:@hono/hono'; const app = new Hono().basePath(...); Deno.serve(app.fetch)`.
*   **Service Worker (`hono/service-worker`):**
    *   Entrypoint: `import { handle } from 'hono/service-worker'; self.addEventListener('fetch', handle(app))`.

---

### Testing

*   **`app.request(path | Request, options?, env?)`:** Primary method for integration testing. Simulates requests and returns `Response`.
    ```typescript
    import { describe, it, expect } from 'vitest' // Or your test runner
    import app from '../src/index' // Your Hono app instance

    describe('API Tests', () => {
      it('GET / should return Hello', async () => {
        const res = await app.request('/')
        expect(res.status).toBe(200)
        expect(await res.text()).toBe('Hello Hono!')
      })

      it('POST /users should create user', async () => {
        const res = await app.request('/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Test User' })
        })
        expect(res.status).toBe(201)
        const data = await res.json()
        expect(data.message).toBe('User created')
        expect(data.name).toBe('Test User')
      })

      it('GET /protected requires auth', async () => {
        const res = await app.request('/protected')
        expect(res.status).toBe(401) // Assuming auth middleware protects it
      })

      it('Should use mock environment', async () => {
        const MOCK_ENV = { API_KEY: 'mock-key' }
        // Assuming route /env reads c.env.API_KEY
        const res = await app.request('/env', {}, MOCK_ENV)
        expect(res.status).toBe(200)
        expect(await res.json()).toEqual({ key: 'mock-key' })
      })
    })
    ```
*   **`testClient(app)` (`hono/testing`):** Provides a typed client (like RPC client) for testing, offering better autocompletion for routes and payloads.
    ```typescript
    import { testClient } from 'hono/testing'
    import app from '../src/index'

    describe('Typed Client Test', () => {
      it('Should get user data', async () => {
        const client = testClient(app)
        // Assumes GET /users/:id returns { id: string, name: string }
        const res = await client.users[':id'].$get({ param: { id: '123' } })
        expect(res.status).toBe(200)
        const data = await res.json()
        expect(data.id).toBe('123')
        expect(data.name).toBeDefined()
      })
    })
    ```

---

### Best Practices

*   **Avoid "Controller" Functions:** Define handlers directly inline with route definitions (`app.get('/', (c) => {...})`) for better TypeScript inference, especially for path parameters and context variables.
*   **Use `factory.createHandlers()`:** If separation is needed, use `createHandlers` from `hono/factory` to retain type safety.
*   **Build Larger Apps with `app.route()`:** Structure applications by creating separate Hono instances for different modules/features (e.g., `users.ts`, `posts.ts`) and mount them using `app.route('/users', usersApp)`.
*   **RPC Type Inference:** When using `app.route()` with RPC, ensure handlers within sub-apps are chained (`new Hono().get(...).post(...)`) and export the `typeof` the *final* chained app instance that includes all routes intended for the client.