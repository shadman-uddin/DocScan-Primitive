# DocScan Extraction Worker

Cloudflare Worker that acts as a secure proxy for the Anthropic Claude Vision API.

## Setup

### 1. Install Wrangler CLI

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Set Environment Variables

Set your Anthropic API key as a secret:

```bash
cd worker
wrangler secret put ANTHROPIC_API_KEY
```

When prompted, paste your Anthropic API key.

For ALLOWED_ORIGIN, edit `wrangler.toml` or set it in the Cloudflare dashboard.

### 4. Deploy

```bash
wrangler deploy
```

The worker will be deployed to `https://docscan-extraction-worker.<your-subdomain>.workers.dev`

## Local Development

Run the worker locally:

```bash
wrangler dev
```

This starts a local server at `http://localhost:8787`

**Note:** You'll need to set ANTHROPIC_API_KEY locally. Create a `.dev.vars` file:

```
ANTHROPIC_API_KEY=your-api-key-here
ALLOWED_ORIGIN=http://localhost:5173
```

## API Endpoint

### POST /api/extract

Extracts structured data from handwritten forms using Claude Vision.

**Request Body:**
```json
{
  "image": "base64-encoded-image",
  "mimeType": "image/jpeg",
  "fieldDefinitions": [
    { "name": "worker_name", "label": "Worker Name", "type": "text" }
  ]
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "fields": [
      {
        "field_name": "worker_name",
        "extracted_value": "John Doe",
        "confidence": 0.95
      }
    ],
    "processingTime": 1234,
    "model": "claude-sonnet-4-20250514"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Update Frontend

After deploying, update your frontend `.env` file:

```
VITE_API_URL=https://docscanextraction.skillaxis.workers.dev
```
