# Git Push Guide for Local Changes

When a local commit (for example, `aed1757`) is present but the repository has no configured remote, set the remote and push manually:

1. **Check the existing commits** to confirm the commit hash is present:
   ```bash
   git log --oneline -5
   ```
2. **Add the remote** pointing at the GitHub repository (replace with the correct URL):
   ```bash
   git remote add origin git@github.com:<org>/<repo>.git
   ```
3. **Push the branch** (e.g., `main` or `work`) to GitHub:
   ```bash
   git push origin <branch>
   ```

If the remote already exists but uses HTTPS and needs SSH, update it with:
```bash
git remote set-url origin git@github.com:<org>/<repo>.git
```

Should authentication errors occur, ensure your SSH key is loaded and has permission to push to the target repository.
