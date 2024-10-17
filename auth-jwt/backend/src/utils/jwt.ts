import jwt from "jsonwebtoken";

export class JWTUtils {
  static async generateAccessToken(payload: any) {
    return jwt.sign(payload, process.env.JWT_KEY!, {
      expiresIn: "10s",
    });
  }

  static async generateRefreshToken(payload: any) {
    return jwt.sign(payload, process.env.JWT_KEY!, {
      expiresIn: "30d",
    });
  }

  static async verify(token: string) {
    return jwt.verify(token, process.env.JWT_KEY!);
  }
}
