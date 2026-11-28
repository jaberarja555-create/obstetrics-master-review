#!/usr/bin/env python3
"""Move the Permanent Exam key into Supabase without anyone seeing it (28 Nov 2026).

The repository is public, so the key (32 bytes, AES-256-GCM, see ishrah/exam/BUILD.md) can never be committed. Instead:
  * The deploy workflow derives a private X25519 key from the ISHRAH_DB_URL secret (HMAC-SHA256 with a fixed label). Only a run that
    holds that secret can know it. `pub` prints its PUBLIC half (safe to show).
  * Whoever built js/data.enc wraps the exam key with that public key (`wrap`, ephemeral X25519 + HKDF-SHA256 + AES-256-GCM) and
    commits ishrah/exam/build/key.wrap.json. The file is useless without the secret.
  * The workflow runs `store`: unwraps it and writes exam_cfg (id 1). It prints only "stored" and a short fingerprint, never the key.

  python3 tools/ishrah/exam_key_transport.py pub            (workflow: env DB)
  python3 tools/ishrah/exam_key_transport.py wrap <pub> <keyfile>   (builder: writes ishrah/exam/build/key.wrap.json)
  python3 tools/ishrah/exam_key_transport.py store          (workflow: env DB; uses psql)
"""
import base64, hashlib, hmac, json, os, subprocess, sys
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes, serialization

HERE = os.path.dirname(os.path.abspath(__file__))
WRAP = os.path.join(HERE, '..', '..', 'ishrah', 'exam', 'build', 'key.wrap.json')
LABEL = b'smra-permanent-exam-key-transport-v1'
RAW = serialization.Encoding.Raw, serialization.PublicFormat.Raw

def db():
    v = os.environ.get('DB', '')
    v = ''.join(ch for ch in v if ch not in '\r\n\t `"\'<>')
    if not v: sys.exit('DB secret missing')
    return v

def priv():
    return X25519PrivateKey.from_private_bytes(hmac.new(db().encode(), LABEL, hashlib.sha256).digest())

def kek(shared, eph_pub, pub):
    return HKDF(algorithm=hashes.SHA256(), length=32, salt=eph_pub + pub, info=LABEL).derive(shared)

def fingerprint(k):
    return hashlib.sha256(k).hexdigest()[:12]

cmd = sys.argv[1] if len(sys.argv) > 1 else ''
if cmd == 'pub':
    print('exam key transport public key: ' + base64.b64encode(priv().public_key().public_bytes(*RAW)).decode())
elif cmd == 'wrap':
    pub = base64.b64decode(sys.argv[2]); key = base64.b64decode(open(sys.argv[3]).read().strip())
    assert len(pub) == 32 and len(key) == 32
    eph = X25519PrivateKey.generate(); eph_pub = eph.public_key().public_bytes(*RAW)
    shared = eph.exchange(X25519PublicKey.from_public_bytes(pub))
    iv = os.urandom(12); ct = AESGCM(kek(shared, eph_pub, pub)).encrypt(iv, key, LABEL)
    json.dump({'v': 1, 'pub': base64.b64encode(pub).decode(), 'eph': base64.b64encode(eph_pub).decode(),
               'iv': base64.b64encode(iv).decode(), 'ct': base64.b64encode(ct).decode(), 'fp': fingerprint(key)}, open(WRAP, 'w'), indent=1)
    print('wrote', WRAP, 'key fingerprint', fingerprint(key))
elif cmd == 'store':
    if not os.path.exists(WRAP): print('no key.wrap.json: nothing to store'); sys.exit(0)
    w = json.load(open(WRAP)); p = priv(); pub = p.public_key().public_bytes(*RAW)
    if base64.b64decode(w['pub']) != pub: sys.exit('key.wrap.json was made for another transport key')
    eph_pub = base64.b64decode(w['eph'])
    key = AESGCM(kek(p.exchange(X25519PublicKey.from_public_bytes(eph_pub)), eph_pub, pub)).decrypt(base64.b64decode(w['iv']), base64.b64decode(w['ct']), LABEL)
    k = base64.b64encode(key).decode()
    sql = "insert into public.exam_cfg (id, k) values (1, :'k') on conflict (id) do update set k = excluded.k where public.exam_cfg.k is distinct from excluded.k;"
    r = subprocess.run(['psql', db(), '-v', 'ON_ERROR_STOP=1', '-q', '-v', 'k=' + k], input=sql, text=True, capture_output=True)
    if r.returncode: sys.exit('store failed: ' + (r.stderr or '').replace(k, '***')[:300])
    print('permanent exam key stored (fingerprint ' + fingerprint(key) + ')')
else:
    sys.exit(__doc__)
