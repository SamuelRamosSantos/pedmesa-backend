import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export class HashService {
  static hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }

  static compare(plainText: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plainText, hash);
  }
}
