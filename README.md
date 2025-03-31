# Gemini Cheatsheet Generator

This project uses the Google Gemini API to automatically generate dense, self-contained Markdown cheatsheets from the documentation found within software project repositories. The goal is to create practical summaries optimized for consumption by Large Language Model (LLM) agents (or humans!) needing a quick, factual overview of a tool's API and core concepts based *only* on its source documentation.

## How it Works

The script performs the following steps for each specified project:

1.  **Clones Repository:** Clones the target project's repository using `git clone --depth=1`.
2.  **Extracts Documentation:** Uses the [`files-to-prompt`](https://github.com/mozilla/files-to-prompt) tool to extract text content from Markdown files found within the specified documentation path inside the cloned repository.
3.  **Generates Cheatsheet:** Sends the extracted documentation text to the configured Google Gemini model via the API, along with a system prompt instructing it to create a dense, accurate, and self-contained Markdown cheatsheet.
4.  **Saves Output:** Saves the generated cheatsheet as a Markdown file (`[project_name]_cheatsheet.md`) in the output directory.
5.  **Cleans Up:** Removes the temporarily cloned repository.

## Prerequisites

Before running the script, ensure you have the following installed:

1.  **Bun:** The script is written for the Bun runtime. ([Installation Guide](https://bun.sh/docs/installation))
2.  **Git:** Required for cloning repositories.
3.  **Python 3 & Pip:** Required by the `files-to-prompt` tool.
4.  **`files-to-prompt`:** The core documentation extraction tool. Install it globally:
    ```bash
    npm install -g @mozilla/files-to-prompt
    # or using pip directly if preferred
    # pip3 install files-to-prompt
    ```
5.  **Google Gemini API Key:** You need an API key from Google AI Studio. ([Get an API Key](https://aistudio.google.com/app/apikey))

## Setup

1.  **Clone this repository:**
    ```bash
    git clone <your-repo-url>
    cd gemini-cheatsheet-generator # Or your chosen directory name
    ```
2.  **Install dependencies:**
    ```bash
    bun install
    ```

## Configuration

1.  **Gemini API Key:**
    Set the `GEMINI_API_KEY` environment variable:
    ```bash
    export GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```
    *Note: It's recommended to use a secret management system or `.env` file (and add `.env` to `.gitignore`) for storing your API key securely, rather than exporting it directly in your shell history.*

2.  **Target Projects (Sources):**
    You define the projects to generate cheatsheets for in two ways:

    *   **(Recommended) JSON Source Files:** Create JSON files in the `./sources` directory. Each file defines one project. This method allows processing multiple projects easily.
        *   **Format:**
            ```json
            // sources/bun.json (example)
            {
              "name": "Bun", // Project name (used for output filename)
              "repo": "https://github.com/oven-sh/bun", // Git repository URL
              "path": "docs" // Relative path within the repo to the documentation files/directory
            }
            ```
        *   **Important:** The `path` should point to the directory containing the Markdown files you want to process (e.g., `docs`, `docs/api`, `website/docs`). You may need to inspect the target repository to find the correct path.
        *   A script `create_sources.sh` is included to generate example source files for popular projects. Review and adjust the `path` in these generated files.

    *   **(Fallback) Environment Variables:** If no source file paths are provided as command-line arguments, the script will look for these environment variables to define a *single* project:
        *   `REPO_URL`: Git repository URL.
        *   `PROJECT_NAME`: Name of the project.
        *   `DOCS_DIR`: Relative path to the documentation directory within the repo.
        ```bash
        export REPO_URL="https://github.com/some/repo"
        export PROJECT_NAME="SomeProject"
        export DOCS_DIR="documentation"
        ```

3.  **Gemini Model (Optional):**
    You can specify a different Gemini model via the `GEMINI_MODEL` environment variable. It defaults to `gemini-2.5-pro-exp-03-25`.
    ```bash
    export GEMINI_MODEL="gemini-1.5-flash-latest"
    ```

## Usage

Make sure your `GEMINI_API_KEY` is set.

*   **Generate from Source Files:**
    Pass the paths to your source JSON files as arguments:
    ```bash
    bun run generate.ts sources/bun.json
    # Or multiple files:
    bun run generate.ts sources/bun.json sources/vite.json sources/nestjs.json
    # You can also use `bun start ...`
    ```

*   **Generate from Environment Variables (Fallback):**
    Ensure `REPO_URL`, `PROJECT_NAME`, and `DOCS_DIR` are set, then run without arguments:
    ```bash
    # Ensure REPO_URL, PROJECT_NAME, DOCS_DIR are exported
    bun run generate.ts
    ```

## Output

Generated cheatsheets will be saved as Markdown files in the `./cheatsheets` directory (relative to where you run the script).

*If running via Docker (see below), this corresponds to the volume mapped to `/app/output` inside the container.*

## Running with Docker

A `Dockerfile` is provided to containerize the script and its dependencies.

1.  **Build the Docker image:**
    ```bash
    docker build -t gemini-cheatsheet-gen .
    ```

2.  **Run the container:**
    You need to mount a volume for the output and pass the Gemini API key securely.

    *   **Using Source Files (Mount sources directory):**
        ```bash
        docker run --rm \
          -e GEMINI_API_KEY="YOUR_API_KEY_HERE" \
          -v "$(pwd)/sources:/app/sources:ro" \ # Mount local sources read-only
          -v "$(pwd)/cheatsheets:/app/output" \ # Mount local dir for output
          gemini-cheatsheet-gen \
          sources/bun.json sources/vite.json # Arguments passed to the script inside container
        ```

    *   **Using Environment Variables:**
        ```bash
        docker run --rm \
          -e GEMINI_API_KEY="YOUR_API_KEY_HERE" \
          -e REPO_URL="https://github.com/some/repo" \
          -e PROJECT_NAME="SomeProject" \
          -e DOCS_DIR="documentation" \
          -v "$(pwd)/cheatsheets:/app/output" \ # Mount local dir for output
          gemini-cheatsheet-gen
          # No source file arguments needed here
        ```

## Customization

*   **System Prompt:** Modify the `systemInstruction` variable in `generate_cheatsheet.ts` to change how the cheatsheet is structured or what aspects are emphasized.
*   **Gemini Configuration:** Adjust `generationConfig` in `generate_cheatsheet.ts` to tweak temperature, max output tokens, etc.
*   **`files-to-prompt` Behavior:** Refer to the `files-to-prompt` documentation for options on how it extracts text (though this script uses its default behavior).

## License

This project is licensed under the MIT License. See the `LICENSE` file (if created) or the standard MIT License text for details.
