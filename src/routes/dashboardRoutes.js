import express from 'express';
import {
  getDashboardStats,
  getSalesOverview,
  getTopSellingBikes,
  getRevenueStats
} from '../controllers/dashboardController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/stats', getDashboardStats);
router.get('/sales-overview', getSalesOverview);
router.get('/top-bikes', getTopSellingBikes);
router.get('/revenue', getRevenueStats);

export default router;