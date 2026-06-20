export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function generatePublisherKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify']
  );
}

export async function signContent(privateKey: CryptoKey, content: string): Promise<string> {
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(content)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function verifySignature(
  publicKey: CryptoKey,
  content: string,
  signatureBase64: string
): Promise<boolean> {
  const sigBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));
  return crypto.subtle.verify(
    { name: 'ECDSA', hash: 'SHA-256' },
    publicKey,
    sigBytes,
    new TextEncoder().encode(content)
  );
}

export async function exportKeyToJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}

export async function importPublicKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['verify']
  );
}

export async function importPrivateKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign']
  );
}

