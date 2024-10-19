import { PrismaClient } from "@prisma/client";

export class Prisma {
  private constructor() {}
  private static _client: PrismaClient | null = null;

  public static initialize() {
    if (!this._client) {
      this._client = new PrismaClient();
    }
  }

  public static get client() {
    if (!this._client)
      throw new Error("Prisma must be inistialized before calling client()");

    return this._client;
  }
}
