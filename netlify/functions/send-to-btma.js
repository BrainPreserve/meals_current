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

    // The page may send either recipes_html (current index.html) OR meals_html (older name).
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (_) {}

    const recipesHtml = String(body.recipes_html || "");
    const mealsHtmlIn = String(body.meals_html || "");
    const tablesHtml  = String(body.tables_html || "");
    const recipeCount = String(body.recipe_count || "");

    const payload = {
      fn: "savesignals",
      client_id: String(body.client_id || "demo"),    // UI doesn’t show this; “demo” is fine
      source: String(body.source_app || "meal_gen"),
      timestamp_iso: new Date().toISOString(),
      signals: [], // reserved (not used here)

      // Map recipes_html -> meals_html for BTMA context
      context: {
        meals_html:  mealsHtmlIn || recipesHtml,      // accept BOTH names safely
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

    let text = await resp.text();
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
