import express from "express";
import { authMiddleware } from "../middlewares/auth";
import { AuthUtils } from "../utils/auth";
import { Prisma } from "../db/prisma-client";
const router = express.Router();

router.post("/logout-devices", authMiddleware, async (req, res) => {
  if (!req.userId) {
    res.status(401).send({ success: false });
    return;
  }

  // Increment the user's refresh token version.
  const user = await Prisma.client.user.update({
    where: { id: req.userId },
    data: { version: { increment: 1 } },
  });
  if (!user) throw new Error("User doesn't exist");

  // Clear the tokens from cookie.
  AuthUtils.clearTokens(res);

  res.status(200).send({ success: true });
});

export default router;
