const crypto = require('crypto');

// Secret key for AES-256-GCM encryption (32 bytes)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || 'sungo_zeno_solar_secret_key_32b!';
const ALGORITHM = 'aes-256-gcm';

/**
 * 1. One-way Password Hashing (PBKDF2 with SHA-512 & 16-byte random salt)
 * Dùng cho mật khẩu Zeno Cloud (Zero-Knowledge, không thể giải mã ngược lại).
 */
function hashPassword(password) {
  if (!password) return '';
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(String(password), salt, iterations, 64, 'sha512').toString('hex');
  return `pbkdf2$${iterations}$${salt}$${hash}`;
}

/**
 * 2. Safe Password Verification (Timing-safe comparison)
 * Tương thích ngược: kiểm tra hash PBKDF2 an toàn, fallback cho mật khẩu cũ.
 */
function verifyPassword(password, storedHashOrPlain) {
  if (!password || !storedHashOrPlain) return false;
  const inputStr = String(password);
  const storedStr = String(storedHashOrPlain);

  if (storedStr.startsWith('pbkdf2$')) {
    const parts = storedStr.split('$');
    if (parts.length !== 4) return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];
    const hash = crypto.pbkdf2Sync(inputStr, salt, iterations, 64, 'sha512').toString('hex');
    try {
      const a = Buffer.from(hash, 'hex');
      const b = Buffer.from(originalHash, 'hex');
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    } catch (e) {
      return false;
    }
  }

  // Tương thích ngược với plain string cũ
  return inputStr === storedStr;
}

/**
 * 3. Reversible AES-256-GCM Encryption
 * Dùng cho Mật khẩu Hãng (Chỉ Backend giải mã khi cần ủy quyền gọi API lên solar.siseli.com).
 */
function encryptSecret(text) {
  if (!text) return '';
  const str = String(text);
  if (str.startsWith('enc$gcm$')) return str; // Đã mã hóa

  const key = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(str, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');

  return `enc$gcm$${iv.toString('hex')}$${tag}$${encrypted}`;
}

/**
 * 4. AES-256-GCM Decryption (Chỉ Backend proxy gọi API hãng)
 */
function decryptSecret(encryptedText) {
  if (!encryptedText) return '';
  const str = String(encryptedText);
  if (!str.startsWith('enc$gcm$')) {
    return str; // Plaintext cũ
  }

  try {
    const parts = str.split('$');
    if (parts.length !== 5) return str;
    const iv = Buffer.from(parts[2], 'hex');
    const tag = Buffer.from(parts[3], 'hex');
    const encrypted = parts[4];

    const key = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.warn('[Security Helper] Giải mã secret thất bại:', err.message);
    return str;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  encryptSecret,
  decryptSecret
};
