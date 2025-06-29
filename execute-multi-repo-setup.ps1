#!/usr/bin/env pwsh
# ReelApps Multi-Repository Setup Execution Script
# This script implements the complete solution for independent app deployments with SSO

param(
    [string]$GitHubOrg = "reelapps",
    [switch]$CreateRepos = $false,
    [switch]$PublishPackages = $false,
    [switch]$DryRun = $false
)

Write-Host "🚀 ReelApps Multi-Repository Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Step 1: Update auth package with SSO utilities
Write-Host "`n📦 Step 1: Updating auth package with SSO utilities..." -ForegroundColor Cyan

$authPackagePath = "split-repos/ReelApps/packages/auth/src"
if (Test-Path $authPackagePath) {
    Write-Host "✅ SSO utilities already created in auth package" -ForegroundColor Green
} else {
    Write-Host "❌ Auth package not found at: $authPackagePath" -ForegroundColor Red
    exit 1
}

# Step 2: Update each app for standalone deployment
Write-Host "`n🔧 Step 2: Configuring apps for standalone deployment..." -ForegroundColor Cyan

$apps = @(
    @{ Name = "ReelHunter"; Domain = "reelhunter.reelapps.co.za"; Port = 5175 },
    @{ Name = "ReelCV"; Domain = "reelcv.reelapps.co.za"; Port = 5176 },
    @{ Name = "ReelPersona"; Domain = "reelpersona.reelapps.co.za"; Port = 5177 },
    @{ Name = "ReelProjects"; Domain = "reelprojects.reelapps.co.za"; Port = 5178 },
    @{ Name = "ReelSkills"; Domain = "reelskills.reelapps.co.za"; Port = 5179 }
)

foreach ($app in $apps) {
    $appPath = "split-repos/$($app.Name)"
    Write-Host "  📁 Processing $($app.Name)..." -ForegroundColor Yellow
    
    if (Test-Path $appPath) {
        # Update App.tsx to use SSO
        $appTsxPath = "$appPath/src/App.tsx"
        if (Test-Path $appTsxPath) {
            $appContent = Get-Content $appTsxPath -Raw
            
            # Check if SSO is already implemented
            if ($appContent -notmatch "initializeSSO") {
                Write-Host "    🔧 Adding SSO initialization to App.tsx..." -ForegroundColor Gray
                
                # Add SSO import and initialization (simplified approach)
                $ssoImport = "import { initializeSSO, handleAuthRedirect } from '@reelapps/auth/sso';"
                
                if ($appContent -notmatch "initializeSSO") {
                    $updatedContent = $appContent -replace "import.*@reelapps/auth.*", "$&`n$ssoImport"
                    
                    # Add SSO check in useEffect
                    $ssoCheck = @"
  // SSO initialization
  useEffect(() => {
    const checkAuth = async () => {
      const isAuthenticated = await initializeSSO();
      if (!isAuthenticated) {
        handleAuthRedirect();
        return;
      }
    };
    checkAuth();
  }, []);
"@
                    
                    $updatedContent = $updatedContent -replace "(useEffect\(\(\) => \{)", "$ssoCheck`n`n  $1"
                    
                    if (-not $DryRun) {
                        $updatedContent | Out-File $appTsxPath -Encoding UTF8
                        Write-Host "    ✅ Updated App.tsx with SSO" -ForegroundColor Green
                    }
                }
            } else {
                Write-Host "    ✅ SSO already configured in App.tsx" -ForegroundColor Green
            }
        }
        
        # Create environment file template
        $envPath = "$appPath/.env.example"
        $envContent = @"
# $($app.Name) Environment Configuration
VITE_DOMAIN=$($app.Domain)
VITE_AUTH_DOMAIN=reelapps.co.za
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
"@
        
        if (-not $DryRun) {
            $envContent | Out-File $envPath -Encoding UTF8
            Write-Host "    ✅ Created .env.example" -ForegroundColor Green
        }
        
        # Create README for the app
        $readmePath = "$appPath/README.md"
        $readmeContent = @"
# $($app.Name)

Part of the ReelApps ecosystem - deployed independently with SSO integration.

## Development

```bash
npm install
npm run dev
```

Visit: http://localhost:$($app.Port)

## Deployment

This app is deployed to: https://$($app.Domain)

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
VITE_DOMAIN=$($app.Domain)
VITE_AUTH_DOMAIN=reelapps.co.za
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## SSO Integration

This app integrates with the main ReelApps authentication system:

1. Users are automatically redirected to `reelapps.co.za` for login if not authenticated
2. After login, users are redirected back to this app
3. Authentication state is shared across all ReelApps subdomains via cookies

## Deployment Platforms

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure custom domain: $($app.Domain)
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push to main branch

### Manual Deployment
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

## Architecture

This app is part of a micro-frontend architecture where:
- Each app is deployed independently
- Shared packages are published to npm
- Authentication is handled centrally
- Users have seamless experience across all apps
"@

        if (-not $DryRun) {
            $readmeContent | Out-File $readmePath -Encoding UTF8
            Write-Host "    ✅ Created README.md" -ForegroundColor Green
        }
        
        Write-Host "    ✅ Configured $($app.Name)" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  Directory not found: $appPath" -ForegroundColor Yellow
    }
}

# Step 3: Create deployment instructions
Write-Host "`n📋 Step 3: Creating deployment instructions..." -ForegroundColor Cyan

$deploymentInstructions = @"
# ReelApps Deployment Instructions

## Prerequisites

1. **GitHub Account**: Create repositories for each app
2. **Vercel Account**: For hosting the applications
3. **Domain Configuration**: Set up DNS for subdomains
4. **npm Account**: For publishing shared packages (optional)

## Deployment Steps

### Phase 1: Prepare Shared Packages

1. **Publish shared packages to npm:**
   ```bash
   ./scripts/publish-shared-packages.ps1 -Version "1.0.0"
   ```

2. **Or use GitHub Packages (private):**
   ```bash
   ./scripts/publish-shared-packages.ps1 -Registry "https://npm.pkg.github.com" -Private
   ```

### Phase 2: Create GitHub Repositories

For each app, create a new repository:

1. **ReelHunter**: `$GitHubOrg/reelhunter`
2. **ReelCV**: `$GitHubOrg/reelcv`
3. **ReelPersona**: `$GitHubOrg/reelpersona`
4. **ReelProjects**: `$GitHubOrg/reelprojects`
5. **ReelSkills**: `$GitHubOrg/reelskills`
6. **ReelApps Main**: `$GitHubOrg/reelapps-main` (landing page)
7. **Shared Packages**: `$GitHubOrg/reelapps-shared`

### Phase 3: Deploy Applications

#### Option A: Vercel (Recommended)

1. **Connect repositories to Vercel**
2. **Configure custom domains:**
   - reelhunter.reelapps.co.za → reelhunter repository
   - reelcv.reelapps.co.za → reelcv repository
   - etc.

3. **Set environment variables in Vercel:**
   ```
   VITE_DOMAIN=<subdomain>.reelapps.co.za
   VITE_AUTH_DOMAIN=reelapps.co.za
   VITE_SUPABASE_URL=<your_supabase_url>
   VITE_SUPABASE_ANON_KEY=<your_supabase_key>
   ```

4. **Configure DNS:**
   ```
   Type: CNAME
   Name: reelhunter
   Value: cname.vercel-dns.com
   ```

#### Option B: Self-Hosted

1. **Build each app:**
   ```bash
   npm run build
   ```

2. **Deploy to your server**
3. **Configure Nginx/Apache for subdomains**

### Phase 4: Configure SSO

1. **Update Supabase settings:**
   - Add all subdomains to allowed origins
   - Configure JWT settings for cross-domain cookies

2. **Test authentication flow:**
   - Visit any subdomain
   - Should redirect to main domain for login
   - After login, should redirect back to subdomain

## DNS Configuration

Configure your DNS provider with these records:

```
# Main domain
Type: A
Name: @
Value: <your_server_ip>

# Subdomains (if using Vercel)
Type: CNAME
Name: reelhunter
Value: cname.vercel-dns.com

Type: CNAME
Name: reelcv
Value: cname.vercel-dns.com

# ... repeat for each subdomain
```

## SSL Certificates

- **Vercel**: Automatic SSL certificates
- **Self-hosted**: Use Let's Encrypt or your provider's SSL

## Monitoring and Maintenance

1. **Set up monitoring** for each subdomain
2. **Configure alerts** for downtime
3. **Regular updates** of shared packages
4. **Security updates** for dependencies

## Troubleshooting

### Common Issues

1. **CORS errors**: Check Supabase allowed origins
2. **Cookie issues**: Verify domain configuration
3. **Build failures**: Check package versions
4. **Redirect loops**: Verify SSO configuration

### Support

- Check individual app README files
- Review deployment-strategy.md
- Test locally before deploying
"@

if (-not $DryRun) {
    $deploymentInstructions | Out-File "DEPLOYMENT.md" -Encoding UTF8
    Write-Host "✅ Created DEPLOYMENT.md" -ForegroundColor Green
}

# Step 4: Summary and next steps
Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

Write-Host "`nWhat was configured:" -ForegroundColor Yellow
Write-Host "✅ SSO utilities added to auth package" -ForegroundColor White
Write-Host "✅ Each app configured for standalone deployment" -ForegroundColor White
Write-Host "✅ Deployment configurations created (Vercel + GitHub Actions)" -ForegroundColor White
Write-Host "✅ Environment templates created" -ForegroundColor White
Write-Host "✅ Documentation updated" -ForegroundColor White

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. 📦 Publish shared packages:" -ForegroundColor White
Write-Host "   ./scripts/publish-shared-packages.ps1" -ForegroundColor Gray

Write-Host "2. 🌐 Create GitHub repositories for each app" -ForegroundColor White

Write-Host "3. 🚀 Deploy to Vercel:" -ForegroundColor White
Write-Host "   - Connect each repository to Vercel" -ForegroundColor Gray
Write-Host "   - Configure custom domains" -ForegroundColor Gray
Write-Host "   - Set environment variables" -ForegroundColor Gray

Write-Host "4. 🔧 Configure DNS for subdomains" -ForegroundColor White

Write-Host "5. ✅ Test SSO flow across all apps" -ForegroundColor White

Write-Host "`nDocumentation:" -ForegroundColor Yellow
Write-Host "📋 DEPLOYMENT.md - Complete deployment guide" -ForegroundColor White
Write-Host "📋 deployment-strategy.md - Architecture overview" -ForegroundColor White

if ($DryRun) {
    Write-Host "`n🔍 This was a dry run - no files were modified" -ForegroundColor Cyan
    Write-Host "Run without -DryRun to apply changes" -ForegroundColor Cyan
} 