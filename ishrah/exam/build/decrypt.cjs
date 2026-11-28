/* Recover the plaintext question bank from the committed encrypted blob (owner, 28 Nov 2026).
   Another account that has the key (build/exam.key, or Supabase exam_cfg.k) but not the raw team sources can still get the
   full bank back: this writes build/data.json (the EXAM JSON) and js/data.js (the dev bundle) from js/data.enc.
   Run:  node build/decrypt.cjs */
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const HERE = __dirname;
const key = Buffer.from(fs.readFileSync(path.join(HERE, 'exam.key'), 'utf8').trim(), 'base64');
const buf = fs.readFileSync(path.join(HERE, '..', 'js', 'data.enc'));
const iv = buf.subarray(0, 12), tag = buf.subarray(buf.length - 16), ct = buf.subarray(12, buf.length - 16);
const dec = crypto.createDecipheriv('aes-256-gcm', key, iv); dec.setAuthTag(tag);
const plain = Buffer.concat([dec.update(ct), dec.final()]);
fs.writeFileSync(path.join(HERE, 'data.json'), plain);
fs.writeFileSync(path.join(HERE, '..', 'js', 'data.js'), 'window.EXAM=' + plain.toString('utf8') + ';');
console.log('recovered build/data.json and js/data.js —', JSON.parse(plain).questions.length, 'questions');
