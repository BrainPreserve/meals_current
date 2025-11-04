const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fetch = require('node-fetch');

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

async function openaiChat(messages) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-5-thinking', temperature: 0.1, messages })
  });
  if (!r.ok) throw new Error(`OpenAI ${r.status}`);
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const { client_id } = JSON.parse(event.body || '{}');
    if (!client_id) return { statusCode: 400, body: 'Missing client_id' };

    const db = fb();
    const [bioSnap, mgaSnap] = await Promise.all([
      db.collection('clients').doc(client_id).collection('mirrors').doc('biomarkers').get(),
      db.collection('clients').doc(client_id).collection('apps').doc('mga').get(),
    ]);

    const biomarkers = bioSnap.exists ? bioSnap.data().data : {};
    const mga = mgaSnap.exists ? mgaSnap.data() : {};
    const biomarkerText = Object.entries(biomarkers).map(([k, v]) => `${k}: ${v}`).join('\n');

    const messages = [
      { role: 'system', content: 'You produce a technical, structured AI Analysis tying meals to cardiometabolic/brain-health biomarkers.' },
      { role: 'user', content: [
        `BIOMARKERS:\n${biomarkerText || '(none mirrored yet)'}`,
        `MGA_RECIPES_HTML:\n${mga.meals_html || ''}`,
        `MGA_NUTRITION_TABLES_HTML:\n${mga.tables_html || ''}`,
        'TASK: Provide sections: (1) Key Signals (2) Mechanistic Links (insulin, GV/TIR, BP var., HRV, inflammation, sleep) (3) Nutrient density/DII (4) Risks & Caveats (5) 7-day Optimization Anchors.'
      ].join('\n\n')}
    ];

    const text = await openaiChat(messages);
    return { statusCode: 200, body: JSON.stringify({ ok: true, text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};
