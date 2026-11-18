import jwt from "jsonwebtoken";
import env from "@/config/env.js";

export default function ( { _id, email, role }: Jwt.JwtInput): string {

  return jwt.sign({ _id, email, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}