# GitHub workflow for Calorfy

## Branches

- `main`: releasable, protected, PR required.
- `develop`: integration for the current launch milestone.
- `feat/*`, `fix/*`, `chore/*`: short-lived branches from `develop`.
- `release/1.0.0`: stabilization branch used for TestFlight and App Store submission.

## Required checks

Every PR must pass TypeScript, ESLint, unit tests, secret scanning and an Expo configuration check. Production releases also require a successful iOS preview build and a manual TestFlight smoke-test approval.

## Repository bootstrap

The local checkout currently has no remote. After creating the private GitHub repository:

```powershell
git remote add origin https://github.com/OWNER/calorfy.git
git fetch origin
```

Do not push until the exposed Clarifai, ImgBB and Edamam credentials have been revoked. Rewriting history is not required for the current repository because they only appear in uncommitted changes, but they must be removed from the working tree before the first new commit.

