import { execa } from "execa";
import chalk from "chalk";
import { stat, rm } from "node:fs/promises";
import { resolve } from "node:path";

export async function removeWorktreeHandler(
    pathOrBranch: string = "",
    options: { force?: boolean }
) {
    try {
        await execa("git", ["rev-parse", "--is-inside-work-tree"]);

        if (!pathOrBranch) {
            console.error(chalk.red("You must specify a path or branch name for the worktree."));
            process.exit(1);
        }

        // If the user gave us a path, we can remove directly.
        // If user gave us a branch name, we might parse `git worktree list` to find the matching path.
        let targetPath = pathOrBranch;

        // Try to see if it's a valid path
        let isDirectory = false;
        try {
            const stats = await stat(pathOrBranch);
            isDirectory = stats.isDirectory();
        } catch {
            isDirectory = false;
        }

        if (!isDirectory) {
            // If it's not a directory, assume it's a branch name:
            const { stdout } = await execa("git", ["worktree", "list", "--porcelain"]);
            // The --porcelain output is structured. We'll parse lines and find the "worktree <path>" and "branch refs/heads/<branchName>"
            const entries = stdout.split("\n");
            let currentPath: string | null = null;
            for (const line of entries) {
                if (line.startsWith("worktree ")) {
                    currentPath = line.replace("worktree ", "").trim();
                } else if (line.startsWith("branch ")) {
                    const fullBranchRef = line.replace("branch ", "").trim(); // e.g. refs/heads/my-branch
                    const shortBranch = fullBranchRef.replace("refs/heads/", "");
                    if (shortBranch === pathOrBranch && currentPath) {
                        targetPath = currentPath;
                        break;
                    }
                }
            }
        }

        console.log(chalk.blue(`Removing worktree: ${targetPath}`));

        // Pass the "--force" flag to Git if specified
        await execa("git", ["worktree", "remove", ...(options.force ? ["--force"] : []), targetPath]);

        // Optionally also remove the physical directory if it still exists
        try {
            await stat(targetPath);
            await rm(targetPath, { recursive: true, force: true });
            console.log(chalk.green(`Deleted folder ${targetPath}`));
        } catch {
            // Directory doesn't exist, which is fine
        }

        console.log(chalk.green("Worktree removed successfully!"));
    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red("Failed to remove worktree:"), error.message);
        } else {
            console.error(chalk.red("Failed to remove worktree:"), error);
        }
        process.exit(1);
    }
} 