# ReelApps Multi-Repository Setup Script
# This script prepares each app for independent deployment

param(
    [string]$GitHubOrg = "reelapps",
    [string]$PackageRegistry = "npm",  # or "github" for GitHub packages
    [switch]$DryRun = $false
)

Write-Host "🚀 Setting up ReelApps Multi-Repository Structure" -ForegroundColor Green

# Define apps and their configurations
$apps = @(
    @{
        Name = "reelhunter"
        Description = "AI-powered recruiter matching platform"
        Domain = "reelhunter.reelapps.co.za"
        Port = 5175
    },
    @{
        Name = "reelcv"
        Description = "Interactive CV builder with video integration"
        Domain = "reelcv.reelapps.co.za"
        Port = 5176
    },
    @{
        Name = "reelpersona"
        Description = "AI personality analysis for professionals"
        Domain = "reelpersona.reelapps.co.za"
        Port = 5177
    },
    @{
        Name = "reelprojects"
        Description = "Project showcase and portfolio builder"
        Domain = "reelprojects.reelapps.co.za"
        Port = 5178
    },
    @{
        Name = "reelskills"
        Description = "Skills assessment and verification platform"
        Domain = "reelskills.reelapps.co.za"
        Port = 5179
    }
)

# Function to create package.json for standalone apps
function Create-StandalonePackageJson {
    param($AppName, $AppConfig)
    
    $packageJson = @{
        name = "@reelapps/$AppName"
        private = $true
        version = "1.0.0"
        description = $AppConfig.Description
        type = "module"
        scripts = @{
            dev = "vite --port $($AppConfig.Port)"
            build = "vite build"
            preview = "vite preview --port $($AppConfig.Port)"
            lint = "eslint . --ext .ts,.tsx --report-unused-disable-directives --max-warnings 0"
        }
        dependencies = @{
            "@reelapps/auth" = "^1.0.0"
            "@reelapps/config" = "^1.0.0"
            "@reelapps/types" = "^1.0.0"
            "@reelapps/ui" = "^1.0.0"
            "lucide-react" = "^0.344.0"
            "react" = "^18.2.0"
            "react-dom" = "^18.2.0"
            "react-router-dom" = "^7.6.2"
            "zod" = "^3.25.67"
            "zustand" = "^4.3.8"
        }
        devDependencies = @{
            "@types/node" = "^24.0.4"
            "@types/react" = "^18.2.43"
            "@types/react-dom" = "^18.2.17"
            "@typescript-eslint/eslint-plugin" = "^7.0.0"
            "@typescript-eslint/parser" = "^7.0.0"
            "@vitejs/plugin-react" = "^4.2.1"
            "autoprefixer" = "^10.4.16"
            "eslint" = "^8.55.0"
            "eslint-plugin-react-hooks" = "^4.6.0"
            "eslint-plugin-react-refresh" = "^0.4.5"
            "postcss" = "^8.4.32"
            "tailwindcss" = "^3.3.6"
            "typescript" = "^5.2.2"
            "vite" = "^5.0.8"
        }
    }
    
    return $packageJson | ConvertTo-Json -Depth 10
}

# Function to create deployment configuration
function Create-DeploymentConfig {
    param($AppName, $AppConfig)
    
    # Vercel configuration
    $vercelJson = @{
        name = $AppName
        version = 2
        builds = @(
            @{
                src = "package.json"
                use = "@vercel/static-build"
                config = @{
                    distDir = "dist"
                }
            }
        )
        routes = @(
            @{
                src = "/(.*)"
                dest = "/index.html"
            }
        )
        env = @{
            VITE_DOMAIN = $AppConfig.Domain
            VITE_AUTH_DOMAIN = "reelapps.co.za"
        }
    } | ConvertTo-Json -Depth 10
    
    # GitHub Actions workflow
    $githubWorkflow = @"
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        env:
          VITE_DOMAIN: $($AppConfig.Domain)
          VITE_AUTH_DOMAIN: reelapps.co.za
          VITE_SUPABASE_URL: `${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: `${{ secrets.VITE_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: vercel/action@v1
        with:
          vercel-token: `${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: `${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: `${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
"@

    return @{
        vercel = $vercelJson
        github = $githubWorkflow
    }
}

# Function to update auth package for SSO
function Update-AuthPackageForSSO {
    Write-Host "📦 Updating auth package for SSO support..." -ForegroundColor Yellow
    
    $authPackagePath = "split-repos/ReelApps/packages/auth"
    $authSrcPath = "$authPackagePath/src"
    
    # Create SSO utility
    $ssoUtilContent = @"
// SSO utilities for cross-subdomain authentication
export const SSO_CONFIG = {
  MAIN_DOMAIN: 'reelapps.co.za',
  COOKIE_DOMAIN: '.reelapps.co.za',
  AUTH_COOKIE_NAME: 'reelapps_auth_token',
};

export function getAuthDomain(): string {
  return process.env.VITE_AUTH_DOMAIN || SSO_CONFIG.MAIN_DOMAIN;
}

export function getCurrentDomain(): string {
  return process.env.VITE_DOMAIN || window.location.hostname;
}

export function shouldRedirectToAuth(): boolean {
  return getCurrentDomain() !== getAuthDomain();
}

export function createAuthRedirectUrl(returnUrl?: string): string {
  const authDomain = getAuthDomain();
  const currentDomain = getCurrentDomain();
  const redirectUrl = returnUrl || `https://${currentDomain}`;
  return `https://${authDomain}/login?redirect=${encodeURIComponent(redirectUrl)}`;
}

export function handleAuthRedirect(): void {
  if (shouldRedirectToAuth() && !hasValidAuthToken()) {
    const redirectUrl = createAuthRedirectUrl();
    window.location.href = redirectUrl;
  }
}

export function hasValidAuthToken(): boolean {
  // Check for auth token in cookies
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${SSO_CONFIG.AUTH_COOKIE_NAME}=`)
  );
  return !!authCookie;
}

export function setAuthCookie(token: string): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
  
  document.cookie = `${SSO_CONFIG.AUTH_COOKIE_NAME}=${token}; ` +
    `expires=${expires.toUTCString()}; ` +
    `domain=${SSO_CONFIG.COOKIE_DOMAIN}; ` +
    `path=/; secure; samesite=lax`;
}

export function clearAuthCookie(): void {
  document.cookie = `${SSO_CONFIG.AUTH_COOKIE_NAME}=; ` +
    `expires=Thu, 01 Jan 1970 00:00:00 UTC; ` +
    `domain=${SSO_CONFIG.COOKIE_DOMAIN}; ` +
    `path=/;`;
}
"@

    if (-not $DryRun) {
        New-Item -Path "$authSrcPath/sso.ts" -Value $ssoUtilContent -Force
        Write-Host "✅ Created SSO utilities" -ForegroundColor Green
    }
}

# Main execution
Write-Host "🔧 Starting multi-repo setup..." -ForegroundColor Cyan

# Step 1: Update auth package for SSO
Update-AuthPackageForSSO

# Step 2: Create standalone repositories
foreach ($app in $apps) {
    Write-Host "`n📁 Processing $($app.Name)..." -ForegroundColor Cyan
    
    $appPath = "split-repos/$($app.Name.Replace('reel', 'Reel'))"
    
    if (Test-Path $appPath) {
        Write-Host "  📦 Creating standalone package.json..." -ForegroundColor Yellow
        
        $packageJson = Create-StandalonePackageJson -AppName $app.Name -AppConfig $app
        
        if (-not $DryRun) {
            $packageJson | Out-File -FilePath "$appPath/package.json" -Encoding UTF8
            Write-Host "  ✅ Created package.json" -ForegroundColor Green
        }
        
        # Create deployment configurations
        Write-Host "  🚀 Creating deployment configurations..." -ForegroundColor Yellow
        
        $deployConfig = Create-DeploymentConfig -AppName $app.Name -AppConfig $app
        
        if (-not $DryRun) {
            # Vercel config
            $deployConfig.vercel | Out-File -FilePath "$appPath/vercel.json" -Encoding UTF8
            
            # GitHub Actions
            $workflowDir = "$appPath/.github/workflows"
            if (-not (Test-Path $workflowDir)) {
                New-Item -Path $workflowDir -ItemType Directory -Force
            }
            $deployConfig.github | Out-File -FilePath "$workflowDir/deploy.yml" -Encoding UTF8
            
            Write-Host "  ✅ Created deployment configurations" -ForegroundColor Green
        }
        
        # Create README
        $readmeContent = @"
# $($app.Name.ToUpper())

$($app.Description)

## Development

```bash
npm install
npm run dev
```

Visit: http://localhost:$($app.Port)

## Deployment

This app is deployed to: https://$($app.Domain)

## Environment Variables

```env
VITE_DOMAIN=$($app.Domain)
VITE_AUTH_DOMAIN=reelapps.co.za
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

## SSO Integration

This app integrates with the main ReelApps authentication system. Users are automatically redirected to the main domain for login if not authenticated.
"@

        if (-not $DryRun) {
            $readmeContent | Out-File -FilePath "$appPath/README.md" -Encoding UTF8
            Write-Host "  ✅ Created README.md" -ForegroundColor Green
        }
    }
    else {
        Write-Host "  ⚠️  Directory not found: $appPath" -ForegroundColor Red
    }
}

# Step 3: Create shared packages repository structure
Write-Host "`n📦 Creating shared packages structure..." -ForegroundColor Cyan

$sharedPackagesPath = "reelapps-shared"
if (-not $DryRun) {
    if (-not (Test-Path $sharedPackagesPath)) {
        New-Item -Path $sharedPackagesPath -ItemType Directory -Force
    }
    
    # Copy packages
    Copy-Item -Path "split-repos/ReelApps/packages" -Destination $sharedPackagesPath -Recurse -Force
    
    Write-Host "✅ Created shared packages structure" -ForegroundColor Green
}

Write-Host "`n🎉 Multi-repo setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the deployment-strategy.md file" -ForegroundColor White
Write-Host "2. Publish shared packages to npm registry" -ForegroundColor White
Write-Host "3. Create GitHub repositories for each app" -ForegroundColor White
Write-Host "4. Configure domain DNS settings" -ForegroundColor White
Write-Host "5. Set up deployment pipelines" -ForegroundColor White 