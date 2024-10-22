import express from "express";
import { z } from "zod";
import { Prisma } from "../clients/prisma/prisma-client";
import { AuthUtils } from "../utils/auth-utils";

const router = express.Router();

const BanUserSchema = z.object({
  id: z.number(),
});

router.post("/:id", async (req, res) => {
  const result = BanUserSchema.safeParse(req.params);
  if (!result.success) {
    res.status(400).send({ success: false });
    return;
  }

  await AuthUtils.removeAllSessions(result.data.id);
  const user = await Prisma.client.user.update({
    where: { id: result.data.id },
    data: { allowed: false },
  });

  if (!user) {
    res.status(404).send({ success: false });
    return;
  }

  res.status(200).send({ success: true });
});

export default router;
