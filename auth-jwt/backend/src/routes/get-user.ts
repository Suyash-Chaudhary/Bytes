import express from "express";
import { Prisma } from "../db/prisma-client";
import { authMiddleware } from "../middlewares/auth";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  if (!req.userId) throw new Error("Unautorized access");

  const user = await Prisma.client.user.findUnique({
    where: { id: req.userId },
  });

  if (!user) throw new Error("User doesn't exist");

  res.status(200).send({ success: true, user });
});

export default router;
