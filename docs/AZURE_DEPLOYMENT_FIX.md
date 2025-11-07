# Azure Static Web App - Fixing Deployment Issues

## Problem

The Azure Static Web App deployment is failing due to problematic app settings that are not allowed with Managed Functions:

- `FUNCTIONS_EXTENSION_VERSION`
- `FUNCTIONS_WORKER_RUNTIME`
- `AzureWebJobsStorage`

These settings were manually added to the Azure Static Web App configuration, but they are **not compatible** with the Managed Functions feature used by Azure Static Web Apps.

## Understanding the Issue

This application is a **pure frontend Single Page Application (SPA)** with:

- ✅ Static HTML, CSS, and JavaScript served from the `app/` directory
- ❌ **No Azure Functions API** (note `api_location: ""` in the workflow)
- ❌ **No backend services**

The problematic app settings listed above are designed for standalone Azure Functions apps, **not** for Azure Static Web Apps with Managed Functions.

## Solution: Remove App Settings from Azure Portal

You must remove these app settings directly from your Azure Static Web App configuration in the Azure Portal:

### Step-by-Step Instructions

1. **Log in to Azure Portal**: https://portal.azure.com

2. **Navigate to your Static Web App**:
   - Search for "Static Web Apps" in the top search bar
   - Select your Static Web App resource (named something like `thankful-coast-03f2b250f`)

3. **Open Configuration**:
   - In the left sidebar, click on **"Configuration"**
   - You'll see the "Application settings" tab

4. **Remove the problematic settings**:
   - Look for these settings and delete them:
     - `FUNCTIONS_EXTENSION_VERSION`
     - `FUNCTIONS_WORKER_RUNTIME`
     - `AzureWebJobsStorage`
   - Click the **X** or **Delete** button next to each setting
   - Click **Save** at the top of the page

5. **Verify removal**:
   - Refresh the Configuration page
   - Confirm the settings are no longer listed

6. **Trigger a new deployment**:
   - Either push a new commit to the `main` branch
   - Or manually trigger the GitHub Actions workflow

## Why This Happens

These settings may have been added:

- During initial Static Web App creation if you selected an API option
- By manually configuring settings in the Azure Portal
- By using Azure CLI or Infrastructure as Code templates meant for Azure Functions

## Prevention

To prevent this issue in the future:

1. **Do not manually add Azure Functions-specific settings** to your Static Web App
2. **Use the `staticwebapp.config.json` file** in the repository root to configure your app
3. **Keep `api_location: ""` in the workflow** if you don't have an API
4. **Review Azure Portal settings** before deployment

## Reference Documentation

- [Azure Static Web Apps Configuration](https://learn.microsoft.com/en-us/azure/static-web-apps/configuration)
- [Azure Static Web Apps with Managed Functions](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-overview)
- [Troubleshooting Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/troubleshooting)

## Configuration File

This repository now includes a `staticwebapp.config.json` file at the root that properly configures the Static Web App for frontend-only deployment. This file:

- Sets up proper SPA routing with fallback to `index.html`
- Configures security headers
- Defines MIME types for static assets
- Does **not** include any Azure Functions-specific settings

## Need Help?

If you continue to experience deployment issues after removing these settings:

1. Check the GitHub Actions workflow logs for detailed error messages
2. Review the Azure Static Web App deployment logs in the Azure Portal
3. Ensure no Infrastructure as Code (Bicep, Terraform, ARM templates) is setting these values
4. Contact Azure Support if the issue persists

## Summary

**Action Required**: Remove the following app settings from Azure Portal:

- ✅ Remove `FUNCTIONS_EXTENSION_VERSION`
- ✅ Remove `FUNCTIONS_WORKER_RUNTIME`
- ✅ Remove `AzureWebJobsStorage`

After removal, the deployment should succeed without errors.
