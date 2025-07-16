# Deployment Guide for Stable Ride

## GitHub Actions CI/CD Setup

This project uses GitHub Actions for continuous integration and deployment. The workflows are configured to run automatically on push and pull request events.

## Required Secrets

Before the CI/CD pipeline can work properly, you need to configure the following secrets in your GitHub repository settings:

### Production Secrets
- `PRODUCTION_API_URL` - The production API URL (e.g., https://api.stableride.com)
- `PRODUCTION_DATABASE_URL` - PostgreSQL connection string for production
- `GOOGLE_MAPS_API_KEY` - Google Maps API key for production
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for production
- `STRIPE_SECRET_KEY` - Stripe secret key for production
- `SENDGRID_API_KEY` - SendGrid API key for email services
- `AWS_ACCESS_KEY_ID` - AWS access key for S3 backups
- `AWS_SECRET_ACCESS_KEY` - AWS secret access key
- `AWS_REGION` - AWS region (e.g., us-west-2)
- `BACKUP_S3_BUCKET` - S3 bucket name for database backups
- `BACKUP_ENCRYPTION_KEY` - Encryption key for database backups

### Testing Secrets
- `TEST_GOOGLE_MAPS_API_KEY` - Google Maps API key for testing
- `SNYK_TOKEN` - (Optional) Snyk token for security scanning

## Workflow Descriptions

### 1. CI/CD Pipeline (`ci-cd.yml`)
- **Triggers**: Push to main/develop, PRs
- **Jobs**:
  - Lint: Checks code style with ESLint and Prettier
  - Type Check: Validates TypeScript types
  - Test Backend: Runs backend tests with PostgreSQL and Redis
  - Test Frontend: Runs frontend unit tests
  - Build: Builds all packages
  - Deploy Staging: Auto-deploys develop branch to staging
  - Deploy Production: Auto-deploys main branch to production
  - Security Scan: Checks for vulnerabilities

### 2. E2E Tests (`e2e-tests.yml`)
- **Triggers**: Push to main/develop, nightly at 1 AM UTC
- **Purpose**: Runs end-to-end tests using Playwright
- **Features**: Uploads test reports and videos on failure

### 3. Database Backup (`database-backup.yml`)
- **Triggers**: Daily at 2 AM UTC, manual trigger
- **Purpose**: Backs up production database to S3
- **Features**: Encryption, 30-day retention, failure notifications

### 4. Dependency Updates (`dependency-update.yml`)
- **Triggers**: Weekly on Mondays, manual trigger
- **Purpose**: Checks for outdated dependencies
- **Features**: Creates GitHub issues for updates

### 5. PR Checks (`pr-checks.yml`)
- **Triggers**: Pull request events
- **Features**:
  - Checks PR size and suggests splitting large PRs
  - Validates branch naming conventions
  - Auto-labels PRs based on changed files
  - Scans for TODO/FIXME comments

## Deployment Environments

### Staging Environment
- **Branch**: `develop`
- **URL**: Configure in your deployment platform
- **Auto-deploy**: Yes

### Production Environment
- **Branch**: `main`
- **URL**: Configure in your deployment platform
- **Auto-deploy**: Yes
- **Manual approval**: Recommended via GitHub environment protection rules

## Setting Up Deployment

1. **Configure GitHub Secrets**:
   ```bash
   # Go to Settings > Secrets and variables > Actions
   # Add all required secrets listed above
   ```

2. **Configure Environments**:
   ```bash
   # Go to Settings > Environments
   # Create 'staging' and 'production' environments
   # Add protection rules as needed
   ```

3. **Update Deployment Scripts**:
   - Edit the deployment steps in `ci-cd.yml`
   - Add your specific deployment commands for your hosting platform

## Deployment Platforms

The CI/CD pipeline is platform-agnostic. You can deploy to:

### Vercel (Frontend)
```yaml
- name: Deploy to Vercel
  run: |
    npm i -g vercel
    vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

### Railway/Render (Backend)
```yaml
- name: Deploy to Railway
  run: |
    npm i -g @railway/cli
    railway up --token=${{ secrets.RAILWAY_TOKEN }}
```

### AWS (Full Stack)
```yaml
- name: Deploy to AWS
  run: |
    # Frontend to S3/CloudFront
    aws s3 sync frontend/dist s3://${{ secrets.S3_BUCKET }}
    aws cloudfront create-invalidation --distribution-id ${{ secrets.CF_DIST_ID }} --paths "/*"
    
    # Backend to ECS/EB
    # Add your ECS/EB deployment commands
```

## Monitoring

After deployment, monitor:
- GitHub Actions tab for workflow status
- Application logs in your hosting platform
- Error tracking service (e.g., Sentry)
- Performance monitoring (e.g., New Relic)

## Rollback Procedure

If issues occur after deployment:
1. **Immediate**: Revert the merge commit on main/develop
2. **GitHub**: Go to Actions > Select the last successful deployment > Re-run
3. **Manual**: Use your platform's rollback feature

## Local Testing of Workflows

Test workflows locally using [act](https://github.com/nektos/act):
```bash
# Install act
brew install act

# Test CI workflow
act -j lint

# Test with secrets
act -j build --secret-file .env.secrets
```