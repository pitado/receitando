import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
    return `scrypt$${salt.toString('base64url')}$${derived.toString('base64url')}`;
  }

  async verify(password: string, encoded: string): Promise<boolean> {
    const [algorithm, saltValue, hashValue] = encoded.split('$');
    if (algorithm !== 'scrypt' || !saltValue || !hashValue) return false;

    try {
      const salt = Buffer.from(saltValue, 'base64url');
      const expected = Buffer.from(hashValue, 'base64url');
      const actual = (await scrypt(password, salt, expected.length)) as Buffer;
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }
}
