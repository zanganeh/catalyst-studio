# Optimizely API Credentials Setup Guide

## Overview
This guide provides step-by-step instructions for obtaining and configuring Optimizely API credentials for Catalyst Studio integration.

## Prerequisites
- Active Optimizely CMS account
- Administrator access to the Optimizely admin panel
- Access to your organization's API management settings

## Step 1: Access Optimizely Admin Panel

1. Navigate to your Optimizely CMS instance
   - Production: `https://[your-instance].optimizely.com`
   - Staging: `https://[your-staging-instance].optimizely.com`

2. Log in with administrator credentials

3. Navigate to the Settings menu in the top navigation bar

## Step 2: Generate API Key

### Navigation Path
1. From the admin panel, click **Settings** → **API Keys**
2. Click **"Create New API Key"** button

### API Key Configuration

1. **Key Name**: Enter a descriptive name (e.g., "Catalyst Studio Integration")

2. **Required Scopes**: Select the following permissions:
   - ✅ **Content Type Management**
     - `content-types:read` - Read content type definitions
     - `content-types:write` - Modify content type definitions
   
   - ✅ **Content Management**
     - `content:read` - Read content items
     - `content:write` - Create and modify content
     - `content:delete` - Delete content items
   
   - ✅ **Media Management**
     - `media:read` - Read media library items
     - `media:write` - Upload and modify media
     - `media:delete` - Delete media items
   
   - ✅ **Publishing**
     - `publish:read` - View publishing status
     - `publish:write` - Publish content

3. **IP Restrictions** (Optional):
   - For development: Leave unrestricted
   - For production: Add your server IP addresses

4. Click **"Generate API Key"**

5. **IMPORTANT**: Copy the API key immediately - it will only be displayed once!

## Step 3: Retrieve Project ID

1. Navigate to **Settings** → **Project Information**
2. Locate the **Project ID** field
3. Copy the alphanumeric ID (format: `proj_XXXXXXXXXXXX`)

Alternative method:
- Check the URL when viewing content: `https://app.optimizely.com/v2/projects/[PROJECT_ID]/...`

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Optimizely Configuration
OPTIMIZELY_API_KEY=your_api_key_here
OPTIMIZELY_PROJECT_ID=proj_XXXXXXXXXXXX
OPTIMIZELY_API_URL=https://api.optimizely.com/v2

# Optional: Environment-specific settings
OPTIMIZELY_ENVIRONMENT=development  # or staging, production
```

## Step 5: Verify Credentials

Test your API connection using curl:

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.optimizely.com/v2/projects/YOUR_PROJECT_ID
```

Expected response: JSON object with project details

## API Key Rotation Process

### Regular Rotation Schedule
- Development keys: Rotate every 90 days
- Production keys: Rotate every 30 days
- Compromised keys: Rotate immediately

### Rotation Steps
1. Generate new API key (follow Step 2)
2. Update environment variables in all environments
3. Deploy changes
4. Verify new key is working
5. Revoke old key from Optimizely admin panel

### Key Rotation Checklist
- [ ] New key generated with correct scopes
- [ ] Development environment updated
- [ ] Staging environment updated
- [ ] Production environment updated
- [ ] CI/CD secrets updated
- [ ] Team notified of rotation
- [ ] Old key revoked
- [ ] Rotation logged in security audit

## Security Best Practices

### Storage Guidelines
- ❌ **Never** commit API keys to version control
- ❌ **Never** hardcode keys in source code
- ❌ **Never** share keys via email or chat
- ✅ Use environment variables
- ✅ Use secrets management tools (e.g., AWS Secrets Manager, Azure Key Vault)
- ✅ Implement key encryption for production

### Access Control
- Use separate keys for each environment
- Implement least-privilege principle
- Use read-only keys for development when possible
- Regular audit of API key usage

### Monitoring
- Enable API usage logging in Optimizely
- Monitor for unusual activity patterns
- Set up alerts for rate limit approaches
- Track key usage across environments

## Troubleshooting Common Issues

### Invalid API Key Error
```
Error: 401 Unauthorized - Invalid API key
```
**Solution**: Verify key is copied correctly without spaces or line breaks

### Insufficient Permissions
```
Error: 403 Forbidden - Insufficient scopes
```
**Solution**: Regenerate key with all required scopes listed above

### Project Not Found
```
Error: 404 Not Found - Project not found
```
**Solution**: Verify Project ID format and ensure it includes the `proj_` prefix

### Rate Limiting
```
Error: 429 Too Many Requests
```
**Solution**: Implement exponential backoff or contact Optimizely support for limit increase

## Support Resources

- [Optimizely API Documentation](https://docs.optimizely.com/api)
- [API Authentication Guide](https://docs.optimizely.com/api/authentication)
- [Rate Limits and Quotas](https://docs.optimizely.com/api/rate-limits)
- Support Email: support@optimizely.com
- Developer Forum: https://community.optimizely.com

## Next Steps

After obtaining your credentials:
1. Configure your local environment using the [Local Development Guide](./local-development.md)
2. Test the integration with mock data first
3. Verify live API connection
4. Begin development with the provider pattern