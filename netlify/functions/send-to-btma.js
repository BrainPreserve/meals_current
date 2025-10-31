// netlify/functions/send-to-btma.js
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const BTMA_EXEC_URL = process.env.BTMA_EXEC_URL;
    const BTMA_TOKEN = process.env.BTMA_TOKEN;

    if (!BTMA_EXEC_URL || !BTMA_TOKEN) {
      return {
        statusCode: 500,
        body: JSON.stringify({ ok: false, error: "Missing BTMA_EXEC_URL or BTMA_TOKEN env var" }),
      };
    }

    const incoming = JSON.parse(event.body || "{}");

    // CALL the new BTMA endpoint that writes into signals_log (your exact schema)
    const payload = {
      fn: "saveSignals_MGA",
      token: BTMA_TOKEN,
      recipes_html: incoming.recipes_html || "",
      tables_html:  incoming.tables_html  || "",
      recipe_count: incoming.recipe_count || 1,
      // user_id/session_id: include later if/when you add auth/session to MGA
      user_id:     incoming.user_id || "",
      session_id:  incoming.session_id || ""
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
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:String(err) }) };
  }
};
