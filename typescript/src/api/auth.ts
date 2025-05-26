import { Context, Next } from "hono";
import { jwt } from "hono/jwt";
import bcrypt from "bcryptjs";
import jwtLib from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const authMiddleware = jwt({
  secret: JWT_SECRET,
});

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: number): string => {
  return jwtLib.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });
};

export const requireAuth = async (c: Context, next: Next) => {
  try {
    await authMiddleware(c, next);
  } catch (error) {
    return c.text("Unauthorized", 401);
  }
};
