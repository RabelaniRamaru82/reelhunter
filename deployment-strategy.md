# ReelApps Multi-Repository Deployment Strategy

## Overview
This strategy allows each app to be deployed independently while maintaining Single Sign-On (SSO) through the main ReelApps domain.

## Architecture

### 1. Repository Structure
```
GitHub Repositories:
├── reelapps/reelapps-main          # Main landing/auth app
├── reelapps/reelapps-shared        # Shared packages (@reelapps/*)
├── reelapps/reelhunter             # Recruiter matching app
├── reelapps/reelcv                 # CV builder app
├── reelapps/reelpersona            # Personality analysis
├── reelapps/reelprojects           # Project showcase
└── reelapps/reelskills             # Skills assessment
```

### 2. Domain Structure
```
Main Domain: reelapps.co.za
Subdomains:
├── reelhunter.reelapps.co.za
├── reelcv.reelapps.co.za
├── reelpersona.reelapps.co.za
├── reelprojects.reelapps.co.za
└── reelskills.reelapps.co.za
```

## SSO Implementation

### 1. Shared Authentication State
- Main domain (`reelapps.co.za`) handles authentication
- JWT tokens stored in cookies with domain `.reelapps.co.za`
- All subdomains can read the auth state

### 2. Auth Flow
1. User visits any subdomain (e.g., `reelhunter.reelapps.co.za`)
2. App checks for auth token in cookie
3. If no token, redirect to `reelapps.co.za/login?redirect=reelhunter.reelapps.co.za`
4. After login, redirect back to original subdomain with token

### 3. Shared Package Strategy
Each app repository will include the shared packages as:
- Git submodules (for development)
- Published npm packages (for production)

## Implementation Steps

### Phase 1: Prepare Shared Packages
1. Create `reelapps-shared` repository
2. Publish packages to npm registry or private registry
3. Version and tag releases

### Phase 2: Extract Individual Apps
1. Create separate repositories for each app
2. Include shared packages as dependencies
3. Configure deployment pipelines

### Phase 3: SSO Configuration
1. Configure domain cookies for authentication
2. Set up redirect flows
3. Test cross-subdomain authentication

### Phase 4: Deployment
1. Deploy main app to `reelapps.co.za`
2. Deploy each app to respective subdomains
3. Configure DNS and SSL certificates

## Technical Implementation

### Shared Package Distribution
```json
// Each app's package.json
{
  "dependencies": {
    "@reelapps/auth": "^1.0.0",
    "@reelapps/ui": "^1.0.0",
    "@reelapps/types": "^1.0.0",
    "@reelapps/config": "^1.0.0"
  }
}
```

### Environment Configuration
```env
# Main app (.env)
VITE_DOMAIN=reelapps.co.za
VITE_AUTH_DOMAIN=reelapps.co.za
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Subdomain apps (.env)
VITE_DOMAIN=reelhunter.reelapps.co.za
VITE_AUTH_DOMAIN=reelapps.co.za
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### Cookie Configuration
```typescript
// In @reelapps/auth package
const cookieOptions = {
  domain: '.reelapps.co.za',  // Allows all subdomains to access
  secure: true,               // HTTPS only
  sameSite: 'lax',           // Cross-site requests allowed
  httpOnly: false            // Allow JavaScript access
};
```

## Deployment Platforms

### Option 1: Vercel
- Each repository deployed as separate Vercel project
- Custom domains configured for each project
- Environment variables managed per project

### Option 2: Netlify
- Similar to Vercel with separate sites
- Branch deployments for staging

### Option 3: Self-hosted
- Docker containers for each app
- Nginx reverse proxy for routing
- CI/CD pipelines for automated deployment

## Benefits
1. **Independent Deployments**: Each app can be deployed separately
2. **Team Autonomy**: Different teams can work on different apps
3. **Scalability**: Scale individual apps based on usage
4. **Maintenance**: Easier to maintain and debug individual apps
5. **SSO**: Seamless user experience across all apps

## Next Steps
1. Choose deployment platform
2. Set up shared package registry
3. Create repository templates
4. Implement SSO authentication flow
5. Test cross-subdomain functionality 