import express from "express";
import { z } from "zod";
import { Prisma } from "../clients/prisma/prisma-client";
import { AuthUtils } from "../utils/auth-utils";

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

  // Create new session for the user.
  const token = await AuthUtils.createSession(user.id, { id: user.id });

  // Set the sessionId in the cookie.
  AuthUtils.setSessionCookie(res, token);

  // Return response with the tokens.
  res.status(200).send({ success: true, user });
});

export default router;
