## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of Bun's APIs and features based on the provided documentation. It covers core functionalities like HTTP servers/clients, file I/O, binary data manipulation, database access (SQLite, PostgreSQL), process spawning, FFI, WebSockets, utilities, and more. It is designed to be self-contained and comprehensive, enabling you to quickly understand and start using Bun's capabilities for various tasks. Bun-specific APIs and performance optimizations are highlighted.

---

## Bun Cheatsheet

### Core Concepts & Globals

*   **`Bun` Object:** Namespace for Bun-specific APIs (`Bun.serve`, `Bun.file`, `Bun.write`, `Bun.hash`, etc.).
*   **`process`:** Node.js-compatible process object (`process.env`, `process.argv`, `process.exit`, etc.). `Bun.env` is an alias for `process.env`.
*   **Web APIs:** Implements many Web standards like `fetch`, `Request`, `Response`, `Headers`, `URL`, `Blob`, `File`, `ReadableStream`, `WritableStream`, `WebSocket`, `console`, Timers (`setTimeout`, `setInterval`), `TextEncoder`, `TextDecoder`, `AbortController`, `Crypto`.
*   **Node.js Compatibility:** Implements many Node.js APIs like `node:fs`, `node:path`, `node:http`, `node:https`, `node:crypto`, `node:dns`, `node:stream`, `Buffer`, `__dirname`, `__filename`, `require`. Node-API (`.node` files) is also supported via `require()` or `process.dlopen()`.
*   **`import.meta`:** Provides module metadata:
    *   `import.meta.dir`: Absolute path to the module's directory.
    *   `import.meta.file`: Filename of the module.
    *   `import.meta.path`: Absolute path to the module file.
    *   `import.meta.url`: `file://` URL string for the module.
    *   `import.meta.main`: `true` if the module is the entry point executed by `bun run`.
    *   `import.meta.resolve(specifier)`: Resolves a module specifier relative to the current module.
    *   `import.meta.env`: Alias for `process.env`.
*   **Performance:** Bun focuses on speed, often using native code and system calls for performance-critical operations (e.g., file I/O, HTTP, hashing).

### File System I/O (`Bun.file`, `Bun.write`, `FileSink`)

*   **Reading Files (`Bun.file`)**
    *   `Bun.file(path | fd | URL, options?: { type?: string }): BunFile`
    *   Creates a `BunFile` instance (subclass of `Blob`), representing a lazily-loaded file. Does not read the file immediately.
    *   `BunFile` properties: `.size` (bytes), `.type` (MIME type, default `text/plain;charset=utf-8`).
    *   `BunFile` methods (async): `.text()`, `.arrayBuffer()`, `.bytes()` (`Uint8Array`), `.stream()`, `.json()`, `.exists()`.
    *   `.delete()`: Deletes the file.
    *   Can point to non-existent files (`.exists()` returns `false`).
    *   `Bun.stdin`, `Bun.stdout`, `Bun.stderr` are `BunFile` instances.
*   **Writing Files (`Bun.write`)**
    *   `Bun.write(destination: string | URL | BunFile | fd, data: string | Blob | ArrayBuffer | TypedArray | Response): Promise<number>`
    *   Writes data to a destination. Uses optimized system calls (e.g., `copy_file_range`, `sendfile`, `clonefile`, `fcopyfile`) when possible (e.g., `Bun.write(file, otherFile)`).
    *   Examples:
        ```ts
        await Bun.write("output.txt", "Some text");
        await Bun.write(Bun.stdout, Bun.file("input.txt")); // Like cat
        await Bun.write("index.html", await fetch("https://bun.sh"));
        await Bun.write(Bun.file("out.bin"), new Uint8Array([1,2,3]));
        ```
*   **Incremental Writing (`FileSink`)**
    *   Get a writer: `const writer = file.writer(options?: { highWaterMark?: number })`
    *   `writer.write(chunk: string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer): number`: Writes data to an internal buffer.
    *   `writer.flush(): number | Promise<number>`: Flushes the buffer to disk. Returns bytes flushed.
    *   `writer.end(error?: Error): number | Promise<number>`: Flushes buffer and closes the file.
    *   `writer.unref()` / `writer.ref()`: Control if the sink keeps the process alive.
*   **Directories (`node:fs`)**
    *   Use Bun's fast `node:fs` implementation for directory operations.
    *   `readdir(path, { recursive?: boolean })`: Reads directory contents.
    *   `mkdir(path, { recursive?: true })`: Creates directories.

### HTTP Server (`Bun.serve`)

*   `Bun.serve(options: Serve): Server`
*   Starts a high-performance HTTP/WebSocket server.
*   **Options (`Serve` interface):**
    *   `fetch(req: Request, server: Server): Response | Promise<Response>`: Handler for incoming requests not matched by `routes`.
    *   `routes`: (Bun v1.2.3+) Object mapping URL patterns to handlers or static `Response` objects.
        *   Static: `/path": new Response("OK")` (zero-allocation dispatch)
        *   Dynamic: `"/users/:id": (req: BunRequest<"/users/:id">) => Response` (Params in `req.params`)
        *   Wildcard: `"/api/*": handler`
        *   Per-Method: `"/posts": { GET: handler, POST: handler }`
        *   Precedence: Exact > Parameter > Wildcard > Global Catch-all.
    *   `error(error: Error): Response | Promise<Response>`: Global error handler.
    *   `websocket?: WebSocketHandler`: Handlers for WebSocket connections (see WebSockets section).
    *   `port?: number`: Port to listen on (default: `$BUN_PORT`, `$PORT`, `$NODE_PORT`, or 3000). `0` for random port.
    *   `hostname?: string`: Hostname to bind to (default: `"0.0.0.0"`).
    *   `unix?: string`: Path for Unix domain socket (prefix with `\0` for abstract namespace).
    *   `tls?: TLSOptions | TLSOptions[]`: TLS configuration (see TLS section).
    *   `development?: boolean`: Enables detailed error pages (default: `false`).
    *   `idleTimeout?: number`: Max idle time in seconds (default varies).
*   **`BunRequest` (extends `Request`):**
    *   `params: Record<string, string>`: Parsed URL parameters for dynamic routes.
    *   `cookies: CookieMap`: Access/modify request cookies (see Cookies section).
*   **Server Object (`Server`):**
    *   `server.stop(force?: boolean): Promise<void>`: Stops the server (graceful by default).
    *   `server.reload(options: Serve): void`: Hot-reloads `fetch`, `error`, `routes`.
    *   `server.ref()` / `server.unref()`: Control if server keeps process alive.
    *   `server.port`, `server.hostname`, `server.url`.
    *   `server.requestIP(req): SocketAddress | null`: Get client IP info.
    *   `server.timeout(req, seconds)`: Set per-request idle timeout.
    *   `server.pendingRequests`, `server.pendingWebSockets`: Counters.
    *   `server.upgrade(req, options?)`: Upgrade request to WebSocket.
    *   `server.publish(topic, data, compress?)`: Publish to WebSocket topic.
    *   `server.subscriberCount(topic)`: Get WebSocket subscriber count.
*   **TLS Options (`TLSOptions`):**
    *   `key`, `cert`: File contents (string, `BunFile`, `Buffer`, `TypedArray`, or array thereof).
    *   `ca`: Root CA certificate(s).
    *   `passphrase`: For encrypted keys.
    *   `dhParamsFile`: Path to Diffie-Hellman parameters.
    *   `serverName`: For SNI. Can pass array of `TLSOptions` for multiple SNIs.
*   **Streaming Files:** Return `new Response(Bun.file(path))` for efficient streaming (`sendfile`). Use `Bun.file(path).slice(start, end)` for partial content.
*   **HTML Imports:** `import page from "./index.html"` bundles and serves a frontend app.
*   **`export default` Syntax:** A file exporting a `Serve`-like object can be run directly (`bun run file.js`).

### HTTP Client (`fetch`)

*   Implements the WHATWG `fetch` standard.
*   `fetch(url | Request, options?): Promise<Response>`
*   **Common Options:** `method`, `headers`, `body` (string, `FormData`, `ArrayBuffer`, `Blob`, `ReadableStream`, etc.).
*   **Response Body:** `.text()`, `.json()`, `.formData()`, `.bytes()`, `.arrayBuffer()`, `.blob()`, `response.body` (ReadableStream for async iteration).
*   **Bun Extensions/Features:**
    *   `proxy: string`: HTTP proxy URL.
    *   `unix: string`: Path to Unix domain socket for connection.
    *   `tls: TLSOptionsClient`: Client-side TLS config (`key`, `cert`, `ca`, `checkServerIdentity`, `rejectUnauthorized: false` to disable validation).
    *   `decompress: boolean`: Automatic response decompression (default: `true`).
    *   `keepalive: boolean`: Disable connection reuse (default: `false`, meaning reuse is enabled).
    *   `verbose: boolean | "curl"`: Enable debug logging.
    *   `s3: S3Credentials`: Options for fetching `s3://` URLs.
*   **Protocol Support:** `http://`, `https://`, `file://`, `data:`, `blob:`, `s3://`.
*   **Timeouts/Cancellation:** Use `AbortSignal.timeout(ms)` or `AbortController`.
*   **Performance:**
    *   DNS Caching/Prefetching: Uses `bun:dns` cache, `dns.prefetch()` available.
    *   Connection Pooling/Keep-Alive: Enabled by default. `BUN_CONFIG_MAX_HTTP_REQUESTS` env var controls simultaneous connection limit (default 256).
    *   Optimized Response Reading: `.text()`, `.json()`, etc., are fast. `Bun.write(path, response)` is optimized.
    *   `sendfile(2)`: Used for large file uploads under certain conditions.

### WebSockets

*   **Server-Side (`Bun.serve`):**
    *   Upgrade: `server.upgrade(req, { data?, headers? })` in `fetch` handler.
    *   Handlers: Define in `Bun.serve({ websocket: { ... } })`.
        *   `open(ws: ServerWebSocket)`
        *   `message(ws: ServerWebSocket, message: string | Buffer)`
        *   `close(ws: ServerWebSocket, code: number, reason: string)`
        *   `drain(ws: ServerWebSocket)`: Socket ready for more data (backpressure).
        *   `ping(ws, data)`, `pong(ws, data)`
    *   `ServerWebSocket` Instance (`ws`):
        *   `ws.data`: Context data attached during upgrade.
        *   `ws.send(data: string | Buffer | TypedArray, compress?: boolean): number`: Sends message. Returns bytes sent, `0` (dropped), or `-1` (backpressure).
        *   `ws.close(code?, reason?)`
        *   `ws.subscribe(topic: string)`
        *   `ws.unsubscribe(topic: string)`
        *   `ws.publish(topic: string, data, compress?: boolean)`: Publish to topic (excludes self).
        *   `ws.isSubscribed(topic: string)`
        *   `ws.remoteAddress`: Client IP.
        *   `ws.readyState`: Connection state (0-3).
        *   `ws.cork(callback)`: Batch operations.
    *   Pub/Sub: Use `ws.subscribe/unsubscribe/publish` and `server.publish/subscriberCount`.
    *   Configuration: `idleTimeout`, `maxPayloadLength`, `backpressureLimit`, `closeOnBackpressureLimit`, `perMessageDeflate` (compression), `sendPings`, `publishToSelf`.
*   **Client-Side (`WebSocket`):**
    *   `new WebSocket(url, options?)`: Standard Web API.
    *   Bun Extension: `options.headers` to set custom headers (not browser-compatible).
    *   Event Listeners: `open`, `message`, `close`, `error`.

### Binary Data & Streams

*   **Core Types:**
    *   `ArrayBuffer`: Raw sequence of bytes. Cannot access directly. `.byteLength`, `.slice()`.
    *   `DataView`: Low-level interface for reading/writing different number types at specific offsets in an `ArrayBuffer`. Methods: `getUint8`, `setInt16`, `getFloat64`, `setBigInt64`, etc.
    *   `TypedArray`: Array-like views over an `ArrayBuffer` with fixed element types (`Uint8Array`, `Int16Array`, `Float32Array`, `BigInt64Array`, etc.). Supports array methods like `.map`, `.filter`, `.reduce`. Cannot `push`/`pop`.
        *   `new TypedArray(buffer, byteOffset?, length?)`
        *   `new TypedArray(length)`
        *   `new TypedArray(array | typedArray)`
    *   `Uint8Array`: Most common TypedArray (byte array). Bun adds `.toBase64()`, `.fromBase64()`, `.toHex()`, `.fromHex()`. Used with `TextEncoder`/`TextDecoder`.
    *   `Buffer` (Node.js API): Subclass of `Uint8Array` with extra methods. `Buffer.from()`, `buf.toString('utf8' | 'hex' | 'base64')`, `buf.writeUInt8()`, etc.
    *   `Blob`: Immutable blob of binary data, often represents files. Has `.size`, `.type`, `.text()`, `.arrayBuffer()`, `.stream()`, `.bytes()`.
    *   `File`: Subclass of `Blob` with `.name` and `.lastModified`.
    *   `BunFile`: Bun-specific subclass of `Blob` for lazily-loaded local files (see File I/O).
*   **Streams:**
    *   Web Streams: `ReadableStream`, `WritableStream`, `TransformStream`.
    *   Node.js Streams: `node:stream` module (`Readable`, `Writable`, `Duplex`).
    *   Direct `ReadableStream` (Bun): `new ReadableStream({ type: "direct", pull(controller){ controller.write(...) } })`. Avoids queueing/copying.
    *   Async Generators: Can be used as stream sources: `new Response(async function* () { yield ... })`.
    *   `Bun.ArrayBufferSink`: Fast incremental writer for building `ArrayBuffer` or `Uint8Array`. Methods: `start({ asUint8Array?, stream?, highWaterMark? })`, `write()`, `flush()`, `end()`.
*   **Conversions:**
    *   Use constructors: `new Uint8Array(buf)`, `new DataView(arr.buffer, arr.byteOffset, arr.byteLength)`, `Buffer.from(arr)`.
    *   Access underlying buffer: `arr.buffer`, `view.buffer`, `buf.buffer`.
    *   String <-> Binary: `new TextEncoder().encode(str)`, `new TextDecoder().decode(buf)`, `Buffer.from(str)`, `buf.toString()`.
    *   Blob methods: `await blob.arrayBuffer()`, `await blob.text()`, `await blob.bytes()`, `blob.stream()`.
    *   `Bun.readableStreamTo*()`: Convenience functions (`ToArrayBuffer`, `ToBytes`, `ToBlob`, `ToJSON`, `ToText`, `ToArray`, `ToFormData`).
    *   `Response` helpers: `new Response(stream).arrayBuffer()`, `.text()`, etc.

### Spawning Processes (`Bun.spawn`, `Bun.spawnSync`)

*   **Async (`Bun.spawn`)**
    *   `Bun.spawn(cmd: string[] | { cmd: string[], ...options }): Subprocess`
    *   Options: `cwd`, `env`, `stdio` (array), `stdin`, `stdout`, `stderr`, `onExit`, `ipc`, `serialization`, `signal`, `timeout`, `killSignal`.
    *   `stdin`/`stdout`/`stderr`: Can be `"pipe"`, `"inherit"`, `"ignore"`, `null`, `BunFile`, `TypedArray`, `number` (fd). `stdin` also accepts `ReadableStream`, `Blob`, `Response`, `Request`.
        *   `"pipe"` for `stdin` returns `FileSink`.
        *   `"pipe"` for `stdout`/`stderr` returns `ReadableStream`.
    *   `Subprocess` Object: `.pid`, `.stdin` (FileSink if piped), `.stdout`/`.stderr` (ReadableStream if piped), `.exited` (Promise<number>), `.exitCode`, `.signalCode`, `.killed`, `.kill(signal?)`, `.ref()`, `.unref()`, `.send(msg)` (IPC), `.disconnect()`, `.resourceUsage()`.
    *   IPC: Use `ipc(msg, child)` handler in options and `child.send(msg)`. Child uses `process.send()`/`process.on('message')`. `serialization: "json"` needed for Bun <-> Node.js IPC.
*   **Sync (`Bun.spawnSync`)**
    *   `Bun.spawnSync(cmd: string[] | { cmd: string[], ...options }): SyncSubprocess`
    *   Blocking version.
    *   `SyncSubprocess` Object: `.pid`, `.stdout`/`.stderr` (Buffer | undefined), `.exitCode`, `.signalCode`, `.success` (boolean), `.resourceUsage()`. No `.stdin` property for writing.
*   Performance: Uses `posix_spawn`. Faster than Node.js `child_process`.

### Databases

*   **SQLite (`bun:sqlite`)**
    *   `import { Database } from 'bun:sqlite'`
    *   `new Database(filename?, options?)`: `:memory:` or path. Options: `readonly`, `create`, `strict`, `safeIntegers`.
    *   Load via import: `import db from "./db.sqlite" with { type: "sqlite" }`
    *   `db.query(sql): Statement`: Prepare & cache statement.
    *   `db.prepare(sql): Statement`: Prepare without caching.
    *   `db.run(sql, params?)`: Execute, returns `{ lastInsertRowid, changes }`.
    *   `db.exec()`: Alias for `run`.
    *   `db.transaction(callback)`: Create transaction function. Versions: `.deferred`, `.immediate`, `.exclusive`. Supports nesting (savepoints).
    *   `db.close(throwOnError?)`.
    *   `db.serialize(): Uint8Array`.
    *   `Database.deserialize(Uint8Array): Database`.
    *   `db.loadExtension(name)`.
    *   `db.fileControl(cmd, value)`.
    *   `Statement` Methods: `.all(params?)`, `.get(params?)`, `.run(params?)`, `.values(params?)`, `.iterate()`, `.as(Class)`, `.finalize()`, `.toString()`.
    *   Parameters: Named (`$name`, `:name`, `@name`) or positional (`?`). Bind via object or array. `strict: true` allows binding named params without prefix.
    *   Integers: `safeIntegers: true` returns `bigint` for large integers, throws on >64bit input. Default returns `number` (potential truncation >53 bits).
    *   WAL Mode: `db.exec("PRAGMA journal_mode = WAL;")` recommended.
    *   Performance: Significantly faster than `better-sqlite3` and Deno's driver.
*   **PostgreSQL (`Bun.sql`)**
    *   `import { sql, SQL } from "bun"` (or just `sql` if using env vars).
    *   Tagged Template: `sql`SELECT * FROM users WHERE id = ${userId}` (prevents SQL injection).
    *   Configuration: Reads `POSTGRES_URL`, `DATABASE_URL`, `PG*` env vars or use `new SQL(options)`.
    *   Connection Options: `url`, `hostname`, `port`, `database`, `username`, `password`, `max` (pool size), `idleTimeout`, `maxLifetime`, `connectionTimeout`, `tls` (boolean or object), `onconnect`, `onclose`, `prepare` (boolean, default true), `bigint` (boolean, default false). Dynamic `password` function supported.
    *   Query Execution: Lazy (executes on `await` or `.execute()`).
        *   `await sql`...`: Returns array of objects (default).
        *   `await sql`...`.values()`: Returns array of arrays.
        *   `await sql`...`.raw()`: Returns array of `Buffer` arrays.
        *   `await sql`...`.simple()`: Execute simple query (multiple statements, no params).
        *   `await sql.file(path, params?)`: Execute query from file.
        *   `await sql.unsafe(query, params?)`: Execute raw SQL (use with caution).
        *   `.execute()`: Returns query object for cancellation (`query.cancel()`).
    *   SQL Fragments: `sql(value)` for dynamic values, `sql(tableName)` for identifiers, `sql(obj)` for INSERT/UPDATE, `sql(array, key?)` for `WHERE IN`.
    *   Transactions: `await sql.begin(async tx => { await tx`...` })`. Supports pipelining (return array of queries). `tx.savepoint(async sp => { ... })`. Distributed: `sql.beginDistributed`, `sql.commitDistributed`, `sql.rollbackDistributed`.
    *   Auth: Supports SCRAM-SHA-256, MD5, Clear Text.
    *   SSL Modes: `disable`, `prefer`, `require`, `verify-ca`, `verify-full`.
    *   Connection Pooling: Automatic. `sql.reserve()` for dedicated connection (use `using` or `.release()`).
    *   Prepared Statements: Automatic for static queries unless `prepare: false`.
    *   Error Handling: Typed errors (e.g., `ERR_POSTGRES_CONNECTION_CLOSED`).
    *   BigInt: Returns large integers as strings by default. Use `bigint: true` option for `bigint` type.

### Networking (TCP/UDP)

*   **TCP (`Bun.listen`, `Bun.connect`)**
    *   Low-level TCP API.
    *   `Bun.listen(options)`: Starts TCP server.
        *   Options: `hostname`, `port`, `socket` (handlers), `tls`.
        *   Socket Handlers: `data(socket, data)`, `open(socket)`, `close(socket, err?)`, `drain(socket)`, `error(socket, err)`. Handlers shared across connections.
        *   Attach data: `socket.data = { ... }` in `open`.
        *   Returns `TCPSocket` (server): `.stop(force?)`, `.reload(handlers)`, `.unref()`.
    *   `Bun.connect(options)`: Connects to TCP server.
        *   Options: `hostname`, `port`, `socket` (handlers), `tls` (boolean or object).
        *   Client Handlers: Server handlers + `connectError(socket, err)`, `end(socket)`, `timeout(socket)`.
        *   Returns `Promise<TCPSocket>` (client).
    *   `socket.write(data)`: Sends data. Buffering recommended for multiple small writes (`ArrayBufferSink`).
    *   `socket.reload(handlers)`: Hot-reloads handlers.
*   **UDP (`Bun.udpSocket`)**
    *   `Bun.udpSocket(options)`: Creates and binds a UDP socket.
        *   Options: `port` (optional), `socket` (handlers), `connect` ({hostname, port}).
        *   Socket Handlers: `data(socket, buf, port, addr)`, `drain(socket)`, `error(socket, err)`, `close(socket)`.
    *   `socket.send(data, port, addr)`: Sends datagram (unconnected). `addr` must be IP. Returns `boolean` (backpressure).
    *   `socket.send(data)`: Sends datagram (connected). Returns `boolean`.
    *   `socket.sendMany(packets)`: Sends multiple packets efficiently. `packets` format depends on connected state. Returns number sent.
    *   `socket.port`, `socket.address`.
    *   `socket.connect(hostname, port)`, `socket.disconnect()`.
    *   `socket.ref()`, `socket.unref()`.
    *   `socket.close()`.

### Foreign Function Interface (FFI - `bun:ffi`)

*   **⚠️ Experimental**
*   Allows calling native libraries (C ABI: Zig, Rust, C/C++, etc.).
*   **`dlopen` Usage:**
    *   `dlopen(path, { symbol: { args: FFIType[], returns: FFIType } })`
    *   Opens a shared library (`.dylib`, `.so`, `.dll`) and defines function signatures.
    *   `suffix`: Platform-specific library suffix.
    *   Returns `{ symbols: { ... }, close() }`.
*   **`cc` Usage:** (Compiling C from JS)
    *   `cc({ source, symbols, library?, flags?, define? })`
    *   Compiles C source (`source`: path/URL/BunFile) using TinyCC and links it.
    *   `symbols`: Same structure as `dlopen`.
    *   `library`: Array of libraries to link against (e.g., `["sqlite3"]`).
    *   `flags`: Array of compiler flags (e.g., `-I`, `-D`).
    *   `define`: Object of preprocessor definitions.
    *   Returns `{ symbols: { ... } }`.
*   **FFI Types (`FFIType` enum/strings):**
    *   `cstring`, `function` (`fn`, `callback`), `ptr` (`pointer`, `void*`, `char*`), `i8`-`i64`, `u8`-`u64`, `f32`, `f64`, `bool`, `char`, `napi_env`, `napi_value`, `buffer`.
*   **Strings (`CString`):**
    *   `new CString(ptr, byteOffset?, byteLength?)`: Converts C string pointer (null-terminated or known length) to JS string (UTF-8 -> UTF-16). Clones the string.
    *   `.ptr`: Original pointer value.
*   **Function Pointers (`CFunction`, `linkSymbols`):**
    *   `new CFunction({ args, returns, ptr })`: Creates callable JS function from a native function pointer.
    *   `linkSymbols({ name: { args, returns, ptr } })`: Define multiple functions from pointers at once.
*   **Callbacks (`JSCallback`):**
    *   `new JSCallback(func, { args, returns, threadsafe? })`: Creates a C function pointer that calls a JS function.
    *   `.ptr`: The native function pointer. Pass this to C functions.
    *   `.close()`: Release resources.
    *   `threadsafe: true`: Experimental support for multi-threaded callbacks.
*   **Pointers:**
    *   Represented as JS `number` (fits 52-bit address space).
    *   `ptr(typedArray)`: Get pointer (`number`) from `TypedArray`.
    *   `toArrayBuffer(ptr, byteOffset?, byteLength?, deallocatorContext?, jsTypedArrayBytesDeallocator?)`: Convert pointer to `ArrayBuffer`. Optional C deallocator callback.
    *   `read`: Namespace for reading primitive types directly from pointers (`read.u8(ptr, offset)`, `read.f64(ptr, offset)`). Faster than `DataView` for single reads.
*   **Memory Management:** Manual. Use `FinalizationRegistry` in JS or the `jsTypedArrayBytesDeallocator` callback from C.

### Hashing & Passwords

*   **Passwords (`Bun.password`)**
    *   `hash(password, options?): Promise<string>` / `hashSync(...)`
    *   `verify(password, hash): Promise<boolean>` / `verifySync(...)`
    *   Algorithms: `"argon2id"` (default), `"argon2i"`, `"argon2d"`, `"bcrypt"`.
    *   Options (Argon2): `memoryCost` (KiB), `timeCost` (iterations).
    *   Options (bcrypt): `cost` (log2 rounds, 4-31).
    *   Formats: PHC (Argon2), MCF (bcrypt). Auto-detects on verify.
    *   Salt automatically generated and included in hash.
    *   Bcrypt passwords > 72 bytes are pre-hashed with SHA-512.
*   **Non-Cryptographic Hashing (`Bun.hash`)**
    *   `hash(input: string | TypedArray | Buffer, seed?: number | bigint): bigint`
    *   Fast, non-secure hashing (Wyhash default, 64-bit).
    *   Other algorithms: `Bun.hash.crc32`, `adler32`, `cityHash32`, `cityHash64`, `xxHash32`, `xxHash64`, `xxHash3`, `murmur32v3`, `murmur64v2`.
*   **Cryptographic Hashing (`Bun.CryptoHasher`)**
    *   `new Bun.CryptoHasher(algorithm: string, key?: string | Buffer | TypedArray)`: Creates hasher. Optional `key` enables HMAC.
    *   Supported Algorithms: `sha1`, `sha256`, `sha512`, `md5`, `blake2b*`, etc. (HMAC supports a subset).
    *   `.update(data: string | Buffer | TypedArray, encoding?: string)`: Feed data incrementally.
    *   `.digest(encoding?: "hex" | "base64" | "latin1" | TypedArray)`: Finalize hash. Returns `Uint8Array` by default, or string/fills TypedArray based on encoding.
    *   HMAC instance cannot be reused after `.digest()`.

### Utilities

*   **Info:** `Bun.version` (string), `Bun.revision` (git commit string).
*   **Env:** `Bun.env` (alias for `process.env`).
*   **Entrypoint:** `Bun.main` (absolute path to main script).
*   **Sleep:** `Bun.sleep(ms | Date): Promise<void>`, `Bun.sleepSync(ms): void`.
*   **Path Resolution:** `Bun.which(cmd, options?): string | null` (find executable), `Bun.resolveSync(specifier, parentPath): string` (module resolution).
*   **UUID:** `Bun.randomUUIDv7(encoding?, timestamp?): string | Buffer` (monotonic UUID v7).
*   **Promises:** `Bun.peek(promise)` (get fulfilled value/error sync, else returns promise), `Bun.peek.status(promise)` (`"pending" | "fulfilled" | "rejected"`).
*   **Editor:** `Bun.openInEditor(path, options?)` (opens file in `$EDITOR`/`$VISUAL`). Options: `editor`, `line`, `column`.
*   **Equality:** `Bun.deepEquals(a, b, strict?: boolean)` (recursive comparison).
*   **HTML:** `Bun.escapeHTML(value): string`.
*   **Terminal Width:** `Bun.stringWidth(str, options?)` (calculates display width, ANSI/emoji aware). Options: `countAnsiEscapeCodes`, `ambiguousIsNarrow`.
*   **URL/Path:** `Bun.fileURLToPath(url)`, `Bun.pathToFileURL(path)`.
*   **Compression:** `Bun.gzipSync(buf, opts?)`, `Bun.gunzipSync(buf)`, `Bun.deflateSync(buf, opts?)`, `Bun.inflateSync(buf)`. Return `Uint8Array`.
*   **Inspection:** `Bun.inspect(obj)` (like `console.log` serialization), `Bun.inspect.custom` (symbol), `Bun.inspect.table(data, props?, opts?)`.
*   **Timing:** `Bun.nanoseconds(): number`.
*   **Stream Conversion:** `Bun.readableStreamTo*(stream)` functions (see Binary Data/Streams).
*   **JSC Utils (`bun:jsc`)**: `serialize(value)`, `deserialize(buffer)`, `estimateShallowMemoryUsageOf(obj)`.

### Color (`Bun.color`)

*   `Bun.color(input: any, outputFormat?: string): any | null`
*   Parses and converts colors. Returns `null` on invalid input.
*   **Input:** CSS names (`"red"`), numbers (`0xff0000`), hex (`"#f00"`), rgb/rgba/hsl/hsla strings, rgb/rgba objects/arrays (`{r,g,b,a?}`, `[r,g,b,a?]`), CSS `lab()`, etc.
*   **Output Formats:**
    *   `"css"`: Compact CSS string (`"red"`, `"#f00"`).
    *   `"ansi"`: Auto-detected ANSI escape code for terminal (16m, 256, or 16 color). Empty string if no color support.
    *   `"ansi-16m"`: 24-bit ANSI (`\x1b[38;2;R;G;Bm`).
    *   `"ansi-256"`: 256-color ANSI (`\x1b[38;5;Nm`).
    *   `"ansi-16"`: 16-color ANSI (`\x1b[38;5;Nm`).
    *   `"number"`: 24-bit integer (`0xff0000`).
    *   `"rgb"` / `"rgba"`: CSS string (`"rgb(255, 0, 0)"`).
    *   `"hsl"` / `"hsla"`: CSS string (`"hsl(0, 100%, 50%)"`).
    *   `"hex"` / `"HEX"`: Hex string (`"#ff0000"` / `"#FF0000"`).
    *   `"{rgb}"`: `{ r: number, g: number, b: number }` (0-255).
    *   `"{rgba}"`: `{ r, g, b, a: number }` (a is 0-1).
    *   `"[rgb]"`: `[r, g, b]` (0-255).
    *   `"[rgba]"`: `[r, g, b, a]` (a is 0-255).
*   **Macro:** Use `import { color } from "bun" with { type: "macro" }` for build-time evaluation.

### Semver (`Bun.semver`)

*   `Bun.semver.satisfies(version: string, range: string): boolean`: Checks if version satisfies range (npm compatible).
*   `Bun.semver.order(versionA: string, versionB: string): -1 | 0 | 1`: Compares two versions for sorting.
*   Faster than `node-semver`.

### Transpiler (`Bun.Transpiler`)

*   `new Bun.Transpiler(options?)`: Creates transpiler instance.
    *   Options: `loader` (`"js"`, `"jsx"`, `"ts"`, `"tsx"`), `define`, `target`, `tsconfig`, `macro`, `exports`, `trimUnusedImports`, `minifyWhitespace`, `inline`.
*   `.transformSync(code, loader?): string`: Transpile synchronously.
*   `.transform(code, loader?): Promise<string>`: Transpile asynchronously.
*   `.scan(code): { exports: string[], imports: Import[] }`: Get imports/exports and metadata.
*   `.scanImports(code): Import[]`: Faster, less accurate import scanning.
*   `Import` Kind: `"import-statement"`, `"require-call"`, `"dynamic-import"`, etc.

### HTMLRewriter

*   `new HTMLRewriter()`: Creates instance based on Cloudflare's lol-html.
*   `.on(selector, handlers)`: Register handlers for CSS selectors.
    *   Handlers: `element(el)`, `text(text)`, `comments(comment)`. Can be async.
*   `.onDocument(handlers)`: Register handlers for document events (`doctype`, `text`, `comments`, `end`).
*   `.transform(input: Response | string | Buffer | Blob | BunFile): Response | string`: Transforms HTML. Preserves Response properties/streaming.
*   **Element Operations:** `.setAttribute`, `.getAttribute`, `.removeAttribute`, `.setInnerContent`, `.before`, `.after`, `.prepend`, `.append`, `.remove`, `.removeAndKeepContent`, `.tagName`, etc.
*   **Text/Comment Operations:** `.text`, `.before`, `.after`, `.replace`, `.remove`.
*   Supports wide range of CSS selectors.

### File System Router (`Bun.FileSystemRouter`)

*   `new Bun.FileSystemRouter(options)`: Creates router instance.
    *   Options: `dir` (pages directory), `style: "nextjs"`, `origin?`, `assetPrefix?`, `fileExtensions?`.
*   `.match(path | Request): MatchResult | null`: Finds matching file route.
    *   `MatchResult`: `filePath`, `kind`, `name`, `pathname`, `src`, `params?`, `query?`.
*   `.reload()`: Re-scans the directory.

### Glob (`Bun.Glob`)

*   `new Glob(pattern)`: Creates glob instance.
*   `.match(path): boolean`: Checks if path matches pattern.
*   `.scan(root | options): AsyncIterable<string>`: Scans file system asynchronously.
*   `.scanSync(root | options): Iterable<string>`: Scans file system synchronously.
*   `ScanOptions`: `cwd`, `dot`, `absolute`, `followSymlinks`, `throwErrorOnBrokenSymlink`, `onlyFiles`.
*   Supported Patterns: `?`, `*`, `**`, `[abc]`, `[a-z]`, `[^abc]`, `{a,b}`, `!`, `\`.

### Cookies (`Bun.Cookie`, `Bun.CookieMap`)

*   **`Bun.CookieMap`:** Map-like interface for cookies.
    *   `new Bun.CookieMap(init?)`: From string, object, or array.
    *   Used in `req.cookies` in `Bun.serve`.
    *   Methods: `.get(name)`, `.has(name)`, `.set(name, value, opts?) | .set(opts) | .set(cookie)`, `.delete(name | opts)`, `.toJSON()`, `.toSetCookieHeaders()`.
    *   Iteration: `entries()`, `keys()`, `values()`, `forEach()`, `Symbol.iterator`.
    *   Property: `.size`.
*   **`Bun.Cookie`:** Represents a single cookie.
    *   `new Bun.Cookie(name, value, opts?) | new Bun.Cookie(str) | new Bun.Cookie(opts)`
    *   Properties: `name`, `value`, `domain`, `path`, `expires` (Date), `secure`, `sameSite` (`"strict" | "lax" | "none"`), `partitioned`, `maxAge`, `httpOnly`.
    *   Methods: `.isExpired()`, `.serialize()`, `.toString()`, `.toJSON()`.
    *   Static: `Cookie.parse(str)`, `Cookie.from(name, value, opts?)`.
*   **Types:** `CookieInit`, `CookieStoreDeleteOptions`, `CookieSameSite`.

### DNS (`bun:dns`, `node:dns`)

*   Implements `node:dns`.
*   Bun-specific Extensions (`import { dns } from "bun"`):
    *   `dns.prefetch(hostname, port?)`: Hints to pre-resolve DNS.
    *   `dns.getCacheStats()`: Returns cache statistics (`{ cacheHitsCompleted, cacheHitsInflight, cacheMisses, size, errors, totalCount }`).
*   Caching: Automatic in-memory cache (up to 255 entries, 30s TTL default). Deduplicates simultaneous lookups. Configurable TTL via `$BUN_CONFIG_DNS_TIME_TO_LIVE_SECONDS`.

### Workers (`Worker`)

*   **🚧 Experimental**
*   `new Worker(path | URL, options?)`: Starts worker thread. Supports TS, JSX, CJS, ESM.
    *   Options: `ref` (boolean, default true), `smol` (boolean, reduce memory), `preload` (string | string[], modules to load first).
    *   Can use `blob:` URLs.
*   Communication: `worker.postMessage(data)`, `self.postMessage(data)`, `worker.onmessage`, `self.onmessage`. Uses Structured Clone Algorithm.
*   Events:
    *   `message`: Received data.
    *   `error`: Error occurred.
    *   `open` (Bun-specific): Worker is ready.
    *   `close` (Bun-specific): Worker terminated. `CloseEvent` has exit code.
*   Termination: `worker.terminate()`, `process.exit()` from within worker.
*   Lifecycle: `worker.ref()` (keep parent alive, default), `worker.unref()` (allow parent to exit).
*   `Bun.isMainThread`: Boolean check.

### Testing (`bun test`)

*   Refer to `bun test` CLI documentation for testing features. `Bun.deepEquals` is used internally by `.toEqual`.