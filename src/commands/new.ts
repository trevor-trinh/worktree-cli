import { execa } from "execa";
import chalk from "chalk";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";

export async function newWorktreeHandler(
    branchName: string = "main",
    options: { path?: string; checkout?: boolean }
) {
    try {
        // 1. Validate we're in a git repo
        await execa("git", ["rev-parse", "--is-inside-work-tree"]);

        // 2. Build final path for the new worktree
        const folderName = options.path ?? `./${branchName}-worktree`;
        const resolvedPath = resolve(folderName);

        // 3. (Optional) checkout new local branch if it doesn't exist yet
        //    This step is only run if user passes `--checkout`
        if (options.checkout) {
            // Check if branch already exists
            const { stdout } = await execa("git", ["branch", "--list", branchName]);
            if (!stdout) {
                console.log(chalk.yellow(`Branch "${branchName}" doesn't exist locally. Creating...`));
                await execa("git", ["checkout", "-b", branchName]);
            } else {
                console.log(chalk.green(`Branch "${branchName}" found locally.`));
            }
        } else {
            // Ensure the branch is present, or you might want to skip this check
            console.log(chalk.gray(`Using branch "${branchName}". Make sure it exists (local or remote).`));
        }

        // 4. Create the new worktree
        console.log(chalk.blue(`Creating new worktree for branch "${branchName}" at: ${resolvedPath}`));
        await execa("git", ["worktree", "add", resolvedPath, branchName]);

        // 5. Open in Cursor editor
        //    (Assuming "cursor <path>" is how you open a folder in Cursor)
        console.log(chalk.blue(`Opening ${resolvedPath} in Cursor...`));
        await execa("cursor", [resolvedPath], { stdio: "inherit" });

        console.log(chalk.green(`Worktree created and opened in Cursor successfully!`));
    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red("Failed to create new worktree:"), error.message);
        } else {
            console.error(chalk.red("Failed to create new worktree:"), error);
        }
        process.exit(1);
    }
} 