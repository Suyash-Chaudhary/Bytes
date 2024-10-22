import express from "express";
import { Prisma } from "../clients/prisma/prisma-client";
import { authMiddleware } from "../middlewares/auth-middleware";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  if (!req.userId) {
    res.status(401).send({ success: false });
    return;
  }

  const user = await Prisma.client.user.findUnique({
    where: { id: req.userId },
  });
  if (!user) {
    res.status(404).send({ success: false });
    return;
  }

  res.status(200).send({ success: true, user });
});

export default router;
