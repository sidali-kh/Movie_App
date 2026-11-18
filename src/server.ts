import app from "@/app.js";
import env from "@/config/env.js";
import connectDB from "@/database/connection.js";


async function startServer(): Promise<void> {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Movie API running on port ${env.PORT}`);
  });
}

const server = startServer();


server.catch((error: unknown) => {
  console.error("Failed to start the server:", error);
  process.exitCode = 1;
});
