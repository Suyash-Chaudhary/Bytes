import { v4 as uuidv4 } from "uuid";
import { RedisClient } from "../clients/redis/redis-client";
import jwt from "jsonwebtoken";
import { Response } from "express";

interface SessionPayload {
  sessionId: string;
}

interface AuthPayload {
  id: number;
}

export class AuthUtils {
  static async setSessionCookie(res: Response, token: string) {
    res.cookie("sessionToken", token);
  }

  static async clearSessionCookie(res: Response) {
    res.clearCookie("sessionToken");
  }

  static async createSession(userId: number, payload: AuthPayload) {
    const sessionId = uuidv4();
    await RedisClient.client()
      .multi()
      .set(`session:${sessionId}`, JSON.stringify(payload))
      .sAdd(`user:${userId}:sessions`, sessionId)
      .exec();

    const token = jwt.sign({ sessionId }, process.env.JWT_KEY!);
    return token;
  }

  static async verifyToken(token: string) {
    const payload = jwt.verify(token, process.env.JWT_KEY!) as SessionPayload;
    return payload;
  }

  static async getSession(sessionId: string) {
    const payload = await RedisClient.client().get(`session:${sessionId}`);
    if (!payload) throw new Error("Session not found.");
    return JSON.parse(payload) as AuthPayload;
  }

  static async removeSession(userId: number, sessionId: string) {
    await RedisClient.client()
      .multi()
      .del(`session:${sessionId}`)
      .sRem(`user:${userId}:sessions`, sessionId)
      .exec();
  }

  static async removeAllSessions(userId: number) {
    const sessions = await RedisClient.client().sMembers(
      `user:${userId}:sessions`
    );

    const multi = RedisClient.client().multi();
    sessions.forEach((sessionId) => {
      multi.del(`session:${sessionId}`);
    });

    multi.del(`user:${userId}:sessions`);
    await multi.exec();
  }
}
