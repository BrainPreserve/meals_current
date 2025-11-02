// netlify/functions/send-to-btma.js
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const BTMA_EXEC_URL = process.env.BTMA_EXEC_URL;
    const BTMA_TOKEN    = process.env.BTMA_TOKEN;

    if (!BTMA_EXEC_URL || !BTMA_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: "Missing BTMA_EXEC_URL or BTMA_TOKEN env var" }),
      };
    }

    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (_) {}

    // Accept BOTH names: recipes_html (from your page) OR meals_html
    const recipesHtml = String(body.recipes_html || "");
    const mealsHtmlIn = String(body.meals_html || "");
    const tablesHtml  = String(body.tables_html || "");
    const recipeCount = String(body.recipe_count || "");
    const clientId    = String(body.client_id || "demo");   // BTMA UI doesn’t need to show this
    const sourceApp   = String(body.source_app || "meal_gen");

    const payload = {
      fn: "savesignals",
      client_id: clientId,
      source: sourceApp,
      timestamp_iso: new Date().toISOString(),

      // Reserved signals array (optional)
      signals: [],

      // Unified context block for BTMA
      context: {
        meals_html:  mealsHtmlIn || recipesHtml,  // prefer meals_html; fallback to recipes_html
        tables_html: tablesHtml,
        recipe_count: recipeCount
      },

      token: BTMA_TOKEN
    };

    const resp = await fetch(BTMA_EXEC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }

    return {
      statusCode: resp.status,
      body: JSON.stringify(json),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err) }) };
  }
};
