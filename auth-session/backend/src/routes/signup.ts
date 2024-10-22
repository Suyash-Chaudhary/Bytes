import express from "express";
import { z } from "zod";
import { EncryptionUtils } from "../utils/encryption-utils";
import { Prisma } from "../clients/prisma/prisma-client";
import { AuthUtils } from "../utils/auth-utils";

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const router = express.Router();

router.post("/signup", async (req, res) => {
  // Validate body.
  const result = SignUpSchema.safeParse(req.body);
  if (!result.success) throw new Error("Invalid body");
  const data = result.data;

  // Check if user exists.
  if (await Prisma.client.user.findFirst({ where: { email: data.email } })) {
    res.status(400).send({ success: false, message: "User already exists" });
    return;
  }

  // Create user record.
  const user = await Prisma.client.user.create({
    data: {
      email: data.email,
      password: await EncryptionUtils.toHash(data.password),
    },
  });

  // Create new session for the user.
  const token = await AuthUtils.createSession(user.id, { id: user.id });

  // Set the sessionId in the cookie.
  AuthUtils.setSessionCookie(res, token);

  // Return response with the tokens.
  res.status(201).send({ success: true, user });
});

export default router;
