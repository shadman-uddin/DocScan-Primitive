# Worker Deployment Guide

## Problem Identified

Your Cloudflare Worker at `eic-jsa.skillaxis.workers.dev` is deployed but **missing the latest code updates**, specifically:

1. The `/api/health` endpoint (returns 404)
2. The worker has hardcoded extraction logic that ignores custom field definitions

## Current Worker Status

- **Worker URL**: https://eic-jsa.skillaxis.workers.dev ✅ Active
- **Worker Name**: eic-jsa
- **Config File**: Updated to match deployed name ✅
- **/api/extract**: Working but with hardcoded fields ⚠️
- **/api/health**: Missing (404) ❌

## How to Redeploy the Worker

### Option 1: Using Wrangler CLI (Recommended)

1. **Get your Cloudflare API Token**:
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Click "Create Token"
   - Use the "Edit Cloudflare Workers" template
   - Copy the token

2. **Deploy the worker**:
   ```bash
   cd worker
   export CLOUDFLARE_API_TOKEN="your-token-here"
   npx wrangler deploy --env=""
   ```

3. **Verify deployment**:
   ```bash
   curl https://eic-jsa.skillaxis.workers.dev/api/health
   ```

   Should return:
   ```json
   {
     "status": "ok",
     "hasAnthropicKey": true,
     "hasSheetId": true,
     "hasServiceAccount": true
   }
   ```

### Option 2: Manual Deployment via Dashboard

1. Go to: https://dash.cloudflare.com/
2. Navigate to **Workers & Pages**
3. Click on **eic-jsa**
4. Click **Quick Edit** or **Edit Code**
5. Copy the entire contents of `worker/index.js`
6. Paste it into the editor
7. Click **Save and Deploy**

## Environment Variables to Verify

After redeployment, verify these are still set in the Cloudflare dashboard:

- ✅ `ANTHROPIC_API_KEY` (Secret)
- ✅ `GOOGLE_SHEET_ID` (Plaintext)
- ✅ `GOOGLE_SERVICE_ACCOUNT_JSON` (JSON)
- ✅ `ALLOWED_ORIGIN` (Plaintext)
- ✅ `RECORDS_TAB` (Plaintext)
- ✅ `UPLOAD_LOG_TAB` (Plaintext)
- ✅ `FIELD_ORDER` (Plaintext)

## Testing After Deployment

1. **Test health endpoint**:
   ```bash
   curl https://eic-jsa.skillaxis.workers.dev/api/health
   ```

2. **Test extraction** (from your app):
   - Upload an EIC sign-in sheet photo
   - Verify it extracts the correct field names
   - Check that worker names are being read correctly

## What Changed

- Fixed `wrangler.toml` to use correct worker name "eic-jsa"
- Removed demo data fallback to make worker connection errors clear
- The worker code in `worker/index.js` is ready to deploy with the `/api/health` endpoint

## Notes

- The worker currently has **hardcoded extraction logic** for EIC sign-in sheets
- Field definitions from the frontend are sent but not currently used by the worker
- The extraction prompt is optimized for:
  - Foreman name (top-left)
  - Date in MM-DD-YY format (top-right)
  - Worker table with: Name, ID#, Time In, Time Out
