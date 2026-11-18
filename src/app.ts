
import express from "express";
import swaggerUi from "swagger-ui-express";
import { readFileSync } from "node:fs";
import path from "node:path";
import cors from "cors";
import helmet from "helmet";
import apiAppRoutes from "@/routes/index.app.js";

const app = express();

// Security-related HTTP headers.
app.use(helmet());

// Allow cross-origin requests.
// Configure allowed origins explicitly before production.
app.use(cors());

// Parse incoming JSON request bodies.
app.use(express.json({ limit: "10kb" }));

const swaggerDocument = JSON.parse(
  readFileSync(
    path.resolve(process.cwd(), "docs/swagger.json"),
    "utf8"
  )
);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument)
);

app.use("/api/v1", apiAppRoutes);

export default app;