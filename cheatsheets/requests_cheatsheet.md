## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of the Python Requests library, designed to help you quickly understand its core functionality and start making HTTP requests. It covers making requests, handling responses, sessions, authentication, and various advanced features, based entirely on the provided documentation snippets.

---

## Python Requests Cheatsheet

### Core Concepts

*   **Purpose:** Requests is an HTTP library for Python, designed for simplicity and ease of use.
*   **Main Goal:** Allows sending HTTP/1.1 requests easily, handling complexities like query strings, form encoding, connection pooling, and content decoding automatically.
*   **Dependencies:** Relies on `urllib3` for connection pooling and low-level HTTP handling. Uses `certifi` for CA bundles. Optionally uses `chardet` or `charset_normalizer` for encoding detection. Optional SOCKS support requires `requests[socks]`. Optional Brotli decoding requires `brotli` or `brotlicffi`.
*   **Compatibility:** Officially supports Python 3.8+.

### Making Requests

All request functions return a `Response` object.

**Main Request Methods:**

*   `requests.request(method, url, **kwargs)`: Generic method.
*   `requests.get(url, params=None, **kwargs)`: Sends a GET request.
*   `requests.post(url, data=None, json=None, **kwargs)`: Sends a POST request.
*   `requests.put(url, data=None, **kwargs)`: Sends a PUT request.
*   `requests.patch(url, data=None, **kwargs)`: Sends a PATCH request.
*   `requests.delete(url, **kwargs)`: Sends a DELETE request.
*   `requests.head(url, **kwargs)`: Sends a HEAD request.
*   `requests.options(url, **kwargs)`: Sends an OPTIONS request.

**Common Keyword Arguments (`**kwargs`):**

*   `params`: (dict or list of tuples) Dictionary or bytes to be sent in the query string for the `Request`. Keys with `None` values are ignored. List values result in multiple key entries.
    ```python
    payload = {'key1': 'value1', 'key2': ['value2', 'value3']}
    r = requests.get('https://httpbin.org/get', params=payload)
    # URL becomes: https://httpbin.org/get?key1=value1&key2=value2&key2=value3
    ```
*   `data`: (dict, list of tuples, bytes, or file-like object) Data to send in the body of the `Request`. Typically used for form-encoded POST/PUT. If a dict or list of tuples, it's form-encoded. If bytes or file-like, sent directly.
    ```python
    # Form-encoded
    payload = {'key1': 'value1', 'key2': 'value2'}
    r = requests.post('https://httpbin.org/post', data=payload)

    # Multiple values for a key
    payload_tuples = [('key1', 'value1'), ('key1', 'value2')]
    r1 = requests.post('https://httpbin.org/post', data=payload_tuples)

    # Raw string data
    r = requests.post(url, data='raw data string')

    # Streaming Upload (file-like object, open in binary mode 'rb')
    with open('massive-body', 'rb') as f:
        requests.post('http://some.url/streamed', data=f)

    # Chunked Upload (generator/iterator without length)
    def gen():
        yield 'hi'
        yield 'there'
    requests.post('http://some.url/chunked', data=gen())
    ```
*   `json`: (any json-serializable object) Data to be JSON-encoded and sent in the body. Automatically sets `Content-Type` header to `application/json`. Ignored if `data` or `files` is passed.
    ```python
    payload = {'some': 'data'}
    r = requests.post(url, json=payload)
    ```
*   `headers`: (dict) Dictionary of HTTP Headers to send. Header names are case-insensitive. Values must be string, bytestring, or unicode (string preferred). Custom headers have lower precedence than specific auth/content headers set by Requests. Use `OrderedDict` for specific header ordering (though default headers might intersperse).
    ```python
    headers = {'user-agent': 'my-app/0.0.1', 'Accept': 'application/json'}
    r = requests.get(url, headers=headers)
    ```
*   `cookies`: (dict or `RequestsCookieJar`) Cookies to send.
    ```python
    cookies = dict(cookies_are='working')
    r = requests.get(url, cookies=cookies)
    ```
*   `files`: (dict) Dictionary of `'name': file-like-objects` for multipart encoding upload. File-like objects should be opened in binary mode (`'rb'`). Can also be a tuple: `('filename', file_obj, 'content_type', {'header_key': 'header_value'})`. Strings can also be sent as files. For multiple files with the same field name, use a list of tuples.
    ```python
    files = {'file': open('report.xls', 'rb')}
    r = requests.post(url, files=files)

    # Explicit filename, content_type, headers
    files = {'file': ('report.xls', open('report.xls', 'rb'), 'application/vnd.ms-excel', {'Expires': '0'})}
    r = requests.post(url, files=files)

    # String as file
    files = {'file': ('report.csv', 'some,data,to,send\nanother,row,to,send\n')}
    r = requests.post(url, files=files)

    # Multiple files for same field
    multiple_files = [
        ('images', ('foo.png', open('foo.png', 'rb'), 'image/png')),
        ('images', ('bar.png', open('bar.png', 'rb'), 'image/png'))]
    r = requests.post(url, files=multiple_files)
    ```
*   `auth`: (tuple or callable) Auth tuple or callable to enable Basic/Digest/Custom HTTP Auth. Common shorthand: `auth=('user', 'pass')` for Basic Auth. Overrides netrc and `Authorization` header in `headers`.
*   `timeout`: (float or tuple) Seconds to wait. If float, applies to both connect and read timeouts. If tuple `(connect_timeout, read_timeout)`. Connect timeout applies per IP address attempt. Read timeout is between bytes received from server. Default is `None` (no timeout).
    ```python
    r = requests.get('https://github.com', timeout=5) # 5s for connect and read
    r = requests.get('https://github.com', timeout=(3.05, 27)) # 3.05s connect, 27s read
    r = requests.get('https://github.com', timeout=None) # No timeout
    ```
*   `allow_redirects`: (bool) `True` by default (except for HEAD). Set to `False` to disable following redirects.
*   `proxies`: (dict) Dictionary mapping protocol or protocol+hostname to the URL of the proxy.
    ```python
    proxies = {
      'http': 'http://10.10.1.10:3128',
      'https': 'http://user:pass@10.10.1.10:1080',
      'http://10.20.1.128': 'http://10.10.1.10:5323' # Specific host
    }
    requests.get('http://example.org', proxies=proxies)
    ```
*   `stream`: (bool) If `False` (default), the response content is immediately downloaded. If `True`, data isn't downloaded until `Response.content` is accessed or data is iterated (`iter_content`/`iter_lines`). Connection remains open. Use with `with` statement for reliable closing.
    ```python
    r = requests.get(url, stream=True)
    with open(filename, 'wb') as fd:
        for chunk in r.iter_content(chunk_size=128):
            fd.write(chunk)

    # Ensure closure even if not reading full body
    with requests.get('https://httpbin.org/get', stream=True) as r:
        # Process response headers, maybe read some data
        pass # Connection closed automatically on exit
    ```
*   `verify`: (bool or string) `True` (default) to verify SSL certificate. `False` to ignore SSL errors (INSECURE). String path to a CA bundle file or directory of CA certs (requires `c_rehash`). Can be controlled via `REQUESTS_CA_BUNDLE` or `CURL_CA_BUNDLE` env vars.
    ```python
    r = requests.get('https://github.com', verify='/path/to/certfile')
    r = requests.get('https://insecure.site', verify=False)
    ```
*   `cert`: (string or tuple) Path to SSL client cert file (`.pem`). If key is separate, use tuple: `('/path/client.cert', '/path/client.key')`. Private key must be unencrypted.
*   `hooks`: (dict) Dictionary of `'hook_name': callback_func` or list of funcs. Only `response` hook available. Callback receives the `Response` object. If callback returns a value, it replaces the `Response`.
    ```python
    def print_url(r, *args, **kwargs):
        print(r.url)
    requests.get('https://httpbin.org/', hooks={'response': print_url})
    ```

### The Response Object (`requests.Response`)

Returned by request methods.

**Attributes:**

*   `status_code`: (int) HTTP status code (e.g., `200`, `404`).
*   `headers`: (CaseInsensitiveDict) Dictionary-like object of response headers. Keys are case-insensitive. Access like `r.headers['Content-Type']`.
*   `encoding`: (str) Encoding used to decode `r.text`. Guessed from headers or content (using `charset_normalizer` or `chardet` if installed). Can be set manually. Defaults to `ISO-8859-1` if `Content-Type` is `text` but no charset is specified (RFC 2616).
    ```python
    print(r.encoding) # e.g., 'utf-8'
    r.encoding = 'ISO-8859-1' # Change encoding for subsequent .text access
    ```
*   `text`: (str) Response content decoded using `r.encoding`.
*   `content`: (bytes) Response content as raw bytes. Automatically decompresses `gzip` and `deflate`. Automatically decompresses `br` if Brotli library is installed.
*   `json(**kwargs)`: (callable) Decodes response content as JSON. Raises `requests.exceptions.JSONDecodeError` if decoding fails or content is not valid JSON. Accepts `**kwargs` passed to `json.loads()`.
*   `url`: (str) The final URL after any redirections.
*   `history`: (list of `Response` objects) List of Response objects from redirects, sorted oldest to newest. Empty if no redirects or `allow_redirects=False`.
*   `cookies`: (`RequestsCookieJar`) CookieJar containing cookies sent back from the server. Acts like a dict.
*   `raw`: (urllib3.response.HTTPResponse) Raw response from `urllib3`. Requires `stream=True` on the request. Use `iter_content` or `iter_lines` for most streaming cases.
*   `request`: (`PreparedRequest`) The `PreparedRequest` object associated with this response.
*   `links`: (dict) Parsed Link headers. Keyed by `rel` parameter (e.g., `r.links['next']['url']`).

**Methods:**

*   `raise_for_status()`: Raises `requests.exceptions.HTTPError` for 4xx or 5xx status codes. Does nothing for successful codes (2xx).
*   `iter_content(chunk_size=1, decode_unicode=False)`: Iterates over the response data. `chunk_size` is bytes per chunk. If `decode_unicode=True`, chunks are decoded using `r.encoding`. If `stream=True` was used and `chunk_size=None`, iterates by transport chunks. Automatically handles `gzip`/`deflate` decoding.
*   `iter_lines(chunk_size=512, decode_unicode=False, delimiter=None)`: Iterates over the response data line by line. `decode_unicode` decodes using `r.encoding`. If `stream=True`, avoids reading entire content into memory. Provide fallback encoding via `r.encoding` if server doesn't specify. Not reentrant safe.
*   `close()`: Releases the connection back to the pool. Necessary if using `stream=True` and not consuming the entire body or using a `with` statement.

**Status Code Lookup:**

*   `requests.codes`: Object providing access to status codes via names (e.g., `requests.codes.ok`, `requests.codes.not_found`). Equivalent to integer codes (e.g., `requests.codes.ok == 200`).

### Session Objects (`requests.Session`)

*   **Purpose:** Persists parameters (cookies, headers, auth, proxies, etc.) across multiple requests. Uses `urllib3` connection pooling for performance gains when hitting the same host.
*   **Usage:** Instantiate `requests.Session()`, then call request methods (`get`, `post`, etc.) on the session object.
    ```python
    s = requests.Session()
    s.auth = ('user', 'pass')
    s.headers.update({'x-test': 'true'})

    # Makes request with auth and x-test header
    r1 = s.get('https://httpbin.org/headers')

    # Makes request with auth and BOTH x-test and x-test2 headers
    # (method-level headers merged with/override session headers)
    r2 = s.get('https://httpbin.org/headers', headers={'x-test2': 'true'})

    # Persists cookies automatically
    s.get('https://httpbin.org/cookies/set/sessioncookie/123456789')
    r = s.get('https://httpbin.org/cookies')
    print(r.text) # Shows 'sessioncookie'
    ```
*   **Context Manager:** Sessions can be used as context managers to ensure they are closed.
    ```python
    with requests.Session() as s:
        s.get('...')
    ```
*   **Overriding Session Params:** Set a parameter to `None` at the method level to omit a session-level key (e.g., `s.get(url, headers={'x-test': None})`).
*   **Session Attributes:** Session-level settings like `headers`, `auth`, `proxies`, `hooks`, `params`, `verify`, `cert`, `cookies` can be set directly on the Session object.
*   **Environment Settings:** Session objects do not automatically merge environment settings (like `REQUESTS_CA_BUNDLE`). Use `s.merge_environment_settings(url, proxies, stream, verify, cert)` to get settings suitable for `s.send()`.

### Authentication

*   **Basic Auth:**
    ```python
    from requests.auth import HTTPBasicAuth
    requests.get(url, auth=HTTPBasicAuth('user', 'pass'))
    # Shorthand:
    requests.get(url, auth=('user', 'pass'))
    ```
*   **Digest Auth:**
    ```python
    from requests.auth import HTTPDigestAuth
    requests.get(url, auth=HTTPDigestAuth('user', 'pass'))
    ```
*   **netrc:** If `auth` is not provided, Requests attempts to find credentials in `~/.netrc` (or `~/_netrc`, or path in `NETRC` env var) for the hostname and uses Basic Auth if found. Overrides `Authorization` header set via `headers=`.
*   **OAuth 1/2:** Requires the `requests-oauthlib` library (mentioned in docs, not included by default).
    ```python
    # Example for OAuth 1 (requires requests_oauthlib)
    # from requests_oauthlib import OAuth1
    # auth = OAuth1(app_key, app_secret, user_token, user_secret)
    # requests.get(url, auth=auth)
    ```
*   **Custom Auth:** Create a class inheriting from `requests.auth.AuthBase` and implement `__call__(self, r)`. The method should modify the request object `r` (e.g., add headers) and return it.
    ```python
    from requests.auth import AuthBase
    class PizzaAuth(AuthBase):
        def __init__(self, username):
            self.username = username
        def __call__(self, r):
            r.headers['X-Pizza'] = self.username
            return r
    requests.get(url, auth=PizzaAuth('kenneth'))
    ```
*   **Other:** Kerberos (`requests-kerberos`), NTLM (`requests-ntlm`) mentioned as available extensions.

### SSL Verification & Certificates

*   **Verification:** Enabled by default (`verify=True`). Uses `certifi` package for CA bundle. Raises `requests.exceptions.SSLError` on verification failure. Disable with `verify=False` (INSECURE). Provide path to custom CA bundle/dir with `verify='/path/to/ca.pem'`.
*   **Client Certificates:** Use `cert` parameter: `cert='/path/client.pem'` or `cert=('/path/client.crt', '/path/client.key')`. Key must be unencrypted.
*   **SNI (Server Name Indication):** Needed for hosts using virtual hosting with SSL. Python 3 includes native support. Errors like "hostname doesn't match" on Python 2.7 might indicate missing SNI support (though Python 2 is no longer supported by Requests).

### Proxies

*   **Configuration:**
    *   Per-request: `proxies` dict argument.
    *   Per-session: `session.proxies = {...}` (Note: may be overridden by environment variables unless specified per-request).
    *   Environment Variables: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`, `NO_PROXY` (and uppercase variants).
*   **Format:** `proxies = {'http': 'http://user:pass@host:port', 'https': 'socks5://host:port'}`. URLs must include scheme.
*   **Specific Hosts:** `proxies = {'http://example.com': 'http://proxy.local:8080'}`.
*   **SOCKS:** Requires `pip install 'requests[socks]'`. Use scheme `socks5://` (client-side DNS) or `socks5h://` (proxy-side DNS).
*   **HTTPS Proxies:** Often require trusting the proxy's root CA. Set `REQUESTS_CA_BUNDLE` or `CURL_CA_BUNDLE` env var to the proxy's CA bundle path.

### Advanced Usage

*   **Prepared Requests:** Manually create a `Request`, prepare it into a `PreparedRequest` (applying session state if using `Session.prepare_request`), modify it, then send using `Session.send()`.
    ```python
    from requests import Request, Session
    s = Session()
    req = Request('POST', url, data=data, headers=headers)
    # Apply session cookies, headers, etc.
    prepped = s.prepare_request(req)
    # Modify prepared request
    prepped.body = b'Specific body'
    del prepped.headers['Content-Type']
    # Merge env settings if needed
    settings = s.merge_environment_settings(prepped.url, {}, None, None, None)
    resp = s.send(prepped, **settings)
    ```
*   **Transport Adapters:** Mechanism to define interaction methods per HTTP service. Mount adapters onto a `Session` for specific URL prefixes. Default is `HTTPAdapter` using `urllib3`. Allows custom SSL versions, retry logic, etc.
    ```python
    from requests.adapters import HTTPAdapter
    from urllib3.util import Retry

    s = requests.Session()
    # Example: Add automatic retries
    retries = Retry(total=3, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retries)
    s.mount('http://', adapter)
    s.mount('https://', adapter)
    ```
*   **Keep-Alive:** Automatic within a `Session` due to `urllib3` connection pooling. Ensure response body is consumed (`stream=False` or read `r.content` or use `iter_*`) or `r.close()` is called to release connection back to pool.
*   **Blocking IO:** Requests is blocking by default. For async, consider libraries like `requests-threads`, `grequests`, `requests-futures`, or `httpx` (mentioned in docs).

### Exceptions

Base exception: `requests.exceptions.RequestException`

Common subclasses:

*   `requests.exceptions.ConnectionError`: Network problems (DNS failure, refused connection).
*   `requests.exceptions.HTTPError`: Raised by `response.raise_for_status()` for 4xx/5xx responses.
*   `requests.exceptions.Timeout`: Request timed out (base class for ConnectTimeout, ReadTimeout).
    *   `requests.exceptions.ConnectTimeout`
    *   `requests.exceptions.ReadTimeout`
*   `requests.exceptions.TooManyRedirects`: Exceeded maximum redirection limit.
*   `requests.exceptions.URLRequired`: Invalid URL provided.
*   `requests.exceptions.RequestException`: Base class for all Requests exceptions.
*   `requests.exceptions.JSONDecodeError`: Failed to decode JSON response.
*   `requests.exceptions.SSLError`: SSL verification failed.
*   `requests.exceptions.InvalidURL`: Invalid URL format (e.g., bad escape sequence). (Mentioned in 2.x migration notes context).
*   `requests.exceptions.MissingSchema`: Proxy URL missing scheme (e.g., `10.10.1.10:3128` instead of `http://10.10.1.10:3128`). (Mentioned in 2.x migration notes context).
*   `requests.exceptions.ChunkedEncodingError`: Incorrect chunked encoding received. (Mentioned in 2.x migration notes context).

### Utilities

*   **Cookies:**
    *   `requests.utils.dict_from_cookiejar(cj)`: Returns dict from CookieJar.
    *   `requests.utils.add_dict_to_cookiejar(cj, cookie_dict)`: Adds dict items to CookieJar.
    *   `requests.cookies.cookiejar_from_dict(cookie_dict, cookiejar=None, overwrite=True)`: Returns RequestsCookieJar from dict.
    *   `requests.cookies.RequestsCookieJar`: Dict-like CookieJar object.
    *   `requests.cookies.CookieConflictError`: Exception for cookie conflicts.
*   **Encodings:**
    *   `requests.utils.get_encodings_from_content(content)`: Returns encodings from HTML/XML content string.
    *   `requests.utils.get_encoding_from_headers(headers)`: Returns encoding specified in `Content-Type` header.
    *   `requests.utils.get_unicode_from_response(r)`: Returns unicode string from response, trying multiple methods.

### Installation

```bash
python -m pip install requests
```