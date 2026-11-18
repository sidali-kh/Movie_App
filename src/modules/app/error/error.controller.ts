import type { Request, Response } from "express";

export function getErrorList(
  _req: Request,
  res: Response,
): void {
  res.status(501).json({
    message: "Implement getErrorList",
  });
}
