import express from "express";
import { z } from "zod";
import { Prisma } from "../db/prisma-client";

const router = express.Router();

const BanUserSchema = z.object({
  id: z.number(),
});

router.post("/:id", async (req, res) => {
  const result = BanUserSchema.safeParse(req.params);
  if (!result.success) throw new Error("Invalid request params");
  const id = result.data.id;

  const user = await Prisma.client.user.update({
    where: { id },
    data: { version: { increment: 1 }, allowed: false },
  });

  if (!user) {
    res.status(404).send({ success: false, message: "User doesn't exist." });
    return;
  }

  res.status(200).send({ success: true });
});

export default router;
