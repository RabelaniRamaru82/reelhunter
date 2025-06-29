# Script to publish shared packages to npm registry
param(
    [string]$Registry = "https://registry.npmjs.org/",
    [string]$Version = "1.0.0",
    [switch]$DryRun = $false,
    [switch]$Private = $false
)

Write-Host "📦 Publishing ReelApps Shared Packages" -ForegroundColor Green

$packages = @("auth", "config", "types", "ui", "supabase")
$packagesPath = "split-repos/ReelApps/packages"

function Update-PackageForPublishing {
    param($PackageName, $PackagePath)
    
    Write-Host "  🔧 Updating $PackageName for publishing..." -ForegroundColor Yellow
    
    # Read existing package.json
    $packageJsonPath = "$PackagePath/package.json"
    $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
    
    # Update version
    $packageJson.version = $Version
    
    # Add/update publishing configuration
    if (-not $packageJson.publishConfig) {
        $packageJson | Add-Member -NotePropertyName "publishConfig" -NotePropertyValue @{}
    }
    
    if ($Private) {
        $packageJson.publishConfig.access = "restricted"
    } else {
        $packageJson.publishConfig.access = "public"
    }
    
    $packageJson.publishConfig.registry = $Registry
    
    # Ensure proper main/types fields
    if (-not $packageJson.main) {
        $packageJson.main = "dist/index.js"
    }
    if (-not $packageJson.types) {
        $packageJson.types = "dist/index.d.ts"
    }
    
    # Add files field if not present
    if (-not $packageJson.files) {
        $packageJson.files = @("dist", "README.md")
    }
    
    # Update repository information
    $packageJson.repository = @{
        type = "git"
        url = "https://github.com/reelapps/reelapps-shared.git"
        directory = "packages/$PackageName"
    }
    
    # Add homepage
    $packageJson.homepage = "https://github.com/reelapps/reelapps-shared#readme"
    
    # Add bugs URL
    $packageJson.bugs = @{
        url = "https://github.com/reelapps/reelapps-shared/issues"
    }
    
    if (-not $DryRun) {
        $packageJson | ConvertTo-Json -Depth 10 | Out-File $packageJsonPath -Encoding UTF8
        Write-Host "  ✅ Updated package.json for $PackageName" -ForegroundColor Green
    }
}

function Build-Package {
    param($PackageName, $PackagePath)
    
    Write-Host "  🔨 Building $PackageName..." -ForegroundColor Yellow
    
    Push-Location $PackagePath
    
    try {
        if (-not $DryRun) {
            # Install dependencies
            npm install
            
            # Build the package
            npm run build
            
            Write-Host "  ✅ Built $PackageName" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ❌ Failed to build $PackageName`: $_" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
    
    return $true
}

function Publish-Package {
    param($PackageName, $PackagePath)
    
    Write-Host "  🚀 Publishing $PackageName..." -ForegroundColor Yellow
    
    Push-Location $PackagePath
    
    try {
        if (-not $DryRun) {
            if ($Private) {
                npm publish --access restricted
            } else {
                npm publish --access public
            }
            Write-Host "  ✅ Published $PackageName" -ForegroundColor Green
        } else {
            Write-Host "  🔍 Dry run: Would publish $PackageName" -ForegroundColor Cyan
        }
    }
    catch {
        Write-Host "  ❌ Failed to publish $PackageName`: $_" -ForegroundColor Red
        return $false
    }
    finally {
        Pop-Location
    }
    
    return $true
}

# Main execution
Write-Host "Starting package publishing process..." -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No actual changes will be made" -ForegroundColor Cyan
}

# Check if packages directory exists
if (-not (Test-Path $packagesPath)) {
    Write-Host "❌ Packages directory not found: $packagesPath" -ForegroundColor Red
    exit 1
}

$successCount = 0
$totalCount = $packages.Count

foreach ($package in $packages) {
    $packagePath = "$packagesPath/$package"
    
    Write-Host "`n📦 Processing $package..." -ForegroundColor Cyan
    
    if (-not (Test-Path $packagePath)) {
        Write-Host "  ⚠️  Package directory not found: $packagePath" -ForegroundColor Yellow
        continue
    }
    
    # Update package for publishing
    Update-PackageForPublishing -PackageName $package -PackagePath $packagePath
    
    # Build package
    if (Build-Package -PackageName $package -PackagePath $packagePath) {
        # Publish package
        if (Publish-Package -PackageName $package -PackagePath $packagePath) {
            $successCount++
        }
    }
}

Write-Host "`n🎉 Publishing complete!" -ForegroundColor Green
Write-Host "Successfully processed: $successCount/$totalCount packages" -ForegroundColor White

if ($successCount -eq $totalCount) {
    Write-Host "`n✅ All packages published successfully!" -ForegroundColor Green
    Write-Host "You can now update your apps to use the published packages:" -ForegroundColor Yellow
    Write-Host 'npm install @reelapps/auth @reelapps/ui @reelapps/types @reelapps/config' -ForegroundColor White
} else {
    Write-Host "`n⚠️  Some packages failed to publish. Please check the errors above." -ForegroundColor Yellow
} 