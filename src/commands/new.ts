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

        // Check if directory already exists
        let directoryExists = false;
        try {
            await stat(resolvedPath);
            directoryExists = true;
        } catch (error) {
            // Directory doesn't exist, continue with creation
        }

        // 3. Check if branch exists
        const { stdout: localBranches } = await execa("git", ["branch", "--list", branchName]);
        const { stdout: remoteBranches } = await execa("git", ["branch", "-r", "--list", `origin/${branchName}`]);
        const branchExists = !!localBranches || !!remoteBranches;

        // 4. Create the new worktree or open the editor if it already exists
        if (directoryExists) {
            console.log(chalk.yellow(`Directory already exists at: ${resolvedPath}`));

            // Check if this is a git worktree by checking for .git file/folder
            let isGitWorktree = false;
            try {
                await stat(join(resolvedPath, ".git"));
                isGitWorktree = true;
            } catch (error) {
                // Not a git worktree
            }

            if (isGitWorktree) {
                console.log(chalk.green(`Using existing worktree at: ${resolvedPath}`));
            } else {
                console.log(chalk.yellow(`Warning: Directory exists but is not a git worktree.`));
            }

            // Skip to opening editor
        } else {
            console.log(chalk.blue(`Creating new worktree for branch "${branchName}" at: ${resolvedPath}`));

            if (!branchExists) {
                console.log(chalk.yellow(`Branch "${branchName}" doesn't exist. Creating new branch with worktree...`));
                // Create a new branch and worktree in one command with -b flag
                await execa("git", ["worktree", "add", "-b", branchName, resolvedPath]);
            } else {
                console.log(chalk.green(`Using existing branch "${branchName}".`));
                await execa("git", ["worktree", "add", resolvedPath, branchName]);
            }

            // 5. (Optional) Install dependencies if --install flag is provided
            if (options.install) {
                console.log(chalk.blue(`Installing dependencies using ${options.install} in ${resolvedPath}...`));
                await execa(options.install, ["install"], { cwd: resolvedPath, stdio: "inherit" });
            }
        }

        // 6. Open in the specified editor (or default to "cursor")
        const editorCommand = options.editor || "cursor";
        console.log(chalk.blue(`Opening ${resolvedPath} in ${editorCommand}...`));
        await execa(editorCommand, [resolvedPath], { stdio: "inherit" });

        console.log(chalk.green(`Worktree ${directoryExists ? "opened" : "created"}, dependencies installed (if specified), and opened in ${editorCommand} successfully!`));
    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red("Failed to create new worktree:"), error.message);
        } else {
            console.error(chalk.red("Failed to create new worktree:"), error);
        }
        process.exit(1);
    }
} 