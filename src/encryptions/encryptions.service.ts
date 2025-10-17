import { Injectable } from '@nestjs/common';

import * as CryptoJS from 'crypto-js';
import { ConfigService } from '../config/config.service';
@Injectable()
export class EncryptionsService {

  private password: string;
  constructor(private readonly cfg: ConfigService) {
    this.password =
      this.cfg.getConfig().API_GATEWAY?.ENCRYPTION_PASSWORD.trim() ??
      'IkIopwlWorpqUj';

  }
  encrypt(plainText: string): string {
    const parsedKey = CryptoJS.SHA256(this.password);
    const parsedIV = CryptoJS.MD5(this.password);
    const messageUtf8 = CryptoJS.enc.Utf8.parse(plainText);

    const encrypted = CryptoJS.AES.encrypt(messageUtf8, parsedKey, {
      iv: parsedIV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted?.ciphertext?.toString(CryptoJS.enc.Base64);
  }

  decrypt(encryptedText: string): string {
    const parsedKey = CryptoJS.SHA256(this.password);
    const parsedIV = CryptoJS.MD5(this.password);
    const decrypted = CryptoJS.AES.decrypt(encryptedText, parsedKey, {
      iv: parsedIV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}
