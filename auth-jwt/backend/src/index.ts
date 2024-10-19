import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import { Prisma } from "./db/prisma-client";
import signinRouter from "./routes/signin";
import signupRouter from "./routes/signup";
import logoutDevicesRouter from "./routes/logout-devices";
import banUserRouter from "./routes/ban-user";
import getUserRouter from "./routes/get-user";

declare global {
  namespace Express {
    export interface Request {
      userId: number;
    }
  }
}

Prisma.initialize();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/signin", signinRouter);
app.use("/signup", signupRouter);
app.use("/logout-devices", logoutDevicesRouter);
app.use("/ban-user", banUserRouter);
app.use("/get-user", getUserRouter);

app.get("/", (req, res) => {
  res.send({ status: true });
});

app.listen(3000);
