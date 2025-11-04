const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let app;
function fb() {
  if (!app) {
    app = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
  return getFirestore();
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const { client_id, meals_html, tables_html, recipe_count } = JSON.parse(event.body || '{}');
    if (!client_id) return { statusCode: 400, body: 'Missing client_id' };

    const db = fb();
    await db
      .collection('clients').doc(client_id)
      .collection('apps').doc('mga')
      .set({
        updated_at: new Date().toISOString(),
        meals_html: meals_html || '',
        tables_html: tables_html || '',
        recipe_count: typeof recipe_count === 'number' ? recipe_count : null,
      }, { merge: true });

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
