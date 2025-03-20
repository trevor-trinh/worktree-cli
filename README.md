# cursor-worktree

A CLI tool for managing Git worktrees with a focus on opening them in the Cursor editor.

## Installation

```bash
pnpm install -g .
```

## Usage

### Create a new worktree

```bash
cursor-worktree new <branchName> [options]
```

Options:
- `-p, --path <path>`: Specify a custom path for the worktree
- `-c, --checkout`: Create new branch if it doesn't exist and checkout automatically

Example:
```bash
cursor-worktree new feature/login
cursor-worktree new feature/chat --checkout
cursor-worktree new feature/auth -p ./auth-worktree
```

### List worktrees

```bash
cursor-worktree list
```

### Remove a worktree

```bash
cursor-worktree remove <pathOrBranch>
```

You can remove a worktree by either its path or branch name:
```bash
cursor-worktree remove ./feature/login-worktree
cursor-worktree remove feature/chat
```

## Requirements

- Git
- Node.js
- Cursor editor installed and available in PATH

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in development mode
pnpm dev
```

## License

MIT 