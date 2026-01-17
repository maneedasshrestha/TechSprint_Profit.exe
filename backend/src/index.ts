import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import issuesRoutes from "./routes/issues";
import heatmapRoutes from "./routes/heatmap";
import postsRoutes from "./routes/posts";
import proposalRoutes from "./routes/proposals";
import blockchainService from "./services/blockchainService";
import {
  adminLogin,
  verifyAdminToken,
  getAdminProfile,
} from "./controllers/adminController";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Admin auth routes
app.post("/api/admin-login", adminLogin);
app.get("/api/admin/profile", verifyAdminToken, getAdminProfile);

// Basic routes
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

app.get("/api", (req, res) => {
  res.json({ message: "Welcome to Hamro Chautari API" });
});

// Import and use issues routes
app.use("/api", issuesRoutes);

// Import and use heatmap routes
app.use("/api/heatmap", heatmapRoutes);

// Import and use posts routes
app.use("/api", postsRoutes);

// Import and use proposal routes (blockchain voting)
app.use("/api/proposals", proposalRoutes);

// Initialize blockchain service if contract address is set
if (process.env.CONTRACT_ADDRESS) {
  blockchainService.initContract(process.env.CONTRACT_ADDRESS);
  console.log('⛓️  Blockchain service initialized');
}

// Start server
app.listen(port, () => {
  console.log(`✅ Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`📊 Issues API: http://localhost:${port}/api/issues`);
  console.log(`🗺️  Heatmap API: http://localhost:${port}/api/heatmap/all`);
  console.log(
    `🗺️  Ward API: http://localhost:${port}/api/heatmap/ward/:wardNumber`
  );
  console.log(`🗺️  Summary API: http://localhost:${port}/api/heatmap/summary`);
  console.log(`🗳️  Proposals API: http://localhost:${port}/api/proposals`);
  console.log(`⛓️  Blockchain: ${process.env.CONTRACT_ADDRESS ? 'Connected' : 'Not deployed yet'}`);
});

export default app;
