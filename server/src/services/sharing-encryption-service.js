import crypto from 'crypto';
import { logger } from './logger.js';

const log = logger.child({ module: 'encryption-service' });

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

export function generateContentKey() {
  return crypto.randomBytes(KEY_LENGTH);
}

export function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_LENGTH, 'sha512');
}

export function encryptContent(plaintext, key) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: ALGORITHM
  };
}

export function decryptContent(encryptedData, key) {
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  
  return decrypted.toString('utf8');
}

export function encryptWithPassword(plaintext, password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(password, salt);
  const encrypted = encryptContent(plaintext, key);
  
  return {
    ...encrypted,
    salt: salt.toString('base64')
  };
}

export function decryptWithPassword(encryptedData, password) {
  const salt = Buffer.from(encryptedData.salt, 'base64');
  const key = deriveKey(password, salt);
  return decryptContent(encryptedData, key);
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 64, 'sha512');
  return `${salt.toString('base64')}:${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const computedHash = crypto.pbkdf2Sync(
    password,
    Buffer.from(salt, 'base64'),
    PBKDF2_ITERATIONS,
    64,
    'sha512'
  );
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'base64'),
    computedHash
  );
}

export function generateShareCode(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[randomBytes[i] % chars.length];
  }
  return code;
}

export function generateKeyPair() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
  return {
    publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    privateKey: privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64')
  };
}

export const encryptionService = {
  generateContentKey,
  deriveKey,
  encryptContent,
  decryptContent,
  encryptWithPassword,
  decryptWithPassword,
  hashPassword,
  verifyPassword,
  generateShareCode,
  generateKeyPair
};

export default encryptionService;
