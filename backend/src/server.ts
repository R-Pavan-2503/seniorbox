import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error.js";
import feedRoutes from "./routes/feed.js";
import listRoutes from "./routes/lists.js";
import logRoutes from "./routes/logs.js";
import mediaRoutes from "./routes/media.js";
import searchRoutes from "./routes/search.js";
import userRoutes from "./routes/users.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan(config.nodeEnv === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api/search", searchRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/users", userRoutes);
app.use("/api", feedRoutes);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`OmniLog API listening on ${config.port}`);
});
