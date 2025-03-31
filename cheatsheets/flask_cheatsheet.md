## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of the Flask web framework based on its core documentation. It's designed to help you, an LLM agent, quickly grasp Flask's fundamental concepts, main APIs, common patterns, and essential procedures like setup, testing, and deployment. The information is self-contained and extracted solely from the provided documentation snippets. You should be able to use this cheatsheet to start writing basic Flask applications and understand its key components.

---

## Flask Cheatsheet

### Core Concepts

*   **Microframework:** Flask aims to keep the core simple but extensible. It doesn't include database abstraction, form validation, etc., by default, relying on extensions.
*   **WSGI:** Flask is a WSGI application framework. It requires a WSGI server (like Gunicorn, uWSGI, Waitress, or the built-in development server) to run.
*   **Application Object:** The central object is an instance of the `flask.Flask` class. It's explicitly created, usually passing `__name__` to determine the root path for resources.
*   **Routing:** Maps URLs to view functions using the `@app.route()` decorator or `app.add_url_rule()`. Supports variable parts (`<variable>`) and converters (`<converter:variable>`). Ensures unique URLs with trailing slash redirection rules.
*   **Views:** Functions decorated with `@app.route()` that handle requests and return responses.
*   **Templates:** Uses Jinja2 for rendering templates (usually HTML). Supports template inheritance (`{% extends %}`, `{% block %}`), control structures (`{% if %}`, `{% for %}`), and expressions (`{{ variable }}`). Autoescaping is enabled for HTML files by default.
*   **Context Locals:** Special objects (proxies) that act like global variables but are specific to a context (like a request or application thread/coroutine).
    *   **Request Context:** Active during a request. Provides `request` and `session` proxies. Pushed automatically during a request or manually via `app.test_request_context()`.
    *   **Application Context:** Active when the application is handling a request or CLI command. Provides `current_app` and `g` proxies. Pushed automatically with a request context or manually via `app.app_context()`.
*   **Request Object (`request`):** A context-local proxy providing access to incoming request data (form data, URL arguments, files, cookies, headers, etc.).
*   **Session Object (`session`):** A context-local proxy (dict-like) for storing user-specific data across requests. Uses cryptographically signed cookies by default, requiring a `SECRET_KEY`.
*   **Application Globals (`g`):** A context-local namespace object for storing data during an application context (typically, during a single request or CLI command). Useful for managing resources like database connections.
*   **Current App (`current_app`):** A context-local proxy pointing to the application handling the current request or activity.
*   **Blueprints:** Organize an application into reusable components. They record operations (like routes, error handlers) to be registered on an application later, potentially multiple times or under different URL prefixes/subdomains.
*   **Configuration:** Handled via the `app.config` attribute (a dict subclass). Can be loaded from objects, files (Python, JSON, TOML, etc.), or environment variables.
*   **Error Handling:** Use `@app.errorhandler()` or `app.register_error_handler()` to register functions that handle specific exceptions or HTTP status codes. Use `abort()` to raise HTTP exceptions.
*   **Signals:** Uses the Blinker library for dispatching notifications on events (e.g., `request_started`, `template_rendered`). Subscribed to using `signal.connect()`.
*   **Class-Based Views:** Use `flask.views.View` or `flask.views.MethodView` for object-oriented view implementation. `MethodView` dispatches to methods based on HTTP request method (e.g., `get()`, `post()`).
*   **Command Line Interface (CLI):** Provided by the `flask` command (using Click). Supports built-in commands (`run`, `shell`), extension commands, and custom application commands defined with `@app.cli.command()`.
*   **Testing:** Flask provides utilities for testing:
    *   `app.test_client()`: Makes requests to the app without a live server.
    *   `app.test_cli_runner()`: Runs CLI commands.
    *   `app.app_context()`, `app.test_request_context()`: Push contexts manually for testing specific code units.
*   **Extensions:** Packages that add functionality (e.g., database integration, forms). Usually follow an `init_app` pattern to bind to an application instance, supporting the factory pattern.
*   **Async/Await:** Supports `async def` views (requires `flask[async]`). Runs coroutines in a thread, not natively ASGI. Performance benefits mainly for concurrent I/O. Background tasks via `asyncio.create_task` are not reliably supported in standard WSGI deployment.

### Basic Application Structure

```python
# 1. Import Flask
from flask import Flask, request, render_template, url_for, redirect, flash, session, g, jsonify, make_response, abort

# 2. Create Application Instance
#    '__name__' helps Flask find templates/static files.
#    'instance_relative_config=True' loads config from instance folder.
app = Flask(__name__, instance_relative_config=True)

# 3. Configuration (examples)
app.config.from_mapping(
    SECRET_KEY='dev_secret_key', # REQUIRED for sessions/flashing. Change in production!
    DATABASE='/path/to/database.sqlite',
    DEBUG=False # Default: False. Set via 'flask run --debug' or FLASK_DEBUG=1
)
# Load optional instance config (e.g., production secrets)
app.config.from_pyfile('config.py', silent=True)
# Load from environment variables (e.g., FLASK_SERVER_NAME='example.com')
app.config.from_prefixed_env()

# 4. Define Routes and View Functions
@app.route('/')
def index():
    return '<h1>Hello, World!</h1>'

@app.route('/user/<username>')
def show_user_profile(username):
    # Access variable part from URL
    from markupsafe import escape
    return f'User: {escape(username)}'

@app.route('/post/<int:post_id>')
def show_post(post_id):
    # Use converter for type checking (int, float, path, uuid, string, any)
    return f'Post ID: {post_id}'

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Access form data: request.form['username']
        # Access query params: request.args.get('next')
        # Access JSON data: request.json
        # Access uploaded files: request.files['the_file']
        # Access cookies: request.cookies.get('user_id')
        username = request.form.get('username')
        password = request.form.get('password')
        # ... validate user ...
        if valid_login(username, password):
            session['user_id'] = get_user_id(username) # Store in session
            flash('Login successful!', 'success') # Flash message
            return redirect(url_for('index')) # Redirect using url_for
        else:
            flash('Invalid credentials', 'error')
            return render_template('login.html', error='Invalid credentials'), 400 # Render template with error
    else: # GET request
        return render_template('login.html')

# 5. Template Rendering (Jinja2)
@app.route('/hello/')
@app.route('/hello/<name>')
def hello(name=None):
    # Looks for templates in 'templates/' folder by default
    return render_template('hello.html', person=name)

# 6. Error Handling
@app.errorhandler(404)
def page_not_found(error):
    # Return tuple: (body, status_code, headers)
    return render_template('404.html'), 404

@app.route('/admin')
def admin_only():
    if not g.user or not g.user.is_admin:
        abort(403) # Abort with Forbidden status
    return 'Admin Area'

# 7. Application Context / Request Context Management (Example: DB connection)
# import sqlite3
# def get_db():
#     if 'db' not in g:
#         g.db = sqlite3.connect(app.config['DATABASE'])
#         g.db.row_factory = sqlite3.Row
#     return g.db
#
# @app.teardown_appcontext
# def close_db(exception=None):
#     db = g.pop('db', None)
#     if db is not None:
#         db.close()

# 8. Running the Development Server (via CLI is preferred)
# if __name__ == '__main__':
#     app.run(debug=True) # Not recommended for production
```

### Running the App (CLI)

1.  **Set Environment Variables (Optional, or use `.flaskenv` / `.env`)**
    *   `FLASK_APP=your_module_name` (e.g., `hello` if saved as `hello.py`)
    *   `FLASK_DEBUG=1` (Enables debug mode and reloader)

2.  **Run Development Server**
    ```bash
    flask run
    # With options:
    flask --app your_app_module run --debug --host=0.0.0.0 --port=8000
    ```
    *   `--app`: Specify app module/factory (e.g., `hello`, `myapp:create_app()`). Auto-detects `app.py` or `wsgi.py`.
    *   `--debug`: Enable debug mode (reloader, debugger). **DO NOT USE IN PRODUCTION.**
    *   `--host=0.0.0.0`: Make server externally visible.
    *   `--port`: Set port number.

3.  **Run Interactive Shell**
    ```bash
    flask shell
    ```
    *   Provides a Python shell with an active application context (`current_app`, `g`).

### Routing Details

*   **Decorator:** `@app.route(rule, **options)`
*   **Function:** `app.add_url_rule(rule, endpoint=None, view_func=None, **options)`
*   **`rule`:** URL pattern string.
*   **Variable Parts:** `<variable_name>`, `<converter:variable_name>`. Converters: `string` (default), `int`, `float`, `path`, `uuid`, `any`.
*   **`endpoint`:** Name for URL generation with `url_for()`. Defaults to view function name.
*   **`methods`:** List of allowed HTTP methods (e.g., `['GET', 'POST']`). Default is `['GET']` (+ `HEAD`, `OPTIONS`).
*   **`defaults`:** Dict of default values for URL variables.
*   **`subdomain`:** Rule for subdomain matching.
*   **Trailing Slashes:**
    *   Rule ends with `/` (e.g., `/projects/`): Accessing without slash redirects *to* slash.
    *   Rule does not end with `/` (e.g., `/about`): Accessing *with* slash gives 404.
*   **URL Building:** `url_for(endpoint_name, **values)` generates URLs. Use `.` prefix for endpoint within the same blueprint (e.g., `url_for('.index')`). Unknown values become query parameters.

### Request Handling Lifecycle

1.  WSGI server calls Flask app (`wsgi_app`).
2.  App Context and Request Context are pushed (`current_app`, `g`, `request`, `session` become available).
3.  Session is opened.
4.  URL rule matching occurs.
5.  `request_started` signal sent.
6.  `url_value_preprocessor` functions run.
7.  `before_request` functions run. If one returns a response, subsequent `before_request` and the view function are skipped.
8.  If URL matched, the view function is called. If not, error handling starts.
9.  View function returns a value.
10. If an exception occurred and an `errorhandler` matches, it's called to return a response.
11. Return value (from view, before_request, or errorhandler) is converted into a `Response` object.
12. `after_this_request` functions run.
13. `after_request` functions run (can modify response).
14. Session is saved.
15. `request_finished` signal sent.
16. If an unhandled exception occurred, default error handling (500) or HTTP exception handling occurs. `got_request_exception` signal sent.
17. Response sent back to WSGI server.
18. `teardown_request` functions run.
19. `request_tearing_down` signal sent.
20. Request context popped (`request`, `session` unavailable).
21. `teardown_appcontext` functions run.
22. `appcontext_tearing_down` signal sent.
23. App context popped (`current_app`, `g` unavailable).
24. `appcontext_popped` signal sent.

### Context Locals (Proxies)

*   **`request`:** Represents the current incoming request. Attributes:
    *   `method`: HTTP method (e.g., `'GET'`, `'POST'`).
    *   `args`: Parsed URL query parameters (`MultiDict`).
    *   `form`: Parsed form data from POST/PUT (`MultiDict`).
    *   `values`: Combined `args` and `form` (`CombinedMultiDict`).
    *   `files`: Uploaded files (`FileStorage` objects in a `MultiDict`).
    *   `cookies`: Cookies sent by client (dict).
    *   `headers`: Request headers (`EnvironHeaders`).
    *   `data`: Raw request body as bytes.
    *   `json`: If `Content-Type` is `application/json`, parsed JSON data, else `None`.
    *   `environ`: Raw WSGI environment dict.
    *   `url`: Full request URL.
    *   `path`: Path part of the URL.
    *   `script_root`: Path the application is mounted under.
    *   `host`: Hostname requested by client.
    *   `remote_addr`: Client's IP address.
    *   `max_content_length`: Max bytes to read for request body.
    *   `max_form_memory_size`: Max bytes for non-file form parts.
    *   `max_form_parts`: Max number of form parts.
*   **`session`:** Dictionary-like object for storing data across requests for a single user. Requires `app.secret_key`. Attributes:
    *   `modified`: Set to `True` to force saving, needed when modifying mutable structures in the session.
    *   `permanent`: If `True`, session lasts for `PERMANENT_SESSION_LIFETIME`. Default is `False` (browser session).
    *   `new`: `True` if the session was newly created.
*   **`current_app`:** Proxy to the active Flask application instance.
*   **`g`:** General purpose namespace object bound to the application context. Use for request-scoped resources (like DB connections). Reset for each request/CLI command. Is an instance of `flask.ctx._AppCtxGlobals` by default.
*   **Accessing Proxied Object:** Use `proxy._get_current_object()` (e.g., `current_app._get_current_object()`) if the actual object is needed (e.g., for signals).

### Responses

*   View functions return values that Flask converts into a `Response` object.
*   **Return Types & Conversion:**
    *   `Response` object: Returned directly.
    *   `str` (HTML): Body = string, Status = 200, Mimetype = `text/html`.
    *   `bytes`: Body = bytes, Status = 200, Mimetype = `text/html`.
    *   `dict` or `list`: Passed to `jsonify()`. Status = 200, Mimetype = `application/json`.
    *   `tuple`: `(body, status)`, `(body, headers)`, or `(body, status, headers)`.
    *   Iterator/Generator: Treated as a streaming response. Use `stream_with_context()` if request context is needed inside the generator.
    *   WSGI callable: Converted to a `Response` object.
*   **`make_response(*args)`:** Explicitly create a `Response` object from a view return value to modify it before returning.
*   **`Response` Object Attributes/Methods:**
    *   `data`: Response body as bytes.
    *   `status_code`: HTTP status code (int).
    *   `headers`: Dictionary-like object for response headers.
    *   `mimetype`: Content type.
    *   `set_cookie(key, value='', max_age=None, expires=None, path='/', domain=None, secure=False, httponly=False, samesite=None)`: Sets a cookie.

### Templates (Jinja2)

*   **Rendering:**
    *   `render_template(template_name_or_list, **context)`: Renders template from `templates` folder.
    *   `render_template_string(source, **context)`: Renders template from a string.
    *   `stream_template()`, `stream_template_string()`: Render template incrementally (streaming).
*   **Default Context:** `config`, `request`, `session`, `g`, `url_for()`, `get_flashed_messages()`.
*   **Autoescaping:** Enabled by default for `.html`, `.htm`, `.xml`, `.xhtml`, `.svg`.
    *   Disable: Use `|safe` filter (e.g., `{{ my_html|safe }}`) or `{% autoescape false %}...{% endautoescape %}` block.
    *   Wrap trusted HTML in `markupsafe.Markup` object in Python code.
*   **Template Inheritance:**
    *   `{% extends "base.html" %}`: Inherit from a base template. Must be first tag.
    *   `{% block block_name %}...{% endblock %}`: Define blocks in base template to be overridden by child templates.
    *   `{{ super() }}`: Render the content of the parent block within a child block.
*   **Custom Filters:** Use `@app.template_filter('filter_name')` decorator or `app.jinja_env.filters['filter_name'] = my_filter_func`.
*   **Context Processors:** Use `@app.context_processor` decorator on a function that returns a dict. The dict's items are injected into the context of all templates.

### Configuration (`app.config`)

*   Dictionary-like object holding configuration. Access via `app.config['KEY']`.
*   **Loading:**
    *   `app.config.from_mapping(key=value, ...)` or `app.config.update(...)`: Direct key-value pairs.
    *   `app.config.from_object('python.module.or.Class')`: Loads uppercase variables from a module or class.
    *   `app.config.from_pyfile('filename.cfg', silent=False)`: Loads uppercase variables from a Python file. Relative paths can be instance-relative if `instance_relative_config=True`.
    *   `app.config.from_envvar('ENV_VAR_NAME', silent=False)`: Loads from file specified by an environment variable.
    *   `app.config.from_file("config.json", load=json.load)`: Load from data files (JSON, TOML etc.) using a load function.
    *   `app.config.from_prefixed_env(prefix='FLASK', loads=json.loads)`: Load from environment variables starting with `prefix`. Parses values using `loads` function. Double underscores (`__`) denote nesting.
*   **Instance Folder:** (`instance_relative_config=True`) A folder outside the package (`instance/` or `$PREFIX/var/myapp-instance`) for non-version-controlled files (config, DB). Path in `app.instance_path`. Load instance config with `app.config.from_pyfile('config.py', silent=True)`.
*   **Key Built-in Values:**
    *   `SECRET_KEY`: **Required** for sessions, flashing, CSRF protection. Should be long, random bytes/string. Keep secret.
    *   `DEBUG`: Enable/disable debug mode. **Never enable in production.** Best set via `flask run --debug` or `FLASK_DEBUG=1`.
    *   `TESTING`: Enable test mode (propagates exceptions, may alter extension behavior).
    *   `SERVER_NAME`: Hostname/port for the app (e.g., `'example.com:5000'`). Needed for subdomain matching and external URL generation outside request context.
    *   `APPLICATION_ROOT`: Path the app is mounted under (e.g., `'/myapp'`). Default `'/'`.
    *   `SESSION_COOKIE_NAME`, `_DOMAIN`, `_PATH`, `_HTTPONLY`, `_SECURE`, `_SAMESITE`, `_PARTITIONED`: Control session cookie attributes.
    *   `PERMANENT_SESSION_LIFETIME`: `timedelta` or `int` (seconds) for permanent session duration. Default 31 days.
    *   `MAX_CONTENT_LENGTH`: Max size for incoming request body in bytes.
    *   `MAX_FORM_MEMORY_SIZE`: Max size for non-file multipart form fields. Default 500kB.
    *   `MAX_FORM_PARTS`: Max number of multipart form fields. Default 1000.
    *   `TEMPLATES_AUTO_RELOAD`: Reload templates if changed (enabled in debug mode by default).
    *   `EXPLAIN_TEMPLATE_LOADING`: Log template loading steps for debugging.
    *   `USE_X_SENDFILE`: Enable `X-Sendfile` header for efficient file serving via web server (Apache, Nginx).

### Blueprints

*   Organize views, templates, static files, and other code into components.
*   Create instance: `bp = Blueprint('blueprint_name', __name__, url_prefix='/prefix', static_folder='static', template_folder='templates', subdomain='sub')`
*   Register on app: `app.register_blueprint(bp)`
*   Routes/Error Handlers: Use `@bp.route()`, `@bp.errorhandler()`, etc.
*   URL Generation: Endpoint names are prefixed with blueprint name (e.g., `url_for('blueprint_name.view_name')`).
*   Resources:
    *   `template_folder`: Added to template search path (lower priority than app's).
    *   `static_folder`: Served at `blueprint_url_prefix/static` (endpoint `blueprint_name.static`). Needs `url_prefix` to be accessible.
*   Nesting: Register a blueprint on another blueprint: `parent.register_blueprint(child)`. Names and URL prefixes are nested.
*   Blueprint-specific URL Processors: `@bp.url_defaults`, `@bp.url_value_preprocessor`.

### Error Handling

*   **Registering Handlers:**
    *   `@app.errorhandler(code_or_exception)`
    *   `app.register_error_handler(code_or_exception, func)`
    *   Can register for HTTP status codes (e.g., `404`), `HTTPException` subclasses (e.g., `werkzeug.exceptions.NotFound`), or any exception class.
*   **Aborting:** `abort(code_or_exception, description=None)` raises an `HTTPException`.
*   **Handler Logic:** Handler function receives the exception instance. Must return a valid response (e.g., `render_template('error.html'), 404`).
*   **Blueprint Handlers:** Take precedence over app handlers if blueprint handles the request. Cannot handle 404 routing errors directly.
*   **Generic Handlers:** Handlers for `HTTPException` or `Exception` catch broad ranges of errors. Use with caution.
*   **Unhandled Exceptions:** If no handler is registered, `HTTPException`s become simple error pages, others become 500 Internal Server Error. In debug mode, debugger is shown.

### Request Hooks & Signals

*   **Request Hooks (Decorators):**
    *   `@app.before_request`: Run before each request. Can return a response to short-circuit.
    *   `@app.after_request`: Run after view function if no unhandled exception. Must take and return a response object.
    *   `@app.teardown_request`: Run at end of request, even if exception occurred. Takes exception object.
    *   `@app.teardown_appcontext`: Run when app context tears down. Takes exception object.
    *   `@app.url_defaults`: Modify values for `url_for()`.
    *   `@app.url_value_preprocessor`: Process values extracted from URL before view.
    *   `@app.context_processor`: Inject variables into template context.
*   **Signals (Blinker library):**
    *   `template_rendered`: After template rendering. Sender=app, args: `template`, `context`.
    *   `before_render_template`: Before template rendering. Sender=app, args: `template`, `context`.
    *   `request_started`: Before `before_request` handlers. Sender=app.
    *   `request_finished`: After `after_request` handlers. Sender=app, arg: `response`.
    *   `got_request_exception`: When exception handling starts. Sender=app, arg: `exception`.
    *   `request_tearing_down`: After `teardown_request` handlers. Sender=app, arg: `exc`.
    *   `appcontext_pushed`: When app context is pushed. Sender=app.
    *   `appcontext_popped`: When app context is popped. Sender=app.
    *   `appcontext_tearing_down`: After `teardown_appcontext` handlers. Sender=app, arg: `exc`.
    *   `message_flashed`: When `flash()` is called. Sender=app, args: `message`, `category`.
    *   **Connecting:** `signal.connect(receiver_func, sender=app)`
    *   **Disconnecting:** `signal.disconnect(receiver_func, sender=app)`
    *   **Context Manager:** `with signal.connected_to(receiver_func, sender=app): ...`
    *   **Sending Custom Signals:** `my_signal.send(sender, **data)`

### Message Flashing

*   Pass messages between requests (typically show on next request). Uses session.
*   `flash(message, category='message')`: Records a message.
*   `get_flashed_messages(with_categories=False, category_filter=[])`: Retrieves messages (clears them). Available in templates.

### JSON Support

*   Flask uses `flask.json` which wraps Python's `json` module.
*   `jsonify(*args, **kwargs)`: Creates a JSON `Response` object. Serializes args/kwargs. Handles dicts/lists returned from views automatically.
*   `request.json`: Parses incoming JSON request body (requires `Content-Type: application/json`).
*   Can customize JSON provider via `app.json_provider_class` or `app.json`.
*   `|tojson` filter in Jinja uses the app's JSON provider.

### Static Files

*   Served from the `static` folder (configurable via `static_folder`) next to the app module/package.
*   URL path is `/static/` (configurable via `static_url_path`).
*   Generate URL with `url_for('static', filename='path/to/file.css')`.
*   Blueprints can have their own static folders.

### Testing

*   Use `pytest`. Install `pytest` and `coverage`.
*   **Fixtures (in `tests/conftest.py`):**
    *   `app`: Creates/configures app instance for testing (`TESTING=True`). Can manage resources (e.g., temp DB).
    *   `client`: Returns `app.test_client()`.
    *   `runner`: Returns `app.test_cli_runner()`.
*   **Test Client (`client`):**
    *   Methods like `client.get(path, ...)`, `client.post(path, data=..., json=..., ...)`.
    *   Arguments: `query_string`, `headers`, `data` (form), `json` (JSON body), `follow_redirects=True`.
    *   Returns `TestResponse` object (`response.data`, `response.status_code`, `response.headers`, `response.json`).
    *   Session testing: Use `with client:` to access session after request, or `with client.session_transaction() as sess:` to modify session before request.
*   **CLI Runner (`runner`):**
    *   `runner.invoke(args=[command, arg1, ...])`.
    *   Returns `Result` object (`result.output`, `result.exit_code`).
*   **Testing Context-Bound Code:**
    *   Use `with app.app_context(): ...` to push only app context.
    *   Use `with app.test_request_context(path, method='GET', ...): ...` to push request (and app) context.

### Class-Based Views

*   `flask.views.View`: Base class. Subclass must implement `dispatch_request(**url_args)`. Register with `app.add_url_rule(rule, view_func=MyView.as_view('endpoint_name', **init_args))`.
*   `flask.views.MethodView`: Dispatches to methods named after HTTP methods (e.g., `get()`, `post()`). Automatically sets `methods` option.
*   `init_every_request`: Class attribute (default `True`). If `False`, one instance is created per `as_view` call, not per request. Use `g` for request-local data if `False`.
*   `decorators`: Class attribute, list of decorators to apply to the generated view function.
*   `methods`: Class attribute, list of HTTP methods the view supports (for `View`).

### Extensions

*   Packages adding functionality. Search PyPI (often named `Flask-Foo`).
*   Common Pattern:
    ```python
    from flask_foo import Foo
    foo = Foo() # Create instance

    def create_app():
        app = Flask(__name__)
        app.config['FOO_SETTING'] = 'value'
        foo.init_app(app) # Initialize with app
        return app
    ```
*   `init_app` method allows using application factory pattern.
*   Extensions might store state in `app.extensions['ext_name']`.

### Deployment

*   **DO NOT use development server (`flask run` or `app.run()`) in production.**
*   **WSGI Servers:** Need a production WSGI server. Examples:
    *   `Gunicorn`: Pure Python, easy config, async workers (gevent/eventlet). `gunicorn -w 4 'myapp:create_app()'`
    *   `Waitress`: Pure Python, Windows support, simple config. `waitress-serve --call 'myapp:create_app'`
    *   `uWSGI`: Compiled, fast, complex config. `uwsgi --http :8000 --master -p 4 -w myapp:app`
    *   `mod_wsgi`: Apache integration. `mod_wsgi-express start-server wsgi.py`
*   **Reverse Proxy:** Often needed in front of WSGI server (e.g., Nginx, Apache httpd) to handle TLS, serve static files, load balancing, etc.
    *   Configure proxy (e.g., Nginx `proxy_pass`, Apache `ProxyPass`).
    *   Proxy should set `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host`.
    *   Use `werkzeug.middleware.proxy_fix.ProxyFix` middleware in Flask app to trust headers: `app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)` (adjust counts based on proxy setup).
*   **ASGI:** To run Flask with an ASGI server (like Hypercorn, Uvicorn), wrap the Flask app: `from asgiref.wsgi import WsgiToAsgi; asgi_app = WsgiToAsgi(flask_app)`.

### Security Considerations

*   **Resource Use:** Configure `MAX_CONTENT_LENGTH`, `MAX_FORM_MEMORY_SIZE`, `MAX_FORM_PARTS`. Also rely on OS/server limits.
*   **XSS:** Jinja2 autoescaping helps. Be careful when:
    *   Generating HTML outside Jinja.
    *   Using `Markup()` or `|safe` filter on user input.
    *   Serving uploaded HTML/text files (use `Content-Disposition: attachment`).
    *   Using Jinja expressions in *unquoted* HTML attributes (always quote: `value="{{ user_input }}"`).
    *   Consider Content Security Policy (CSP) header to mitigate risks like `javascript:` URIs.
*   **CSRF:** Flask doesn't have built-in CSRF protection. Requires generating and validating tokens for state-changing requests (POST, PUT, DELETE). Often handled by extensions (like Flask-WTF).
*   **JSON:** Top-level arrays are safe in modern browsers.
*   **Security Headers:** Consider setting these response headers:
    *   `Strict-Transport-Security` (HSTS): Force HTTPS.
    *   `Content-Security-Policy` (CSP): Control resource loading.
    *   `X-Content-Type-Options: nosniff`: Prevent content sniffing.
    *   `X-Frame-Options: SAMEORIGIN`: Prevent clickjacking.
*   **Cookies:** Use `Secure`, `HttpOnly`, and `SameSite` attributes (via `app.config` for session cookie or `response.set_cookie`). Set appropriate `Expires` or `Max-Age`.

### Common Patterns

*   **Application Factories (`create_app`):** Function to create and configure app instance. Good for testing, multiple instances. Extensions use `init_app`.
*   **Packages:** Structure larger apps using Python packages instead of single modules.
*   **Blueprints:** Organize larger apps into components.
*   **Database Integration:**
    *   **SQLite:** Use built-in `sqlite3`. Manage connection with `g` and `teardown_appcontext`. Use `sqlite3.Row` factory.
    *   **SQLAlchemy:** Use Flask-SQLAlchemy extension or manage `scoped_session` manually with `teardown_appcontext`. Declarative or manual mapping.
    *   **MongoEngine:** Use Flask-MongoEngine extension.
*   **Form Validation:** Use WTForms (often via Flask-WTF extension). Define form class, instantiate with `request.form`, call `validate()`, render fields in template.
*   **Background Tasks:** Use Celery. Integrate with Flask config, use `@shared_task`, call tasks with `.delay()`.
*   **Deferred Callbacks:** Use `@after_this_request` decorator to register functions to run after the current request finishes (e.g., to set a cookie from `before_request`).
*   **Streaming:** Return a generator from a view function. Wrap generator with `stream_with_context()` if request context is needed. `stream_template()` handles templates.
*   **View Decorators:** Use `functools.wraps` to create decorators that add behavior to view functions (e.g., login checks, caching).