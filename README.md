# cursor-worktree

A CLI tool for managing Git worktrees with a focus on opening them in the Cursor editor.

## Installation

```bash
pnpm install -g .
```

## Usage

### Create a new worktree

```bash
cwt new <branchName> [options]
```

Options:
- `-p, --path <path>`: Specify a custom path for the worktree
- `-c, --checkout`: Create new branch if it doesn't exist and checkout automatically

Example:
```bash
cwt new feature/login
cwt new feature/chat --checkout
cwt new feature/auth -p ./auth-worktree
```

### List worktrees

```bash
cwt list
```

### Remove a worktree

```bash
cwt remove <pathOrBranch>
```

You can remove a worktree by either its path or branch name:
```bash
cwt remove ./feature/login-worktree
cwt remove feature/chat
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