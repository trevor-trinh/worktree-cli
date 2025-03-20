# Manual Test for CI Publish Workflow

1. Push a commit to the main branch (or merge the PR) to trigger the workflow.
2. Check the Actions tab in your GitHub repository to see that the "Publish to npm" workflow runs successfully.
3. Verify that the package is published to npm with the expected version (0.0.0-development) without any new commits from the workflow.

## Important Notes

- The CI workflow will not make any commits or version bumps
- Version updates should be handled manually outside of CI
- Make sure you have set up the `NPM_TOKEN` secret in your GitHub repository settings 