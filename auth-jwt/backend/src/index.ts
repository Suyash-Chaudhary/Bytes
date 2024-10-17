import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { EncryptionUtils } from "./utils/encryption";
import { withError } from "./utils/with-error";
import { JWTUtils } from "./utils/jwt";

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cookieParser());

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
});

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
});

const LogoutAllDeviceSchema = z.object({
  id: z.number().int(),
});

const BanUserSchema = z.object({
  id: z.number().int(),
});

const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get tokens from cookie or headers.
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // Stop if no accessToken is provided.
    if (!accessToken) return next();

    // Verify access token & only process token expiry errors.
    const [error, authPayload] = (await withError(
      JWTUtils.verify(accessToken),
      [TokenExpiredError]
    )) as [TokenExpiredError | undefined, { id: number }];

    // If access token is valid,
    if (!error) {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: authPayload.id as number },
      });
      console.log({ user });
      return next();
    }

    // If access token has expired, try to use refresh token.
    const refreshPayload = (await JWTUtils.verify(refreshToken)) as {
      id: number;
      version: number;
    };

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: refreshPayload.id },
    });

    if (!user.allowed) {
      throw new Error("Unauthorized user.");
    }

    if (user.version !== refreshPayload.version) {
      throw new Error("Invalid token.");
    }

    const newAccessToken = await JWTUtils.generateAccessToken({
      id: user.id,
    });

    const newRefreshToken = await JWTUtils.generateRefreshToken({
      id: user.id,
      version: user.version,
    });

    res.cookie("accessToken", newAccessToken);
    res.cookie("refreshToken", newRefreshToken);
  } catch (error) {
    // Any other errors in tokens are treated as dangerous & tokens are cleared.
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    console.log({ error });
  } finally {
    return next();
  }
};

app.get("/user", authMiddleware, async (req, res) => {
  res.send({ success: true });
});

app.post("/signup", async (req, res) => {
  // Validate body.
  const result = SignUpSchema.safeParse(req.body);
  if (!result.success) throw new Error("Invalid body");
  const data = result.data;

  // Check if user exists.
  if (await prisma.user.findFirst({ where: { email: data.email } })) {
    res.status(400).send({ success: false, message: "User already exists" });
    return;
  }

  // Create user record.
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: await EncryptionUtils.toHash(data.password),
    },
  });

  // // Create access & refresh tokens.
  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_KEY!,
    { expiresIn: "10s" }
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      version: user.version,
    },
    process.env.JWT_KEY!,
    { expiresIn: "30d" }
  );

  // Set user's cookie.
  res.cookie("accessToken", accessToken);
  res.cookie("refreshToken", refreshToken);

  // Return response with the tokens.
  res.status(201).send({ success: true });
});

app.post("/signin", async (req, res) => {
  // Validate body.
  const result = SignInSchema.safeParse(req.body);
  if (!result.success) throw new Error("Invalid body");
  const data = result.data;

  // Check if user exists.
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) throw new Error("User not registered");

  // Check if user can login.
  if (!user.allowed) throw new Error("User unauthorized");

  // Create access & refresh tokens.
  const accessToken = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_KEY!,
    { expiresIn: "10s" }
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      version: user.version,
    },
    process.env.JWT_KEY!,
    { expiresIn: "30d" }
  );

  // Set user's cookie.
  res.cookie("accessToken", accessToken);
  res.cookie("refreshToken", refreshToken);

  // Return response with the tokens.
  res.status(200).send({ success: true, accessToken, refreshToken });
});

app.post("/logout-all-devices/:id", async (req, res) => {
  // Validate body.
  const result = LogoutAllDeviceSchema.safeParse(req.body);
  if (!result.success) throw new Error("Invalid body");
  const id = result.data.id;

  // Increment the user's refresh token version.
  const user = await prisma.user.update({
    where: { id },
    data: { version: { increment: 1 } },
  });

  if (!user) throw new Error("User doesn't exist");

  res.status(200).send({ success: true });
});

app.post("/ban-user/:id", async (req, res) => {
  // Validate body.
  const result = LogoutAllDeviceSchema.safeParse(req.body);
  if (!result.success) throw new Error("Invalid body");
  const id = result.data.id;

  // Increment the user's refresh token version and set allowed -> false.
  const user = await prisma.user.update({
    where: { id },
    data: { version: { increment: 1 }, allowed: false },
  });

  if (!user) throw new Error("User doesn't exist");

  res.status(200).send({ success: true });
});

app.get("/", (req, res) => {
  res.send({ status: true });
});

app.listen(3000);
