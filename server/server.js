// Minimal server to persist cases.json for PT EMR Simulator
// Endpoints:
//   GET  /cases  -> returns the full cases map from app/data/cases.json
//   PUT  /cases  -> replaces cases.json with provided JSON body (object keyed by id)

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5173;
const ROOT = path.resolve(__dirname, '..');
const CASES_PATH = path.join(ROOT, 'app', 'data', 'cases.json');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Health
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Read cases.json
app.get('/cases', (_req, res) => {
  try {
    if (!fs.existsSync(CASES_PATH)) {
      return res.status(200).json({});
    }
    const raw = fs.readFileSync(CASES_PATH, 'utf8');
    const data = raw ? JSON.parse(raw) : {};
    return res.json(data);
  } catch (err) {
    console.error('Failed to read cases.json', err);
    return res.status(500).json({ error: 'Failed to read cases.json' });
  }
});

// Replace cases.json
app.put('/cases', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Body must be an object keyed by case id' });
    }
    fs.mkdirSync(path.dirname(CASES_PATH), { recursive: true });
    fs.writeFileSync(CASES_PATH, JSON.stringify(body, null, 2), 'utf8');
    return res.json({ ok: true });
  } catch (err) {
    console.error('Failed to write cases.json', err);
    return res.status(500).json({ error: 'Failed to write cases.json' });
  }
});

app.listen(PORT, () => {

});
