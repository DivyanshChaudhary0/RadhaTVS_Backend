import express from "express";
import {
  addBike,
  getBikes,
  updateBike,
  deleteBike,
  getStockSummary,
} from "../controllers/bikeController.js";

import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", addBike);
router.get("/", getBikes);
router.get("/stock", getStockSummary);
router.put("/:id", updateBike);
router.delete("/:id", deleteBike);

export default router;
