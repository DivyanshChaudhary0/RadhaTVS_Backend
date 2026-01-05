import express from "express";
import {
  getAllSales,
  getDailySales,
  getSalesByCustomer,
  getSalesByBike,
  getRevenueSummary,
} from "../controllers/reportController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.get("/sales", getAllSales);
router.get("/daily", getDailySales);
router.get("/customer/:customerId", getSalesByCustomer);
router.get("/bike/:bikeId", getSalesByBike);
router.get("/revenue", getRevenueSummary);

export default router;
