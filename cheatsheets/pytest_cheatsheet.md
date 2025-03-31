## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of the PyTest testing framework based on its core documentation. It covers installation, test discovery, writing tests (including assertions, fixtures, marking, and parametrization), command-line usage, configuration, plugin basics, hook system, reporting, and key API components. It aims to be a self-contained reference allowing you to quickly understand and start using PyTest for writing and running Python tests.

---

## PyTest Cheatsheet

### Core Concepts

*   **Purpose:** PyTest is a testing framework for Python, designed for writing small, readable tests that can scale to complex functional testing.
*   **Philosophy:** Favors simple `assert` statements over specific `assert*` methods, explicit dependency declaration (fixtures), and extensibility through plugins and hooks.

### Installation

*   **Requirements:** Python 3.8+ or PyPy3.
*   **Command:** `pip install -U pytest`
*   **Verify:** `pytest --version`

### Basic Usage

*   **Running Tests:**
    *   `pytest`: Runs all tests (`test_*.py` / `*_test.py`) in the current directory and subdirectories.
    *   `pytest <path/to/file.py>`: Runs tests in a specific file.
    *   `pytest <path/to/dir/>`: Runs tests in a specific directory.
    *   `python -m pytest [...]`: Similar to `pytest [...]`, but adds the current directory to `sys.path`.

### Test Discovery Conventions

PyTest finds tests automatically based on these conventions:

*   **Files:** `test_*.py` or `*_test.py`.
*   **Functions:** `test_` prefixed functions or methods outside of classes.
*   **Classes:** `Test` prefixed classes (without an `__init__` method).
*   **Methods:** `test_` prefixed methods within `Test` prefixed classes. `@staticmethod` and `@classmethod` are also collected.
*   **unittest.TestCase:** Subclasses and their `test` methods are collected.
*   **Packages:** Directories must contain an `__init__.py` file to be considered packages for import resolution in `prepend`/`append` modes. Namespace packages (PEP420) are supported but discovery still relies on `__init__.py`.
*   **Customization:** Discovery rules can be changed via :confval:`python_files`, :confval:`python_classes`, :confval:`python_functions` in configuration.
*   **Ignoring Paths:** Use `--ignore=path`, `--ignore-glob=pattern` or :confval:`norecursedirs`. Default `norecursedirs`: `'.*', '*.egg', '_darcs', 'build', 'CVS', 'dist', 'node_modules', 'venv', '{arch}'`. Virtualenvs are ignored by default unless `--collect-in-virtualenv` is used.
*   **Skipping Collection:** Set `__test__ = False` on classes or modules. Use :globalvar:`collect_ignore` or :globalvar:`collect_ignore_glob` in `conftest.py`.

### Running Specific Tests

*   **By Keyword (`-k`):**
    *   `pytest -k "MyClass and not method"`: Runs tests matching the expression (substring match, case-insensitive, supports `and`, `or`, `not`). Matches filenames, class names, function/method names, markers, and keywords.
    *   `-k "expression"`: Matches tests containing the expression.
    *   `-k "not expression"`: Excludes tests containing the expression.
*   **By Marker (`-m`):**
    *   `pytest -m slow`: Runs tests marked with `@pytest.mark.slow`.
    *   `pytest -m "mark1 and not mark2"`: Runs tests matching the marker expression.
    *   `pytest -m "device(serial='123')"`: Runs tests matching marker keyword arguments (supports `int`, `str`, `bool`, `None`).
*   **By Node ID (`::`):**
    *   `pytest path/to/test_mod.py::test_func`: Runs a specific function.
    *   `pytest path/to/test_mod.py::TestClass`: Runs all methods in a class.
    *   `pytest path/to/test_mod.py::TestClass::test_method`: Runs a specific method.
    *   `pytest path/to/test_mod.py::test_func[param]`: Runs a specific parametrization variant.
*   **By Package (`--pyargs`):**
    *   `pytest --pyargs pkg.testing`: Finds and runs tests from the installed package location.
*   **From File (`@`):**
    *   `pytest @tests.txt`: Reads arguments (one per line) from `tests.txt`.

### Assertions

*   **Basic Assertions:** Use plain `assert` statements. PyTest provides detailed introspection on failures.
    ```python
    def test_addition():
        assert 1 + 1 == 2
    ```
*   **Assertion Messages:** Custom messages are shown alongside introspection.
    ```python
    assert value % 2 == 0, "value should be even"
    ```
*   **Assertion Introspection:** PyTest rewrites `assert` statements in test modules to provide detailed failure information.
    *   Rewriting only applies to test modules and registered plugins/modules.
    *   Enable rewriting for helper modules: `pytest.register_assert_rewrite("myhelper")`.
    *   Disable rewriting per module: Add `"PYTEST_DONT_REWRITE"` to the module docstring.
    *   Disable globally: `pytest --assert=plain`.
    *   Rewritten modules are cached (usually `.pyc` files). Caching can be disabled (`sys.dont_write_bytecode = True` in `conftest.py`).

### Exception Testing

*   **`pytest.raises`:** Assert that a block of code raises an exception.
    ```python
    import pytest

    def test_raises_value_error():
        with pytest.raises(ValueError):
            raise ValueError("oops")

    def test_raises_with_info():
        with pytest.raises(RuntimeError) as excinfo:
            raise RuntimeError("some message")
        assert "some message" in str(excinfo.value)
        assert excinfo.type is RuntimeError

    # Match exception message content (regex search)
    with pytest.raises(ValueError, match=r"must be \d+"):
        raise ValueError("value must be 42")
    ```
    *   `excinfo` is an `ExceptionInfo` object with `.type`, `.value`, `.traceback`.
    *   Matches subclasses by default. Check `excinfo.type is ExpectedException` for exact type match.
*   **`pytest.RaisesGroup`:** Assert for :exc:`ExceptionGroup` or :exc:`BaseExceptionGroup`.
    ```python
    def test_exception_in_group():
        with pytest.RaisesGroup(ValueError, TypeError):
            raise ExceptionGroup("msg", [ValueError("foo"), TypeError("bar")])

    # Match group message
    with pytest.RaisesGroup(BaseException, match="my group msg"):
        raise BaseExceptionGroup("my group msg", [KeyboardInterrupt()])

    # Check contained exceptions with pytest.RaisesExc
    with pytest.RaisesGroup(pytest.RaisesExc(ValueError, match="foo")):
        raise ExceptionGroup("", (ValueError("foo")))
    ```
    *   Use `check=callable` for custom checks on the exception group.
    *   Use `flatten_subgroups=True` or `allow_unwrapped=True` for flexible structure matching.
    *   `excinfo.group_contains(ExcType, [match=...], [depth=...])`: Check for contained exceptions (use with caution, prefer `RaisesGroup`).
*   **`pytest.fail`:** Imperatively fail a test.
    ```python
    pytest.fail("unsupported configuration", pytrace=True) # pytrace=False hides traceback
    ```
*   **`xfail(raises=...)`:** Mark a test as expected to fail with a specific exception.

### Warning Testing

*   **Automatic Capture:** PyTest captures `WARNING` level or higher logs and warnings, displaying them in a summary. Disable with `-p no:warnings` or `--disable-warnings`.
*   **Filtering:** Control warnings via `-W` flag (similar to `python -W`) or `filterwarnings` ini option.
    ```ini
    [pytest]
    filterwarnings =
        error # Treat most warnings as errors
        ignore::DeprecationWarning # Ignore specific type
        ignore:.*U.*mode is deprecated:DeprecationWarning # Ignore specific message/type
    ```
*   **`@pytest.mark.filterwarnings`:** Apply filters per test/class/module.
    ```python
    @pytest.mark.filterwarnings("ignore:api v1")
    def test_one(): ...
    ```
*   **`pytest.warns`:** Assert that a block of code emits a specific warning.
    ```python
    import warnings, pytest

    def test_warning():
        with pytest.warns(UserWarning, match="deprecated"):
            warnings.warn("deprecated API", UserWarning)

    # Record warnings without assertion
    with pytest.warns() as record:
        warnings.warn("runtime", RuntimeWarning)
    assert len(record) == 1
    assert str(record[0].message) == "runtime"
    ```
    *   Returns a `WarningsRecorder` instance (list-like).
*   **`recwarn` Fixture:** Records warnings issued during a test function's execution.
    ```python
    def test_hello(recwarn):
        warnings.warn("hello", UserWarning)
        assert len(recwarn) == 1
        w = recwarn.pop(UserWarning)
        assert str(w.message) == "hello"
    ```
    *   Also returns a `WarningsRecorder` instance.
*   **`pytest.deprecated_call`:** Check that a function call triggers `DeprecationWarning` or `PendingDeprecationWarning`.
    ```python
    with pytest.deprecated_call(match="use new_func instead"):
        old_func(1)
    ```

### Fixtures (`@pytest.fixture`)

*   **Concept:** Provide a defined, reliable context (setup/teardown) for tests via dependency injection. Replaces classic xUnit setup/teardown.
*   **Declaration:** Use the `@pytest.fixture` decorator.
    ```python
    @pytest.fixture
    def smtp_connection():
        # setup code
        conn = smtplib.SMTP(...)
        yield conn # provide the fixture value
        # teardown code
        conn.close()
    ```
*   **Requesting:** Test functions (or other fixtures) request fixtures by naming them as arguments.
    ```python
    def test_email(smtp_connection):
        # smtp_connection fixture is executed and result injected
        assert smtp_connection.send(...)
    ```
*   **Scope:** Controls fixture lifetime (`function`, `class`, `module`, `package`, `session`). Higher scopes execute first.
    ```python
    @pytest.fixture(scope="module")
    def my_module_fixture(): ...
    ```
    *   `function`: Default. Created per test function.
    *   `class`: Created once per test class.
    *   `module`: Created once per module.
    *   `package`: Created once per package (experimental).
    *   `session`: Created once per test session.
    *   Dynamic Scope: `scope=callable(fixture_name, config)` can return a scope string dynamically.
*   **Teardown/Finalization:**
    *   Use `yield`: Code after `yield` runs as teardown. (Recommended)
    *   `request.addfinalizer(callable)`: Register cleanup functions. Finalizers run LIFO.
*   **Autouse Fixtures:** Run automatically for tests within their scope. Use `@pytest.fixture(autouse=True)`. Useful for setup that doesn't return a value (e.g., `monkeypatch`, `chdir`).
*   **Parametrization:** Fixtures can be parametrized, causing dependent tests to run multiple times.
    ```python
    @pytest.fixture(params=["a", "b"])
    def my_param_fixture(request):
        return request.param # Access current parameter

    def test_with_param(my_param_fixture): # Runs twice
        assert my_param_fixture in ("a", "b")
    ```
    *   Use `ids=["id1", "id2"]` or `ids=callable` in `@pytest.fixture` to customize test IDs.
    *   Use `pytest.param(value, marks=..., id=...)` within `params` list for per-parameter marks/ids.
*   **Fixture Availability:** Fixtures defined in `conftest.py` are available to tests in or below that directory. Fixtures from installed plugins are globally available. Test discovery order: function -> class -> module -> package -> session -> plugins.
*   **`usefixtures` Marker:** Apply fixtures to tests without needing them as arguments. Useful for side-effect fixtures (e.g., setup/teardown).
    ```python
    @pytest.mark.usefixtures("db_setup", "clean_cache")
    def test_user_update(): ...

    # Apply to all tests in a module
    pytestmark = pytest.mark.usefixtures("db_setup")
    ```
*   **Overriding:** Define a fixture with the same name in a lower scope (e.g., module overrides conftest, class overrides module) to override it. The overriding fixture can request the original fixture by name.
*   **Introspection (`request` fixture):** Provides info about the requesting test context.
    *   `request.fixturename`: Name of the fixture.
    *   `request.scope`: Scope of the fixture.
    *   `request.cls`: Class object (if applicable).
    *   `request.module`: Module object.
    *   `request.node`: The collection node (Item, Class, Module, etc.).
    *   `request.config`: The pytest config object.
    *   `request.param`: The current parameter in a parametrized fixture.
    *   `request.getfixturevalue(name)`: Get another fixture's value dynamically.
    *   `request.addfinalizer(callable)`: Register a teardown function.

#### Key Built-in Fixtures

*   `tmp_path`: Provides a `pathlib.Path` to a unique temporary directory (function scope).
*   `tmp_path_factory`: Creates temporary directories (session scope). Methods: `mktemp(basename, numbered=True)`, `getbasetemp()`.
*   `tmpdir`: Legacy version of `tmp_path` returning `py.path.local`. (Discouraged)
*   `tmpdir_factory`: Legacy version of `tmp_path_factory`. (Discouraged)
*   `monkeypatch`: Safely modify classes, methods, dicts, env vars, `sys.path`.
    *   Methods: `setattr`, `delattr`, `setitem`, `delitem`, `setenv`, `delenv`, `syspath_prepend`, `chdir`, `context`.
    *   Modifications are automatically undone after the test.
*   `capsys`/`capsysbinary`: Capture `sys.stdout`/`sys.stderr` as text/bytes. Method: `readouterr()` returns `(out, err)`. Has `disabled()` context manager.
*   `capfd`/`capfdbinary`: Capture file descriptors 1/2 as text/bytes. Method: `readouterr()` returns `(out, err)`. Has `disabled()` context manager.
*   `caplog`: Capture log records. Properties: `text`, `records`, `record_tuples`, `messages`. Methods: `set_level()`, `at_level()`, `clear()`, `get_records()`.
*   `recwarn`: Record warnings issued by code. Returns `WarningsRecorder` (list-like). Methods: `pop()`, `clear()`.
*   `pytestconfig`: Access to the `pytest.Config` object.
*   `request`: Provides information about the requesting test context.
*   `cache`: Provides `config.cache` for storing/retrieving data across test runs. Methods: `get(key, default)`, `set(key, value)`, `mkdir(name)`.
*   `doctest_namespace`: A `dict` injected into the namespace for doctests.
*   `record_property`: Add `<property>` tags to JUnit XML `testcase`.
*   `record_testsuite_property`: Add `<property>` tags to JUnit XML `testsuite`.
*   `record_xml_attribute`: Add attributes to JUnit XML `testcase`. (Experimental)
*   `pytester`/`testdir`: For testing pytest plugins. `pytester` uses `pathlib.Path`, `testdir` uses legacy `py.path.local`. Provides methods like `runpytest()`, `makepyfile()`, `makeconftest()`, `copy_example()`.

### Markers (`@pytest.mark.*`)

*   **Concept:** Apply metadata to tests for selection, skipping, xfailing, parametrization, etc.
*   **Applying:** Use `@pytest.mark.NAME(...)` decorator on functions, methods, or classes. Use `pytestmark = pytest.mark.NAME / [pytest.mark.NAME1, ...]` at module level.
*   **Running Marked Tests (`-m`):**
    *   `pytest -m NAME`: Run tests with the `NAME` marker.
    *   `pytest -m "NAME1 and not NAME2"`: Run tests matching the expression.
    *   `pytest -m "NAME(arg='value')"`: Match marker keyword arguments.
*   **Registering:** Define markers in `pytest.ini` / `pyproject.toml` / `setup.cfg` or via `pytest_configure` hook to avoid warnings and enable `--strict-markers`.
    ```ini
    [pytest]
    markers =
        slow: mark test as slow.
        serial: mark test as serial.
        webtest
    ```
*   **Listing Markers:** `pytest --markers`
*   **Strict Markers:** `pytest --strict-markers` (or `addopts = --strict-markers` in ini) fails the run if unregistered markers are used.
*   **Built-in Markers:**
    *   `skip(reason=...)`: Unconditionally skip.
    *   `skipif(condition, reason=...)`: Skip if condition is true. Condition can be bool or string.
    *   `xfail(condition=..., reason=..., raises=..., run=True, strict=False)`: Mark as expected failure.
        *   `run=False`: Don't execute the test.
        *   `raises=Exc`: Expect specific exception(s).
        *   `strict=True`: Fail the suite if the test passes (XPASS). Configurable via `xfail_strict` ini option.
    *   `parametrize(argnames, argvalues, indirect=False, ids=None, scope=None)`: Parametrize test function arguments.
    *   `usefixtures(name1, name2, ...)`: Use specified fixtures without listing them as arguments.
    *   `filterwarnings(warning_spec)`: Add warning filter for the test item.
*   **Marking Parametrized Tests:** Use `pytest.param(value, marks=..., id=...)` within the `argvalues` list.
    ```python
    @pytest.mark.parametrize("a, b", [
        (1, 2),
        pytest.param(3, 4, marks=pytest.mark.slow, id="slow_case"),
    ])
    def test_add(a, b): ...
    ```

### Command-Line Interface (CLI)

*   **Help:** `pytest -h` / `pytest --help`
*   **Version:** `pytest --version` (add `-V` again for plugin info)
*   **Select Tests:**
    *   `pytest path/to/test.py`
    *   `pytest path/to/dir/`
    *   `pytest path/to/test.py::ClassName::test_method`
    *   `pytest -k EXPRESSION` (keyword/substring matching, case-insensitive)
    *   `pytest -m MARKEXPR` (marker matching)
    *   `pytest --pyargs package.module`
    *   `pytest --deselect nodeid_prefix` (deselect tests)
    *   `pytest @args.txt` (read arguments from file)
*   **Control Execution:**
    *   `-x`, `--exitfirst`: Stop on first failure/error. (Same as `--maxfail=1`)
    *   `--maxfail=N`: Stop after N failures/errors.
    *   `--lf`, `--last-failed`: Rerun only last failures.
    *   `--ff`, `--failed-first`: Run failures first, then rest.
    *   `--nf`, `--new-first`: Run new tests first, then rest (by mtime).
    *   `--sw`, `--stepwise`: Stop on failure, continue from there next run.
    *   `--sw-skip`, `--stepwise-skip`: Like `--sw`, but ignore first failure.
*   **Output/Reporting:**
    *   `-v`, `--verbose`: Increase verbosity. Shows test names.
    *   `-vv`: More verbose. Shows full diffs (up to a limit).
    *   `-vvv`: Even more verbose (no practical effect in core pytest, but used by plugins).
    *   `-q`, `--quiet`: Decrease verbosity. Shows dots.
    *   `-qq`: Quieter.
    *   `--verbosity=LEVEL`: Set verbosity level explicitly.
    *   `-r CHARS`: Show extra summary info (f=failed, E=error, s=skipped, x=xfail, X=xpass, p=passed, P=passed w/ output, a=all except pP, A=all, N=none). Default: `fE`.
    *   `--no-fold-skipped`: Do not group skipped tests in summary.
    *   `--tb=style`: Traceback style (`auto`, `long`, `short`, `line`, `native`, `no`).
    *   `--showlocals`, `-l`: Show local variables in tracebacks.
    *   `--no-showlocals`: Hide local variables in tracebacks.
    *   `--full-trace`: Don't cut tracebacks, show trace on Ctrl+C.
    *   `--color=auto|yes|no`: Control terminal coloring.
    *   `--code-highlight=yes|no`: Control code syntax highlighting.
    *   `--durations=N`: Show N slowest test durations (0=all).
    *   `--durations-min=N`: Minimum duration (seconds) to show. Default 0.005.
    *   `--capture=method`: `fd`, `sys`, `no`, `tee-sys`. Default `fd`.
    *   `-s`: Shortcut for `--capture=no`.
    *   `--show-capture=mode`: How to show capture on failure (`no`, `stdout`, `stderr`, `log`, `all`). Default `all`.
    *   `--junit-xml=path`: Create JUnit XML report.
    *   `--pastebin=mode`: Send `failed` or `all` info to bpaste.net.
    *   `--no-header`: Disable header output.
    *   `--no-summary`: Disable final summary output.
    *   `--disable-warnings`: Disable warnings summary.
*   **Debugging:**
    *   `--pdb`: Drop into PDB on failure or Ctrl+C.
    *   `--trace`: Drop into PDB at the start of each test.
    *   `--pdbcls=mod:cls`: Use custom PDB class.
*   **Collection:**
    *   `--collect-only`, `--co`: Show collected tests, don't run.
    *   `--ignore=path`: Ignore path (multi-allowed).
    *   `--ignore-glob=pattern`: Ignore glob pattern (multi-allowed).
    *   `--confcutdir=dir`: Limit `conftest.py` discovery upwards.
    *   `--noconftest`: Don't load `conftest.py` files.
    *   `--keep-duplicates`: Don't ignore duplicate paths specified on command line.
    *   `--collect-in-virtualenv`: Don't ignore tests in virtualenvs.
    *   `--import-mode=mode`: `prepend`, `append`, `importlib`. Default `prepend`.
*   **Doctests:**
    *   `--doctest-modules`: Run doctests in `.py` modules.
    *   `--doctest-glob=pattern`: Glob pattern for doctest files (default `test*.txt`).
    *   `--doctest-report=style`: Diff format (`none`, `cdiff`, `ndiff`, `udiff`, `only_first_failure`).
    *   `--doctest-ignore-import-errors`: Ignore `ImportError` during doctest collection.
    *   `--doctest-continue-on-failure`: Run all examples in a doctest even if one fails.
*   **Plugins & Configuration:**
    *   `-p name`: Early-load plugin (`-p no:name` to disable).
    *   `--trace-config`: Show `conftest.py` loading trace.
    *   `--debug`: Store internal debug info to `pytestdebug.log`.
    *   `-c file`: Load config from specific file.
    *   `-o name=value`: Override ini option (multi-allowed).
    *   `--rootdir=path`: Force root directory.
*   **Assertion Control:**
    *   `--assert=mode`: `rewrite` (default) or `plain`.
*   **Setup/Teardown Info:**
    *   `--setup-only`: Run only fixture setup/teardown.
    *   `--setup-show`: Show fixture setup/teardown during run.
    *   `--setup-plan`: Show fixture/test execution plan, don't run.
*   **Cache:**
    *   `--cache-show[=glob]`: Show cache content.
    *   `--cache-clear`: Clear cache at start.
    *   `--lfnf=mode`: Behavior of `--lf` when no prior failures (`all`, `none`). Default `all`.
*   **Warnings & Strictness:**
    *   `-W filter`: Set Python warning filters.
    *   `--strict-markers`: Error on unregistered markers.
    *   `--strict-config`: Error on unknown ini options.
    *   `--strict`: Deprecated alias for `--strict-markers`.
*   **Misc:**
    *   `--basetemp=dir`: Specify base temporary directory (Warning: gets cleared!).
    *   `--runxfail`: Run xfail-marked tests as if not marked.

### Configuration (`pytest.ini`, `pyproject.toml`, `tox.ini`, `setup.cfg`)

*   **Discovery:** Pytest searches upward from test paths/cwd for config files in this order: `pytest.ini`, `pyproject.toml`, `tox.ini`, `setup.cfg`. The first one found determines `rootdir`.
*   **Format:**
    *   `pytest.ini` / `tox.ini`: Use `[pytest]` section.
    *   `pyproject.toml`: Use `[tool.pytest.ini_options]` table.
    *   `setup.cfg`: Use `[tool:pytest]` section (discouraged).
*   **Key Options (`ini options ref`):**
    *   `addopts = --opt1 --opt2`: Add default command-line options.
    *   `minversion = X.Y`: Require minimum pytest version.
    *   `testpaths = dir1 dir2`: Directories to search if no path given on CLI. Supports globs.
    *   `norecursedirs = .git build tmp*`: Directory patterns to ignore during collection.
    *   `python_files = test_*.py check_*.py`: Glob patterns for test module discovery.
    *   `python_classes = Test* Check*`: Prefixes/globs for test class discovery.
    *   `python_functions = test_* check_*`: Prefixes/globs for test function discovery.
    *   `markers = ...`: Register custom markers (one per line, `name: description`).
    *   `filterwarnings = ...`: Configure warning filters (one per line).
    *   `xfail_strict = True|False`: Default for xfail `strict` parameter.
    *   `log_cli = True|False`: Enable/disable live logging.
    *   `log_*`, `junit_*`, `cache_dir`, `empty_parameter_set_mark`, `faulthandler_timeout`, `usefixtures`, `pythonpath`, `required_plugins`, `console_output_style`, `verbosity_*`, `tmp_path_retention_*`, `truncation_limit_*`: See reference docs for details.

### Plugins

*   **Concept:** Extend or modify pytest's behavior.
*   **Installation:** `pip install pytest-NAME`. Found automatically via entry points.
*   **Discovery:** `pytest --trace-config` shows loaded plugins.
*   **Disabling:** `pytest -p no:NAME` or `PYTEST_ADDOPTS="-p no:NAME"`.
*   **Loading via `pytest_plugins`:** Add `pytest_plugins = ["myplugin", "another.plugin"]` to `conftest.py` or test modules. (Deprecated in non-root `conftest.py`).
*   **Writing Plugins:** Implement hook functions and/or define fixtures. Register via entry points in package metadata.
*   **Testing Plugins:** Use the `pytester` fixture (enable via `pytest_plugins = ["pytester"]` in test `conftest.py`).

### Hooks

*   **Concept:** Functions implemented by plugins/conftest to customize pytest.
*   **Implementation:** Define functions named `pytest_*` matching hook specifications.
*   **Execution:** Pytest calls all registered implementations for a hook.
*   **Argument Pruning:** Implementations only need to accept arguments they use.
*   **Ordering:** `@pytest.hookimpl(tryfirst=True)` / `@pytest.hookimpl(trylast=True)`.
*   **Wrappers:** `@pytest.hookimpl(wrapper=True)` allows code execution around other hooks via `yield`.
*   **Key Hooks (Examples):**
    *   `pytest_addoption(parser)`: Add command-line/ini options.
    *   `pytest_configure(config)`: Called after config is loaded.
    *   `pytest_collection_modifyitems(session, config, items)`: Modify collected test items.
    *   `pytest_runtest_setup(item)`, `pytest_runtest_call(item)`, `pytest_runtest_teardown(item)`: Run before/during/after test item execution.
    *   `pytest_runtest_makereport(item, call)`: Create test report object.
    *   `pytest_terminal_summary(terminalreporter, exitstatus, config)`: Add text to terminal summary.
    *   `pytest_assertrepr_compare(config, op, left, right)`: Provide custom assertion failure explanation.
    *   `pytest_generate_tests(metafunc)`: Parametrize tests dynamically.
    *   `pytest_addhooks(pluginmanager)`: Register new hook specifications.
*   **Declaring New Hooks:** Define spec functions (usually empty with docstring) and register via `pluginmanager.add_hookspecs(module_or_class)` in `pytest_addhooks`.

### Logging and Warnings

*   **Logging Capture (`caplog` fixture):**
    *   Captures logs emitted during tests.
    *   `caplog.text`: Captured text output.
    *   `caplog.records`: List of `logging.LogRecord` objects.
    *   `caplog.record_tuples`: List of `(logger_name, level, message)` tuples.
    *   `caplog.set_level(level, [logger=...])`: Set capture level.
    *   `caplog.at_level(level, [logger=...])`: Context manager for level change.
    *   `caplog.clear()`: Clear captured records.
    *   `caplog.get_records(when)`: Get records from `setup`, `call`, or `teardown` phase.
*   **Live Logging (CLI Output):**
    *   Enable: `log_cli = True` in ini or `--log-cli` flag.
    *   Options: `log_cli_level`, `log_cli_format`, `log_cli_date_format`. Output goes to `stdout`.
*   **Logging to File:**
    *   Enable: `--log-file=path` or `log_file = path` in ini.
    *   Options: `log_file_level`, `log_file_format`, `log_file_date_format`, `log_file_mode` (`w` or `a`).
*   **Warning Capture (`recwarn` fixture / default summary):**
    *   Pytest captures warnings by default and shows a summary.
    *   Disable summary: `--disable-warnings`.
    *   Disable capture plugin: `-p no:warnings`.
    *   Filter warnings: `-W filter` or `filterwarnings` ini option or `@pytest.mark.filterwarnings`.
    *   `recwarn` fixture: Records warnings during test execution. Returns `WarningsRecorder`.

### Other Features

*   **Doctests:**
    *   Run with `--doctest-modules`.
    *   Find files via `--doctest-glob=pattern` (default `test*.txt`).
    *   Configure via `doctest_optionflags`, `doctest_encoding` ini options.
    *   Use fixtures via `getfixture()` helper.
    *   Inject names via `doctest_namespace` fixture.
    *   Skip via `# doctest: +SKIP` or `pytest.skip()`.
*   **unittest Integration:**
    *   Runs `unittest.TestCase` subclasses automatically.
    *   Supports most `unittest` features (`setUp`, `tearDown`, `@skip`, etc.).
    *   Pytest marks (`skip`, `skipif`, `xfail`) work.
    *   Pytest `autouse` fixtures work.
    *   Regular pytest fixtures (via argument injection) and parametrization *do not* work.
*   **xUnit Setup/Teardown:**
    *   `setup_module(module)`, `teardown_module(module)`
    *   `setup_class(cls)`, `teardown_class(cls)` (use `@classmethod`)
    *   `setup_method(self, method)`, `teardown_method(self, method)`
    *   `setup_function(function)`, `teardown_function(function)`
    *   Note: Teardown is skipped if setup fails. Integrated with fixture scopes since pytest 4.2.
*   **Floating Point Comparison (`pytest.approx`):**
    *   `assert actual == pytest.approx(expected, rel=..., abs=..., nan_ok=...)`
    *   Works with numbers, numpy arrays, dicts/sequences of numbers.
*   **Debugging:**
    *   `--pdb`: Enter PDB on failure.
    *   `--trace`: Enter PDB at start of each test.
    *   `import pdb; pdb.set_trace()` or `breakpoint()` (Python 3.7+): Set breakpoints in code. Pytest disables capture automatically.
*   **Fault Handler:** Enabled by default. Dumps tracebacks on segfaults. `faulthandler_timeout=X` ini option dumps tracebacks for tests exceeding X seconds. Disable with `-p no:faulthandler`.
*   **Unhandled Exception Warnings:** Detects unraisable exceptions (e.g., in `__del__`) and unhandled thread exceptions. Issues `PytestUnraisableExceptionWarning` / `PytestUnhandledThreadExceptionWarning`. Disable with `-p no:unraisableexception` / `-p no:threadexception`.
*   **Bash Completion:** Requires `argcomplete`. Setup via `activate-global-python-argcomplete` or `register-python-argcomplete pytest`.

### Key API Objects

*   **`pytest.Config`:** Configuration object, accessible via `pytestconfig` fixture or hooks. Contains options, paths (`rootpath`, `inipath`), plugin manager (`pluginmanager`), cache (`cache`), hook relay (`hook`).
*   **`pytest.Session`:** Represents the test session. Root of the collection tree.
*   **`pytest.Item`:** Base class for test items (runnable nodes).
*   **`pytest.Collector`:** Base class for collection nodes (collects items/collectors).
*   **Nodes:** `pytest.Package`, `pytest.Module`, `pytest.Class`, `pytest.Function`, `pytest.File`, `pytest.Dir`, `pytest.Directory`. Nodes form the collection tree. Access via `request.node`, `item`, etc. Key attributes: `name`, `parent`, `config`, `session`, `path`, `nodeid`, `keywords`, `stash`. Methods: `getparent()`, `iter_markers()`, `get_closest_marker()`, `add_marker()`.
*   **`pytest.FixtureRequest` (`request` fixture):** Provides context about the requesting test/fixture.
*   **`pytest.Metafunc`:** Passed to `pytest_generate_tests` hook for parametrization. Methods: `parametrize()`. Attributes: `fixturenames`, `function`, `cls`, `module`, `config`.
*   **`pytest.Mark`:** Represents a mark applied to an item. Attributes: `name`, `args`, `kwargs`.
*   **`pytest.MarkDecorator`:** Object returned by `pytest.mark.NAME`.
*   **`pytest.MarkGenerator` (`pytest.mark`):** Factory for creating `MarkDecorator` objects.
*   **`pytest.ExceptionInfo`:** Wrapper around exceptions caught by `pytest.raises`. Attributes: `type`, `value`, `traceback`. Methods: `match()`, `group_contains()`.
*   **`pytest.RaisesGroup` / `pytest.RaisesExc`:** Context managers for asserting :exc:`ExceptionGroup`.
*   **`pytest.TestReport` / `pytest.CollectReport`:** Objects representing test/collection outcomes, passed to reporting hooks. Attributes: `nodeid`, `location`, `keywords`, `outcome` ('passed', 'failed', 'skipped'), `longrepr`, `when` ('setup', 'call', 'teardown'), `duration`.
*   **`pytest.Parser`:** For adding options via `pytest_addoption`. Methods: `addoption()`, `getgroup()`.
*   **`pytest.OptionGroup`:** Group for options added via `Parser`.
*   **`pytest.Stash` / `pytest.StashKey`:** Type-safe storage on nodes/config for plugins.
*   **`pytest.ExitCode`:** Enum representing pytest exit codes (0: OK, 1: FAILED, 2: INTERRUPTED, 3: INTERNALERROR, 4: USAGEERROR, 5: NOTESTSCOLLECTED).

### Deprecations & Removals (Summary)

*   **Removed (Recent):** Python 3.7 support (pytest 8.0), `pytest.Instance` collector (7.0), `--result-log` (6.0), `junit_family` default change (6.0), `yield_fixture` alias (6.2), various internal/deprecated APIs in major versions.
*   **Deprecated:** `fspath` arg for Node constructors (use `path`), `py.path.local` hook args (use `pathlib.Path` args), direct construction of internal classes, `pytest.warns(None)`, `msg=` in `pytest.fail/skip/exit` (use `reason=`), applying marks to fixture functions, returning non-None from tests, nose support (setup/teardown, @with_setup).

### Backwards Compatibility Policy

*   Pytest aims for smooth transitions.
*   **Trivial Changes:** Supported indefinitely, docs encourage newer methods.
*   **Transitional Changes:** Warnings issued (`PytestDeprecationWarning`, `PytestRemovedInXWarning`). Functionality removed in major releases (e.g., deprecated in X.0, removed in (X+1).0 or later). Warnings become errors in the major release before removal.
*   **True Breakage:** Rare, only for unsustainable APIs, requires community coordination, detailed rationale, and migration help.
*   **Python Version Support:** Follows CPython maintenance schedule. See `backwards-compatibility.rst` for specific version support table.


---

This cheatsheet is based on the provided documentation snippets and aims to be dense and self-contained. For full details and advanced usage, always refer to the official, complete PyTest documentation.## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of the PyTest testing framework based on its core documentation. It covers installation, test discovery, writing tests (including assertions, fixtures, marking, and parametrization), command-line usage, configuration, plugin basics, hook system, reporting, and key API components. It aims to be a self-contained reference allowing you to quickly understand and start using PyTest for writing and running Python tests.

---

## PyTest Cheatsheet

### Core Concepts

*   **Purpose:** PyTest is a testing framework for Python, designed for writing small, readable tests that can scale to complex functional testing.
*   **Philosophy:** Favors simple `assert` statements over specific `assert*` methods, explicit dependency declaration (fixtures), and extensibility through plugins and hooks.

### Installation

*   **Requirements:** Python 3.8+ or PyPy3. (Version support changes over time, check `backwards-compatibility` section).
*   **Command:** `pip install -U pytest`
*   **Verify:** `pytest --version`

### Basic Usage

*   **Running Tests:**
    *   `pytest`: Runs all tests (`test_*.py` / `*_test.py`) following discovery rules, starting from `testpaths` (if configured) or current directory.
    *   `pytest <path/to/file.py>`: Runs tests in a specific file.
    *   `pytest <path/to/dir/>`: Runs tests in a specific directory.
    *   `python -m pytest [...]`: Almost equivalent to `pytest [...]`, but adds the current directory to `sys.path`.

### Test Discovery Conventions

PyTest finds tests automatically based on these conventions:

*   **Files:** Matches `test_*.py` and `*_test.py` patterns by default. Configurable via :confval:`python_files`.
*   **Functions:** `test_` prefixed functions outside classes. Configurable via :confval:`python_functions`.
*   **Classes:** `Test` prefixed classes (without an `__init__` method). Configurable via :confval:`python_classes`.
*   **Methods:** `test_` prefixed methods inside `Test` prefixed classes. `@staticmethod` and `@classmethod` are included. Configurable via :confval:`python_functions`.
*   **unittest.TestCase:** Subclasses and their `test` methods are collected automatically. `python_classes`/`python_functions` have no effect here.
*   **Import Modes (`--import-mode`):**
    *   `prepend` (default): Adds test directory to start of `sys.path`. Requires unique filenames if not in packages.
    *   `append`: Adds test directory to end of `sys.path`. Better for testing installed packages. Requires unique filenames if not in packages.
    *   `importlib`: Imports without modifying `sys.path`. Does not require unique filenames. Test modules cannot import each other directly. Helper modules should be part of the main package. Recommended for new projects.
*   **Packages:** Directory must contain `__init__.py` to be treated as a package for import modes `prepend`/`append`. Namespace packages (:pep:`420`) supported, configurable via :confval:`consider_namespace_packages`.
*   **Ignoring Paths:**
    *   `--ignore=path`: Ignore specific path (multi-allowed).
    *   `--ignore-glob=pattern`: Ignore paths matching pattern (multi-allowed).
    *   :confval:`norecursedirs` (ini option): List of patterns for directories to ignore. Defaults include `.git`, `*.egg`, `_build`, `dist`, `venv`, `node_modules`, etc.
    *   Virtualenvs ignored by default unless `--collect-in-virtualenv` is used.
*   **Skipping Collection:**
    *   Set `__test__ = False` on classes or modules.
    *   Use :globalvar:`collect_ignore` or :globalvar:`collect_ignore_glob` lists in `conftest.py`.

### Running Specific Tests

*   **By Keyword (`-k EXPRESSION`):**
    *   Runs tests whose names (or parent names, markers, keywords) match the expression.
    *   Case-insensitive substring matching.
    *   Supports `and`, `or`, `not`, parentheses.
    *   Example: `pytest -k "MyClass and not method"`
*   **By Marker (`-m MARKEXPR`):**
    *   Runs tests matching the marker expression.
    *   Example: `pytest -m "slow or webtest"`
    *   Example: `pytest -m "env(name='prod')"` (matches marker arguments)
*   **By Node ID (`pytest path[::class][::func][::param]`):**
    *   `pytest test_mod.py::test_func`
    *   `pytest test_mod.py::TestClass::test_method`
    *   `pytest test_mod.py::test_func[param-value]`
*   **By Package (`--pyargs`):**
    *   `pytest --pyargs mypkg.test_module`: Runs tests from the installed location of `mypkg.test_module`.
*   **Deselection (`--deselect`):**
    *   `pytest --deselect path/to/test.py::TestClass::test_method`: Excludes specific tests.
*   **From File (`@file`):**
    *   `pytest @tests_to_run.txt`: Reads arguments (one per line) from file.

### Assertions

*   **Basic Assertions:** Use standard `assert` statement. Pytest provides detailed introspection on failure.
    ```python
    def test_example():
        x = 1
        y = 2
        assert x + y == 3
    ```
*   **Assertion Failure Reporting:** Shows values of subexpressions.
    ```
    E       assert (1 + 2) == 4
    E        +  where 3 = 1 + 2
    ```
*   **Custom Messages:** Appear alongside introspection.
    ```python
    assert len(my_list) > 0, "List should not be empty"
    ```
*   **Assertion Rewriting:** Modifies test module ASTs on import for detailed reports.
    *   Enabled by default for test modules and plugins.
    *   Enable for helper modules: `pytest.register_assert_rewrite("my_module")` (e.g., in `__init__.py` or `conftest.py`).
    *   Disable per module: Add `"PYTEST_DONT_REWRITE"` to docstring.
    *   Disable globally: `pytest --assert=plain`.
    *   Caches rewritten bytecode (`.pyc`) unless disabled (`sys.dont_write_bytecode = True`).

### Exception Testing

*   **`pytest.raises` (Context Manager):**
    ```python
    import pytest

    def test_invalid_input():
        with pytest.raises(ValueError):
            int("invalid")

    # Access exception info
    with pytest.raises(KeyError) as excinfo:
        my_dict = {}
        _ = my_dict["missing"]
    assert "missing" in str(excinfo.value)
    assert excinfo.type is KeyError

    # Match exception message (regex search)
    with pytest.raises(ValueError, match=r"must be \d+"):
        raise ValueError("value must be 42")
    ```
    *   `excinfo` is `pytest.ExceptionInfo` (`.type`, `.value`, `.traceback`).
    *   Matches exception type or subclasses. Use `excinfo.type is ExpectedExc` for exact match.
*   **`pytest.RaisesGroup` (Context Manager):** For asserting :exc:`ExceptionGroup`.
    ```python
    with pytest.RaisesGroup(ValueError, TypeError):
        raise ExceptionGroup("msg", [ValueError("foo"), TypeError("bar")])

    # Match group message and check contained exceptions
    with pytest.RaisesGroup(ValueError, match="group message", check=lambda eg: len(eg.exceptions) == 1):
        raise ExceptionGroup("group message", [ValueError("value error")])

    # Specify details of contained exceptions
    with pytest.RaisesGroup(pytest.RaisesExc(ValueError, match="foo")):
        raise ExceptionGroup("", (ValueError("foo"),))
    ```
*   **`ExceptionInfo.group_contains`:** Check for contained exceptions within an `ExceptionGroup` (use `RaisesGroup` preferably).
    ```python
    with pytest.raises(ExceptionGroup) as excinfo:
        raise ExceptionGroup("group", [RuntimeError("err1")])
    assert excinfo.group_contains(RuntimeError, match="err1", depth=1)
    ```
*   **`pytest.fail(reason, pytrace=True)`:** Imperatively fail a test.
*   **`pytest.skip(reason, allow_module_level=False)`:** Imperatively skip a test or module.
*   **`pytest.xfail(reason)`:** Imperatively mark test as expected-to-fail.
*   **`@pytest.mark.xfail(raises=Exc)`:** Expect failure with a specific exception.

### Warning Testing

*   **Automatic Capture:** Captures `WARNING`+ level warnings, shown in summary. Disable summary: `--disable-warnings`. Disable plugin: `-p no:warnings`.
*   **Filtering:**
    *   CLI: `-W action::category:message:module:lineno` (Python stdlib format, message is substring).
    *   INI (`filterwarnings`): `action::category:message:module:lineno` (one per line, message is regex).
    *   Marker: `@pytest.mark.filterwarnings("action:message:category:module:lineno")`. Applied per item/class/module. Marker filters take precedence.
*   **`pytest.warns(ExpectedWarning, match=...)`:** Assert a specific warning is raised.
    ```python
    with pytest.warns(UserWarning, match="deprecated"):
        warnings.warn("API deprecated", UserWarning)
    ```
    *   Returns a `WarningsRecorder` instance.
*   **`recwarn` Fixture:** Records all warnings during a test function. Returns `WarningsRecorder`.
    ```python
    def test_warnings(recwarn):
        warnings.warn("some warning")
        assert len(recwarn) == 1
        w = recwarn.pop(UserWarning) # Can pop specific type
        assert "some warning" in str(w.message)
    ```
*   **`pytest.deprecated_call(match=...)`:** Check code triggers `DeprecationWarning` or `PendingDeprecationWarning`.

### Fixtures (`@pytest.fixture`)

*   **Concept:** Functions providing setup/teardown/resources for tests via dependency injection.
*   **Declaration:** Decorate a function with `@pytest.fixture`.
*   **Requesting:** Name the fixture as an argument in a test function or another fixture.
*   **Teardown/Finalization:**
    *   **`yield` (Recommended):** Code after `yield` is teardown code.
        ```python
        @pytest.fixture
        def db_conn():
            conn = connect_db()
            yield conn  # Value provided to tests
            conn.close() # Teardown code
        ```
    *   **`request.addfinalizer(func)`:** Register cleanup functions (LIFO order).
*   **Scope (`scope=...`):** Controls fixture lifetime.
    *   `function` (default): Once per test function.
    *   `class`: Once per test class.
    *   `module`: Once per module.
    *   `package`: Once per package (experimental).
    *   `session`: Once per test session.
    *   Higher scopes run before lower scopes. Fixtures can only request fixtures with same or broader scope.
*   **Autouse (`autouse=True`):** Fixture runs automatically for all tests within its scope without being explicitly requested.
*   **Parametrization (`params=[...], ids=[...]`):** Run tests multiple times with different fixture values.
    ```python
    @pytest.fixture(params=[1, 2], ids=["case1", "case2"])
    def number_fixture(request):
        return request.param # Access current parameter

    def test_numbers(number_fixture): # Runs twice
        assert isinstance(number_fixture, int)
    ```
    *   Use `pytest.param(value, marks=..., id=...)` in `params` list for per-parameter marks/ids.
*   **Availability:** Defined in test modules or `conftest.py`. `conftest.py` fixtures are available to tests in/below that directory. Plugin fixtures are global.
*   **`@pytest.mark.usefixtures("name1", "name2")`:** Apply fixtures (usually for side-effects) without adding them as arguments. Does not work on fixture functions.
*   **Overriding:** Define fixture with same name in a more specific scope (module > conftest, class > module). Can request original fixture by name.
*   **`request` Fixture:** Special fixture providing context about the requestor. Attributes: `scope`, `fixturename`, `node`, `config`, `param` (for parametrized fixtures), `keywords`, `module`, `cls`. Methods: `getfixturevalue()`, `addfinalizer()`.
*   **`tmp_path` / `tmp_path_factory`:** Provide temporary directories as `pathlib.Path` objects (function/session scope). Factory methods: `mktemp()`, `getbasetemp()`.
*   **`tmpdir` / `tmpdir_factory`:** Legacy versions using `py.path.local`. (Discouraged).
*   **`monkeypatch`:** Safely patch/mock objects, dicts, env vars, `sys.path`. Methods: `setattr`, `delattr`, `setitem`, `delitem`, `setenv`, `delenv`, `syspath_prepend`, `chdir`, `context`. Automatically undone.
*   **`capsys` / `capfd` / `capsysbinary` / `capfdbinary`:** Capture stdout/stderr/FDs. Method: `readouterr()`. Context manager: `disabled()`.
*   **`caplog`:** Capture log records. Properties/methods for access and control.
*   **`recwarn`:** Record warnings.
*   **`pytestconfig`:** Access `pytest.Config`.
*   **`cache`:** Access `config.cache` for cross-run state. Methods: `get()`, `set()`, `mkdir()`.
*   **`doctest_namespace`:** Inject names into doctest namespace.
*   **`record_property` / `record_testsuite_property` / `record_xml_attribute`:** Add data/attributes to JUnit XML reports.

### Markers (`@pytest.mark.*`)

*   **Concept:** Metadata applied to tests for selection or behavior modification.
*   **Applying:** `@pytest.mark.NAME(...)` decorator or `pytestmark = ...` module/class variable.
*   **Running (`-m MARKEXPR`):** Select tests using marker expressions (`slow and not integration`). Can match marker args (`-m "env(name='prod')"`).
*   **Registering:** Define in `pytest.ini` / `pyproject.toml` (`markers = name: description`) or `pytest_configure` hook (`config.addinivalue_line("markers", ...)`). Avoids warnings, enables `--strict-markers`.
*   **Listing:** `pytest --markers`.
*   **Strict Mode:** `pytest --strict-markers` fails if unregistered marks are used.
*   **Key Built-in Markers:**
    *   `skip(reason=...)`: Unconditionally skip.
    *   `skipif(condition, reason=...)`: Skip if condition (bool or string) is true.
    *   `xfail(condition=..., reason=..., raises=Exc, run=True, strict=False)`: Mark as expected failure.
    *   `parametrize(argnames, argvalues, indirect=False, ids=None, scope=None)`: Parametrize arguments.
    *   `usefixtures("name1", ...)`: Apply fixtures without passing as arguments.
    *   `filterwarnings("action:message:category:...")`: Apply warning filter.

### Command-Line Interface (CLI)

*   **Help:** `pytest -h`
*   **Version:** `pytest --version` (`-VV` for plugin info)
*   **Selection:** `-k EXPR`, `-m MARKEXPR`, `path::nodeid`, `--pyargs`, `--deselect`, `@file`
*   **Execution Control:** `-x` / `--exitfirst`, `--maxfail=N`, `--lf`, `--ff`, `--nf`, `--sw`, `--sw-skip`
*   **Reporting:** `-v`, `-vv`, `-q`, `-qq`, `--verbosity=N`, `-r CHARS`, `--tb=style`, `-l` / `--showlocals`, `--no-showlocals`, `--durations=N`, `--durations-min=N`, `--capture=MODE`, `-s`, `--show-capture=MODE`, `--junit-xml=path`, `--pastebin=MODE`, `--no-header`, `--no-summary`
*   **Debugging:** `--pdb`, `--trace`, `--pdbcls=...`
*   **Collection:** `--collect-only`, `--ignore=PATH`, `--ignore-glob=PAT`, `--confcutdir=DIR`, `--noconftest`, `--keep-duplicates`, `--collect-in-virtualenv`, `--import-mode=MODE`
*   **Doctests:** `--doctest-modules`, `--doctest-glob=PAT`, `--doctest-report=STYLE`, `--doctest-ignore-import-errors`, `--doctest-continue-on-failure`
*   **Plugins/Config:** `-p name`/`-p no:name`, `--trace-config`, `--debug`, `-c FILE`, `-o name=value`, `--rootdir=PATH`
*   **Assertion:** `--assert=rewrite|plain`
*   **Setup Info:** `--setup-only`, `--setup-show`, `--setup-plan`
*   **Cache:** `--cache-show[=glob]`, `--cache-clear`, `--lfnf=all|none`
*   **Warnings/Strictness:** `-W filter`, `--strict-markers`, `--strict-config`
*   **Misc:** `--basetemp=DIR`, `--runxfail`

### Configuration Files

*   **Files:** `pytest.ini`, `pyproject.toml` (`[tool.pytest.ini_options]`), `tox.ini` (`[pytest]`), `setup.cfg` (`[tool:pytest]`). Searched upwards from `rootdir`. First one found is used.
*   **`rootdir`:** Determined based on args and config file location. Forced with `--rootdir`. Used for nodeids and cache path.
*   **Key `ini` Options:**
    *   `addopts`: Default CLI options.
    *   `minversion`: Minimum pytest version.
    *   `testpaths`: Default collection paths.
    *   `norecursedirs`: Directories to ignore.
    *   `python_files`/`_classes`/`_functions`: Discovery patterns.
    *   `markers`: Register custom markers.
    *   `filterwarnings`: Configure warning filters.
    *   `xfail_strict`: Default for `@xfail(strict=...)`.
    *   `log_*`: Logging options (cli, file, format, level).
    *   `junit_*`: JUnit XML options (family, logging, duration, suite_name).
    *   `cache_dir`: Cache directory location.
    *   `empty_parameter_set_mark`: `skip`, `xfail`, `fail_at_collect`.
    *   `faulthandler_timeout`: Timeout for dumping tracebacks.
    *   `usefixtures`: Global `usefixtures`.
    *   `pythonpath`: Add directories to `sys.path`.
    *   `required_plugins`: List required plugins.
    *   `console_output_style`: `classic`, `progress`, `count`.
    *   `verbosity_assertions`/`verbosity_test_cases`: Fine-grained verbosity.
    *   `tmp_path_retention_count`/`tmp_path_retention_policy`: Control temp dir retention.
    *   `consider_namespace_packages`: Enable namespace package discovery.
    *   `truncation_limit_lines`/`truncation_limit_chars`: Control assertion truncation (0 disables).

### Plugins

*   **Discovery:** Via setuptools entry points (`pytest11`), `PYTEST_PLUGINS` env var, `pytest_plugins` var in `conftest.py`/test modules, `-p` option. Autoloading via entry points can be disabled with `PYTEST_DISABLE_PLUGIN_AUTOLOAD` or `--disable-plugin-autoload`.
*   **Disabling:** `pytest -p no:plugin_name`.
*   **Writing:** Implement hooks and/or fixtures. Register via entry points for distribution.
*   **Testing:** Use `pytester` fixture (enable with `pytest_plugins = ["pytester"]` in test `conftest.py`).
*   **Assertion Rewriting:** Enabled for plugins loaded via entry points or `pytest_plugins`. Use `pytest.register_assert_rewrite()` for other helper modules within the plugin package (e.g., in `__init__.py`).

### Hooks (API for Customization)

*   **Concept:** Functions implemented by plugins/conftest.py to intercept and modify pytest behavior. Named `pytest_*`.
*   **Implementation:** Define functions matching hook specifications. Use `@pytest.hookimpl(...)` decorator for ordering/wrapping.
*   **Execution:** Pytest calls all registered hooks. Argument pruning allows partial signatures. Hooks (except `pytest_runtest_*`) should not raise exceptions.
*   **Ordering:** `@pytest.hookimpl(tryfirst=True)`, `@pytest.hookimpl(trylast=True)`.
*   **Wrappers:** `@pytest.hookimpl(wrapper=True)` executes around other implementations using `yield`.
*   **Key Hooks (Examples):**
    *   Initialization: `pytest_addoption`, `pytest_configure`, `pytest_sessionstart`, `pytest_sessionfinish`, `pytest_unconfigure`, `pytest_load_initial_conftests`.
    *   Collection: `pytest_collect_file`, `pytest_pycollect_makeitem`, `pytest_collection_modifyitems`, `pytest_ignore_collect`, `pytest_generate_tests`.
    *   Test Execution: `pytest_runtest_setup`, `pytest_runtest_call`, `pytest_runtest_teardown`, `pytest_runtest_makereport`.
    *   Reporting: `pytest_report_header`, `pytest_terminal_summary`, `pytest_runtest_logreport`, `pytest_report_teststatus`.
    *   Assertion: `pytest_assertrepr_compare`, `pytest_assertion_pass` (experimental).
    *   Debugging: `pytest_exception_interact`, `pytest_enter_pdb`, `pytest_leave_pdb`.
*   **Declaring New Hooks:** Define spec functions, register via `pytest_addhooks(pluginmanager)`. Call via `config.hook.hook_name(...)`.

### Key API Objects

*   **`pytest.Config`:** Configuration object (`pytestconfig` fixture).
*   **Nodes (`pytest.Item`, `pytest.Collector`, etc.):** Represent items in the collection tree. Key attributes: `name`, `nodeid`, `path`, `fspath` (legacy), `config`, `session`, `parent`, `keywords`, `stash`. Methods: `getparent()`, `iter_markers()`, `get_closest_marker()`, `add_marker()`.
*   **`pytest.FixtureRequest` (`request` fixture):** Context for fixture execution.
*   **`pytest.Metafunc`:** For `pytest_generate_tests`. Method: `parametrize()`.
*   **`pytest.Mark`:** Represents an applied mark. Attributes: `name`, `args`, `kwargs`.
*   **`pytest.MarkDecorator`:** Object returned by `pytest.mark.NAME`.
*   **`pytest.MarkGenerator` (`pytest.mark`):** Factory for marks.
*   **`pytest.ExceptionInfo`:** Wrapper for caught exceptions (`pytest.raises`).
*   **`pytest.RaisesGroup` / `pytest.RaisesExc`:** Context managers for :exc:`ExceptionGroup`.
*   **`pytest.TestReport` / `pytest.CollectReport`:** Test/collection outcome objects.
*   **`pytest.Parser` / `pytest.OptionGroup`:** For adding command-line/ini options.
*   **`pytest.Cache` (`config.cache`):** Cross-session data storage.
*   **`pytest.MonkeyPatch` (`monkeypatch` fixture):** For safe patching.
*   **`pytest.CaptureFixture` (`capsys`/`capfd` fixtures):** For capturing output.
*   **`pytest.LogCaptureFixture` (`caplog` fixture):** For capturing logs.
*   **`pytest.WarningsRecorder` (`recwarn` fixture):** For recording warnings.
*   **`pytest.TempPathFactory` (`tmp_path_factory` fixture):** For creating temporary directories (`pathlib.Path`).
*   **`pytest.Pytester` (`pytester` fixture):** For testing pytest plugins. Includes `RunResult`, `LineMatcher`, `HookRecorder`.
*   **`pytest.Stash` / `pytest.StashKey`:** Type-safe storage on nodes/config.

### Exit Codes (`pytest.ExitCode`)

*   `0`: OK (all tests passed)
*   `1`: TESTS_FAILED (some tests failed)
*   `2`: INTERRUPTED (user interrupt)
*   `3`: INTERNAL_ERROR
*   `4`: USAGE_ERROR
*   `5`: NO_TESTS_COLLECTED

### Backwards Compatibility & Deprecations

*   Pytest follows semantic versioning loosely. Breaking changes usually occur in major versions (X.0).
*   Deprecations are announced with `PytestDeprecationWarning` or `PytestRemovedInXWarning`.
*   Warnings become errors in the major release prior to removal.
*   Check `deprecations.rst` and `backwards-compatibility.rst` in docs for details.
*   **Key Recent Removals:** Python 3.7 support (in pytest 8.0), `pytest.Instance` collector (7.0), `pytest.collect` module (7.0), `--result-log` (6.0), `yield_fixture` alias (6.2), `[pytest]` section in `setup.cfg` (use `[tool:pytest]`) (4.0).
*   **Key Deprecations:** Nose support (`setup`/`teardown`, `@with_setup`), `msg=` argument in `fail`/`skip`/`exit` (use `reason=`), `fspath` arguments/attributes (use `pathlib.Path`), `py.path.local` hook arguments, applying marks to fixture functions, returning non-None from tests.


---

This cheatsheet summarizes features based *only* on the provided documentation text.


</docs>

```markdown
## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of the PyTest testing framework based on its core documentation. It covers installation, test discovery, writing tests (including assertions, fixtures, marking, and parametrization), command-line usage, configuration, plugin basics, hook system, reporting, and key API components. It aims to be a self-contained reference allowing you to quickly understand and start using PyTest for writing and running Python tests.

---

## PyTest Cheatsheet

### Core Concepts

*   **Purpose:** PyTest is a testing framework for Python, designed for writing small, readable tests that can scale to complex functional testing.
*   **Philosophy:** Favors simple `assert` statements over specific `assert*` methods, explicit dependency declaration (fixtures), and extensibility through plugins and hooks.

### Installation

*   **Requirements:** Python 3.8+ or PyPy3. (Version support changes over time, check `backwards-compatibility` section).
*   **Command:** `pip install -U pytest`
*   **Verify:** `pytest --version`

### Basic Usage

*   **Running Tests:**
    *   `pytest`: Runs all tests (`test_*.py` / `*_test.py`) following discovery rules, starting from `testpaths` (if configured) or current directory.
    *   `pytest <path/to/file.py>`: Runs tests in a specific file.
    *   `pytest <path/to/dir/>`: Runs tests in a specific directory.
    *   `python -m pytest [...]`: Almost equivalent to `pytest [...]`, but adds the current directory to `sys.path`.

### Test Discovery Conventions

PyTest finds tests automatically based on these conventions:

*   **Files:** Matches `test_*.py` and `*_test.py` patterns by default. Configurable via :confval:`python_files`.
*   **Functions:** `test_` prefixed functions outside classes. Configurable via :confval:`python_functions`.
*   **Classes:** `Test` prefixed classes (without an `__init__` method). Configurable via :confval:`python_classes`.
*   **Methods:** `test_` prefixed methods within `Test` prefixed classes. `@staticmethod` and `@classmethod` are included. Configurable via :confval:`python_functions`.
*   **unittest.TestCase:** Subclasses and their `test` methods are collected automatically. `python_classes`/`python_functions` have no effect here.
*   **Import Modes (`--import-mode`):**
    *   `prepend` (default): Adds test directory to start of `sys.path`. Requires unique filenames if not in packages.
    *   `append`: Adds test directory to end of `sys.path`. Better for testing installed packages. Requires unique filenames if not in packages.
    *   `importlib`: Imports without modifying `sys.path`. Does not require unique filenames. Test modules cannot import each other directly. Helper modules should be part of the main package. Recommended for new projects.
*   **Packages:** Directory must contain `__init__.py` to be treated as a package for import modes `prepend`/`append`. Namespace packages (:pep:`420`) supported, configurable via :confval:`consider_namespace_packages`.
*   **Ignoring Paths:**
    *   `--ignore=path`: Ignore specific path (multi-allowed).
    *   `--ignore-glob=pattern`: Ignore paths matching pattern (multi-allowed).
    *   :confval:`norecursedirs` (ini option): List of patterns for directories to ignore. Defaults include `.git`, `*.egg`, `_build`, `dist`, `venv`, `node_modules`, etc.
    *   Virtualenvs ignored by default unless `--collect-in-virtualenv` is used.
*   **Skipping Collection:**
    *   Set `__test__ = False` on classes or modules.
    *   Use :globalvar:`collect_ignore` or :globalvar:`collect_ignore_glob` lists in `conftest.py`.

### Running Specific Tests

*   **By Keyword (`-k EXPRESSION`):**
    *   Runs tests whose names (or parent names, markers, keywords) match the expression.
    *   Case-insensitive substring matching.
    *   Supports `and`, `or`, `not`, parentheses.
    *   Example: `pytest -k "MyClass and not method"`
*   **By Marker (`-m MARKEXPR`):**
    *   Runs tests matching the marker expression.
    *   Example: `pytest -m "slow or webtest"`
    *   Example: `pytest -m "env(name='prod')"` (matches marker arguments)
*   **By Node ID (`pytest path[::class][::func][::param]`):**
    *   `pytest test_mod.py::test_func`
    *   `pytest test_mod.py::TestClass::test_method`
    *   `pytest test_mod.py::test_func[param-value]`
*   **By Package (`--pyargs`):**
    *   `pytest --pyargs mypkg.test_module`: Runs tests from the installed location of `mypkg.test_module`.
*   **Deselection (`--deselect`):**
    *   `pytest --deselect path/to/test.py::TestClass::test_method`: Excludes specific tests.
*   **From File (`@file`):**
    *   `pytest @tests_to_run.txt`: Reads arguments (one per line) from file.

### Assertions

*   **Basic Assertions:** Use standard `assert` statement. Pytest provides detailed introspection on failure.
    ```python
    def test_example():
        x = 1
        y = 2
        assert x + y == 3
    ```
*   **Assertion Failure Reporting:** Shows values of subexpressions.
    ```
    E       assert (1 + 2) == 4
    E        +  where 3 = 1 + 2
    ```
*   **Custom Messages:** Appear alongside introspection.
    ```python
    assert len(my_list) > 0, "List should not be empty"
    ```
*   **Assertion Rewriting:** Modifies test module ASTs on import for detailed reports.
    *   Enabled by default for test modules and plugins.
    *   Enable for helper modules: `pytest.register_assert_rewrite("my_module")` (e.g., in `__init__.py` or `conftest.py`).
    *   Disable per module: Add `"PYTEST_DONT_REWRITE"` to docstring.
    *   Disable globally: `pytest --assert=plain`.
    *   Rewritten modules are cached (`.pyc`) unless disabled (`sys.dont_write_bytecode = True`).

### Exception Testing

*   **`pytest.raises` (Context Manager):**
    ```python
    import pytest

    def test_invalid_input():
        with pytest.raises(ValueError):
            int("invalid")

    # Access exception info
    with pytest.raises(KeyError) as excinfo:
        my_dict = {}
        _ = my_dict["missing"]
    assert "missing" in str(excinfo.value)
    assert excinfo.type is KeyError

    # Match exception message (regex search)
    with pytest.raises(ValueError, match=r"must be \d+"):
        raise ValueError("value must be 42")
    ```
    *   `excinfo` is `pytest.ExceptionInfo` (`.type`, `.value`, `.traceback`).
    *   Matches exception type or subclasses. Use `excinfo.type is ExpectedExc` for exact match.
*   **`pytest.RaisesGroup` (Context Manager):** For asserting :exc:`ExceptionGroup`.
    ```python
    with pytest.RaisesGroup(ValueError, TypeError):
        raise ExceptionGroup("msg", [ValueError("foo"), TypeError("bar")])

    # Match group message and check contained exceptions
    with pytest.RaisesGroup(ValueError, match="group message", check=lambda eg: len(eg.exceptions) == 1):
        raise ExceptionGroup("group message", [ValueError("value error")])

    # Specify details of contained exceptions
    with pytest.RaisesGroup(pytest.RaisesExc(ValueError, match="foo")):
        raise ExceptionGroup("", (ValueError("foo"),))
    ```
    *   Use `check=callable` for custom checks on the exception group.
    *   Use `flatten_subgroups=True` or `allow_unwrapped=True` for flexible structure matching.
*   **`ExceptionInfo.group_contains`:** Check for contained exceptions within an `ExceptionGroup` (use `RaisesGroup` preferably).
    ```python
    with pytest.raises(ExceptionGroup) as excinfo:
        raise ExceptionGroup("group", [RuntimeError("err1")])
    assert excinfo.group_contains(RuntimeError, match="err1", depth=1)
    ```
*   **`pytest.fail(reason, pytrace=True)`:** Imperatively fail a test.
*   **`pytest.skip(reason, allow_module_level=False)`:** Imperatively skip a test or module.
*   **`pytest.xfail(reason)`:** Imperatively mark test as expected-to-fail.
*   **`@pytest.mark.xfail(raises=Exc)`:** Expect failure with a specific exception.

### Warning Testing

*   **Automatic Capture:** Captures `WARNING`+ level warnings, shown in summary. Disable summary: `--disable-warnings`. Disable plugin: `-p no:warnings`.
*   **Filtering:**
    *   CLI: `-W action::category:message:module:lineno` (Python stdlib format, message is substring).
    *   INI (`filterwarnings`): `action::category:message:module:lineno` (one per line, message is regex).
    *   Marker: `@pytest.mark.filterwarnings("action:message:category:module:lineno")`. Applied per item/class/module. Marker filters take precedence.
*   **`pytest.warns(ExpectedWarning, match=...)`:** Assert a specific warning is raised.
    ```python
    import warnings, pytest

    def test_warning():
        with pytest.warns(UserWarning, match="deprecated"):
            warnings.warn("API deprecated", UserWarning)

    # Record warnings without assertion
    with pytest.warns() as record:
        warnings.warn("runtime", RuntimeWarning)
    assert len(record) == 1
    assert str(record[0].message) == "runtime"
    ```
    *   Returns a `WarningsRecorder` instance.
*   **`recwarn` Fixture:** Records all warnings during a test function. Returns `WarningsRecorder`.
    ```python
    def test_warnings(recwarn):
        warnings.warn("hello", UserWarning)
        assert len(recwarn) == 1
        w = recwarn.pop(UserWarning) # Can pop specific type
        assert "some warning" in str(w.message)
    ```
    *   Also returns a `WarningsRecorder` instance.
*   **`pytest.deprecated_call(match=...)`:** Check code triggers `DeprecationWarning` or `PendingDeprecationWarning`.
    ```python
    with pytest.deprecated_call(match="use new_func instead"):
        old_func(1)
    ```

### Fixtures (`@pytest.fixture`)

*   **Concept:** Functions providing setup/teardown/resources for tests via dependency injection. Replaces classic xUnit setup/teardown.
*   **Declaration:** Decorate a function with `@pytest.fixture`.
*   **Requesting:** Name the fixture as an argument in a test function or another fixture.
*   **Teardown/Finalization:**
    *   **`yield` (Recommended):** Code after `yield` is teardown code.
        ```python
        @pytest.fixture
        def db_conn():
            conn = connect_db()
            yield conn  # Value provided to tests
            conn.close() # Teardown code
        ```
    *   **`request.addfinalizer(func)`:** Register cleanup functions (LIFO order).
*   **Scope (`scope=...`):** Controls fixture lifetime.
    *   `function` (default): Once per test function.
    *   `class`: Once per test class.
    *   `module`: Once per module.
    *   `package`: Once per package (experimental).
    *   `session`: Once per test session.
    *   Higher scopes run before lower scopes. Fixtures can only request fixtures with same or broader scope.
    *   Dynamic Scope: `scope=callable(fixture_name, config)` can return a scope string dynamically.
*   **Autouse (`autouse=True`):** Fixture runs automatically for all tests within its scope without being explicitly requested. Useful for setup that doesn't return a value (e.g., `monkeypatch`, `chdir`).
*   **Parametrization (`params=[...], ids=[...]`):** Run tests multiple times with different fixture values.
    ```python
    @pytest.fixture(params=["a", "b"], ids=["case1", "case2"])
    def my_param_fixture(request):
        return request.param # Access current parameter

    def test_with_param(my_param_fixture): # Runs twice
        assert my_param_fixture in ("a", "b")
    ```
    *   Use `pytest.param(value, marks=..., id=...)` within `params` list for per-parameter marks/ids.
*   **Fixture Availability:** Defined in test modules or `conftest.py`. `conftest.py` fixtures are available to tests in/below that directory. Plugin fixtures are global. Test discovery order: function -> class -> module -> package -> session -> plugins.
*   **`@pytest.mark.usefixtures("name1", "name2")`:** Apply fixtures (usually for side-effects) without adding them as arguments. Does not work on fixture functions.
*   **Overriding:** Define fixture with same name in a more specific scope (module > conftest, class > module). Can request original fixture by name.
*   **`request` Fixture:** Special fixture providing context about the requesting test/fixture. Attributes: `scope`, `fixturename`, `node`, `config`, `param` (for parametrized fixtures), `keywords`, `module`, `cls`. Methods: `getfixturevalue()`, `addfinalizer()`.

#### Key Built-in Fixtures

*   `tmp_path`: Provides a `pathlib.Path` to a unique temporary directory (function scope).
*   `tmp_path_factory`: Creates temporary directories (session scope). Methods: `mktemp(basename, numbered=True)`, `getbasetemp()`.
*   `tmpdir`: Legacy version of `tmp_path` returning `py.path.local`. (Discouraged)
*   `tmpdir_factory`: Legacy version of `tmp_path_factory`. (Discouraged)
*   `monkeypatch`: Safely modify classes, methods, dicts, env vars, `sys.path`. Methods: `setattr`, `delattr`, `setitem`, `delitem`, `setenv`, `delenv`, `syspath_prepend`, `chdir`, `context`. Automatically undone.
*   `capsys`/`capsysbinary`: Capture `sys.stdout`/`sys.stderr` as text/bytes. Method: `readouterr()` returns `(out, err)`. Has `disabled()` context manager.
*   `capfd`/`capfdbinary`: Capture file descriptors 1/2 as text/bytes. Method: `readouterr()` returns `(out, err)`. Has `disabled()` context manager.
*   `caplog`: Capture log records. Properties: `text`, `records`, `record_tuples`, `messages`. Methods: `set_level()`, `at_level()`, `clear()`, `get_records()`.
*   `recwarn`: Record warnings issued by code. Returns `WarningsRecorder` (list-like). Methods: `pop()`, `clear()`.
*   `pytestconfig`: Access to the `pytest.Config` object.
*   `request`: Provides information about the requesting test context.
*   `cache`: Provides `config.cache` for storing/retrieving data across test runs. Methods: `get(key, default)`, `set(key, value)`, `mkdir(name)`.
*   `doctest_namespace`: A `dict` injected into the namespace for doctests.
*   `record_property`: Add `<property>` tags to JUnit XML `testcase`.
*   `record_testsuite_property`: Add `<property>` tags to JUnit XML `testsuite`.
*   `record_xml_attribute`: Add attributes to JUnit XML `testcase`. (Experimental)
*   `pytester`/`testdir`: For testing pytest plugins. `pytester` uses `pathlib.Path`, `testdir` uses legacy `py.path.local`. Provides methods like `runpytest()`, `makepyfile()`, `makeconftest()`, `copy_example()`.

### Markers (`@pytest.mark.*`)

*   **Concept:** Metadata applied to tests for selection or behavior modification.
*   **Applying:** `@pytest.mark.NAME(...)` decorator or `pytestmark = ...` module/class variable.
*   **Running Marked Tests (`-m MARKEXPR`):** Select tests using marker expressions (`slow and not integration`). Can match marker args (`-m "env(name='prod')"`).
*   **Registering:** Define in `pytest.ini` / `pyproject.toml` (`markers = name: description`) or `pytest_configure` hook (`config.addinivalue_line("markers", ...)`). Avoids warnings, enables `--strict-markers`.
*   **Listing:** `pytest --markers`.
*   **Strict Mode:** `pytest --strict-markers` (or `addopts = --strict-markers` in ini) fails the run if unregistered marks are used.
*   **Key Built-in Markers:**
    *   `skip(reason=...)`: Unconditionally skip.
    *   `skipif(condition, reason=...)`: Skip if condition (bool or string) is true.
    *   `xfail(condition=..., reason=..., raises=Exc, run=True, strict=False)`: Mark as expected failure.
        *   `run=False`: Don't execute the test.
        *   `raises=Exc`: Expect specific exception(s).
        *   `strict=True`: Fail the suite if the test passes (XPASS). Configurable via `xfail_strict` ini option.
    *   `parametrize(argnames, argvalues, indirect=False, ids=None, scope=None)`: Parametrize test function arguments.
    *   `usefixtures("name1", ...)`: Apply fixtures without passing as arguments.
    *   `filterwarnings("action:message:category:...")`: Apply warning filter.
*   **Marking Parametrized Tests:** Use `pytest.param(value, marks=..., id=...)` within the `argvalues` list.
    ```python
    @pytest.mark.parametrize("a, b", [
        (1, 2),
        pytest.param(3, 4, marks=pytest.mark.slow, id="slow_case"),
    ])
    def test_add(a, b): ...
    ```

### Command-Line Interface (CLI)

*   **Help:** `pytest -h` / `pytest --help`
*   **Version:** `pytest --version` (`-VV` for plugin info)
*   **Selection:** `-k EXPR`, `-m MARKEXPR`, `path::nodeid`, `--pyargs`, `--deselect`, `@file`
*   **Execution Control:** `-x` / `--exitfirst`, `--maxfail=N`, `--lf`, `--ff`, `--nf`, `--sw`, `--sw-skip`
*   **Output/Reporting:** `-v`, `-vv`, `-q`, `-qq`, `--verbosity=N`, `-r CHARS`, `--tb=style`, `-l` / `--showlocals`, `--no-showlocals`, `--durations=N`, `--durations-min=N`, `--capture=MODE`, `-s`, `--show-capture=MODE`, `--junit-xml=path`, `--pastebin=MODE`, `--no-header`, `--no-summary`, `--no-fold-skipped`, `--xfail-tb`
*   **Debugging:** `--pdb`, `--trace`, `--pdbcls=...`
*   **Collection:** `--collect-only`, `--ignore=PATH`, `--ignore-glob=PAT`, `--confcutdir=DIR`, `--noconftest`, `--keep-duplicates`, `--collect-in-virtualenv`, `--import-mode=MODE`
*   **Doctests:** `--doctest-modules`, `--doctest-glob=PAT`, `--doctest-report=STYLE`, `--doctest-ignore-import-errors`, `--doctest-continue-on-failure`
*   **Plugins/Config:** `-p name`/`-p no:name`, `--trace-config`, `--debug`, `-c FILE`, `-o name=value`, `--rootdir=PATH`
*   **Assertion:** `--assert=rewrite|plain`
*   **Setup Info:** `--setup-only`, `--setup-show`, `--setup-plan`
*   **Cache:** `--cache-show[=glob]`, `--cache-clear`, `--lfnf=all|none`
*   **Warnings/Strictness:** `-W filter`, `--strict-markers`, `--strict-config`
*   **Misc:** `--basetemp=DIR`, `--runxfail`

### Configuration Files

*   **Files:** `pytest.ini`, `pyproject.toml` (`[tool.pytest.ini_options]`), `tox.ini` (`[pytest]`), `setup.cfg` (`[tool:pytest]`). Searched upwards from `rootdir`. First one found is used.
*   **`rootdir`:** Determined based on args and config file location. Forced with `--rootdir`. Used for nodeids and cache path.
*   **Key `ini` Options (`ini options ref`):**
    *   `addopts`: Default CLI options.
    *   `minversion`: Minimum pytest version.
    *   `testpaths`: Default collection paths. Supports globs.
    *   `norecursedirs`: Directory patterns to ignore.
    *   `python_files`/`_classes`/`_functions`: Discovery patterns.
    *   `markers`: Register custom markers (one per line, `name: description`).
    *   `filterwarnings`: Configure warning filters (one per line).
    *   `xfail_strict`: Default for `@xfail(strict=...)`.
    *   `log_*`: Logging options (cli, file, format, level, mode, auto_indent).
    *   `junit_*`: JUnit XML options (family, logging, duration, suite_name, log_passing_tests).
    *   `cache_dir`: Cache directory location.
    *   `empty_parameter_set_mark`: `skip`, `xfail`, `fail_at_collect`.
    *   `faulthandler_timeout`: Timeout for dumping tracebacks.
    *   `usefixtures`: Global `usefixtures`.
    *   `pythonpath`: Add directories to `sys.path`.
    *   `required_plugins`: List required plugins (with optional versions).
    *   `console_output_style`: `classic`, `progress`, `count`.
    *   `verbosity_assertions`/`verbosity_test_cases`: Fine-grained verbosity.
    *   `tmp_path_retention_count`/`tmp_path_retention_policy`: Control temp dir retention.
    *   `consider_namespace_packages`: Enable namespace package discovery.
    *   `truncation_limit_lines`/`truncation_limit_chars`: Control assertion truncation (0 disables).

### Plugins

*   **Discovery:** Via setuptools entry points (`pytest11`), `PYTEST_PLUGINS` env var, `pytest_plugins` var in `conftest.py`/test modules, `-p` option. Autoloading via entry points can be disabled with `PYTEST_DISABLE_PLUGIN_AUTOLOAD` or `--disable-plugin-autoload`.
*   **Disabling:** `pytest -p no:plugin_name`.
*   **Writing:** Implement hooks and/or fixtures. Register via entry points for distribution.
*   **Testing:** Use the `pytester` fixture (enable via `pytest_plugins = ["pytester"]` in test `conftest.py`).
*   **Assertion Rewriting:** Enabled for plugins loaded via entry points or `pytest_plugins`. Use `pytest.register_assert_rewrite()` for other helper modules within the plugin package (e.g., in `__init__.py`).

### Hooks (API for Customization)

*   **Concept:** Functions implemented by plugins/conftest.py to intercept and modify pytest behavior. Named `pytest_*`.
*   **Implementation:** Define functions matching hook specifications. Use `@pytest.hookimpl(...)` decorator for ordering/wrapping.
*   **Execution:** Pytest calls all registered hooks. Argument pruning allows partial signatures. Hooks (except `pytest_runtest_*`) should not raise exceptions.
*   **Ordering:** `@pytest.hookimpl(tryfirst=True)`, `@pytest.hookimpl(trylast=True)`.
*   **Wrappers:** `@pytest.hookimpl(wrapper=True)` executes around other implementations using `yield`.
*   **Key Hooks (Examples):**
    *   Initialization: `pytest_addoption`, `pytest_configure`, `pytest_sessionstart`, `pytest_sessionfinish`, `pytest_unconfigure`, `pytest_load_initial_conftests`.
    *   Collection: `pytest_collect_file`, `pytest_pycollect_makeitem`, `pytest_collection_modifyitems`, `pytest_ignore_collect`, `pytest_generate_tests`, `pytest_collect_directory`.
    *   Test Execution: `pytest_runtest_setup`, `pytest_runtest_call`, `pytest_runtest_teardown`, `pytest_runtest_makereport`.
    *   Reporting: `pytest_report_header`, `pytest_terminal_summary`, `pytest_runtest_logreport`, `pytest_report_teststatus`.
    *   Assertion: `pytest_assertrepr_compare`, `pytest_assertion_pass` (experimental).
    *   Debugging: `pytest_exception_interact`, `pytest_enter_pdb`, `pytest_leave_pdb`.
*   **Declaring New Hooks:** Define spec functions, register via `pytest_addhooks(pluginmanager)`. Call via `config.hook.hook_name(...)`.

### Key API Objects

*   **`pytest.Config`:** Configuration object (`pytestconfig` fixture).
*   **Nodes (`pytest.Item`, `pytest.Collector`, etc.):** Represent items in the collection tree. Key attributes: `name`, `nodeid`, `path`, `fspath` (legacy), `config`, `session`, `parent`, `keywords`, `stash`. Methods: `getparent()`, `iter_markers()`, `get_closest_marker()`, `add_marker()`.
*   **`pytest.FixtureRequest` (`request` fixture):** Context for fixture execution.
*   **`pytest.Metafunc`:** Passed to `pytest_generate_tests` hook for parametrization. Method: `parametrize()`.
*   **`pytest.Mark`:** Represents an applied mark. Attributes: `name`, `args`, `kwargs`.
*   **`pytest.MarkDecorator`:** Object returned by `pytest.mark.NAME`.
*   **`pytest.MarkGenerator` (`pytest.mark`):** Factory for marks.
*   **`pytest.ExceptionInfo`:** Wrapper around exceptions caught by `pytest.raises`. Attributes: `type`, `value`, `traceback`. Methods: `match()`, `group_contains()`.
*   **`pytest.RaisesGroup` / `pytest.RaisesExc`:** Context managers for asserting :exc:`ExceptionGroup`.
*   **`pytest.TestReport` / `pytest.CollectReport`:** Test/collection outcome objects. Attributes: `nodeid`, `location`, `keywords`, `outcome`, `longrepr`, `when`, `duration`.
*   **`pytest.Parser` / `pytest.OptionGroup`:** For adding command-line/ini options.
*   **`pytest.Cache` (`config.cache`):** Cross-session data storage.
*   **`pytest.MonkeyPatch` (`monkeypatch` fixture):** For safe patching.
*   **`pytest.CaptureFixture` (`capsys`/`capfd` fixtures):** For capturing output.
*   **`pytest.LogCaptureFixture` (`caplog` fixture):** For capturing logs.
*   **`pytest.WarningsRecorder` (`recwarn` fixture):** For recording warnings.
*   **`pytest.TempPathFactory` (`tmp_path_factory` fixture):** For creating temporary directories (`pathlib.Path`).
*   **`pytest.Pytester` (`pytester` fixture):** For testing pytest plugins. Includes `RunResult`, `LineMatcher`, `HookRecorder`.
*   **`pytest.Stash` / `pytest.StashKey`:** Type-safe storage on nodes/config.

### Exit Codes (`pytest.ExitCode`)

*   `0`: OK (all tests passed)
*   `1`: TESTS_FAILED (some tests failed)
*   `2`: INTERRUPTED (user interrupt)
*   `3`: INTERNAL_ERROR
*   `4`: USAGE_ERROR
*   `5`: NO_TESTS_COLLECTED

### Backwards Compatibility & Deprecations

*   Pytest aims for smooth transitions. Breaking changes usually occur in major versions (X.0).
*   Deprecations are announced with `PytestDeprecationWarning` or `PytestRemovedInXWarning`. Warnings become errors in the major release prior to removal.
*   Check `deprecations.rst` and `backwards-compatibility.rst` in docs for details.
*   **Key Recent Removals:** Python 3.7 support (in pytest 8.0), `pytest.Instance` collector (7.0), `pytest.collect` module (7.0), `--result-log` (6.0), `junit_family` default change (6.0), `yield_fixture` alias (6.2), `[pytest]` section in `setup.cfg` (use `[tool:pytest]`) (4.0).
*   **Key Deprecations:** Nose support (`setup`/`teardown`, `@with_setup`), `msg=` argument in `fail`/`skip`/`exit` (use `reason=`), `fspath` arguments/attributes (use `pathlib.Path`), `py.path.local` hook arguments, applying marks to fixture functions, returning non-None from tests.

---

This cheatsheet is based on the provided documentation snippets and aims to be dense and self-contained.

```