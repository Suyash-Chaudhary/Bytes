import express from "express";
import { z } from "zod";
import { AuthUtils } from "../utils/auth";
import { Prisma } from "../db/prisma-client";

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const router = express.Router();

router.post("/", async (req, res) => {
  // Validate body.
  const result = SignInSchema.safeParse(req.body);
  if (!result.success) throw new Error("Invalid body");
  const data = result.data;

  // Check if user exists.
  const user = await Prisma.client.user.findUnique({
    where: { email: data.email },
  });
  if (!user) throw new Error("User not registered");

  // Check if user can login.
  if (!user.allowed) throw new Error("User unauthorized");

  // Create access & refresh tokens.
  const accessToken = await AuthUtils.generateAccessToken({ id: user.id });
  const refreshToken = await AuthUtils.generateRefreshToken({
    id: user.id,
    version: user.version,
  });

  // Set user's cookie.
  AuthUtils.setTokensInCookie(res, accessToken, refreshToken);

  // Return response with the tokens.
  res.status(200).send({ success: true, accessToken, refreshToken });
});

export default router;
