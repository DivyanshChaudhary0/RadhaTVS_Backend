import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { protect } from "./middlewares/authMiddleware.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", protect, (req, res) => {
  const user = req?.admin;
  console.log("Rquest come in /", user);
  res.json({
    user: user,
    success: true,
    message: "Bike Shop API is running 🚀",
  });
});

app.use("/api", (req, res, next) => { console.log("Request came in"); next()}, routes);

export default app;
