/* Encrypt the exam bank for the paid subscription (owner, 28 Nov 2026).
   The full question bank never enters the public repo as plain text: pipeline.py writes build/data.json (git-ignored);
   this script encrypts it with AES-256-GCM into ../js/data.enc (committed), using the key in build/exam.key (git-ignored,
   kept by the owner and stored in Supabase exam_cfg). A subscriber's app gets the key from the platform and decrypts in the
   browser with WebCrypto. It also writes ../js/data.sample.js (committed): a small free preview shown before subscribing.
   File layout of data.enc:  iv(12 bytes) || ciphertext || gcm-tag(16 bytes).
   Run:  node build/encrypt.js      (after python3 build/pipeline.py). */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const HERE = __dirname;
const keyFile = path.join(HERE, 'exam.key');
if (!fs.existsSync(keyFile)) { console.error('missing build/exam.key — generate one: python3 -c "import os,base64;print(base64.b64encode(os.urandom(32)).decode())" > build/exam.key'); process.exit(1); }
const key = Buffer.from(fs.readFileSync(keyFile, 'utf8').trim(), 'base64');
if (key.length !== 32) { console.error('exam.key must be 32 bytes base64'); process.exit(1); }
const plain = fs.readFileSync(path.join(HERE, 'data.json'));           // the EXAM JSON (no "window.EXAM=" wrapper)

const iv = crypto.randomBytes(12);
const cph = crypto.createCipheriv('aes-256-gcm', key, iv);
const ct = Buffer.concat([cph.update(plain), cph.final()]);
const tag = cph.getAuthTag();
const out = Buffer.concat([iv, ct, tag]);
fs.writeFileSync(path.join(HERE, '..', 'js', 'data.enc'), out);
console.log('wrote js/data.enc', out.length, 'bytes (plain', plain.length + ')');

/* free preview: a spread of real questions so a student can try before paying. Keeps the app usable while locked. */
const data = JSON.parse(plain.toString('utf8'));
const qs = data.questions || [];
const N = 20, step = Math.max(1, Math.floor(qs.length / N));
const pick = [];
for (let i = 0; i < qs.length && pick.length < N; i += step) { const q = qs[i]; if (q && q.q && (q.o || q.options)) pick.push(q); }
const sample = { sample: true, total: data.total || qs.length, questions: pick, subjects: data.subjects || [] };
fs.writeFileSync(path.join(HERE, '..', 'js', 'data.sample.js'), 'window.EXAM_SAMPLE=' + JSON.stringify(sample) + ';');
console.log('wrote js/data.sample.js', pick.length, 'preview questions');
