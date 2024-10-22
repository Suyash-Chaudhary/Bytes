import express from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { AuthUtils } from "../utils/auth-utils";
const router = express.Router();

router.post("/logout-devices", authMiddleware, async (req, res) => {
  if (!req.userId) {
    res.status(401).send({ success: false });
    return;
  }

  await AuthUtils.removeAllSessions(req.userId);
  res.status(200).send({ success: true });
});

export default router;
