import Sale from "../models/Sale.js";

export const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("bikeId", "brand model color")
      .populate("customerId", "name phone")
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDailySales = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();

    const start = new Date(date.setHours(0, 0, 0, 0));
    const end = new Date(date.setHours(23, 59, 59, 999));

    const sales = await Sale.find({
      createdAt: { $gte: start, $lte: end },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + sale.salePrice, 0);

    res.json({
      date: start.toDateString(),
      totalSales: sales.length,
      totalRevenue,
      sales,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalesByCustomer = async (req, res) => {
  try {
    const sales = await Sale.find({
      customerId: req.params.customerId,
    })
      .populate("bikeId", "brand model color")
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalesByBike = async (req, res) => {
  try {
    const sales = await Sale.find({
      bikeId: req.params.bikeId,
    })
      .populate("customerId", "name phone")
      .sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getRevenueSummary = async (req, res) => {
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$salePrice" },
          totalSales: { $sum: 1 },
        },
      },
    ]);

    res.json(
      result[0] || {
        totalRevenue: 0,
        totalSales: 0,
      }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


