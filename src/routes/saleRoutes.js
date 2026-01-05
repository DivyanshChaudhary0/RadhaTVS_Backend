
import express from "express";
import { allSales, customerSales, sellBike, statisticsDashboard } from "../controllers/saleController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", sellBike);
router.get('/', allSales);
router.get(`/:customerId`, customerSales);
router.get(`/dashboard`, statisticsDashboard);

export default router;
