import { Buffer } from 'buffer';

// Encryption Configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const TAG_LENGTH = 128;

export interface EncryptionKey {
  key: CryptoKey;
  id: string;
  createdAt: string;
  expiresAt?: string;
}

export interface EncryptedData {
  data: ArrayBuffer;
  iv: Uint8Array;
  tag: ArrayBuffer;
  keyId: string;
}

export interface DecryptionResult {
  data: ArrayBuffer;
  keyId: string;
}

class EncryptionService {
  private keyStore: Map<string, EncryptionKey> = new Map();
  private masterKey: CryptoKey | null = null;

  constructor() {
    this.initializeMasterKey();
  }

  private async initializeMasterKey(): Promise<void> {
    try {
      // In production, this would be stored securely and retrieved from a key management service
      const masterKeyMaterial = await this.generateRandomBytes(32);
      this.masterKey = await crypto.subtle.importKey(
        'raw',
        masterKeyMaterial,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
    } catch (error) {
      console.error('Failed to initialize master key:', error);
      throw new Error('Encryption service initialization failed');
    }
  }

  private async generateRandomBytes(length: number): Promise<Uint8Array> {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  private async generateKeyId(): Promise<string> {
    const randomBytes = await this.generateRandomBytes(16);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  async generateEncryptionKey(): Promise<EncryptionKey> {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    const keyId = await this.generateKeyId();
    const salt = await this.generateRandomBytes(16);
    
    // Derive encryption key from master key
    const encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      this.masterKey,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );

    const key: EncryptionKey = {
      key: encryptionKey,
      id: keyId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    };

    this.keyStore.set(keyId, key);
    return key;
  }

  async encryptFile(file: File, keyId?: string): Promise<{
    encryptedData: EncryptedData;
    originalName: string;
    originalSize: number;
    mimeType: string;
  }> {
    let encryptionKey: EncryptionKey;

    if (keyId && this.keyStore.has(keyId)) {
      encryptionKey = this.keyStore.get(keyId)!;
    } else {
      encryptionKey = await this.generateEncryptionKey();
    }

    // Read file data
    const fileBuffer = await file.arrayBuffer();
    
    // Generate IV
    const iv = await this.generateRandomBytes(IV_LENGTH);

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH
      },
      encryptionKey.key,
      fileBuffer
    );

    // Split encrypted data and tag
    const tag = encryptedBuffer.slice(-TAG_LENGTH);
    const data = encryptedBuffer.slice(0, -TAG_LENGTH);

    const encryptedData: EncryptedData = {
      data,
      iv,
      tag,
      keyId: encryptionKey.id
    };

    return {
      encryptedData,
      originalName: file.name,
      originalSize: file.size,
      mimeType: file.type
    };
  }

  async decryptFile(encryptedData: EncryptedData): Promise<ArrayBuffer> {
    const encryptionKey = this.keyStore.get(encryptedData.keyId);
    if (!encryptionKey) {
      throw new Error(`Encryption key not found: ${encryptedData.keyId}`);
    }

    // Combine data and tag
    const combinedData = new Uint8Array(encryptedData.data.byteLength + encryptedData.tag.byteLength);
    combinedData.set(new Uint8Array(encryptedData.data), 0);
    combinedData.set(new Uint8Array(encryptedData.tag), encryptedData.data.byteLength);

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: encryptedData.iv,
        tagLength: TAG_LENGTH
      },
      encryptionKey.key,
      combinedData
    );

    return decryptedBuffer;
  }

  async encryptText(text: string, keyId?: string): Promise<EncryptedData> {
    let encryptionKey: EncryptionKey;

    if (keyId && this.keyStore.has(keyId)) {
      encryptionKey = this.keyStore.get(keyId)!;
    } else {
      encryptionKey = await this.generateEncryptionKey();
    }

    const textEncoder = new TextEncoder();
    const textBuffer = textEncoder.encode(text);
    
    const iv = await this.generateRandomBytes(IV_LENGTH);

    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv,
        tagLength: TAG_LENGTH
      },
      encryptionKey.key,
      textBuffer
    );

    const tag = encryptedBuffer.slice(-TAG_LENGTH);
    const data = encryptedBuffer.slice(0, -TAG_LENGTH);

    return {
      data,
      iv,
      tag,
      keyId: encryptionKey.id
    };
  }

  async decryptText(encryptedData: EncryptedData): Promise<string> {
    const decryptedBuffer = await this.decryptFile(encryptedData);
    const textDecoder = new TextDecoder();
    return textDecoder.decode(decryptedBuffer);
  }

  async generateFileChecksum(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyFileIntegrity(file: File, expectedChecksum: string): Promise<boolean> {
    const actualChecksum = await this.generateFileChecksum(file);
    return actualChecksum === expectedChecksum;
  }

  // Key Management
  async rotateKey(oldKeyId: string): Promise<string> {
    const oldKey = this.keyStore.get(oldKeyId);
    if (!oldKey) {
      throw new Error(`Key not found: ${oldKeyId}`);
    }

    const newKey = await this.generateEncryptionKey();
    
    // In a real implementation, you would re-encrypt all data with the new key
    // For now, we'll just mark the old key as expired
    oldKey.expiresAt = new Date().toISOString();
    
    return newKey.id;
  }

  async revokeKey(keyId: string): Promise<void> {
    const key = this.keyStore.get(keyId);
    if (key) {
      key.expiresAt = new Date().toISOString();
    }
  }

  getActiveKeys(): EncryptionKey[] {
    const now = new Date().toISOString();
    return Array.from(this.keyStore.values()).filter(key => 
      !key.expiresAt || key.expiresAt > now
    );
  }

  // Secure Storage
  async exportKeyForBackup(keyId: string, password: string): Promise<string> {
    const key = this.keyStore.get(keyId);
    if (!key) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Export the key material
    const exportedKey = await crypto.subtle.exportKey('raw', key.key);
    
    // Encrypt the exported key with the password
    const salt = await this.generateRandomBytes(16);
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']),
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const iv = await this.generateRandomBytes(12);
    const encryptedKey = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      exportedKey
    );

    // Combine salt, iv, and encrypted key
    const combined = new Uint8Array(salt.length + iv.length + encryptedKey.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedKey), salt.length + iv.length);

    return Buffer.from(combined).toString('base64');
  }

  async importKeyFromBackup(backupData: string, password: string): Promise<string> {
    const combined = Buffer.from(backupData, 'base64');
    
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedKey = combined.slice(28);

    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedKey = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      derivedKey,
      encryptedKey
    );

    const importedKey = await crypto.subtle.importKey(
      'raw',
      decryptedKey,
      { name: ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );

    const keyId = await this.generateKeyId();
    const key: EncryptionKey = {
      key: importedKey,
      id: keyId,
      createdAt: new Date().toISOString()
    };

    this.keyStore.set(keyId, key);
    return keyId;
  }

  // Utility Methods
  async generateSecurePassword(length: number = 32): Promise<string> {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const randomBytes = await this.generateRandomBytes(length);
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }
    
    return password;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await this.generateRandomBytes(16);
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    
    return Buffer.from(salt).toString('base64') + ':' + 
           hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const [saltB64, hashHex] = hashedPassword.split(':');
    const salt = Buffer.from(saltB64, 'base64');
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    
    const hash = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const computedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return computedHash === hashHex;
  }

  // Cleanup
  cleanup(): void {
    this.keyStore.clear();
    this.masterKey = null;
  }
}

// Create singleton instance
export const encryptionService = new EncryptionService();

// Export for testing
export { EncryptionService }; 