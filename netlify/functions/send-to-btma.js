// netlify/functions/send-to-btma.js — FULL REPLACEMENT
// Posts MGA context (meals_html, tables_html, recipe_count) to BTMA API doPost.
// Requires environment variables: BTMA_URL (exec URL), BTMA_TOKEN, CLIENT_ID (optional default).

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const body = JSON.parse(event.body || '{}');
    const meals_html = body.meals_html || '';
    const tables_html = body.tables_html || '';
    const recipe_count = body.recipe_count || '';

    const BTMA_URL = process.env.BTMA_URL; // e.g., https://script.google.com/macros/s/.../exec
    const BTMA_TOKEN = process.env.BTMA_TOKEN;
    const CLIENT_ID = body.client_id || process.env.CLIENT_ID || 'demo';

    if (!BTMA_URL || !BTMA_TOKEN) {
      return { statusCode: 500, body: JSON.stringify({ ok:false, error:'missing_env_BTMA_URL_or_TOKEN' }) };
    }

    const payload = {
      fn: 'savesignals',
      token: BTMA_TOKEN,
      client_id: CLIENT_ID,
      timestamp_iso: new Date().toISOString(),
      source_app: 'mga',
      context: { meals_html, tables_html, recipe_count }
    };

    const resp = await fetch(BTMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await resp.text();
    return { statusCode: resp.status, body: text };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:String(err) }) };
  }
};
