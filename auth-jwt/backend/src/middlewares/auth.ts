import { Request, Response, NextFunction } from "express";
import { AuthUtils } from "../utils/auth";
import { TokenExpiredError } from "jsonwebtoken";
import { withError } from "../utils/with-error";

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get tokens from cookie or headers.
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // Stop if no accessToken is provided.
    if (!accessToken) return next();

    // Verify access token & only process token expiry errors.
    const [error, authPayload] = (await withError(
      AuthUtils.verifyToken(accessToken),
      [TokenExpiredError]
    )) as [TokenExpiredError | undefined, { id: number }];

    // If access token is valid,
    if (!error) {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: authPayload.id as number },
      });
      req.userId = user.id;
      return next();
    }

    // If access token has expired, try to use refresh token.
    const refreshPayload = (await AuthUtils.verifyToken(refreshToken)) as {
      id: number;
      version: number;
    };

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: refreshPayload.id },
    });

    if (!user.allowed) {
      throw new Error("Unauthorized user.");
    }

    if (user.version !== refreshPayload.version) {
      throw new Error("Invalid token.");
    }

    req.userId = user.id;

    const newAccessToken = await AuthUtils.generateAccessToken({
      id: user.id,
    });
    const newRefreshToken = await AuthUtils.generateRefreshToken({
      id: user.id,
      version: user.version,
    });
    AuthUtils.setTokensInCookie(res, newAccessToken, newRefreshToken);
  } catch (error) {
    // Any other errors in tokens are treated as dangerous & tokens are cleared.
    AuthUtils.clearTokens(res);
    console.log({ error });
    return next();
  }
};

export { authMiddleware };
