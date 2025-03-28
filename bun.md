**Introduction for the LLM Agent:**

Hello! This cheatsheet provides structured information about various Bun APIs based on the documentation you've been given. Use this guide to understand *what* each API does and *how* to use it correctly. Pay close attention to function/method signatures, parameters, return types, and code examples. Notes highlight Bun-specific features or important considerations.

---

**Bun API Cheatsheet**

**1. Binary Data Handling (`./binary-data.md`)**

*   **Core Concept:** JavaScript uses `ArrayBuffer` to represent raw binary data. You interact with it using "views" like `TypedArray` or `DataView`.
*   **`ArrayBuffer`**
    *   **Purpose:** Represents a raw, fixed-length sequence of bytes in memory.
    *   **Usage:** `new ArrayBuffer(byteLength)`
    *   **Key Properties:** `.byteLength`
    *   **Key Methods:** `.slice(begin, end)` (returns a *new* `ArrayBuffer`)
    *   **Note:** You cannot directly read/write bytes from an `ArrayBuffer`. Use views.
    *   **Example:** `const buf = new ArrayBuffer(16); // 16 bytes`
*   **`TypedArray` (Family of classes: `Uint8Array`, `Int16Array`, `Float32Array`, etc.)**
    *   **Purpose:** Provides an array-like interface to read/write uniformly typed data within an `ArrayBuffer`. Each class interprets bytes differently (e.g., `Uint8Array` sees each byte as a number 0-255, `Uint16Array` sees every 2 bytes as a number 0-65535).
    *   **Usage:**
        *   `new Uint8Array(length)`: Creates a new buffer and view.
        *   `new Uint8Array(arrayBuffer, [byteOffset], [length])`: Creates a view on existing buffer/slice.
        *   `new Uint8Array([1, 2, 3])`: Creates from an array literal.
    *   **Key Properties:** `.buffer`, `.byteLength`, `.byteOffset`, `.length`
    *   **Key Methods:** Supports most array methods (`.map`, `.filter`, `.slice`, etc.) but *not* methods that change length (`.push`, `.pop`).
    *   **Note:** `Uint8Array` is the most common, representing a byte array. Bun adds `.toBase64()`, `.fromBase64()`, `.toHex()`, `.fromHex()` to `Uint8Array`.
    *   **Example:**
        ```javascript
        const buf = new ArrayBuffer(4);
        const view = new Uint8Array(buf);
        view[0] = 255;
        console.log(view); // Uint8Array(4) [ 255, 0, 0, 0 ]
        ```
*   **`DataView`**
    *   **Purpose:** Provides low-level `get`/`set` methods to read/write different numeric types at *any* byte offset within an `ArrayBuffer`, handling endianness.
    *   **Usage:** `new DataView(arrayBuffer, [byteOffset], [byteLength])`
    *   **Key Methods:** `.getUint8(offset)`, `.setInt16(offset, value, [littleEndian])`, `.getFloat64(offset, [littleEndian])`, etc.
    *   **Note:** Useful for working with binary file formats or network protocols.
    *   **Example:**
        ```javascript
        const buf = new ArrayBuffer(4);
        const dv = new DataView(buf);
        dv.setUint8(0, 1); // Set first byte to 1
        dv.setUint16(1, 256); // Set bytes 1 and 2 to represent 256
        console.log(dv.getUint8(0)); // 1
        console.log(dv.getUint16(1)); // 256
        ```
*   **`Buffer` (Node.js API, Bun implements)**
    *   **Purpose:** A subclass of `Uint8Array` with many legacy Node.js convenience methods for binary data manipulation (encoding, decoding, etc.).
    *   **Usage:** `Buffer.from(string, [encoding])`, `Buffer.alloc(size)`
    *   **Note:** Bun-specific `Uint8Array` methods (`.toHex`/`.toBase64`) are often faster. Primarily for Node.js compatibility. Not available in browsers.
    *   **Example:**
        ```javascript
        const buf = Buffer.from('hello', 'utf8');
        console.log(buf); // <Buffer 68 65 6c 6c 6f>
        console.log(buf.toString('hex')); // '68656c6c6f'
        ```
*   **`Blob` (Web API)**
    *   **Purpose:** Represents an immutable blob of binary data, often file-like. Has MIME `type` and `size`.
    *   **Usage:** `new Blob(blobParts, [options])` (where `blobParts` is an array of strings, ArrayBuffers, TypedArrays, DataViews, or other Blobs)
    *   **Key Properties:** `.size`, `.type`
    *   **Key Methods:** `.text()`, `.arrayBuffer()`, `.stream()`, `.bytes()` (all return `Promise`).
    *   **Example:** `const blob = new Blob(['{"hello": "world"}'], { type: 'application/json' });`
*   **`File` (Web API)**
    *   **Purpose:** Subclass of `Blob` representing a file, adding `name` and `lastModified` properties.
    *   **Usage:** `new File(fileParts, fileName, [options])`
    *   **Note:** Often obtained from file inputs in browsers or constructed manually. Experimental in Node.js v20.
    *   **Example:** `const file = new File(['content'], 'hello.txt', { type: 'text/plain' });`
*   **`BunFile` (Bun-specific API)**
    *   **Purpose:** Subclass of `Blob` representing a *lazily-loaded* file on disk. Created via `Bun.file(path)`. More efficient than reading the whole file into memory immediately.
    *   **Usage:** `Bun.file(path, [options])`
    *   **Note:** Inherits `Blob` methods (`.text()`, `.arrayBuffer()`, etc.). Accessing these methods reads the file.
    *   **Example:** `const bunFile = Bun.file('./package.json'); console.log(await bunFile.json());`
*   **Streams (`ReadableStream`, `WritableStream` - Web APIs)**
    *   **Purpose:** Abstraction for processing data in chunks without loading everything into memory.
    *   **Usage:** See `./streams.md` section below.
    *   **Note:** Bun also implements Node.js `node:stream`.
*   **Conversions:** (Refer to the detailed table in `./binary-data.md#conversion` for specific code snippets)
    *   Know how to convert *between* these types (e.g., `ArrayBuffer` -> `Uint8Array`, `Blob` -> `ArrayBuffer`, `ReadableStream` -> `string`). The doc provides direct functions/methods for most common conversions. Bun provides helpers like `Bun.readableStreamToArrayBuffer(stream)`.

**2. C Foreign Function Interface (FFI) (`./cc.md`, `./ffi.md`)**

*   **Purpose:** Allows JavaScript to call functions written in native languages (C, C++, Rust, Zig, etc.) that expose a C ABI.
*   **Module:** `bun:ffi` (Experimental ⚠️)
*   **Key Concepts:**
    *   **`dlopen(libraryPath, symbols)`:** Loads a dynamic library (`.dylib`, `.so`, `.dll`) and defines functions to call.
    *   **`cc(options)`:** (Experimental) Compiles C source code on-the-fly using TinyCC and links it.
    *   **`FFIType`:** Enum specifying C types for function arguments and return values (e.g., `FFIType.i32`, `FFIType.cstring`, `FFIType.ptr`).
    *   **`CString`:** Helper class to handle C-style null-terminated strings.
    *   **`CFunction`:** Represents a callable native function pointer.
    *   **`JSCallback`:** Wraps a JavaScript function so it can be passed *to* native code as a callback.
    *   **Pointers (`ptr`, `read`, `toArrayBuffer`):** Functions to work with memory pointers, represented as JS `number`s.
    *   **Memory Management:** **CRITICAL:** Bun FFI does *not* manage memory for native code. You *must* manually free memory allocated by native functions. Node-API is generally safer.
*   **`dlopen` Usage:**
    ```javascript
    import { dlopen, FFIType, suffix } from "bun:ffi";
    const { i32 } = FFIType;

    const lib = dlopen(`libadd.${suffix}`, { // e.g., libadd.dylib
      add: {
        args: [i32, i32], // C function takes two int32_t
        returns: i32,     // C function returns an int32_t
      },
    });

    const result = lib.symbols.add(5, 3); // Call the native 'add' function
    console.log(result); // 8
    ```
*   **`cc` Usage:**
    ```javascript
    // hello.js
    import { cc } from "bun:ffi";
    import source from "./hello.c" with { type: "file" }; // Import C code as text

    const { symbols: { hello } } = cc({
      source, // Path or BunFile or content string
      symbols: {
        hello: { args: [], returns: "int" }, // Define 'hello' function signature
      },
      // library: ["sqlite3"], // Link against libraries
      // flags: ["-I/usr/local/include"], // Compiler flags
      // define: { "NDEBUG": "1" }, // Preprocessor defines
    });

    console.log(hello()); // Call the compiled C function
    ```
    ```c
    // hello.c
    int hello() {
      return 42;
    }
    ```
*   **Working with Strings:**
    ```javascript
    import { dlopen, FFIType, CString } from "bun:ffi";
    // Assume native function get_message() returns char*
    const lib = dlopen('libexample.so', {
        get_message: { args: [], returns: FFIType.cstring }
    });
    const messagePtr = lib.symbols.get_message_ptr(); // If it returned a raw pointer instead
    const message = new CString(messagePtr); // Convert C string pointer to JS string
    console.log(message);
    // Remember to free the pointer if required by the native library!
    // lib.symbols.free_message(messagePtr);
    ```
*   **Callbacks:**
    ```javascript
    import { JSCallback } from "bun:ffi";
    const myCallback = (num) => console.log("Called from C with:", num);
    const callback = new JSCallback(myCallback, {
      args: ["int"],
      returns: "void",
      // threadsafe: true // If called from another thread
    });
    // Pass callback.ptr to a native function expecting a function pointer
    // native_function_expecting_callback(callback.ptr);
    // Remember to call callback.close() when done!
    ```
*   **N-API:** Use `napi_value` and `napi_env` types in FFI definitions to pass/receive raw JavaScript values, interacting via the Node-API C functions within your native code (requires including `node/node_api.h`).

**3. Color Manipulation (`./color.md`)**

*   **API:** `Bun.color(input, outputFormat?)`
*   **Purpose:** Parses various color formats (CSS names, hex, rgb, hsl, numbers, objects, arrays) and converts them to a specified output format.
*   **Input Types:** Strings (`"red"`, `"#f00"`, `"rgb(255,0,0)"`), numbers (`0xff0000`), objects (`{r,g,b,a}`), arrays (`[r,g,b,a]`).
*   **Output Formats:** (String identifier)
    *   `"css"`: Compact CSS string (e.g., `"red"`, `"#f00"`).
    *   `"ansi"`: Best ANSI escape code for terminal (detects terminal support).
    *   `"ansi-16"`, `"ansi-256"`, `"ansi-16m"`: Specific ANSI color depths.
    *   `"number"`: 24-bit integer representation (e.g., `0xff0000`).
    *   `"rgb"`, `"rgba"`, `"hsl"`: CSS function strings.
    *   `"hex"`, `"HEX"`: Hex string (`#rrggbb`).
    *   `"{rgb}"`, `"{rgba}"`: JS object `{ r, g, b, [a] }`. `a` is 0-1.
    *   `"[rgb]"`, `"[rgba]"`: JS array `[r, g, b, [a]]`. `a` is 0-255.
*   **Return Value:** The formatted color string/object/array/number, or `null` if input is invalid.
*   **Example:**
    ```javascript
    Bun.color("blue", "ansi"); // Returns ANSI escape code for blue text
    Bun.color("#ff9900", "{rgb}"); // Returns { r: 255, g: 153, b: 0 }
    Bun.color({ r: 0, g: 255, b: 0, a: 0.5 }, "rgba"); // Returns "rgba(0, 255, 0, 0.5)"
    Bun.color("invalid-color"); // Returns null
    ```

**4. Console as AsyncIterable (`./console.md`)**

*   **API:** `console` object (Bun-specific extension)
*   **Purpose:** Allows reading standard input line by line using `for await...of`.
*   **Note:** This is *in addition* to standard `console.log`, `console.error`, etc.
*   **Usage:**
    ```javascript
    console.log("Enter lines:");
    for await (const line of console) {
      console.log(`Received: ${line}`);
    }
    ```

**5. HTTP Cookies (`./cookie.md`)**

*   **Purpose:** Provides native, fast APIs for parsing and manipulating HTTP cookies.
*   **Classes:**
    *   `Bun.CookieMap`: A Map-like interface for a collection of cookies (e.g., from a `Cookie` request header or `Set-Cookie` response headers).
    *   `Bun.Cookie`: Represents a single cookie with name, value, and attributes (domain, path, expires, httpOnly, etc.).
*   **`Bun.CookieMap`**
    *   **Creation:**
        *   `new Bun.CookieMap()` (empty)
        *   `new Bun.CookieMap(cookieHeaderString)` (parses `Cookie` header)
        *   `new Bun.CookieMap({ name: value, ... })` (from object)
        *   `new Bun.CookieMap([['name', 'value'], ...])` (from array)
    *   **Key Methods:**
        *   `.get(name)`: Get cookie value (string or null).
        *   `.has(name)`: Check if cookie exists.
        *   `.set(name, value, [options])` or `.set({ name, value, ... })`: Add/update a cookie. Options match `CookieInit`.
        *   `.delete(name, [options])` or `.delete({ name, domain, path })`: Mark cookie for deletion.
        *   `.toSetCookieHeaders()`: Get array of `Set-Cookie` header strings (useful outside `Bun.serve`).
        *   `.toJSON()`: Get simple `{ name: value }` object.
        *   Iteration methods: `entries()`, `keys()`, `values()`, `forEach()`, `[Symbol.iterator]`.
    *   **Key Properties:** `.size`
    *   **Integration with `Bun.serve`:** `request.cookies` is a `CookieMap`. Modifications via `.set()` or `.delete()` on `request.cookies` are *automatically* applied to the response as `Set-Cookie` headers.
*   **`Bun.Cookie`**
    *   **Creation:**
        *   `new Bun.Cookie(name, value, [options])`
        *   `new Bun.Cookie(setCookieHeaderString)` (parses `Set-Cookie` header)
        *   `new Bun.Cookie({ name, value, ...options })`
    *   **Properties:** `.name`, `.value`, `.domain`, `.path`, `.expires` (Date), `.secure`, `.httpOnly`, `.sameSite`, `.maxAge`, `.partitioned`.
    *   **Methods:**
        *   `.isExpired()`: Check if expired.
        *   `.serialize()` / `.toString()`: Get `Set-Cookie` header string.
        *   `.toJSON()`: Get serializable `CookieInit` object.
    *   **Static Methods:** `Cookie.parse(string)`, `Cookie.from(name, value, [options])`
*   **Example (`Bun.serve`)**
    ```javascript
    Bun.serve({
      routes: {
        "/": (req) => {
          const visitCount = Number(req.cookies.get("visits") || "0") + 1;
          req.cookies.set("visits", String(visitCount), { maxAge: 3600 }); // Set cookie for 1 hour
          return new Response(`Visits: ${visitCount}`);
        }
      }
    });
    ```

**6. DNS (`./dns.md`)**

*   **Compatibility:** Implements Node.js `node:dns` module (e.g., `dns.promises.resolve4`).
*   **Bun-specific Caching:**
    *   **Behavior:** Bun automatically caches DNS lookups (up to 255 entries, default 30s TTL). Deduplicates simultaneous lookups. Used by `fetch`, `Bun.connect`, `bun install`, etc.
    *   **Configuration:** Set TTL via `BUN_CONFIG_DNS_TIME_TO_LIVE_SECONDS` env var.
*   **Bun-specific APIs (Experimental 🚧):**
    *   `dns.prefetch(hostname, [port])`: Hints Bun to start resolving DNS for a host+port combination *before* it's actually needed. Useful for reducing latency on first connection.
    *   `dns.getCacheStats()`: Returns an object with stats about the DNS cache (hits, misses, size, errors).
*   **Example (`prefetch`):**
    ```javascript
    import { dns } from "bun";
    dns.prefetch("api.example.com", 443); // Start DNS lookup early
    // ... later ...
    await fetch("https://api.example.com/data");
    ```

**7. Fetch API (`./fetch.md`)**

*   **Standard:** Implements the WHATWG `fetch` standard (global function).
*   **Purpose:** Making HTTP(S) requests.
*   **Basic Usage:**
    ```javascript
    const response = await fetch("https://example.com/api/data");
    if (response.ok) {
      const data = await response.json(); // or .text(), .blob(), .arrayBuffer(), .bytes()
      console.log(data);
    } else {
      console.error("Fetch failed:", response.status);
    }
    ```
*   **Options (Second argument to `fetch`):**
    *   `method`: `"POST"`, `"PUT"`, `"DELETE"`, etc. (Default: `"GET"`)
    *   `headers`: `Headers` object or plain object (`{ 'Content-Type': 'application/json' }`)
    *   `body`: Request body (string, `Blob`, `FormData`, `ArrayBuffer`, `TypedArray`, `ReadableStream`).
    *   `signal`: `AbortSignal` for timeouts (`AbortSignal.timeout(ms)`) or cancellation (`AbortController`).
*   **Bun-specific Extensions/Options:**
    *   `unix`: Path to Unix domain socket for the request. `await fetch("http://ignored/path", { unix: "/var/run/docker.sock" });`
    *   `tls`: Object for client TLS configuration (`key`, `cert`, `ca`, `rejectUnauthorized`, `checkServerIdentity`).
    *   `proxy`: HTTP proxy URL string.
    *   `verbose`: `true` or `"curl"` for debug logging of request/response.
    *   `decompress`: `false` to disable automatic response decompression (Default: `true`).
    *   `keepalive`: `false` to disable connection reuse (Default: `true`).
    *   `s3`: S3 credentials/options when using `s3://` URLs.
*   **Protocol Support:** HTTP, HTTPS, `file://`, `data:`, `blob:`, `s3://`.
*   **Response Body Handling:**
    *   Consume fully: `await response.json()`, `await response.text()`, etc.
    *   Stream: `response.body` is a `ReadableStream`. Iterate with `for await (const chunk of response.body)`.
*   **Performance Features:**
    *   `dns.prefetch()`: Start DNS lookup early.
    *   `fetch.preconnect()`: Start DNS, TCP, and TLS handshake early.
    *   Connection Pooling: Automatic reuse of TCP/TLS connections (HTTP Keep-Alive).
    *   Response Buffering: Optimized methods like `.text()`, `.json()`.
    *   `sendfile` optimization for large file uploads under certain conditions.
*   **Example (POST JSON):**
    ```javascript
    const response = await fetch("https://api.example.com/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Bun User" }),
    });
    const newUser = await response.json();
    ```

**8. File System Operations (`./file-io.md`, `./file.md`)**

*   **Core APIs:** `Bun.file()`, `Bun.write()` (optimized, recommended)
*   **Compatibility:** Also implements Node.js `node:fs` module (use for features not in `Bun.file`/`Bun.write`, like `mkdir`, `readdir`).
*   **`Bun.file(path | fd | URL, [options])`**
    *   **Purpose:** Creates a `BunFile` instance, which is a *lazy* reference to a file on disk (or stdin/stdout/stderr). It extends `Blob`.
    *   **Return Value:** `BunFile`
    *   **Key Properties:** `.size`, `.type`
    *   **Key Methods (async):** `.text()`, `.json()`, `.arrayBuffer()`, `.bytes()`, `.stream()`, `.exists()`, `.writer()`, `.delete()`
    *   **Note:** Reading methods (`.text()`, etc.) actually perform the disk read.
    *   **Globals:** `Bun.stdin`, `Bun.stdout`, `Bun.stderr` are `BunFile` instances.
    *   **Example:**
        ```javascript
        const pkgFile = Bun.file("package.json");
        console.log("Size:", pkgFile.size); // Access size without reading content
        if (await pkgFile.exists()) {
          const pkg = await pkgFile.json(); // Reads and parses the file
          console.log("Name:", pkg.name);
        }
        ```
*   **`Bun.write(destination, data)`**
    *   **Purpose:** Fast, versatile function to write various data types to a destination. Uses optimized syscalls.
    *   **`destination`:** `string` (path), `URL` (`file://`), `BunFile`, `number` (file descriptor).
    *   **`data`:** `string`, `Blob` (including `BunFile`), `ArrayBuffer`, `TypedArray`, `Response`.
    *   **Return Value:** `Promise<number>` (bytes written).
    *   **Example (Copy file):**
        ```javascript
        await Bun.write("copy.txt", Bun.file("original.txt"));
        ```
    *   **Example (Write string):**
        ```javascript
        await Bun.write("hello.txt", "Hello from Bun!");
        ```
    *   **Example (Write Response body):**
        ```javascript
        const response = await fetch("https://bun.sh");
        await Bun.write("bun-homepage.html", response);
        ```
*   **`FileSink` (via `bunFile.writer([options])`)**
    *   **Purpose:** Provides an incremental writing API for files. Good for streams or large data.
    *   **Key Methods:**
        *   `.write(chunk)`: Writes a chunk (string, TypedArray, ArrayBuffer). Buffers internally. Returns bytes written.
        *   `.flush()`: Flushes the internal buffer to disk. Returns bytes flushed.
        *   `.end()`: Flushes buffer and closes the file sink.
        *   `.ref()` / `.unref()`: Control if the sink keeps the Bun process alive.
    *   **Options:** `highWaterMark` (buffer size in bytes).
    *   **Example:**
        ```javascript
        const writer = Bun.file("log.txt").writer();
        writer.write("Log entry 1\n");
        writer.write("Log entry 2\n");
        await writer.end(); // Flush and close
        ```
*   **Directory Operations (Use `node:fs`)**
    *   **Reading:** `import { readdir } from 'node:fs/promises'; const files = await readdir('.');`
    *   **Creating:** `import { mkdir } from 'node:fs/promises'; await mkdir('./new_dir', { recursive: true });`

**9. File System Router (`./file-system-router.md`)**

*   **API:** `Bun.FileSystemRouter`
*   **Purpose:** Resolves URL paths to file system paths based on routing conventions (currently Next.js `pages` style). Primarily for library authors building frameworks.
*   **Usage:**
    ```javascript
    const router = new Bun.FileSystemRouter({
      style: "nextjs",       // Routing convention
      dir: "./pages",        // Directory containing route files
      origin: "https://example.com", // Optional: Base URL
      assetPrefix: "/_next/static/", // Optional: Prefix for asset paths
      // fileExtensions: [".tsx", ".jsx"], // Optional: Default includes .js, .jsx, .ts, .tsx
    });

    const match = router.match("/blog/my-post?q=test");
    if (match) {
      console.log(match.filePath); // e.g., /path/to/pages/blog/[slug].tsx
      console.log(match.params);   // e.g., { slug: 'my-post' }
      console.log(match.query);    // e.g., { q: 'test' }
    }

    router.reload(); // Re-scan the directory
    ```
*   **`match()` Input:** `string` (path), `Request`, `Response`.
*   **`match()` Output:** An object with `filePath`, `kind`, `name`, `pathname`, `src`, optional `params`, optional `query`, or `null` if no match.

**10. Glob Pattern Matching (`./glob.md`)**

*   **API:** `Bun.Glob`
*   **Purpose:** Fast, native glob pattern matching for files.
*   **Usage:**
    *   **Matching strings:**
        ```javascript
        import { Glob } from "bun";
        const glob = new Glob("*.ts");
        glob.match("index.ts"); // true
        glob.match("index.js"); // false
        ```
    *   **Scanning directories:**
        ```javascript
        import { Glob } from "bun";
        const glob = new Glob("**/*.js"); // Pattern to match

        // Async scan
        for await (const file of glob.scan(".")) { // Root directory to scan
            console.log(file);
        }

        // Sync scan
        for (const file of glob.scanSync({ cwd: "./src", absolute: true })) {
            console.log(file);
        }
        ```
*   **`ScanOptions`:** `cwd`, `dot`, `absolute`, `followSymlinks`, `throwErrorOnBrokenSymlink`, `onlyFiles`.
*   **Supported Patterns:** `?`, `*`, `**`, `[abc]`, `[a-z]`, `[^abc]`, `{a,b}`, `!` (at start), `\` (escape).

**11. Globals (`./globals.md`)**

*   **Purpose:** Lists global variables and classes available in the Bun runtime.
*   **Sources:** Includes standard Web APIs (`fetch`, `Blob`, `URL`, `console`, `setTimeout`, `crypto`, Streams), Node.js APIs (`Buffer`, `process`, `__dirname`, `require`), and Bun-specific APIs (`Bun`, `HTMLRewriter`).
*   **Key Bun Globals:**
    *   `Bun`: Namespace for many Bun-specific APIs (`Bun.serve`, `Bun.file`, `Bun.hash`, etc.).
    *   `HTMLRewriter`: (Cloudflare API) For transforming HTML using CSS selectors.
*   **Action:** Refer to the table in `./globals.md` for a comprehensive list. When using an API, check if it's listed as a global.

**12. Hashing (`./hashing.md`)**

*   **Compatibility:** Implements Node.js `node:crypto` (`createHash`, `createHmac`).
*   **`Bun.password` (Cryptographic - for passwords)**
    *   **Purpose:** Securely hash and verify passwords using Argon2 (default) or bcrypt. Handles salting automatically.
    *   **Methods:**
        *   `Bun.password.hash(password, [options])`: Async hash. Options: `algorithm` (`"argon2id"`, `"argon2i"`, `"argon2d"`, `"bcrypt"`), algorithm-specific costs (`memoryCost`, `timeCost` for argon; `cost` for bcrypt).
        *   `Bun.password.verify(password, hash)`: Async verify.
        *   `Bun.password.hashSync(...)`, `Bun.password.verifySync(...)`: Synchronous versions (use cautiously, can block).
    *   **Return:** Hash string (PHC format for Argon2, MCF for bcrypt). `verify` returns boolean.
    *   **Example:**
        ```javascript
        const hash = await Bun.password.hash("mysecret");
        const isValid = await Bun.password.verify("mysecret", hash); // true
        ```
*   **`Bun.hash` (Non-cryptographic - for speed/checksums)**
    *   **Purpose:** Fast hashing using algorithms like Wyhash (default), CRC32, Adler32, CityHash, xxHash, MurmurHash. **Not for security.**
    *   **Usage:** `Bun.hash(input, [seed])` (returns `bigint` for 64-bit, `number` for 32-bit). Input can be string, TypedArray, Buffer, ArrayBuffer.
    *   **Specific Algorithms:** `Bun.hash.wyhash()`, `Bun.hash.crc32()`, `Bun.hash.xxHash64()`, etc.
    *   **Example:** `const h = Bun.hash("some data", 1234n);`
*   **`Bun.CryptoHasher` (Cryptographic - general purpose)**
    *   **Purpose:** Incremental hashing using various standard crypto algorithms (SHA-256, SHA-512, MD5, etc.). Supports HMAC.
    *   **Usage:**
        ```javascript
        const hasher = new Bun.CryptoHasher("sha256"); // Algorithm name
        // For HMAC: new Bun.CryptoHasher("sha256", key);
        hasher.update("part 1");
        hasher.update(Buffer.from("part 2"));
        const digest = hasher.digest("hex"); // Output format: "hex", "base64", or Buffer/TypedArray
        console.log(digest);
        ```
    *   **Methods:** `.update(data, [encoding])`, `.digest([encoding | buffer])`, `.copy()` (HMAC only before digest).
    *   **Supported Algorithms:** See list in `./hashing.md`.

**13. HTML Rewriter (`./html-rewriter.md`)**

*   **API:** `HTMLRewriter` (Global Class, based on Cloudflare's lol-html)
*   **Purpose:** Transform HTML content using CSS selectors to target elements, text, or comments. Works on streams (like `Response`).
*   **Usage:**
    ```javascript
    const rewriter = new HTMLRewriter()
      .on("a[href]", { // Target all <a> tags with an href attribute
        element(element) {
          const currentHref = element.getAttribute("href");
          if (currentHref && currentHref.startsWith("/")) {
            element.setAttribute("href", "https://newdomain.com" + currentHref);
          }
        },
      })
      .on("p", { // Target all <p> tags
        text(textChunk) {
          if (textChunk.lastInTextNode) { // Append only once per text node
             textChunk.after(" - appended text");
          }
        }
      });

    const response = await fetch("https://example.com");
    const transformedResponse = rewriter.transform(response); // Can also transform strings, Buffers, Blobs

    console.log(await transformedResponse.text());
    ```
*   **Handlers:**
    *   `element(element)`: Modify element attributes, content (`setAttribute`, `removeAttribute`, `append`, `prepend`, `before`, `after`, `setInnerContent`, `remove`, `onEndTag`).
    *   `text(textChunk)`: Modify text content (`replace`, `before`, `after`, `remove`).
    *   `comments(comment)`: Modify comment content (`text = ...`, `replace`, `before`, `after`, `remove`).
*   **`onDocument(handlers)`:** Handle document-level events (`doctype`, `comments`, `text`, `end`).
*   **Input Types for `.transform()`:** `Response`, `string`, `ArrayBuffer`, `Blob`, `BunFile`.

**14. HTTP Server (`./http.md`)**

*   **Core API:** `Bun.serve(options)` (Recommended)
*   **Compatibility:** Also implements Node.js `http` and `https`.
*   **`Bun.serve(options)`**
    *   **Purpose:** Starts a high-performance HTTP/HTTPS server.
    *   **Key Options:**
        *   `fetch(request, server)`: Handler function for incoming requests. Receives `Request`, returns `Response` or `Promise<Response>`. Acts as fallback if `routes` are used. **Required** if `routes` are not used or Bun version < 1.2.3.
        *   `routes`: (Bun v1.2.3+) An object mapping URL paths/patterns to handlers (`(Request) => Response`) or static `Response` objects. Supports exact paths, parameters (`/users/:id`), wildcards (`/files/*`), per-method handlers (`{ GET: ..., POST: ... }`). More specific routes take precedence.
        *   `error(error)`: Global error handler. Returns a `Response`.
        *   `port`: Port number (default: env vars or 3000). `0` for random.
        *   `hostname`: Hostname to bind (default: `"0.0.0.0"`).
        *   `unix`: Path to Unix domain socket.
        *   `tls`: TLS configuration object (`key`, `cert`, `ca`, `passphrase`, etc.) or array for SNI.
        *   `websocket`: WebSocket handler configuration object (see Section 21).
        *   `development`: `true` enables dev error page (default: `false`).
        *   `idleTimeout`: Max idle time in seconds (default varies).
    *   **Return Value:** `Server` object.
    *   **`Server` Object Methods:**
        *   `.stop([force])`: Stops the server (optionally force close connections).
        *   `.reload(newOptions)`: Hot-reloads `fetch`, `error`, `routes` handlers.
        *   `.ref()` / `.unref()`: Control if server keeps process alive.
        *   `.requestIP(request)`: Get client IP address info.
        *   `.publish(...)`, `.upgrade(...)`: For WebSockets.
    *   **`BunRequest` (passed to handlers):** Extends `Request`, adds:
        *   `params`: Object containing matched route parameters (from `routes`). Type-safe if route is string literal.
        *   `cookies`: `Bun.CookieMap` instance for easy cookie access/modification. Changes are auto-applied to response.
    *   **`export default` syntax:** You can `export default { fetch(req) {...}, port: 3000 }` directly from a file, and `bun run` will serve it.
    *   **Example (Basic with Routes):**
        ```javascript
        Bun.serve({
          port: 3000,
          routes: {
            "/": () => new Response("Homepage!"),
            "/users/:id": (req) => new Response(`User: ${req.params.id}`),
            "/api/data": {
              GET: () => Response.json({ data: [1,2,3] }),
              POST: async (req) => {
                const body = await req.json();
                // ... save body ...
                return Response.json({ success: true, received: body });
              }
            }
          },
          error(error) {
            console.error(error);
            return new Response("Internal Server Error", { status: 500 });
          },
        });
        console.log("Listening on port 3000");
        ```

**15. `import.meta` (`./import-meta.md`)**

*   **Purpose:** Provides metadata about the current module. Standard JS feature, but properties are host-defined.
*   **Bun Properties:**
    *   `import.meta.url`: `string` - URL of the current file (`file:///...`).
    *   `import.meta.path`: `string` - Absolute path to the current file (`/...`). Like `__filename`.
    *   `import.meta.dir`: `string` - Absolute path to the directory of the current file (`/...`). Like `__dirname`.
    *   `import.meta.file`: `string` - Basename of the current file (`file.ts`).
    *   `import.meta.main`: `boolean` - `true` if this file is the entry point (`bun run file.ts`), `false` if imported.
    *   `import.meta.resolve(specifier)`: `string` - Resolves a module `specifier` (like `"react"` or `"./utils"`) to its absolute URL path, using Bun's resolution logic.
    *   `import.meta.env`: Alias for `process.env`.
    *   `import.meta.require(specifier)`: Alias for Node's `require()`.
*   **Example (Check if main module):**
    ```javascript
    if (import.meta.main) {
      console.log("Running as main script");
    }
    ```

**16. Node-API (`./node-api.md`)**

*   **Purpose:** Interface for building native C/C++ addons compatible with Node.js.
*   **Bun Support:** Bun implements ~95% of Node-API. Most existing `.node` addons should work.
*   **Usage:** Load `.node` files using `require()` or `process.dlopen()`.
    ```javascript
    const myNativeAddon = require("./build/Release/my_addon.node");
    myNativeAddon.hello();
    ```

**17. S3 Client (`./s3.md`)**

*   **Purpose:** Native, fast client for interacting with AWS S3 and S3-compatible services (Cloudflare R2, MinIO, etc.).
*   **Key Concepts:**
    *   `Bun.S3Client`: Class to configure S3 connection details (credentials, endpoint, bucket).
    *   `Bun.s3`: A default global `S3Client` instance configured via environment variables (`S3_ACCESS_KEY_ID`, `AWS_ACCESS_KEY_ID`, etc.).
    *   `S3File`: A lazy reference to an object in S3 (created via `client.file(key)` or `s3.file(key)`). Extends `Blob`.
*   **Configuration (`Bun.S3Client` or env vars):** `accessKeyId`, `secretAccessKey`, `region`, `endpoint`, `bucket`, `sessionToken`, `virtualHostedStyle`.
*   **`S3File` Operations (Methods on `S3File` instance, often async):**
    *   Reading: `.text()`, `.json()`, `.arrayBuffer()`, `.bytes()`, `.stream()`.
    *   Partial Reads: `.slice(start, end)` (returns another `S3File`).
    *   Writing: `.write(data, [options])` (accepts string, Buffer, Blob, Response, etc.). Handles large uploads via multipart automatically.
    *   Streaming Write: `.writer([options])` (returns `S3Writer` with `.write`, `.end` methods). Options: `partSize`, `queueSize`, `retry`.
    *   Presigning URL: `.presign([options])` (returns `string`). Options: `expiresIn` (seconds), `method` (`GET`, `PUT`, etc.), `acl`. Synchronous.
    *   Deleting: `.delete()`, `.unlink()`.
    *   Metadata: `.exists()`, `.stat()` (returns `Promise<{ etag, lastModified, size, type }>`).
    *   **Note:** `s3File.size` is `NaN` (requires network call, use `await s3File.stat()`).
*   **`S3Client` Instance/Static Methods:** Provide shortcuts, accepting `key` and optional credentials object.
    *   `client.write(key, data, [options])`
    *   `client.delete(key, [options])`
    *   `client.exists(key, [options])`
    *   `client.stat(key, [options])`
    *   `client.presign(key, [options])`
    *   `S3Client.presign(key, credentials)` (static version)
    *   `S3Client.exists(key, credentials)` (static version) etc.
*   **`s3://` Protocol:** Use `s3://bucket/key` with `fetch()` or `Bun.file()`. Pass S3 options via `fetch(url, { s3: { ... } })`.
*   **Example:**
    ```javascript
    import { s3, write } from "bun"; // Uses env vars

    // Read JSON from S3
    const config = await s3.file("config/app.json").json();

    // Upload a local file to S3
    await write(s3.file("backups/log.txt"), Bun.file("./local_log.txt"));

    // Generate a 1-hour presigned PUT URL
    const uploadUrl = s3.presign("user-uploads/image.jpg", {
      method: "PUT",
      expiresIn: 3600,
      // You might need Content-Type here depending on service
    });
    console.log("Upload URL:", uploadUrl);

    // Delete an object
    await s3.delete("old-data/archive.zip");
    ```

**18. Semantic Versioning (`./semver.md`)**

*   **API:** `Bun.semver`
*   **Purpose:** Fast comparison and validation of semantic version strings (compatible with `node-semver`).
*   **Methods:**
    *   `Bun.semver.satisfies(version, range)`: Returns `boolean` if `version` matches `range` (e.g., `"1.2.3"`, `"^1.0.0"`).
    *   `Bun.semver.order(versionA, versionB)`: Returns `-1` (A < B), `0` (A == B), or `1` (A > B). Useful for sorting.
*   **Example:**
    ```javascript
    import { semver } from "bun";
    semver.satisfies("1.10.2", ">=1.9.0 <2.0.0"); // true
    ["1.0.1", "1.0.0", "1.1.0"].sort(semver.order); // ["1.0.0", "1.0.1", "1.1.0"]
    ```

**19. Spawning Subprocesses (`./spawn.md`)**

*   **APIs:** `Bun.spawn(cmd | options)`, `Bun.spawnSync(cmd | options)`
*   **Purpose:** Execute external commands/processes. `spawn` is async, `spawnSync` is blocking.
*   **`Bun.spawn(cmd | options)` (Async)**
    *   **Input:** `cmd` (array of strings like `['echo', 'hello']`) or `options` object `{ cmd: [...] }`.
    *   **Key Options:**
        *   `cwd`: Working directory.
        *   `env`: Environment variables object (`{ ...process.env, MY_VAR: 'value' }`).
        *   `stdin`: How to handle subprocess input (`null`, `"pipe"`, `"inherit"`, `BunFile`, `TypedArray`, `Response`, `ReadableStream`, `Blob`, file descriptor number). `"pipe"` gives `subprocess.stdin` (a `FileSink`).
        *   `stdout`, `stderr`: How to handle output (`"pipe"`, `"inherit"`, `"ignore"`, `BunFile`, file descriptor number). `"pipe"` gives `subprocess.stdout`/`subprocess.stderr` (a `ReadableStream`). Defaults: `stdout="pipe"`, `stderr="inherit"`.
        *   `onExit(proc, exitCode, signalCode, error)`: Callback when process exits.
        *   `ipc(message, subprocess)`: Handler for messages from child `bun` process (requires `serialization`).
        *   `serialization`: `"json"` or `"advanced"` (default) for IPC. Use `"json"` for Bun<->Node IPC.
        *   `signal`: `AbortSignal` to kill the process.
        *   `timeout`: Milliseconds to wait before killing the process.
        *   `killSignal`: Signal to use for timeout/abort (default `SIGTERM`).
    *   **Return Value:** `Subprocess` object.
    *   **`Subprocess` Properties/Methods:** `.pid`, `.stdin` (if `stdin: 'pipe'`), `.stdout`, `.stderr` (if `stdout/stderr: 'pipe'`), `.exited` (Promise resolving exit code), `.exitCode`, `.signalCode`, `.killed`, `.kill([signal])`, `.unref()`, `.ref()`, `.send(message)` (IPC), `.disconnect()` (IPC), `.resourceUsage()`.
    *   **Example:**
        ```javascript
        const proc = Bun.spawn(["ls", "-lh"], {
            cwd: "/tmp",
            onExit: (proc, code) => console.log(`ls exited with code ${code}`),
        });
        const output = await new Response(proc.stdout).text();
        console.log(output);
        await proc.exited; // Wait for exit
        ```
*   **`Bun.spawnSync(cmd | options)` (Sync/Blocking)**
    *   **Input:** Same options as `Bun.spawn`.
    *   **Return Value:** `SyncSubprocess` object.
    *   **`SyncSubprocess` Properties:** `.stdout` (Buffer), `.stderr` (Buffer), `.exitCode`, `.success` (boolean, true if exitCode is 0), `.pid`, `.signalCode`, `.resourceUsage`.
    *   **Note:** No `.stdin` property for writing incrementally. Input must be provided via `stdin` option. Better for CLI tools, `spawn` is better for servers.
    *   **Example:**
        ```javascript
        const result = Bun.spawnSync(["bun", "--version"]);
        if (result.success) {
          console.log("Bun version:", result.stdout.toString());
        } else {
          console.error("Failed:", result.stderr.toString());
        }
        ```

**20. SQL (PostgreSQL) (`./sql.md`)**

*   **Purpose:** Native, high-performance PostgreSQL client with tagged template literals for safety.
*   **API:** `import { sql } from "bun";` or `import { SQL } from "bun"; const sql = new SQL(options);`
*   **Configuration:** Via env vars (`POSTGRES_URL`, `PGHOST`, etc.) or `new SQL(options)` (host, port, user, pass, db, pool settings, TLS, etc.).
*   **Tagged Template Usage:**
    ```javascript
    const userId = 123;
    const isActive = true;
    const users = await sql`SELECT * FROM users WHERE id = ${userId} AND active = ${isActive}`;
    // Parameters are safely bound, preventing SQL injection
    ```
*   **Key Features & Helpers:**
    *   **Safe Parameter Binding:** `${value}` is automatically parameterized.
    *   **Dynamic Queries (`sql()` helper):**
        *   Table/Schema names: `sql`SELECT * FROM ${sql(tableName)}``
        *   Conditional clauses: `` sql`WHERE active = true ${isAdmin ? sql`AND role = 'admin'` : sql``}` ``
        *   Insert/Update Objects: `` sql`INSERT INTO users ${sql(userObject)}` `` or `` sql`UPDATE users SET ${sql(userObject, 'name', 'email')}` ``
        *   IN clauses: `` sql`WHERE id IN ${sql([1, 2, 3])}` `` or `` sql`WHERE name IN ${sql(userList, 'name')}` ``
    *   **Result Formats:**
        *   `await sql`...`: Array of row objects (default).
        *   `await sql`...`.values()`: Array of row arrays `[[val1, val2], ...]`.
        *   `await sql`...`.raw()`: Array of row arrays with `Buffer` values.
    *   **Multi-Statement (`.simple()`):** `await sql`SELECT 1; SELECT 2;`.simple()`. No parameters allowed.
    *   **File Execution (`.file()`):** `await sql.file("migration.sql", [param1, param2])`.
    *   **Unsafe Execution (`.unsafe()`):** `await sql.unsafe(rawSqlString, [params])`. **Use with extreme caution.** Allows multiple statements only if *no* parameters.
    *   **Transactions (`.begin`, `.savepoint`, `.beginDistributed`, `.commitDistributed`, `.rollbackDistributed`):**
        ```javascript
        await sql.begin(async tx => { // tx is a scoped sql instance
          await tx`UPDATE accounts SET balance = balance - 100 WHERE id = 1`;
          await tx`UPDATE accounts SET balance = balance + 100 WHERE id = 2`;
          // Auto-commits on success, rolls back on error
        });
        ```
    *   **Connection Pooling:** Automatic. Configurable (`max`, `idleTimeout`, etc.). `sql.close()` closes pool.
    *   **Reserved Connections:** `using reserved = await sql.reserve(); await reserved`...`;`
    *   **Prepared Statements:** Automatic by default (can disable with `prepare: false`).
    *   **Data Types:** Handles `BigInt` (returned as string by default, use `bigint: true` option for `BigInt`).
*   **Note:** Currently PostgreSQL only. MySQL/SQLite planned. Some advanced PG features not yet implemented.

**21. SQLite (`./sqlite.md`)**

*   **Purpose:** Native, high-performance SQLite3 driver.
*   **API:** `import { Database, Statement } from 'bun:sqlite';`
*   **`Database` Class:**
    *   **Creation:** `new Database("path/to/db.sqlite" | ":memory:", [options])`. Options: `readonly`, `create`, `strict`, `safeIntegers`.
    *   **Methods:**
        *   `.query(sql)`: Prepares and caches a statement. Returns `Statement`.
        *   `.prepare(sql)`: Prepares a statement without caching. Returns `Statement`.
        *   `.run(sql, [params])`: Executes SQL, returns `{ lastInsertRowid, changes }`. Good for INSERT/UPDATE/DELETE/CREATE.
        *   `.exec(sql, [params])`: Alias for `.run`.
        *   `.transaction(fn)`: Creates a transaction function.
        *   `.loadExtension(name)`: Loads a SQLite extension.
        *   `.close([throwOnError])`: Closes the database.
        *   `.serialize()`: Returns `Uint8Array` snapshot of DB.
        *   `Database.deserialize(buffer)`: Creates DB from snapshot.
        *   `.fileControl(cmd, val)`: Low-level control.
*   **`Statement` Class (from `db.query`/`db.prepare`):**
    *   **Execution Methods:**
        *   `.get([params])`: Returns first row as object or `undefined`.
        *   `.all([params])`: Returns all rows as array of objects.
        *   `.values([params])`: Returns all rows as array of arrays `[[val1, val2], ...]`.
        *   `.run([params])`: Executes statement, returns `{ lastInsertRowid, changes }`.
        *   `.iterate([params])`: Returns an iterator for rows (also works with `for...of`).
    *   **Other Methods:**
        *   `.bind([params])`: Binds parameters without executing (less common).
        *   `.finalize()`: Frees statement resources.
        *   `.toString()`: Returns expanded SQL string with last bound params.
        *   `.as(Class)`: Maps results to instances of `Class` (constructor not called).
    *   **Properties:** `.columnNames`, `.paramsCount`.
*   **Parameters:** Use `?`, `?N`, `$name`, `:name`, `@name`. Bind via object `({ $name: value })` or array/args `(val1, val2)`.
*   **`strict: true` Option:** Requires named params to match *without* prefix (`{ name: value }`), throws on missing binds.
*   **`safeIntegers: true` Option:** Returns large integers as `bigint`, throws if `bigint` params exceed 64 bits. Default (`false`) returns `number` (truncates >53 bits).
*   **Transactions:**
    ```javascript
    const insert = db.prepare("INSERT INTO data (val) VALUES (?)");
    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insert.run(item);
      }
      return items.length; // Return value is passed through
    });
    const count = insertMany([1, 2, 3]); // Executes BEGIN, INSERTs, COMMIT/ROLLBACK
    // Variants: .deferred(), .immediate(), .exclusive()
    ```
*   **WAL Mode:** Recommended for performance. `db.exec("PRAGMA journal_mode = WAL;");`
*   **Example:**
    ```javascript
    import { Database } from "bun:sqlite";
    const db = new Database(":memory:");
    db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);");
    const insert = db.prepare("INSERT INTO users (name) VALUES ($name) RETURNING id;");
    const { id } = insert.get({ $name: "Alice" });
    const user = db.query("SELECT * FROM users WHERE id = ?").get(id);
    console.log(user); // { id: 1, name: 'Alice' }
    db.close();
    ```

**22. Streams (`./streams.md`)**

*   **Standards:** Implements Web `ReadableStream`, `WritableStream`. Also Node.js `node:stream`.
*   **`ReadableStream`**
    *   **Purpose:** Represents a source of data that can be read in chunks.
    *   **Consumption:** `for await (const chunk of stream)`, `stream.getReader()`.
    *   **Creation:** `new ReadableStream({ start(controller), pull(controller), cancel(reason) })`.
    *   **Bun "Direct" Stream:** `new ReadableStream({ type: "direct", pull(controller) })`. Uses `controller.write()` instead of `controller.enqueue()`. Avoids internal queueing/copying for performance.
    *   **Async Generator Streams:** Can use `async function*()` or object with `[Symbol.asyncIterator]` as body for `Response`/`Request`.
        ```javascript
        const stream = new ReadableStream({
          async pull(controller) {
            const data = await fetchData();
            if (data) {
              controller.write(data); // Use write for direct streams
            } else {
              controller.close();
            }
          },
          type: "direct", // Use direct stream for efficiency
        });
        ```
*   **`WritableStream`**
    *   **Purpose:** Represents a destination for data that can be written in chunks.
    *   **Usage:** `stream.getWriter()`, `writer.write(chunk)`, `writer.close()`.
*   **`Bun.ArrayBufferSink`**
    *   **Purpose:** Fast, incremental builder for `ArrayBuffer` or `Uint8Array` when final size is unknown.
    *   **Methods:**
        *   `.start([options])`: Initialize. Options: `asUint8Array` (return `Uint8Array` instead of `ArrayBuffer`), `highWaterMark` (buffer size), `stream` (enable `.flush()` to return data and reset).
        *   `.write(chunk)`: Add data (string, TypedArray, ArrayBuffer).
        *   `.flush()`: Returns buffered data and clears buffer *if* `stream: true`, else returns bytes written.
        *   `.end()`: Returns the final `ArrayBuffer` or `Uint8Array` and prevents further writes.
    *   **Example:**
        ```javascript
        const sink = new Bun.ArrayBufferSink();
        sink.start({ asUint8Array: true });
        sink.write("Hello ");
        sink.write(Buffer.from("World!"));
        const finalData = sink.end(); // Uint8Array
        ```

**23. TCP Sockets (`./tcp.md`)**

*   **Purpose:** Low-level API for TCP client/server communication. For performance-sensitive use cases or implementing protocols other than HTTP.
*   **`Bun.listen(options)` (Server)**
    *   **Purpose:** Starts a TCP server.
    *   **Key Options:**
        *   `hostname`, `port`.
        *   `socket`: Object containing shared handlers for all connections (`open`, `data`, `close`, `drain`, `error`).
        *   `tls`: TLS configuration (`key`, `cert`, etc.).
    *   **Return Value:** `TCPSocket` (server instance).
    *   **Socket Data:** Use generics `Bun.listen<MyData>({...})` and `socket.data` inside handlers to attach context.
    *   **Example:**
        ```javascript
        const server = Bun.listen<{ user: string }>({
          hostname: "localhost", port: 8080,
          socket: {
            open(socket) { socket.data = { user: "guest" }; console.log("Client connected"); },
            data(socket, buffer) { console.log(`Received from ${socket.data.user}:`, buffer.toString()); socket.write("Echo: " + buffer.toString()); },
            close(socket) { console.log("Client disconnected"); },
            error(socket, err) { console.error("Socket error:", err); },
          }
        });
        console.log(`TCP server listening on ${server.hostname}:${server.port}`);
        ```
*   **`Bun.connect(options)` (Client)**
    *   **Purpose:** Connects to a TCP server. Returns `Promise<TCPSocket>`.
    *   **Key Options:** `hostname`, `port`, `socket` (handlers, includes client-specific `connectError`, `end`, `timeout`), `tls` (`true` or config object).
    *   **Return Value:** `Promise<TCPSocket>` (client socket instance).
*   **`TCPSocket` (Instance for both server and client sockets)**
    *   **Methods:**
        *   `.write(data)`: Send data (string, Buffer, TypedArray). Returns bytes written. Handle backpressure using `drain`.
        *   `.end()`: Close the write end.
        *   `.flush()`: Flush buffered data.
        *   `.ref()` / `.unref()`: Control process lifetime.
        *   `.stop([force])`: (Server only) Stop listening.
        *   `.reload(newHandlers)`: Hot-reload socket handlers.
    *   **Buffering:** No automatic buffering; write larger chunks or use `ArrayBufferSink`. Use `drain` handler for backpressure. Corking planned.

**24. Testing (`./test.md`)**

*   **Command:** `bun test`
*   **Purpose:** Runs test files using a Jest-compatible API.
*   **API:** `describe`, `it`, `test`, `expect`, `beforeEach`, `afterAll`, etc. are available globally in test files.
*   **Action:** Refer to the `bun test` CLI documentation for details on writing and running tests.

**25. Transpiler (`./transpiler.md`)**

*   **API:** `Bun.Transpiler`
*   **Purpose:** Exposes Bun's internal JavaScript/TypeScript/JSX transpiler. Useful for build tools or plugins.
*   **Usage:**
    ```javascript
    const transpiler = new Bun.Transpiler({
      loader: "tsx", // or "js", "jsx", "ts"
      // other options: define, target, tsconfig, macro, exports, trimUnusedImports, minifyWhitespace, inline
    });

    // Sync transform (faster for single/small files)
    const jsCodeSync = transpiler.transformSync("const App = () => <div/>;", "tsx");

    // Async transform (uses thread pool, better for many/large files)
    const jsCodeAsync = await transpiler.transform("let x: number = 5;");

    // Scan for imports/exports
    const metadata = transpiler.scan("import React from 'react'; export const a = 1;");
    // metadata = { exports: ['a'], imports: [{ path: 'react', kind: 'import-statement' }] }

    // Faster import scan (less accurate)
    const importsOnly = transpiler.scanImports("import {b} from './b'; require('c');");
    ```
*   **Key Methods:** `.transformSync()`, `.transform()`, `.scan()`, `.scanImports()`.
*   **Options:** Control target platform, define replacements, JSX settings (via `tsconfig`), macros, dead code elimination (`exports`, `trimUnusedImports`), minification, inlining.

**26. UDP Sockets (`./udp.md`)**

*   **Purpose:** API for User Datagram Protocol (UDP) communication. Connectionless, less overhead than TCP, suitable for real-time (games, voice).
*   **API:** `Bun.udpSocket(options)`
*   **`Bun.udpSocket(options)`**
    *   **Purpose:** Creates and binds a UDP socket. Returns `Promise<UDPSocket>`.
    *   **Key Options:**
        *   `port`: Port to bind to (optional, OS assigns if omitted).
        *   `hostname`: Hostname to bind to (optional).
        *   `socket`: Handlers (`data`, `error`, `drain`, `close`).
        *   `connect`: `{ hostname, port }` to create a "connected" UDP socket (restricts sends/receives to one peer).
    *   **`data` Handler:** `(socket, buffer, port, address) => {}` - receives incoming datagrams.
*   **`UDPSocket` (Instance)**
    *   **Methods:**
        *   `.send(data, port, address)`: Sends data (string, Buffer, TypedArray) to a specific destination (unconnected socket). Returns `boolean` (true if sent immediately, false if buffered due to backpressure).
        *   `.send(data)`: Sends data to the connected peer (connected socket). Returns `boolean`.
        *   `.sendMany([data1, port1, addr1, data2, port2, addr2, ...])`: Sends multiple packets efficiently (unconnected).
        *   `.sendMany([data1, data2, ...])`: Sends multiple packets to connected peer.
        *   `.close()`: Closes the socket.
        *   `.ref()` / `.unref()`: Control process lifetime.
    *   **Properties:** `.port`, `.hostname`.
    *   **Backpressure:** If `.send()`/`.sendMany()` returns `false` or fewer packets than requested, wait for the `drain` event before sending more.
*   **Example (Echo Server):**
    ```javascript
    const server = await Bun.udpSocket({
      port: 8080,
      socket: {
        data(socket, data, port, address) {
          console.log(`Received ${data.length} bytes from ${address}:${port}`);
          socket.send(`Echo: ${data.toString()}`, port, address); // Send back
        },
        error(socket, error) {
          console.error("UDP Error:", error);
        },
      },
    });
    console.log(`UDP server listening on port ${server.port}`);
    ```

**27. Utilities (`./utils.md`)**

*   **`Bun.version`**: `string` - Current Bun CLI version.
*   **`Bun.revision`**: `string` - Git commit hash of the Bun build.
*   **`Bun.env`**: Alias for `process.env`.
*   **`Bun.main`**: `string` - Absolute path to the entry script.
*   **`Bun.sleep(ms | Date)`**: `Promise<void>` - Async wait.
*   **`Bun.sleepSync(ms)`**: `void` - Blocking wait.
*   **`Bun.which(command, [options])`**: `string | null` - Finds path to executable (like shell `which`).
*   **`Bun.randomUUIDv7([encoding], [timestamp])`**: `string` | `Buffer` - Generates a time-sortable v7 UUID. `encoding`: `"hex"` (default), `"base64"`, `"base64url"`, `"buffer"`.
*   **`Bun.peek(promise)`**: Returns promise result *only if already settled*, else returns the promise itself. `peek.status(promise)` returns `"pending" | "fulfilled" | "rejected"`. Advanced use.
*   **`Bun.openInEditor(path, [options])`**: Opens file in default editor (`$EDITOR`/`$VISUAL` or configured). Options: `editor`, `line`, `column`.
*   **`Bun.deepEquals(a, b, [strict])`**: `boolean` - Recursive equality check (used by `bun:test`). `strict` checks prototypes and `undefined` properties.
*   **`Bun.escapeHTML(value)`**: `string` - Escapes `&`, `<`, `>`, `"`, `'`. Fast.
*   **`Bun.stringWidth(string, [options])`**: `number` - Calculates terminal display width (handles ANSI, emoji). Options: `countAnsiEscapeCodes`, `ambiguousIsNarrow`. Very fast alternative to `string-width` package.
*   **`Bun.fileURLToPath(url)`**: `string` - Converts `file://` URL to path.
*   **`Bun.pathToFileURL(path)`**: `URL` - Converts path to `file://` URL.
*   **`Bun.gzipSync(data, [options])`**: `Uint8Array` - Gzip compress.
*   **`Bun.gunzipSync(data)`**: `Uint8Array` - Gzip decompress.
*   **`Bun.deflateSync(data, [options])`**: `Uint8Array` - Deflate compress.
*   **`Bun.inflateSync(data)`**: `Uint8Array` - Inflate decompress.
*   **`Bun.inspect(value)`**: `string` - Get `console.log`-style string representation. `Bun.inspect.custom` Symbol for customization. `Bun.inspect.table(data, [props], [opts])` for string version of `console.table`.
*   **`Bun.nanoseconds()`**: `number` - High-precision timer since process start.
*   **`Bun.readableStreamTo*()`**: Async functions to consume `ReadableStream` into `ArrayBuffer`, `Bytes` (Uint8Array), `Blob`, `JSON`, `Text`, `Array` (of chunks), `FormData`.
*   **`Bun.resolveSync(specifier, rootDir)`**: `string` - Synchronously resolve module/file path using Bun's logic. Throws on failure.
*   **`bun:jsc` Utilities:**
    *   `serialize(value)`: `ArrayBuffer` - Uses structured clone algorithm.
    *   `deserialize(buffer)`: `any` - Reverses `serialize`.
    *   `estimateShallowMemoryUsageOf(object)`: `number` - Rough estimate of object's own memory (excluding refs).

**28. WebSockets (`./websockets.md`)**

*   **Server-Side (`Bun.serve`)**
    *   **Setup:** Provide `websocket` handler object in `Bun.serve(options)`. Use `server.upgrade(req, [options])` in the `fetch` handler.
    *   **`websocket` Handlers:** `open(ws)`, `message(ws, message)`, `close(ws, code, reason)`, `drain(ws)`, `error(ws, error)`. These handlers are shared across all connections.
    *   **`ServerWebSocket` Instance (passed to handlers):**
        *   `.send(data, [compress])`: Send message (string, Buffer, TypedArray). Returns status code indicating backpressure.
        *   `.publish(topic, data, [compress])`: Send to topic subscribers (excludes self).
        *   `.subscribe(topic)`, `.unsubscribe(topic)`, `.isSubscribed(topic)`.
        *   `.close([code], [reason])`.
        *   `.data`: Context object attached during `server.upgrade({ data: ... })`.
        *   `.remoteAddress`: Client IP.
        *   `.readyState`: Connection state number.
        *   `.cork(callback)`: Batch multiple operations for efficiency.
    *   **`server.publish(topic, data, [compress])`:** Publish from server to all topic subscribers.
    *   **Options:** `perMessageDeflate` (compression), `idleTimeout`, `maxPayloadLength`, `backpressureLimit`, etc.
    *   **Example (Echo):**
        ```javascript
        Bun.serve({
          port: 3001,
          fetch(req, server) {
            if (server.upgrade(req)) return; // Upgrade successful
            return new Response("Upgrade failed", { status: 500 });
          },
          websocket: {
            message(ws, message) {
              console.log("Received:", message);
              ws.send(message); // Echo back
            },
            open(ws) { console.log("Client connected"); },
            close(ws, code, reason) { console.log("Client disconnected", code, reason); },
          },
        });
        ```
*   **Client-Side (`WebSocket` Global)**
    *   **Standard:** Implements the Web `WebSocket` API.
    *   **Usage:** `const ws = new WebSocket("ws://host:port");`
    *   **Events:** `ws.onopen = ...`, `ws.onmessage = ...`, `ws.onclose = ...`, `ws.onerror = ...` (or use `addEventListener`).
    *   **Methods:** `ws.send(data)`, `ws.close()`.
    *   **Bun Extension:** `new WebSocket(url, { headers: {...} })` allows setting custom headers (not portable to browsers).

**29. Workers (`./workers.md`)**

*   **Purpose:** Run JavaScript code on a separate thread, communicating via messages. Good for CPU-intensive tasks off the main thread. Experimental 🚧.
*   **API:** `Worker` global class (Web standard-like).
*   **Creating a Worker:**
    ```javascript
    // main.ts
    const worker = new Worker(new URL("./worker-script.ts", import.meta.url).href, {
       // smol: true, // Optional: reduce memory usage at cost of perf
       // ref: false, // Optional: don't keep main process alive
       // preload: ["./setup.js"] // Optional: preload scripts
    });

    // Send message
    worker.postMessage({ task: "compute", data: [1, 2, 3] });

    // Receive message
    worker.onmessage = (event) => {
      console.log("Result from worker:", event.data);
      worker.terminate(); // Close the worker when done
    };

    worker.onerror = (event) => { console.error("Worker error:", event.message); };
    worker.on("close", (event) => { console.log("Worker closed", event.code); }); // Bun-specific event
    worker.on("open", () => { console.log("Worker is ready"); }); // Bun-specific event
    ```
*   **Worker Script (`worker-script.ts`):**
    ```typescript
    // Add this line to satisfy TypeScript about 'self'
    declare var self: Worker;

    console.log("Worker started!");

    // Receive message
    self.onmessage = (event) => {
      const { task, data } = event.data;
      if (task === "compute") {
        const result = data.reduce((a: number, b: number) => a + b, 0);
        // Send message back
        self.postMessage({ result });
      }
    };

    // To exit the worker thread itself:
    // process.exit(0);
    ```
*   **Communication:** Use `worker.postMessage(data)` and `self.postMessage(data)` (inside worker). Data is transferred using the structured clone algorithm. Listen using `onmessage` or `addEventListener("message", ...)`.
*   **Termination:**
    *   From main thread: `worker.terminate()`.
    *   From worker thread: `process.exit([code])` or naturally when event loop is empty.
*   **Lifetime (`ref`/`unref`):** Control if worker keeps main process alive. `worker.unref()` detaches it.
*   **`Bun.isMainThread`**: `boolean` - Check if code is running in the main thread or a worker.
*   **Module Support:** Workers support TS, JSX, CJS, ESM imports like the main thread.
*   **`blob:` URLs:** Can create workers from `Blob` or `File` using `URL.createObjectURL()`.
