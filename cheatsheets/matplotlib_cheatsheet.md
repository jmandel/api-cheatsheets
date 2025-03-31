## Introduction for the LLM Agent

Hello! This cheatsheet provides a dense overview of Matplotlib, a comprehensive Python library for creating static, animated, and interactive visualizations. It is based *solely* on the provided documentation snippets and is designed to help you, an LLM agent, quickly grasp the core concepts, structure, configuration, and essential API elements needed to start generating and manipulating Matplotlib plots programmatically. The information covers library structure, documentation building, configuration settings, core plotting interfaces (Axes and pyplot), the Artist hierarchy, Figure management, specific plot types, and associated helper modules.

---

## Matplotlib Cheatsheet

### Overview

Matplotlib is a Python library for creating static, animated, and interactive visualizations. It offers two main interfaces:

1.  **Axes Interface (Object-Oriented):** Explicitly create and manipulate Figure and Axes objects. (Recommended for complex plots and programmatic use).
2.  **pyplot Interface (Function-Based):** Implicitly uses global Figure and Axes objects, manipulated via `matplotlib.pyplot` functions. (Convenient for interactive work and simple plots).

### Core Concepts & Interfaces

**Axes Interface Example:**

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2 * np.pi, 200)
y = np.sin(x)

fig, ax = plt.subplots() # Create a figure and an axes
ax.plot(x, y)
ax.set_title("Axes Interface Plot")
# plt.show() # Display - often implicit in interactive environments
```

**pyplot Interface Example:**

```python
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 2 * np.pi, 200)
y = np.sin(x)

plt.plot(x, y)
plt.title("pyplot Interface Plot")
# plt.show() # Display - often implicit in interactive environments
```

**Key Components:**

*   **Figure (`matplotlib.figure.Figure`):** The top-level container for all plot elements. Can contain multiple Axes.
*   **Axes (`matplotlib.axes.Axes`):** Represents a single plot (or subplot) within a Figure. Contains most plotting methods (`plot`, `scatter`, `hist`, etc.) and elements like axes, ticks, labels.
*   **Axis (`matplotlib.axis.Axis`):** Represents the x/y/z axis, handling limits, ticks, and labels.
*   **Artist (`matplotlib.artist.Artist`):** Base class for everything visible on the Figure, including Figure, Axes, lines, text, patches, etc.

### Installation (Brief Overview from Docs)

Standard installation methods mentioned:

*   `pip install matplotlib`
*   `conda install -c conda-forge matplotlib`
*   `pixi add matplotlib`
*   `uv add matplotlib` (with potential backend limitations, may need e.g., `pyside6`)

### Documentation Structure & Building

*   **Source Directory:** Primarily under `doc/`.
*   **Build System:** Uses Sphinx with reStructuredText (ReST).
*   **Configuration:** `doc/conf.py` (Sphinx config), `doc/docutils.conf` (HTML output config), `doc/matplotlibrc` (plotting defaults for docs).
*   **Content Folders:**
    *   `api/`: API documentation templates (generated from docstrings).
    *   `devel/`: Developer/contribution guides.
    *   `project/`: About Matplotlib (mission, history, license).
    *   `users/`: User guides, tutorials, FAQs, explanations.
    *   `galleries/`: Source Python scripts for examples/tutorials (processed by `sphinx-gallery`).
*   **Build Folders (within `doc/`):**
    *   `_static/`: Supplementary files (images, CSS).
    *   `_templates/`: Sphinx page templates.
    *   `sphinxext/`: Custom Sphinx extensions for Matplotlib docs.
*   **Symlinks:** Sphinx-gallery creates symlinks during build (e.g., `galleries/examples` -> `doc/gallery`). Edit source files, not symlinks.
*   **Building:**
    *   Uses `Makefile` (Linux/macOS) or `make.bat` (Windows) in the `doc/` directory.
    *   Requires Sphinx installed (`python -msphinx`).
    *   **Common Commands:**
        *   `make help`: Show available targets.
        *   `make html`: Build HTML documentation (output in `doc/build/html/`).
        *   `make html-noplot`: Build HTML without running/plotting gallery examples (faster).
        *   `make html-skip-subdirs`: Build HTML skipping subdirectories listed in `.mpl_skip_subdirs.yaml` (creates file on first run). Useful for faster partial builds, but may break crosslinks.
        *   `make clean`: Remove build directory and generated files.
        *   `make show`: Open built HTML docs in a browser.
        *   `make latexpdf`: Build PDF documentation.
    *   **Build Variables/Options:**
        *   `SPHINXOPTS`: Options passed to Sphinx (default: `-W --keep-going`). Can be overridden (e.g., `make SPHINXOPTS= html`).
        *   `SPHINXBUILD`: Command to run Sphinx (default: `python -msphinx`).
        *   `O` variable: Pass additional Sphinx options (e.g., `make O=-j4 html` for parallel build).
        *   Windows: Use `set SPHINXOPTS=...` and `set O=...` before `make.bat`.

### Configuration (`conf.py` and `matplotlibrc`)

**`conf.py` (Sphinx Build Configuration):**

*   **Project Info:** `project`, `copyright`, `version`, `release` (derived from `matplotlib.__version__`), `sourceyear`.
*   **Extensions:** Lists Sphinx extensions used, e.g., `sphinx.ext.autodoc`, `sphinx.ext.autosummary`, `numpydoc`, `sphinx_gallery.gen_gallery`, `matplotlib.sphinxext.plot_directive`, `sphinx_copybutton`, `sphinx_design`, `sphinx_tags`.
*   **Dependency Checks:** `_check_dependencies` function verifies required build dependencies (Graphviz `dot`, LaTeX, Python packages).
*   **HTML Theme:** `html_theme = "mpl_sphinx_theme"`.
    *   `html_theme_options`: Configures theme features like navbar links, version switcher (`switcher.json`), analytics (Plausible), announcement banners.
*   **Paths:** `templates_path`, `html_static_path`, `exclude_patterns`.
*   **Autodoc Settings:** Configures how docstrings are processed (`autodoc_typehints = "none"`, `autodoc_mock_imports`, `autodoc_docstring_signature = True`). `autodoc_process_bases` hook used to hide pybind11 base objects.
*   **Intersphinx:** `intersphinx_mapping` dictionary defines links to external project documentation (Python, NumPy, SciPy, Pandas, etc.).
*   **Sphinx Gallery:** `sphinx_gallery_conf` dictionary configures example/tutorial generation (source/target dirs, image scrapers like `matplotlib_reduced_latex_scraper`, thumbnail size, etc.).
*   **Plot Directive:** `plot_formats`, `plot_srcset` configure output formats and resolutions for plots embedded via `.. plot::`.
*   **Math Rendering:** `mathmpl_fontsize`, `mathmpl_srcset` configure math rendering via Matplotlib's engine.
*   **Source Code Linking:** `linkcode_resolve` function generates links to source code on GitHub based on object inspection.
*   **Sphinx Tags:** `tags_create_tags`, `tags_page_title`, `tags_create_badges`, `tags_badge_colors` configure the `sphinx-tags` extension.
*   **Nitpicky Mode:** `nitpicky = True` enables warnings for unresolved references. `missing_references.json` (configured via `missing_references_filename`) lists known/ignored missing references.
*   **Setup Function:** `setup(app)` function connects custom hooks and configurations to the Sphinx application.

**`matplotlibrc` (Runtime Configuration):**

*   A configuration file for setting default plotting parameters.
*   Snippet provided sets:
    *   `backend: Agg` (non-interactive backend suitable for file output).
    *   `figure.figsize: 5.5, 4.5` (default figure size in inches).
    *   `savefig.dpi: 80` (default resolution for saved figures).
    *   `docstring.hardcopy: True` (setting for hardcopy docstring generation).
    *   `animation.embed_limit: 30` (MB limit for embedding animations).

**`docutils.conf` (HTML Output Configuration):**

*   Sets `field-name-limit` and `image_loading: lazy` for the HTML writer.

### Artist API (`matplotlib.artist`)

*   **Base Class:** `Artist` is the base class for almost everything visible on a Figure.
*   **Core Methods:**
    *   **Drawing:** `draw(renderer)`, `set_visible(bool)`, `get_visible()`, `set_alpha(float)`, `get_alpha()`, `set_zorder(float)`, `get_zorder()`, `set_animated(bool)`, `get_animated()`.
    *   **Clipping:** `set_clip_on(bool)`, `get_clip_on()`, `set_clip_box(bbox)`, `get_clip_box()`, `set_clip_path(path, transform=None)`, `get_clip_path()`.
    *   **Transforms:** `set_transform(Transform)`, `get_transform()`, `is_transform_set()`.
    *   **Interaction:** `set_picker(picker)`, `get_picker()`, `pick()`, `contains(mouseevent)`, `set_mouseover(bool)`, `get_mouseover()`, `get_cursor_data(event)`.
    *   **Hierarchy:** `axes` (property), `figure` (property), `set_figure(Figure)`, `get_figure()`, `get_children()`, `findobj(match=None)`.
    *   **Metadata:** `set_label(str)`, `get_label()`, `set_gid(str)`, `get_gid()`, `set_url(str)`, `get_url()`.
    *   **State:** `stale` (property), `pchanged()`, `add_callback(func)`, `remove_callback(oid)`.
    *   **Bulk Setting:** `set(**kwargs)`, `update(props)`, `update_from(other)`, `properties()`.
    *   **Layout:** `set_in_layout(bool)`, `get_in_layout()`, `sticky_edges` (property).
    *   **Units:** `convert_xunits(x)`, `convert_yunits(y)`, `have_units()`.
    *   **Removal:** `remove()`.
*   **Helper Functions:** `setp(obj, *args, **kwargs)` (set properties), `getp(obj, property=None)` (get properties), `kwdoc(artist)`, `allow_rasterization`.

### Figure API (`matplotlib.figure`)

*   **Figure Class (`Figure`):** Top-level container. Inherits from `FigureBase`.
    *   **Adding Axes/Subplots:** `add_axes(rect, **kwargs)`, `add_subplot(*args, **kwargs)`, `subplots(nrows=1, ncols=1, **kwargs)`, `subplot_mosaic(mosaic, **kwargs)`, `add_gridspec(nrows, ncols, **kwargs)`.
    *   **Adding Subfigures (Experimental):** `add_subfigure(subplotspec, **kwargs)`, `subfigures(nrows=1, ncols=1, **kwargs)`.
    *   **Axes Management:** `get_axes()`, `axes` (property), `delaxes(ax)`, `gca()`, `sca(ax)`.
    *   **Saving:** `savefig(fname, **kwargs)`. Takes `metadata` and `pil_kwargs`.
    *   **Annotations:** `colorbar(mappable, **kwargs)`, `legend(*args, **kwargs)`, `text(x, y, s, **kwargs)`, `suptitle(t, **kwargs)`, `get_suptitle()`, `supxlabel(t, **kwargs)`, `get_supxlabel()`, `supylabel(t, **kwargs)`, `get_supylabel()`.
    *   **Layout:** `subplots_adjust(...)`, `tight_layout(...)`, `align_labels()`, `align_xlabels()`, `align_ylabels()`, `align_titles()`, `set_layout_engine(...)`, `get_layout_engine()`.
    *   **Appearance:** `set_facecolor(color)`, `get_facecolor()`, `set_edgecolor(color)`, `get_edgecolor()`, `set_frameon(bool)`, `get_frameon()`, `set_linewidth(float)`, `get_linewidth()`.
    *   **Size/DPI:** `set_size_inches(w, h, forward=True)`, `get_size_inches()`, `set_figwidth(w)`, `get_figwidth()`, `set_figheight(h)`, `get_figheight()`, `set_dpi(val)`, `get_dpi()`, `dpi` (property).
    *   **Interaction:** `ginput(...)`, `waitforbuttonpress(...)`, `pick(mouseevent)`.
    *   **Drawing:** `draw(renderer=None)`, `draw_artist(a)`, `draw_without_rendering()`.
    *   **Other:** `clear()`, `show()`, `set_canvas(canvas)`, `add_artist(a)`, `get_children()`, `figimage(...)`, `add_axobserver(func)`, `get_tightbbox(renderer, ...)`, `get_window_extent(renderer=None)`.
*   **SubFigure Class (`SubFigure`):** Logical figure within a parent Figure. Shares many methods with `Figure` (e.g., `subplots`, `suptitle`, `supxlabel`, `supylabel`, `add_artist`, appearance methods).
*   **Helper Function:** `figaspect(shape)`: Calculate figure size based on aspect ratio.

### Axes API (`matplotlib.axes`)

*   **Axes Class (`Axes`):** Represents a subplot. Inherits from `_AxesBase`. Contains most plotting methods.
    *   **Attributes:** `viewLim`, `dataLim` (Bboxes). `xaxis`, `yaxis` (Axis objects). `patch` (background Rectangle). `spines` (Spines object). `stale` (property). `figure` (property).
    *   **Plotting Methods (Selected examples):**
        *   *Basic:* `plot`, `errorbar`, `scatter`, `step`, `loglog`, `semilogx`, `semilogy`, `fill_between`, `fill_betweenx`, `bar`, `barh`, `bar_label`, `stem`, `eventplot`, `pie`, `stackplot`, `broken_barh`, `vlines`, `hlines`, `fill`.
        *   *Spans:* `axhline`, `axhspan`, `axvline`, `axvspan`, `axline`.
        *   *Spectral:* `acorr`, `angle_spectrum`, `cohere`, `csd`, `magnitude_spectrum`, `phase_spectrum`, `psd`, `specgram`, `xcorr`.
        *   *Statistics:* `ecdf`, `boxplot`, `violinplot`, `bxp`, `violin`.
        *   *Binned:* `hexbin`, `hist`, `hist2d`, `stairs`.
        *   *Contours:* `clabel`, `contour`, `contourf`.
        *   *2D Arrays:* `imshow`, `matshow`, `pcolor`, `pcolorfast`, `pcolormesh`, `spy`.
        *   *Unstructured Triangles:* `tripcolor`, `triplot`, `tricontour`, `tricontourf`.
        *   *Text/Annotations:* `annotate`, `text`, `table`, `arrow`, `inset_axes`, `indicate_inset`, `indicate_inset_zoom`, `secondary_xaxis`, `secondary_yaxis`.
        *   *Vector Fields:* `barbs`, `quiver`, `quiverkey`, `streamplot`.
    *   **Configuration Methods (Selected examples):**
        *   *Clearing:* `cla()`, `clear()`.
        *   *Appearance:* `axis(...)`, `set_axis_off()`, `set_axis_on()`, `set_frame_on(bool)`, `get_frame_on()`, `set_axisbelow(bool)`, `get_axisbelow()`, `grid(...)`, `set_facecolor(color)`, `get_facecolor()`.
        *   *Axis/Limits:* `set_xlim(...)`, `get_xlim()`, `set_ylim(...)`, `get_ylim()`, `invert_xaxis()`, `xaxis_inverted()`, `invert_yaxis()`, `yaxis_inverted()`.
        *   *Labels/Title/Legend:* `set_xlabel(...)`, `get_xlabel()`, `set_ylabel(...)`, `get_ylabel()`, `set_title(...)`, `get_title()`, `legend(...)`, `get_legend()`, `get_legend_handles_labels()`.
        *   *Scales:* `set_xscale(...)`, `get_xscale()`, `set_yscale(...)`, `get_yscale()`.
        *   *Autoscaling/Margins:* `autoscale(...)`, `margins(...)`, `relim()`.
        *   *Aspect Ratio:* `set_aspect(...)`, `get_aspect()`, `set_box_aspect(...)`, `get_box_aspect()`.
        *   *Ticks/Labels:* `set_xticks(...)`, `get_xticks()`, `set_xticklabels(...)`, `get_xticklabels()`, `set_yticks(...)`, `get_yticks()`, `set_yticklabels(...)`, `get_yticklabels()`, `tick_params(...)`, `locator_params(...)`, `ticklabel_format(...)`.
    *   **Adding Artists:** `add_artist(a)`, `add_collection(col)`, `add_line(line)`, `add_patch(patch)`, `add_table(tab)`.
    *   **Sharing/Twinning:** `twinx()`, `twiny()`, `sharex(other)`, `sharey(other)`.
    *   **Positioning:** `get_position()`, `set_position(pos, which='both')`.
    *   **Interaction:** `can_pan()`, `can_zoom()`, `start_pan(...)`, `drag_pan(...)`, `end_pan(...)`, `format_coord(x, y)`.
    *   **Other:** `set(**kwargs)`. `remove()`.

### pyplot API (`matplotlib.pyplot`)

*   Provides a state-machine interface similar to MATLAB.
*   Implicitly manages figures and axes (`gcf()`, `gca()`).
*   Most `Axes` plotting and configuration methods have a corresponding `pyplot` function (e.g., `plt.plot()`, `plt.xlabel()`, `plt.title()`).
*   **Figure/Axes Management:** `figure()`, `subplots()`, `subplot()`, `subplot_mosaic()`, `axes()`, `sca()`, `delaxes()`, `cla()`, `clf()`, `close()`.
*   **Output/Interaction:** `show()`, `savefig()`, `draw()`, `pause()`, `ion()`, `ioff()`, `isinteractive()`, `ginput()`, `waitforbuttonpress()`.
*   **Configuration:** `rc()`, `rc_context()`, `rcdefaults()`.
*   **Helpers:** `get()`, `setp()`, `findobj()`, `get_cmap()`, `colormaps`, `color_sequences`.

### Artists (Specific Types)

*   **Lines (`matplotlib.lines`):** `Line2D` class (returned by `plot`). Key properties: `color`, `linewidth`, `linestyle`, `marker`, `markersize`, `markevery`.
*   **Patches (`matplotlib.patches`):** Shapes like `Rectangle`, `Circle`, `Polygon`, `Ellipse`, `Arrow`, `FancyArrowPatch`, `Wedge`, `Annulus`. Base class `Patch`. Properties: `facecolor`, `edgecolor`, `linewidth`, `linestyle`, `hatch`, `alpha`.
*   **Collections (`matplotlib.collections`):** Efficiently draw large numbers of similar objects (e.g., `LineCollection`, `PolyCollection`, `PathCollection`, `QuadMesh`). Often returned by plotting functions like `scatter`, `pcolormesh`, `contourf`. Inherit from `ScalarMappable` if they use colormaps.
*   **Images (`matplotlib.image`):** `AxesImage` (from `imshow`), `FigureImage` (from `figimage`), `NonUniformImage`, `PcolorImage`. Properties: `cmap`, `norm`, `interpolation`, `origin`, `extent`.
*   **Text (`matplotlib.text`):** `Text` class (for labels, titles, annotations). Properties: `text`, `color`, `fontsize`, `fontfamily`, `fontstyle`, `fontweight`, `rotation`, `ha` (horizontalalignment), `va` (verticalalignment). `Annotation` subclass for adding arrows. `TextPath` for converting text to paths.
*   **Contour (`matplotlib.contour`):** `ContourSet` class (returned by `contour`, `contourf`). Contains collections of lines/paths.
*   **Quiver (`matplotlib.quiver`):** `Quiver` (from `quiver`), `Barbs` (from `barbs`), `QuiverKey` (for legend).

### Ticks, Locators, Formatters (`matplotlib.axis`, `matplotlib.ticker`, `matplotlib.dates`)

*   **Axis (`matplotlib.axis`):** `Axis` base class, `XAxis`, `YAxis`. Manages ticks, labels, scale.
    *   Methods: `set_major_locator`, `set_minor_locator`, `set_major_formatter`, `set_minor_formatter`, `get_major_ticks`, `get_minor_ticks`, `get_ticklabels`, `set_ticks`, `set_ticklabels`, `set_scale`, `get_scale`, `set_units`, `get_units`, `axis_date`.
*   **Tick (`matplotlib.axis`):** `Tick` base class, `XTick`, `YTick`. Represents a single tick mark and its associated labels/gridline.
    *   Attributes: `label1`, `label2`, `tick1line`, `tick2line`, `gridline`.
*   **Ticker (`matplotlib.ticker`):** Contains locator and formatter classes.
    *   **Locators:** Determine tick positions. Base: `Locator`. Examples: `FixedLocator`, `MultipleLocator`, `LogLocator`, `MaxNLocator`, `AutoLocator`, `IndexLocator`, `LinearLocator`.
    *   **Formatters:** Determine tick label strings. Base: `Formatter`. Examples: `FixedFormatter`, `FuncFormatter`, `FormatStrFormatter`, `ScalarFormatter`, `LogFormatter`, `PercentFormatter`, `EngFormatter`, `IndexFormatter`.
*   **Dates (`matplotlib.dates`):** Date-specific locators, formatters, and converters.
    *   **Locators:** `AutoDateLocator`, `RRuleLocator`, `YearLocator`, `MonthLocator`, `WeekdayLocator`, `DayLocator`, `HourLocator`, `MinuteLocator`, `SecondLocator`.
    *   **Formatters:** `AutoDateFormatter`, `ConciseDateFormatter`, `DateFormatter`.
    *   **Converters:** `date2num`, `num2date`, `datestr2num`.

### Colors and Colormaps (`matplotlib.colors`, `matplotlib.cm`)

*   **Color Specification:** Accepts various formats (e.g., 'r', 'red', '#FF0000', '#F00', (0, 1, 0), 'C0', 'tab:blue').
*   **Normalization (`matplotlib.colors`):** Map data values to [0, 1] for colormapping. Base: `Normalize`. Examples: `NoNorm`, `LogNorm`, `SymLogNorm`, `PowerNorm`, `BoundaryNorm`, `TwoSlopeNorm`, `CenteredNorm`, `FuncNorm`.
*   **Colormaps (`matplotlib.colors`, `matplotlib.cm`):** Map normalized values to colors. Base: `Colormap`. Examples: `LinearSegmentedColormap`, `ListedColormap`. Access registered colormaps via `matplotlib.colormaps['viridis']` or `plt.get_cmap('viridis')`.
    *   `.Colormap.reversed()` creates reversed instance.
    *   `.Colormap.with_extremes(...)` creates copy with under/over/bad colors set.
*   **ScalarMappable (`matplotlib.cm`):** Mixin class for artists that map data values to colors (e.g., `AxesImage`, `ContourSet`, `PathCollection`). Manages `norm` and `cmap`. `to_rgba(x)` converts data *x* to RGBA.
*   **ColorConverter (`matplotlib.colors`):** Handles conversion between color formats (`to_rgb`, `to_rgba`, `to_hex`).
*   **ColorSequenceRegistry (`matplotlib.colors`):** Manages named color sequences (available via `matplotlib.color_sequences`).
*   **LightSource (`matplotlib.colors`):** For creating shaded relief.

### Transforms (`matplotlib.transforms`)

*   **Coordinate Systems:** Data, Axes (fraction 0-1), Figure (fraction 0-1), Display (pixels).
*   **Core Classes:**
    *   `Transform`: Base class for transformations. Methods: `transform(values)`, `transform_path(path)`, `inverted()`. Supports `+` for composition.
    *   `Bbox`: Represents a bounding box. Methods: `contains(x, y)`, `overlaps(other)`, `union(bboxes)`. Properties: `x0`, `y0`, `x1`, `y1`, `width`, `height`.
    *   `Affine2D`: Represents a 2D affine transformation (scale, translate, rotate, skew).
    *   `IdentityTransform`: No-op transform.
    *   `BlendedGenericTransform`: Blends x-coords from one transform and y-coords from another.
    *   `TransformedBbox`: A `Bbox` whose coordinates undergo a `Transform`.
    *   `BboxTransform`, `BboxTransformTo`, `BboxTransformFrom`: Transforms between bounding boxes.
*   **Axes Transforms:** `ax.transData`, `ax.transAxes`, `ax.transFigure` (last one usually same as `fig.transFigure`).

### Animation (`matplotlib.animation`)

*   **Core Classes:**
    *   `Animation`: Base class.
    *   `FuncAnimation`: Creates animation by repeatedly calling a function `func(frame, *fargs)`. Requires `init_func` for blitting.
    *   `ArtistAnimation`: Creates animation from a list of artists.
*   **Key Concept:** Must keep a reference to the `Animation` object to prevent garbage collection.
*   **Saving:** `ani.save(filename, writer=None, fps=None, ...)`. Uses registered `MovieWriter` instances.
*   **Writers:** `PillowWriter` (GIF), `HTMLWriter` (JS/HTML), `FFMpegWriter`/`FFMpegFileWriter`, `ImageMagickWriter`/`ImageMagickFileWriter`. Registry available via `matplotlib.animation.writers`. Use `writer.saving(...)` context manager for direct use.

### Widgets (`matplotlib.widgets`)

*   GUI-neutral interactive elements.
*   **Selectors:** `RectangleSelector`, `EllipseSelector`, `LassoSelector`, `PolygonSelector`, `SpanSelector`. Common methods: `set_active(bool)`, `get_active()`, `set_visible(bool)`, `get_visible()`.
*   **Buttons:** `Button`, `CheckButtons`, `RadioButtons`. Trigger `on_clicked(label)` or `on_clicked(event)`.
*   **Sliders:** `Slider`, `RangeSlider`. Trigger `on_changed(val)`.
*   **Other:** `Cursor`, `TextBox`.

### Toolkits (Brief Mention)

*   **`mpl_toolkits.mplot3d`:** For creating 3D plots (`Axes3D`). Methods like `plot_surface`, `plot_wireframe`, `scatter`, `bar3d`, `contour3d`, `text3d`. Use `ax.view_init(elev, azim)` to set view angle.
*   **`mpl_toolkits.axes_grid1`:** Tools for precise placement of axes, often used for images with fixed aspect ratio or colorbars (`ImageGrid`, `AxesDivider`).
*   **`mpl_toolkits.axisartist`:** Support for curvilinear grids and custom axis artists (`SubplotHost`, `ParasiteAxes`).

### Other Modules (Brief Mention)

*   **`matplotlib.path`:** Represents paths (sequences of points and connection types like MOVETO, LINETO, CURVE3, CURVE4, CLOSEPOLY). `Path` class.
*   **`matplotlib.patches`:** 2D shapes (patches).
*   **`matplotlib.lines`:** 2D lines (`Line2D`).
*   **`matplotlib.text`:** Text rendering and layout.
*   **`matplotlib.image`:** Image handling.
*   **`matplotlib.collections`:** Collections of artists.
*   **`matplotlib.markers`:** Marker style definitions (`MarkerStyle`).
*   **`matplotlib.spines`:** Axes spines (the lines bounding the axes area). `Spine` class.
*   **`matplotlib.gridspec`:** More control over subplot layout (`GridSpec`, `SubplotSpec`).
*   **`matplotlib.scale`:** Axis scale transformations (`LinearScale`, `LogScale`, `SymLogScale`, `LogitScale`).
*   **`matplotlib.style`:** Style sheet management (`style.use(...)`).
*   **`matplotlib.units`:** Handling data with units (e.g., dates, categories).
*   **`matplotlib.category`:** Support for categorical data plotting.
*   **`matplotlib.bezier`:** Utilities for Bezier curves.
*   **`matplotlib.hatch`:** Hatch pattern generation.
*   **`matplotlib.patheffects`:** Effects applied to artist paths (`PathEffect` base class).
*   **`matplotlib.cbook`:** Miscellaneous utility functions (often considered internal).
*   **`matplotlib.mlab`:** Numerical utilities (some overlap with NumPy/SciPy).

### API Changes & Deprecation

*   Matplotlib follows a deprecation policy. API changes are announced, marked as deprecated (often with a `MatplotlibDeprecationWarning`), and removed after a specified number of releases (typically two).
*   Check the `api_changes_...rst` files in the documentation for specifics relevant to the version you are using.
*   Recent significant changes mentioned in provided docs: Python 2 support removal (v3.0), default style changes (v2.0), `plot_date` deprecation (v3.5, removed v3.9), `hold` keyword removal (v2.0).


---
**Note:** This cheatsheet is based *only* on the provided documentation snippets. It may not cover every feature or nuance of Matplotlib. No external URLs or references beyond the provided text have been included.