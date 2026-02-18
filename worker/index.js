let cachedToken = null;
let tokenExpiry = 0;

function base64url(data) {
  let base64;
  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function getGoogleAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && tokenExpiry > now + 60) {
    return cachedToken;
  }

  const serviceAccount = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const { client_email, private_key } = serviceAccount;

  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(
    JSON.stringify({
      iss: client_email,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })
  );

  const signingInput = `${header}.${payload}`;
  const keyData = pemToArrayBuffer(private_key);

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signingInput)
  );

  const jwt = `${signingInput}.${base64url(signature)}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    throw new Error(`Failed to get Google token: ${err}`);
  }

  const tokenData = await tokenResponse.json();
  cachedToken = tokenData.access_token;
  tokenExpiry = now + tokenData.expires_in;
  return cachedToken;
}

async function sheetsAppend(accessToken, sheetId, tabName, values) {
  const range = encodeURIComponent(`${tabName}!A:Z`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (response.status === 403) {
    throw new Error('PERMISSION_DENIED');
  }
  if (response.status === 404) {
    throw new Error('SHEET_NOT_FOUND');
  }
  if (response.status === 429) {
    throw new Error('QUOTA_EXCEEDED');
  }
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sheets append failed: ${err}`);
  }

  return response.json();
}

async function sheetsRead(accessToken, sheetId, tabName) {
  const range = encodeURIComponent(`${tabName}!A:Z`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (response.status === 403) {
    throw new Error('PERMISSION_DENIED');
  }
  if (response.status === 404) {
    throw new Error('SHEET_NOT_FOUND');
  }
  if (response.status === 429) {
    throw new Error('QUOTA_EXCEEDED');
  }
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Sheets read failed: ${err}`);
  }

  return response.json();
}

function sheetsErrorResponse(error, corsHeaders) {
  const msg = error.message || '';
  let status = 500;
  let userMessage = 'Internal server error. Please try again.';

  if (msg === 'PERMISSION_DENIED') {
    status = 403;
    userMessage = 'Unable to write to the connected sheet. Please check the admin configuration.';
  } else if (msg === 'SHEET_NOT_FOUND') {
    status = 404;
    userMessage = 'The configured Google Sheet could not be found. Please verify the Sheet ID in admin settings.';
  } else if (msg === 'QUOTA_EXCEEDED') {
    status = 429;
    userMessage = 'Google Sheets is temporarily unavailable. Your data has been saved locally and will sync when available.';
  }

  return new Response(
    JSON.stringify({ success: false, error: userMessage }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/extract' && request.method === 'POST') {
      try {
        const startTime = Date.now();
        const body = await request.json();
        const { image, mimeType, fieldDefinitions } = body;

        if (!image || !mimeType || !fieldDefinitions) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing required fields: image, mimeType, or fieldDefinitions' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(mimeType)) {
          return new Response(
            JSON.stringify({ success: false, error: `Unsupported image type: ${mimeType}. Must be JPEG, PNG, GIF, or WebP.` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const base64Data = image.split(',')[1] || image;
        const imageSizeBytes = (base64Data.length * 3) / 4;
        const maxSizeBytes = 10 * 1024 * 1024;

        if (imageSizeBytes > maxSizeBytes) {
          return new Response(
            JSON.stringify({ success: false, error: 'Image is too large. Please upload an image smaller than 10MB.' }),
            { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const fieldList = fieldDefinitions.map((f) => `- ${f.label} (${f.type})`).join('\n');
        const prompt = `Extract data from this handwritten form. The form contains these fields:\n${fieldList}\n\nFor each field return a JSON object with:\n{ field_name: string, extracted_value: string or null, confidence: number 0-1 }\n\nIf a field is completely unreadable, set extracted_value to null and confidence to 0.\nReturn a JSON array only. No markdown, no explanation.`;

        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: 'You extract structured data from handwritten forms. Return only valid JSON.',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64Data } },
                  { type: 'text', text: prompt },
                ],
              },
            ],
          }),
        });

        if (anthropicResponse.status === 429) {
          return new Response(
            JSON.stringify({ success: false, error: 'Rate limited. Please wait a moment and try again.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!anthropicResponse.ok) {
          const errorText = await anthropicResponse.text();
          console.error('Anthropic API error:', errorText);
          return new Response(
            JSON.stringify({ success: false, error: 'AI service error. Please try again.' }),
            { status: anthropicResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const anthropicData = await anthropicResponse.json();
        const textContent = anthropicData.content?.find((c) => c.type === 'text')?.text || '';

        let extractedFields;
        try {
          extractedFields = JSON.parse(textContent);
        } catch (e) {
          const jsonMatch = textContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              extractedFields = JSON.parse(jsonMatch[0]);
            } catch (e2) {
              return new Response(
                JSON.stringify({ success: false, error: 'Could not parse extraction results. The form may be unclear — try re-uploading a clearer photo.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
              );
            }
          } else {
            return new Response(
              JSON.stringify({ success: false, error: 'Could not parse extraction results. The form may be unclear — try re-uploading a clearer photo.' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }

        const processingTime = Date.now() - startTime;
        return new Response(
          JSON.stringify({ success: true, data: { fields: extractedFields, processingTime, model: 'claude-sonnet-4-20250514' } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error processing request:', error);
        return new Response(
          JSON.stringify({ success: false, error: 'Internal server error. Please try again.' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (url.pathname === '/api/sheets/append' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { data, submittedBy, uploadId, fileName } = body;

        if (!data || !submittedBy) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing required fields: data, submittedBy' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const accessToken = await getGoogleAccessToken(env);
        const sheetId = env.GOOGLE_SHEET_ID;
        const recordsTab = env.RECORDS_TAB || 'Records';
        const uploadLogTab = env.UPLOAD_LOG_TAB || 'Upload Log';
        const fieldOrder = (env.FIELD_ORDER || '').split(',').map((f) => f.trim()).filter(Boolean);

        const timestamp = new Date().toISOString();
        const fieldValues = fieldOrder.map((f) => data[f] ?? '');
        const recordRow = [timestamp, ...fieldValues, submittedBy, 'Approved'];

        const appendResult = await sheetsAppend(accessToken, sheetId, recordsTab, [recordRow]);
        const updatedRange = appendResult.updates?.updatedRange || '';
        const rowMatch = updatedRange.match(/(\d+)$/);
        const rowNumber = rowMatch ? parseInt(rowMatch[1], 10) : null;

        const logRow = [timestamp, fileName || uploadId || '', 'Approved', submittedBy];
        await sheetsAppend(accessToken, sheetId, uploadLogTab, [logRow]);

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              rowNumber,
              sheetUrl: `https://docs.google.com/spreadsheets/d/${sheetId}`,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Sheets append error:', error);
        return sheetsErrorResponse(error, corsHeaders);
      }
    }

    if (url.pathname === '/api/sheets/records' && request.method === 'GET') {
      try {
        const accessToken = await getGoogleAccessToken(env);
        const sheetId = env.GOOGLE_SHEET_ID;
        const recordsTab = env.RECORDS_TAB || 'Records';

        const result = await sheetsRead(accessToken, sheetId, recordsTab);
        const allRows = result.values || [];

        if (allRows.length === 0) {
          return new Response(
            JSON.stringify({ success: true, data: { headers: [], rows: [], totalRows: 0 } }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const headers = allRows[0];
        const rows = allRows.slice(1);

        return new Response(
          JSON.stringify({ success: true, data: { headers, rows, totalRows: rows.length } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Sheets read error:', error);
        return sheetsErrorResponse(error, corsHeaders);
      }
    }

    if (url.pathname === '/api/sheets/update-request' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { originalRowNumber, requestedBy, description } = body;

        if (!originalRowNumber || !requestedBy || !description) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing required fields: originalRowNumber, requestedBy, description' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const accessToken = await getGoogleAccessToken(env);
        const sheetId = env.GOOGLE_SHEET_ID;
        const updateRequestsTab = env.UPDATE_REQUESTS_TAB || 'Update Requests';

        const timestamp = new Date().toISOString();
        const requestRow = [timestamp, originalRowNumber, requestedBy, description, 'Pending', '', ''];

        const appendResult = await sheetsAppend(accessToken, sheetId, updateRequestsTab, [requestRow]);
        const updatedRange = appendResult.updates?.updatedRange || '';
        const rowMatch = updatedRange.match(/(\d+)$/);
        const requestId = rowMatch ? parseInt(rowMatch[1], 10) : null;

        return new Response(
          JSON.stringify({ success: true, data: { requestId } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Update request error:', error);
        return sheetsErrorResponse(error, corsHeaders);
      }
    }

    if (url.pathname === '/api/sheets/update-requests' && request.method === 'GET') {
      try {
        const accessToken = await getGoogleAccessToken(env);
        const sheetId = env.GOOGLE_SHEET_ID;
        const updateRequestsTab = env.UPDATE_REQUESTS_TAB || 'Update Requests';

        const result = await sheetsRead(accessToken, sheetId, updateRequestsTab);
        const allRows = result.values || [];
        const dataRows = allRows.slice(1);

        const requests = dataRows.map((row, idx) => ({
          row: idx + 2,
          timestamp: row[0] || '',
          originalRow: row[1] ? parseInt(row[1], 10) : null,
          requestedBy: row[2] || '',
          description: row[3] || '',
          status: row[4] || 'Pending',
        }));

        return new Response(
          JSON.stringify({ success: true, data: { requests } }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Fetch update requests error:', error);
        return sheetsErrorResponse(error, corsHeaders);
      }
    }

    if (url.pathname === '/api/health' && request.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          hasAnthropicKey: !!(env.ANTHROPIC_API_KEY),
          hasSheetId: !!(env.GOOGLE_SHEET_ID),
          hasServiceAccount: !!(env.GOOGLE_SERVICE_ACCOUNT_JSON),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
