import express from "express";
import authRoutes from "./authRoutes.js";
import bikeRoutes from "./bikeRoutes.js";
import customerRoutes from "./customerRoutes.js";
import saleRoutes from "./saleRoutes.js";
import reportRoutes from "./reportRoutes.js";
import dashboardRoutes from './dashboardRoutes.js'

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/bikes", bikeRoutes);
router.use("/customers", customerRoutes);
router.use("/sales", saleRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);


export default router;
