import express from "express";
import {
  addCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
} from "../controllers/customerController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.post("/", addCustomer);
router.get("/", getCustomers);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);
router.get("/:id", getCustomerById);

export default router;
