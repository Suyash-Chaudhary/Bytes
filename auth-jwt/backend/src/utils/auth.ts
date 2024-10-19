import jwt from "jsonwebtoken";
import { Response } from "express";

export class AuthUtils {
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

  static async verifyToken(token: string) {
    return jwt.verify(token, process.env.JWT_KEY!);
  }

  static setTokensInCookie(
    res: Response,
    accessToken: string,
    refreshToken: string
  ) {
    // Set user's cookie.
    res.cookie("accessToken", accessToken);
    res.cookie("refreshToken", refreshToken);
  }

  static clearTokens(res: Response) {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
  }
}
