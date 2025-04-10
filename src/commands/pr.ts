import { execa } from "execa";
import chalk from "chalk";
import { stat } from "node:fs/promises";
import { resolve, join, dirname, basename } from "node:path";
import { getDefaultEditor } from "../config.js";

// Helper function to get PR branch name using gh cli
async function getBranchNameFromPR(prNumber: string): Promise<string> {
    try {
        // Use GitHub CLI to get the head ref name (branch name)
        const { stdout } = await execa("gh", [
            "pr",
            "view",
            prNumber,
            "--json",
            "headRefName",
            "-q", // Suppress gh warnings if not tty
            ".headRefName", // Query the JSON output for the branch name
        ]);
        const branchName = stdout.trim();
        if (!branchName) {
            throw new Error("Could not extract branch name from PR details.");
        }
        return branchName;
    } catch (error: any) {
        if (error.stderr?.includes("Could not find pull request")) {
            throw new Error(`Pull Request #${prNumber} not found.`);
        }
        if (error.stderr?.includes("gh not found") || error.message?.includes("ENOENT")) {
            throw new Error("GitHub CLI ('gh') not found. Please install it (brew install gh) and authenticate (gh auth login).");
        }
        throw new Error(`Failed to get PR details: ${error.message || error.stderr || error}`);
    }
}


export async function prWorktreeHandler(
    prNumber: string,
    options: { path?: string; install?: string; editor?: string }
) {
    try {
        // 1. Validate we're in a git repo
        await execa("git", ["rev-parse", "--is-inside-work-tree"]);

        // 2. Get Branch Name from PR Number using GitHub CLI ('gh')
        console.log(chalk.blue(`Fetching branch name for PR #${prNumber}...`));
        const branchName = await getBranchNameFromPR(prNumber);
        console.log(chalk.green(`Found branch name: "${branchName}"`));

        // 3. Fetch the latest changes for the branch from origin
        console.log(chalk.blue(`Fetching latest changes for branch "${branchName}" from origin...`));
        await execa("git", ["fetch", "origin", branchName]);

        // 4. Build final path for the new worktree (similar to 'new' command)
        let folderName: string;
        if (options.path) {
            folderName = options.path;
        } else {
            // Use branch name for the directory
            const currentDir = process.cwd();
            const parentDir = dirname(currentDir);
            const currentDirName = basename(currentDir);
            // Sanitize branch name slightly for directory use (replace slashes)
            const sanitizedBranchName = branchName.replace(/\//g, '-');
            folderName = join(parentDir, `${currentDirName}-${sanitizedBranchName}`);
        }
        const resolvedPath = resolve(folderName);

        // 5. Check if directory already exists
        let directoryExists = false;
        try {
            await stat(resolvedPath);
            directoryExists = true;
        } catch (error) {
            // Directory doesn't exist, continue with creation
        }

        if (directoryExists) {
            console.log(chalk.yellow(`Directory already exists at: ${resolvedPath}`));
            // Check if it's a git worktree
            let isGitWorktree = false;
            try {
                await stat(join(resolvedPath, ".git")); // .git is a file in worktrees
                isGitWorktree = true;
            } catch (error) { /* Not a worktree */ }

            if (isGitWorktree) {
                console.log(chalk.green(`Worktree for branch "${branchName}" seems to already exist.`));
            } else {
                console.error(chalk.red(`Error: Directory "${resolvedPath}" exists but is not a Git worktree. Please remove it or choose a different path using --path.`));
                process.exit(1);
            }
            // If it exists and is a worktree, we'll just open it later.
        } else {
            // 6. Create the worktree
            console.log(chalk.blue(`Creating new worktree for branch "${branchName}" at: ${resolvedPath}`));
            // We use the fetched branch directly. 'git worktree add' will create the worktree pointing to the fetched commit.
            // It doesn't need -b as the branch already exists remotely and was fetched.
            await execa("git", ["worktree", "add", resolvedPath, branchName]);

            // 7. (Optional) Install dependencies if --install flag is provided
            if (options.install) {
                console.log(chalk.blue(`Installing dependencies using ${options.install} in ${resolvedPath}...`));
                await execa(options.install, ["install"], { cwd: resolvedPath, stdio: "inherit" });
            }
        }

        // 8. Open in the specified editor (or use configured default)
        const configuredEditor = getDefaultEditor();
        const editorCommand = options.editor || configuredEditor;
        console.log(chalk.blue(`Opening ${resolvedPath} in ${editorCommand}...`));
        try {
            await execa(editorCommand, [resolvedPath], { stdio: "inherit" });
        } catch (editorError) {
            console.error(chalk.red(`Failed to open editor "${editorCommand}". Please ensure it's installed and in your PATH.`));
            console.warn(chalk.yellow(`Continuing without opening editor.`));
        }

        console.log(chalk.green(`Worktree for PR #${prNumber} (${branchName}) ${directoryExists ? "opened" : "created"} at ${resolvedPath}.`));
        if (!directoryExists && options.install) console.log(chalk.green(`Dependencies installed using ${options.install}.`));
        console.log(chalk.green(`Attempted to open in ${editorCommand}.`));

    } catch (error: any) {
        console.error(chalk.red("Failed to create worktree from PR:"), error.message || error);
        process.exit(1);
    }
} 