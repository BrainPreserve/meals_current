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

    // Body is provided by client-side JS in index.html
    // Expected shape:
    // {
    //   client_id: "demo-client-001",
    //   meals_html: "<div>...</div>",
    //   tables_html: "<div>...</div>",
    //   recipe_count: 2,
    //   source_app: "meal_gen"
    // }
    let body = {};
    try { body = JSON.parse(event.body || "{}"); } catch (_) {}

    const payload = {
      fn: "savesignals",
      client_id: String(body.client_id || "demo"),
      source: String(body.source_app || "meal_gen"),
      timestamp_iso: new Date().toISOString(),
      signals: [], // reserved (not used here)
      context: {
        meals_html:  String(body.meals_html  || ""),
        tables_html: String(body.tables_html || ""),
        recipe_count: String(body.recipe_count || "")
      },
      token: BTMA_TOKEN
    };

    const resp = await fetch(BTMA_EXEC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));

    return {
      statusCode: resp.status,
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err) }) };
  }
};
