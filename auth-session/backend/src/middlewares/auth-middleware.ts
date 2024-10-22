import { Request, Response, NextFunction } from "express";
import { AuthUtils } from "../utils/auth-utils";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sessionToken = req.cookies.sessionToken;
    if (!sessionToken) return next();

    const sessionPayload = await AuthUtils.verifyToken(sessionToken);
    const sessionData = await AuthUtils.getSession(sessionPayload.sessionId);

    req.userId = sessionData.id;
  } catch (error) {
    console.log("ERROR:", error);
    AuthUtils.clearSessionCookie(res);
  } finally {
    next();
  }
};
