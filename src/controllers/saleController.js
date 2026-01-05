import mongoose from "mongoose";
import Bike from "../models/Bike.js";
import Customer from "../models/Customer.js";
import Sale from "../models/Sale.js";

// Create Sale
export const sellBike = async (req, res) => {
  console.log("Inside sale");
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      bikeId,
      customerId,
      quantity,
      discountPercentage = 0,
      discountAmount,
      paymentMethod = "CASH",
      saleDate = new Date(),
    } = req.body;

    // 1. Validate bike exists and has stock
    const bike = await Bike.findById(bikeId).session(session);
    if (!bike) {
      throw new Error("Bike not found");
    }

    if (bike.stock < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${bike.stock}, Requested: ${quantity}`
      );
    }

    // 2. Validate customer exists
    const customer = await Customer.findById(customerId).session(session);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // 3. Create sale
    const sale = new Sale({
      invoiceNumber: `INV-${Date.now()}`,
      bikeId,
      customerId,
      quantity,
      unitPrice: bike.sellingPrice,
      discountPercentage,
      discountAmount,
      paymentMethod,
      saleDate,
      subtotal: bike.sellingPrice * quantity,
      totalAmount: bike.sellingPrice * quantity,
    });

    // 4. Update bike stock
    bike.stock -= quantity;
    if (bike.stock === 0) {
      bike.status = "SOLD";
    }

    await sale.save({ session });
    await bike.save({ session });

    await session.commitTransaction();

    const populatedSale = await Sale.findById(sale._id)
      .populate("bikeId", "model color brand engineCC")
      .populate("customerId", "name phone email");

    res.status(201).json({
      success: true,
      data: populatedSale,
      message: "Sale completed successfully",
    });
  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Get all sales
export const allSales = async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate, customerId } = req.query;

    const query = {};

    // Date filter
    if (startDate || endDate) {
      query.saleDate = {};
      if (startDate) query.saleDate.$gte = new Date(startDate);
      if (endDate) query.saleDate.$lte = new Date(endDate);
    }

    if (customerId) query.customerId = customerId;

    const sales = await Sale.find(query)
      .populate("bikeId", "model color brand")
      .populate("customerId", "name phone")
      .sort({ saleDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Sale.countDocuments(query);

    res.json({
      success: true,
      data: sales,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get sales by customer
export const customerSales = async (req, res) => {
  try {
    const sales = await Sale.find({ customerId: req.params.customerId })
      .populate("bikeId", "model color engineCC")
      .sort({ saleDate: -1 });

    res.json({
      success: true,
      data: sales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get sales statistics for dashboard
export const statisticsDashboard = async (req, res) => {
  try {
    console.log("Inside statics dashboard");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's sales
    const todaySales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: today, $lt: tomorrow },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    // This week's sales
    const firstDayOfWeek = new Date(today);
    firstDayOfWeek.setDate(today.getDate() - today.getDay());
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 7);

    const weeklySales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: firstDayOfWeek, $lt: lastDayOfWeek },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayNextMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      1
    );

    const monthlySales = await Sale.aggregate([
      {
        $match: {
          saleDate: { $gte: firstDayOfMonth, $lt: firstDayNextMonth },
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        today: {
          count: todaySales[0]?.count || 0,
          revenue: todaySales[0]?.revenue || 0,
        },
        weekly: {
          count: weeklySales[0]?.count || 0,
          revenue: weeklySales[0]?.revenue || 0,
        },
        monthly: {
          count: monthlySales[0]?.count || 0,
          revenue: monthlySales[0]?.revenue || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSale = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const sale = await Sale.findById(req.params.id).session(session);

    if (!sale) {
      throw new Error("Sale not found");
    }

    if (sale.status === "CANCELLED") {
      throw new Error("Sale is already cancelled");
    }

    const bike = await Bike.findById(sale.bikeId).session(session);
    bike.stock += sale.quantity;

    if (bike.status === "SOLD" && bike.stock > 0) {
      bike.status = "IN_STOCK";
    }

    sale.status = "CANCELLED";

    await bike.save({ session });
    await sale.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      data: sale,
      message: "Sale cancelled successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};
