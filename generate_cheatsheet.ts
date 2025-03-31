#!/usr/bin/env bun

import { spawnSync } from "bun";
import fs from "node:fs";
import path from "node:path";
import {
  GoogleGenerativeAI,
  // HarmCategory, // Keep import for potential future use
  // HarmBlockThreshold, // Keep import for potential future use
} from "@google/generative-ai";
import minimist from 'minimist'; // Using minimist for CLI argument parsing

// --- Constants ---
const TEMP_REPO_DIR = "./repo_temp";
const CONTAINER_OUTPUT_DIR = "/app/output"; // Assumes running in a container where /app/output is mapped
const SOURCES_DIR = "./sources"; // Default directory to look for source JSON files if relative path is given

// --- Argument Parsing ---
// Parse arguments, allowing multiple positional arguments for source files
const argv = minimist(process.argv.slice(2));
const sourceFileArgs: string[] = argv._; // Get all positional arguments

// --- Configuration Loading (Initial Check for API Key) ---
const geminiApiKey: string | undefined = process.env.GEMINI_API_KEY;
const geminiModel: string = process.env.GEMINI_MODEL || "gemini-2.5-pro-exp-03-25";

// --- Validation (API Key Only at this stage) ---
if (!geminiApiKey) {
  console.error("❌ Error: GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

// --- Gemini API Setup ---
console.log(`🔧 Using Gemini Model: ${geminiModel}`);
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({
  model: geminiModel,
  // Safety settings removed as per previous request
});

// *** MODIFIED: Reverted system prompt example output ***
const systemInstruction = `You are an expert programmer and technical writer creating highly practical cheatsheets. Analyze the provided documentation for a specific software tool. Your goal is to generate an extremely **dense** and **self-contained** cheatsheet optimized for a capable LLM agent who is unfamiliar with this specific subject matter.

**Key Requirements:**
1.  **Density:** Prioritize information density. Be concise yet comprehensive. Avoid conversational filler or lengthy explanations unless absolutely necessary for clarity based *only* on the provided text.
2.  **Self-Contained:** The cheatsheet must be entirely self-contained. **Do NOT include external URLs, links, or references to outside documentation.**
3.  **Complete:** An agent reading this cheatsheet should be able to get started writing code based only on what they read here. Need full details, methods, explanations, etc.
4.  **Structure:** Use clear, logical Markdown formatting (headings, lists, code blocks) suitable for parsing by another language model.
5.  **Accuracy:** Ensure all information accurately reflects the provided documentation snippets.


## Format
You can start with something like you see below... tailored to the tool/software you're generating docs for, of course.

<exampleOutput>
## Introduction for the LLM Agent

Hello! This cheatsheet provides ... [explain briefly what the doc is about and how it can be used. Don't make reference to your prompt, just make this about the content you've created]

---

## [Project Name] Cheatsheet

### [etc, etc]

</exampleOutput>
\`\`\`

`;


// *** MODIFIED: Keep high maxOutputTokens as requested ***
const generationConfig = {
  temperature: 0.7,
  maxOutputTokens: 65536, // High token limit, API might cap lower
  responseMimeType: "text/plain",
};

// --- Helper Functions ---
function runCommand(command: string, args: string[], cwd?: string, errorMessage?: string): string {
  const displayCwd = cwd ? ` in ${path.relative(process.cwd(), cwd) || '.'}` : '';
  console.log(`🏃 Running: ${command} ${args.join(" ")}${displayCwd}`);
  const { success, stdout, stderr, exitCode } = spawnSync([command, ...args], { cwd });

  if (!success) {
    const errorMsg = errorMessage || `Command "${command}" failed`;
    console.error(`❌ ${errorMsg} (Exit Code: ${exitCode})`);
    console.error("Stderr:\n", stderr.toString());
    // Throw an error instead of exiting, so the loop can continue
    throw new Error(`${errorMsg} (Exit Code: ${exitCode})`);
  }
  console.log(`✅ Success: ${command}`);
  return stdout.toString();
}

async function generateCheatsheetWithGemini(filesToPromptOutput: string, toolName: string): Promise<string> {
    console.log(`\n🤖 Calling Gemini API for ${toolName}...`);

    try {
        const result = await model.generateContent({
            contents: [{
                role: "user",
                parts: [{
                    text: `Here is the documentation content for ${toolName}:\n\n<docs>\n${filesToPromptOutput}\n</docs>\n\nBased *only* on that documentation, generate a **dense**, **complete**, and **self-contained** ${toolName} cheatsheet in Markdown format, following the specified format requirements. Remember: NO external links or URLs.`
                }]
            }],
            systemInstruction: { role: "system", parts: [{ text: systemInstruction }] },
            generationConfig,
            // Safety settings removed
        });

        console.log(`✅ Gemini API call successful for ${toolName}.`);

        // --- Process Gemini Response ---
        const response = result.response;
        let combinedCheatsheetText = "";
        try {
            combinedCheatsheetText = response.text();
        } catch (e) {
            console.warn(`⚠️ Could not directly get text using response.text() for ${toolName}. Checking candidates...`);
            const candidates = response?.candidates;
            if (candidates && candidates.length > 0 && candidates[0].content?.parts?.length > 0) {
                combinedCheatsheetText = candidates[0].content.parts.map(part => part.text).join('');
            }
        }

        if (!combinedCheatsheetText || combinedCheatsheetText.trim() === "") {
            let blockReason = response?.promptFeedback?.blockReason;
            let safetyRatings = response?.promptFeedback?.safetyRatings;

            if (!blockReason && response?.candidates?.[0]?.finishReason && response.candidates[0].finishReason !== 'STOP') {
                blockReason = `Generation stopped: ${response.candidates[0].finishReason}`;
                if (response.candidates[0].safetyRatings) {
                    safetyRatings = response.candidates[0].safetyRatings;
                }
            }

            if (blockReason) {
                console.error(`🚨 Generation failed for ${toolName}. Reason: ${blockReason}`);
                if (safetyRatings) {
                    console.error("Safety Ratings:", JSON.stringify(safetyRatings, null, 2));
                }
            } else {
                console.error(`Response structure for ${toolName}:`, JSON.stringify(response, null, 2)); // Log structure if unknown issue
            }
            throw new Error(`No cheatsheet content generated for ${toolName}.`);
        }

        // Basic validation of expected start
        if (!combinedCheatsheetText.trim().startsWith("## Introduction for the LLM Agent")) {
            console.warn(`⚠️ Warning: Generated text for ${toolName} does not start with the expected '## Introduction for the LLM Agent' heading. Outputting as is.`);
        }

        console.log(`\n✨ Generated Cheatsheet Snippet for ${toolName}: ✨\n`);
        const snippet = combinedCheatsheetText.split('\n').slice(0, 15).join('\n'); // Shorter snippet
        console.log(snippet + (combinedCheatsheetText.split('\n').length > 15 ? "\n..." : ""));

        return combinedCheatsheetText; // Return the generated text

    } catch (error: any) {
        console.error(`❌ Error calling Gemini API or processing response for ${toolName}:`, error.message);
        if (error.response && error.response.promptFeedback) {
            console.error("Prompt Feedback:", JSON.stringify(error.response.promptFeedback, null, 2));
        } else if (error.message?.includes('SAFETY')) {
            console.error("A safety-related issue occurred (potentially default API filters). Check API documentation or response details if available.")
        } else if (error.message?.includes('token')) {
            console.error("An error related to token limits occurred. The input might be too large or the requested 'maxOutputTokens' might exceed the model's limit.");
        }
        // Throw error to be caught by the main loop
        throw new Error(`Gemini API failed for ${toolName}: ${error.message}`);
    }
}

function saveCheatsheet(content: string, projectName: string) {
    const cheatsheetFilename = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_cheatsheet.md`;
    const fullCheatsheetPath = path.join(CONTAINER_OUTPUT_DIR, cheatsheetFilename);

    try {
        fs.mkdirSync(CONTAINER_OUTPUT_DIR, { recursive: true });
        fs.writeFileSync(fullCheatsheetPath, content);
        console.log(`\n💾 Cheatsheet saved to: ${fullCheatsheetPath} (inside container)`);
        console.log(`   (Mapped to host directory, likely './cheatsheets')`);
    } catch (err: any) {
        console.error(`\n❌ Error saving cheatsheet to file '${fullCheatsheetPath}': ${err.message}`);
        if (err.code === 'EACCES') {
            console.error(`   Hint: Check write permissions for the host directory mapped to ${CONTAINER_OUTPUT_DIR}.`);
        }
        // Throw error to be caught by the main loop
        throw new Error(`Failed to save cheatsheet for ${projectName}: ${err.message}`);
    }
}

// --- Main Execution Logic ---
async function processSource(sourceConfig: { name: string, repo: string, path: string, sourceOrigin: string }) {
    const { name: currentProjectName, repo: currentRepoUrl, path: currentDocsDir, sourceOrigin } = sourceConfig;

    console.log(`\n---\n🚀 Processing source: ${currentProjectName} (from ${sourceOrigin}) ---\n`);

    let tempRepoPath = path.join(TEMP_REPO_DIR, currentProjectName.toLowerCase().replace(/[^a-z0-9]/g, '_')); // Unique temp dir per project

    try {
        // 1. Clean up and Clone Repo for the current project
        console.log(`🧹 Cleaning up specific temporary directory: ${tempRepoPath}`);
        try {
            fs.rmSync(tempRepoPath, { recursive: true, force: true });
        } catch (rmError: any) {
            if (rmError.code !== 'ENOENT') {
                console.warn(`⚠️ Could not clean specific temp directory ${tempRepoPath}: ${rmError.message}`);
            }
        }
        fs.mkdirSync(tempRepoPath, { recursive: true }); // Ensure base temp dir exists

        console.log(`⬇️ Cloning repository: ${currentRepoUrl} into ${tempRepoPath}`);
        runCommand("git", ["clone", "--depth=1", currentRepoUrl, tempRepoPath], undefined, `Failed to clone repository for ${currentProjectName}`);

        // 2. Prepare Docs Path
        const fullDocsPath = path.join(tempRepoPath, currentDocsDir);
        console.log(`🔍 Checking documentation path: ${fullDocsPath}`);
        if (!fs.existsSync(fullDocsPath)) {
            throw new Error(`Documentation directory not found at specified path: ${fullDocsPath} (Relative path: ${currentDocsDir})`);
        }

        // 3. Run files-to-prompt
        console.log(`📄 Running files-to-prompt on: ${fullDocsPath}`);
        let filesToPromptOutput: string;
        try {
             // Check if files-to-prompt exists before running (only need to check once ideally, but safe here)
             spawnSync(['files-to-prompt', '--version'], { stdio: ['ignore'] });
             filesToPromptOutput = runCommand("files-to-prompt", [fullDocsPath], undefined, `files-to-prompt execution failed for ${currentProjectName}`);
        } catch (e: any) {
             if (e.message.includes('ENOENT') || e.message.includes('files-to-prompt')) { // Check if error is likely 'command not found'
                 console.error("❌ Error: 'files-to-prompt' command not found. Make sure it's installed and in your PATH.");
                 console.error("   (Install globally via: npm install -g @mozilla/files-to-prompt)");
             }
             // Re-throw other errors from runCommand or spawnSync check
             throw e;
        }


        if (!filesToPromptOutput || filesToPromptOutput.trim().length === 0) {
            throw new Error(`files-to-prompt did not produce any output for ${currentProjectName}. Check DOCS_DIR ('${currentDocsDir}') and file contents.`);
        }
        const bytes = Buffer.byteLength(filesToPromptOutput);
        console.log(`📚 Extracted ${bytes} bytes (${(bytes / 1024 / 1024).toFixed(2)} MB) of documentation content for ${currentProjectName}.`);

        // 4. Generate Cheatsheet using Gemini
        const cheatsheetContent = await generateCheatsheetWithGemini(filesToPromptOutput, currentProjectName);

        // 5. Save Cheatsheet
        saveCheatsheet(cheatsheetContent, currentProjectName);

        console.log(`\n✅ Successfully generated cheatsheet for ${currentProjectName}!`);

    } catch (error: any) {
        // Log the error for this specific source but allow the script to continue
        console.error(`\n❌ Failed to process source ${currentProjectName}: ${error.message}`);
        // Optionally log stack trace: console.error(error.stack);
    } finally {
        // 6. Clean up specific cloned repo directory
        console.log(`🧹 Cleaning up temporary directory: ${tempRepoPath}`);
        try {
            fs.rmSync(tempRepoPath, { recursive: true, force: true });
        } catch (rmError: any) {
            if (rmError.code !== 'ENOENT') {
                console.warn(`⚠️ Could not clean specific temp directory ${tempRepoPath} after processing: ${rmError.message}`);
            }
        }
    }
}

async function run() {
    const sourcesToProcess: { name: string, repo: string, path: string, sourceOrigin: string }[] = [];
    let hasErrors = false;

    if (sourceFileArgs.length > 0) {
        // Mode 1: Process JSON files provided as arguments
        console.log(`ℹ️ Found ${sourceFileArgs.length} source file arguments. Processing each...`);
        for (const sourceFileArg of sourceFileArgs) {
            const sourceFilePath = sourceFileArg.startsWith('/') || sourceFileArg.startsWith('.')
                ? path.resolve(sourceFileArg) // Handle absolute or relative paths
                : path.resolve(SOURCES_DIR, sourceFileArg); // Assume file is in SOURCES_DIR if just filename

            console.log(`\n🔍 Attempting to load configuration from source file: ${sourceFilePath}`);
            if (fs.existsSync(sourceFilePath)) {
                try {
                    const sourceContent = fs.readFileSync(sourceFilePath, 'utf-8');
                    const sourceData = JSON.parse(sourceContent);

                    if (sourceData.repo && sourceData.name && sourceData.path) {
                        sourcesToProcess.push({
                            name: sourceData.name,
                            repo: sourceData.repo,
                            path: sourceData.path,
                            sourceOrigin: path.basename(sourceFilePath) // Store where it came from
                        });
                        console.log(`✅ Added source "${sourceData.name}" from ${path.basename(sourceFilePath)} to the processing queue.`);
                    } else {
                        console.error(`❌ Error: Source file ${sourceFilePath} is missing required keys ('repo', 'name', 'path'). Skipping this source.`);
                        hasErrors = true; // Mark that there was an issue
                    }
                } catch (error: any) {
                    console.error(`❌ Error reading or parsing source file ${sourceFilePath}: ${error.message}. Skipping this source.`);
                    hasErrors = true; // Mark that there was an issue
                }
            } else {
                console.error(`❌ Error: Source file not found at ${sourceFilePath}. Skipping this source.`);
                hasErrors = true; // Mark that there was an issue
            }
        }

        if (sourcesToProcess.length === 0) {
             console.error("\n❌ No valid source files found or loaded from the provided arguments. Exiting.");
             process.exit(1);
        }

    } else {
        // Mode 2: Fallback to environment variables if no arguments provided
        console.log("ℹ️ No source files provided via arguments. Attempting to load configuration from environment variables...");
        const repoUrlEnv = process.env.REPO_URL;
        const projectNameEnv = process.env.PROJECT_NAME;
        const docsDirEnv = process.env.DOCS_DIR;

        if (repoUrlEnv && projectNameEnv && docsDirEnv) {
            console.log("✅ Found configuration in environment variables.");
            sourcesToProcess.push({
                name: projectNameEnv,
                repo: repoUrlEnv,
                path: docsDirEnv,
                sourceOrigin: "environment variables"
            });
        } else {
            console.error("❌ Error: No source files provided and REPO_URL, PROJECT_NAME, and DOCS_DIR environment variables are not all set.");
            console.error("   Usage examples:");
            console.error("   1. Using source files: `bun run ./generate.ts sources/bun.json sources/react.json`");
            console.error("   2. Using env vars: `export REPO_URL=... export PROJECT_NAME=... export DOCS_DIR=... bun run ./generate.ts`");
            process.exit(1);
        }
    }

    // --- Process all loaded sources ---
    console.log(`\n--- Starting processing for ${sourcesToProcess.length} source(s) ---`);
    let successCount = 0;
    let failureCount = 0;

    for (const source of sourcesToProcess) {
        try {
            await processSource(source);
            successCount++;
        } catch (error) {
            // Errors during processSource are logged within that function
            failureCount++;
            // Continue to the next source
        }
    }

    // --- Final Summary ---
    console.log(`\n--- Processing Complete ---`);
    console.log(`Total sources attempted: ${sourcesToProcess.length}`);
    console.log(`✅ Successes: ${successCount}`);
    console.log(`❌ Failures: ${failureCount}`);
    console.log(`---------------------------\n`);

    if (hasErrors || failureCount > 0) {
        console.error("⚠️ Some operations failed. Please review the logs above.");
        // Optionally exit with an error code if any source failed
        // process.exit(1);
    } else {
        console.log("🎉 All sources processed successfully!");
    }
}

// --- Run Main ---
run();
