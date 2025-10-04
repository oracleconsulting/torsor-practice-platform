// Simple encryption utility for credential management
// In production, this would use proper encryption libraries and secure key management

export class SecureVault {
  private encryptionKey: string;
  private practiceId: string;
  
  constructor(userKey: string, practiceId: string) {
    // Derive encryption key from user's master password
    this.encryptionKey = this.hashString(userKey);
    this.practiceId = practiceId;
  }
  
  private hashString(str: string): string {
    // Simple hash function - in production, use proper cryptographic hashing
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }
  
  private simpleEncrypt(text: string, key: string): string {
    // Simple XOR encryption - in production, use AES or similar
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode
  }
  
  private simpleDecrypt(encrypted: string, key: string): string {
    // Simple XOR decryption
    const text = atob(encrypted); // Base64 decode
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  }
  
  encryptCredential(password: string): string {
    return this.simpleEncrypt(password, this.encryptionKey);
  }
  
  decryptCredential(encrypted: string): string {
    return this.simpleDecrypt(encrypted, this.encryptionKey);
  }
  
  generateShareableLink(executorEmail: string, delay: number): string {
    // Create time-locked access token
    const payload = {
      email: executorEmail,
      validFrom: Date.now() + delay * 3600000, // hours to ms
      practiceId: this.practiceId,
      token: this.hashString(executorEmail + this.practiceId + Date.now())
    };
    
    // In production, this would be a proper JWT or similar
    return btoa(JSON.stringify(payload));
  }
  
  validateAccessToken(token: string): { valid: boolean; email?: string; practiceId?: string } {
    try {
      const payload = JSON.parse(atob(token));
      const now = Date.now();
      
      if (now < payload.validFrom) {
        return { valid: false };
      }
      
      if (payload.practiceId !== this.practiceId) {
        return { valid: false };
      }
      
      return { 
        valid: true, 
        email: payload.email, 
        practiceId: payload.practiceId 
      };
    } catch {
      return { valid: false };
    }
  }
  
  // Generate a secure password for new credentials
  generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }
  
  // Check password strength
  checkPasswordStrength(password: string): { score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');
    
    if (password.length >= 12) score += 1;
    
    return { score, feedback };
  }
}

// Export a factory function for creating vault instances
export const createSecureVault = (userKey: string, practiceId: string): SecureVault => {
  return new SecureVault(userKey, practiceId);
}; 