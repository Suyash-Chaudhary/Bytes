import { scrypt, randomBytes } from "crypto";

const scryptAsync = (
  password: string,
  salt: string,
  keylen: number
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, (err, derivedKey) => {
      if (err != null) reject(err);
      resolve(derivedKey);
    });
  });
};

export class EncryptionUtils {
  static async toHash(password: string) {
    const salt = randomBytes(8).toString("hex");
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString()}.${salt}`;
  }

  static async compare(hashed: string, str: string) {
    const [hash, salt] = hashed.split(".");
    const buf = await scryptAsync(str, salt, 64);
    return hash === buf.toString();
  }
}
