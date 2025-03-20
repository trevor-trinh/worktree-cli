import { execa } from "execa";
import chalk from "chalk";
import { stat } from "node:fs/promises";
import { resolve, join, dirname, basename } from "node:path";

export async function newWorktreeHandler(
    branchName: string = "main",
    options: { path?: string; checkout?: boolean; install?: string; editor?: string }
) {
    try {
        // 1. Validate we're in a git repo
        await execa("git", ["rev-parse", "--is-inside-work-tree"]);

        // 2. Build final path for the new worktree
        let folderName: string;
        if (options.path) {
            folderName = options.path;
        } else {
            const currentDir = process.cwd();
            const parentDir = dirname(currentDir);
            const currentDirName = basename(currentDir);
            // Create a sibling directory: current directory name concatenated with branchName
            folderName = join(parentDir, `${currentDirName}-${branchName}`);
        }
        const resolvedPath = resolve(folderName);

        // 3. (Optional) checkout new local branch if it doesn't exist yet
        if (options.checkout) {
            const { stdout } = await execa("git", ["branch", "--list", branchName]);
            if (!stdout) {
                console.log(chalk.yellow(`Branch "${branchName}" doesn't exist locally. Creating...`));
                await execa("git", ["checkout", "-b", branchName]);
            } else {
                console.log(chalk.green(`Branch "${branchName}" found locally.`));
            }
        } else {
            console.log(chalk.gray(`Using branch "${branchName}". Make sure it exists (local or remote).`));
        }

        // 4. Create the new worktree
        console.log(chalk.blue(`Creating new worktree for branch "${branchName}" at: ${resolvedPath}`));
        await execa("git", ["worktree", "add", resolvedPath, branchName]);

        // 5. (Optional) Install dependencies if --install flag is provided
        if (options.install) {
            console.log(chalk.blue(`Installing dependencies using ${options.install} in ${resolvedPath}...`));
            await execa(options.install, ["install"], { cwd: resolvedPath, stdio: "inherit" });
        }

        // 6. Open in the specified editor (or default to "cursor")
        const editorCommand = options.editor || "cursor";
        console.log(chalk.blue(`Opening ${resolvedPath} in ${editorCommand}...`));
        await execa(editorCommand, [resolvedPath], { stdio: "inherit" });

        console.log(chalk.green(`Worktree created, dependencies installed (if specified), and opened in ${editorCommand} successfully!`));
    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red("Failed to create new worktree:"), error.message);
        } else {
            console.error(chalk.red("Failed to create new worktree:"), error);
        }
        process.exit(1);
    }
} 