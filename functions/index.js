const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const OpenAI = require('openai');

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();
const OPENAI_API_KEY = defineSecret('OPENAI_API_KEY');

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

exports.parseBaseballImage = onRequest(
  { secrets: [OPENAI_API_KEY], cors: true, timeoutSeconds: 120, memory: '1GiB' },
  async (req, res) => {
    try {
      if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });

      const { mode, imageDataUrl } = req.body || {};
      if (!mode || !['game', 'career'].includes(mode)) return res.status(400).json({ ok: false, error: 'mode must be game|career' });
      if (!imageDataUrl || typeof imageDataUrl !== 'string' || !imageDataUrl.startsWith('data:image/')) {
        return res.status(400).json({ ok: false, error: 'imageDataUrl(data URL) required' });
      }

      const client = new OpenAI({ apiKey: OPENAI_API_KEY.value() });

      const schema = mode === 'game'
        ? {
            name: 'game_extract',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                date: { type: 'string' },
                opponent: { type: 'string' },
                venue: { type: 'string', enum: ['home', 'away'] },
                homeScore: { type: 'number' },
                awayScore: { type: 'number' },
                result: { type: 'string', enum: ['승', '패', '무'] }
              },
              required: ['date', 'opponent', 'venue', 'homeScore', 'awayScore', 'result']
            }
          }
        : {
            name: 'career_extract',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                name: { type: 'string' },
                uniformNumber: { type: 'number' },
                primaryRole: { type: 'string', enum: ['타자', '투수', '투타겸업'] },
                battingCareer: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    games: { type: 'number' },
                    atBats: { type: 'number' },
                    runs: { type: 'number' },
                    hits: { type: 'number' },
                    homeRuns: { type: 'number' },
                    rbi: { type: 'number' },
                    walks: { type: 'number' },
                    strikeouts: { type: 'number' },
                    steals: { type: 'number' },
                    errors: { type: 'number' }
                  },
                  required: ['games','atBats','runs','hits','homeRuns','rbi','walks','strikeouts','steals','errors']
                },
                pitchingCareer: {
                  type: 'object',
                  additionalProperties: false,
                  properties: {
                    games: { type: 'number' },
                    wins: { type: 'number' },
                    losses: { type: 'number' },
                    saves: { type: 'number' },
                    innings: { type: 'string' },
                    strikeouts: { type: 'number' },
                    runsAllowed: { type: 'number' },
                    earnedRuns: { type: 'number' },
                    hitsAllowed: { type: 'number' },
                    walksAllowed: { type: 'number' },
                    battersFaced: { type: 'number' }
                  },
                  required: ['games','wins','losses','saves','innings','strikeouts','runsAllowed','earnedRuns','hitsAllowed','walksAllowed','battersFaced']
                }
              },
              required: ['name','uniformNumber','primaryRole','battingCareer','pitchingCareer']
            }
          };

      const completion = await client.chat.completions.create({
        model: 'gpt-4.1-mini',
        response_format: { type: 'json_schema', json_schema: schema },
        messages: [
          { role: 'system', content: '야구 기록 추출기. 보이는 값만 추출하고 애매하면 0. 스키마 준수.' },
          {
            role: 'user',
            content: [
              { type: 'text', text: mode === 'game' ? '경기 결과를 추출해줘.' : '선수 통산 기록을 추출해줘.' },
              { type: 'image_url', image_url: { url: imageDataUrl } }
            ]
          }
        ]
      });

      const parsed = JSON.parse(completion?.choices?.[0]?.message?.content || '{}');

      if (mode === 'game') {
        const id = Date.now().toString();
        const date = String(parsed.date || new Date().toISOString().slice(0, 10));
        const opponent = String(parsed.opponent || '상대팀');
        const venue = parsed.venue === 'away' ? 'away' : 'home';
        const homeScore = n(parsed.homeScore);
        const awayScore = n(parsed.awayScore);
        const result = ['승', '패', '무'].includes(parsed.result) ? parsed.result : '무';

        const home = venue === 'home' ? '폴라리스' : opponent;
        const away = venue === 'home' ? opponent : '폴라리스';

        const gameDoc = { id, date, opponent, home, away, homeScore, awayScore, result, detail: null };
        await db.collection('polaris_games').doc(id).set(gameDoc);
        return res.json({ ok: true, mode, game: gameDoc });
      }

      return res.json({ ok: true, mode, draft: parsed });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ ok: false, error: err?.message || 'parse failed' });
    }
  }
);