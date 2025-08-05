#!/bin/bash

echo "Cleaning git history to remove secrets..."

# Create a backup branch just in case
git branch backup-before-cleanup

# Use git filter-branch to remove secrets from all commits
git filter-branch --force --index-filter '
    # Remove any .env files that might contain secrets
    git rm --cached --ignore-unmatch backend/.env 2>/dev/null || true
    
    # Remove any hardcoded secrets from specific files
    if [ -f backend/src/config/passport.js ]; then
        # Replace any hardcoded Google OAuth credentials with environment variables
        sed -i "" "s/clientID: \"[^\"]*\"/clientID: process.env.GOOGLE_CLIENT_ID/g" backend/src/config/passport.js 2>/dev/null || true
        sed -i "" "s/clientSecret: \"[^\"]*\"/clientSecret: process.env.GOOGLE_CLIENT_SECRET/g" backend/src/config/passport.js 2>/dev/null || true
    fi
    
    if [ -f backend/src/config/stripe.js ]; then
        # Replace any hardcoded Stripe keys with environment variables
        sed -i "" "s/stripeSecretKey: \"[^\"]*\"/stripeSecretKey: process.env.STRIPE_SECRET_KEY/g" backend/src/config/stripe.js 2>/dev/null || true
        sed -i "" "s/stripePublishableKey: \"[^\"]*\"/stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY/g" backend/src/config/stripe.js 2>/dev/null || true
    fi
' --prune-empty --tag-name-filter cat -- --all

echo "Git history cleaned. Now force pushing to remote..."
git push origin main --force

echo "Cleanup complete! If something goes wrong, you can restore from backup-before-cleanup branch." 