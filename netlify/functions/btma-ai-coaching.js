// netlify/functions/btma-ai-coaching.js
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
        body: JSON.stringify({ ok: false, error: "Missing env vars" }),
      };
    }

    const payload = { fn: "aiCoaching", source: "meal_gen", token: BTMA_TOKEN };

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
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err) }) };
  }
};
