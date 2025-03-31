# Use the official Bun image as the base
# It includes Node.js and basic build tools
FROM oven/bun:latest

# Install system dependencies: git (for cloning), python3 and pip (for files-to-prompt)
# Clean up apt cache afterwards to keep the image smaller
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        python3 \
        python3-pip \
        ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Install the files-to-prompt tool using pip
RUN pip3 install files-to-prompt

# Set the working directory inside the container
WORKDIR /app

# Copy the Bun script into the container
COPY generate_cheatsheet.ts .

# Install required Node.js packages using Bun
# mime-types is needed for the result processing part of the original script
RUN bun install @google/generative-ai mime-types minimist

# Define environment variables for configuration (API key passed at runtime)
ENV REPO_URL=""
ENV PROJECT_NAME=""
ENV DOCS_DIR=""
# GEMINI_API_KEY should be passed securely at runtime, not hardcoded here

# Set the entrypoint to run the Bun script
ENTRYPOINT ["bun", "run", "generate_cheatsheet.ts"]
