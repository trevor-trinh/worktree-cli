# @johnlindquist/worktree

A CLI tool for managing Git worktrees with a focus on opening them in the Cursor editor.

## Installation

```bash
pnpm install -g @johnlindquist/worktree
```

## Usage

### Create a new worktree

```bash
wt new <branchName> [options]
```

Options:
- `-p, --path <path>`: Specify a custom path for the worktree
- `-c, --checkout`: Create new branch if it doesn't exist and checkout automatically

Example:
```bash
wt new feature/login
wt new feature/chat --checkout
wt new feature/auth -p ./auth-worktree
```

### List worktrees

```bash
wt list
```

### Remove a worktree

```bash
wt remove <pathOrBranch>
```

You can remove a worktree by either its path or branch name:
```bash
wt remove ./feature/login-worktree
wt remove feature/chat
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