# Contributing to giffgaff Usage Analyzer

## Development Setup

### Prerequisites
- Node.js and npm installed
- Google account with Apps Script API enabled
- Git installed

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/FLABDUL/giffgaff-usage-analyzer.git
   cd giffgaff-usage-analyzer
   ```

2. **Install CLASP**
   ```bash
   npm install -g @google/clasp
   ```

3. **Login to Google**
   ```bash
   clasp login
   ```

4. **Link to your Apps Script project**
   ```bash
   clasp clone YOUR_SCRIPT_ID
   ```
   Get your Script ID from: Project Settings in [script.google.com](https://script.google.com)

## Development Workflow

### Three-Way Sync: VSCode ↔ Apps Script ↔ GitHub

```
┌─────────┐    clasp push     ┌──────────────┐
│ VSCode  │ ────────────────> │ Apps Script  │
│  (Local)│ <──────────────── │   (Google)   │
└─────────┘    clasp pull     └──────────────┘
     │
     │ git commit/push
     ▼
┌─────────┐
│ GitHub  │
│ (Remote)│
└─────────┘
```

### Making Changes

**Standard workflow:**
```bash
# 1. Make changes in VSCode
# Edit Code.js or other files

# 2. Push to Google Apps Script (for testing)
clasp push

# 3. Test in Apps Script
# Go to script.google.com and run the script

# 4. If working, commit to Git
git add .
git commit -m "Add feature: description"
git push origin main
```

### When You Edit in Apps Script Editor

If you make changes directly in the browser:

```bash
# 1. Pull changes from Apps Script
clasp pull

# 2. Review changes in VSCode

# 3. Commit to GitHub
git add .
git commit -m "Update via Apps Script editor"
git push origin main
```

### Important Notes

- ⚠️ **Always `clasp push` before testing** - Changes in VSCode won't affect the script until pushed
- ⚠️ **Always `clasp pull` after browser edits** - Keep your local copy in sync
- ⚠️ **Commit regularly to GitHub** - Version control is your safety net
- ⚠️ **Never commit `.clasp.json`** - It's in `.gitignore` for security (contains your Script ID)

### Branch Strategy

- `main` - Production-ready code
- Create feature branches for major changes:
  ```bash
  git checkout -b feature/new-analysis
  # Make changes
  git commit -m "Add new analysis feature"
  git push origin feature/new-analysis
  # Create pull request on GitHub
  ```

## Common Commands

### CLASP Commands
```bash
clasp push              # Push local code to Apps Script
clasp pull              # Pull Apps Script code to local
clasp logs              # View execution logs
clasp status            # Check project status
clasp deploy            # Create a new deployment
```

### Git Commands
```bash
git status              # Check current changes
git add .               # Stage all changes
git commit -m "msg"     # Commit with message
git push origin main    # Push to GitHub
git pull origin main    # Pull from GitHub
```

## Troubleshooting

### "User has not enabled the Apps Script API"
Visit https://script.google.com/home/usersettings and enable the API.

### "Push rejected" or merge conflicts
```bash
git pull origin main --rebase
# Resolve conflicts if any
git push origin main
```

### Changes not appearing in Apps Script
Make sure you ran `clasp push` after editing locally.

### Local changes overwritten
If you edited in both places, `clasp pull` might overwrite local changes. Always commit to Git first!

## File Structure

```
giffgaff-usage-analyzer/
├── .clasp.json          # CLASP config (DO NOT COMMIT)
├── .gitignore           # Git ignore rules
├── Code.js              # Main script
├── appsscript.json      # Apps Script manifest
├── README.md            # User documentation
├── CONTRIBUTING.md      # This file - developer guide
└── LICENSE              # MIT License
```

## Getting Help

- Check existing [Issues](https://github.com/FLABDUL/giffgaff-usage-analyzer/issues)
- Create a new issue for bugs or feature requests
- Review [CLASP documentation](https://github.com/google/clasp)

## Code Style

- Use clear, descriptive variable names
- Add comments for complex logic
- Test thoroughly before committing
- Keep functions focused and modular

## Testing

Before submitting changes:

1. Run `clasp push` to deploy to Apps Script
2. Test the script with your own Gmail account
3. Verify all features work as expected
4. Check that error handling works properly

## License

By contributing, you agree that your contributions will be licensed under the MIT License.