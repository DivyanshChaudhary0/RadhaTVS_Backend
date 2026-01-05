import Bike from "../models/Bike.js";

export const addBike = async (req, res) => {
  try {
    const { brand, model, color, engineCC, purchasePrice, sellingPrice, stock } =
      req.body;

    if (
      !model ||
      !color ||
      !engineCC ||
      !purchasePrice ||
      !sellingPrice ||
      !stock
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const bike = await Bike.create({
      brand,
      model,
      color,
      engineCC,
      purchasePrice,
      sellingPrice,
      stock
    });

    res.status(201).json(bike);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBikes = async (req, res) => {
  try {
    const bikes = await Bike.find().sort({ createdAt: -1 });
    res.json(bikes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBike = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);

    if (!bike) {
      return res.status(404).json({ message: "Bike not found" });
    }

    Object.assign(bike, req.body);
    const updatedBike = await bike.save();

    res.json(updatedBike);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBike = async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);

    if (!bike) {
      return res.status(404).json({ message: "Bike not found" });
    }

    if (bike.status === "SOLD") {
      return res.status(400).json({ message: "Sold bike cannot be deleted" });
    }

    await bike.deleteOne();
    res.json({ message: "Bike removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStockSummary = async (req, res) => {
  try {
    const stock = await Bike.aggregate([
      {
        $group: {
          _id: {
            brand: "$brand",
            model: "$model",
            color: "$color",
          },
          total: { $sum: 1 },
          sold: {
            $sum: {
              $cond: [{ $eq: ["$status", "SOLD"] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          brand: "$_id.brand",
          model: "$_id.model",
          color: "$_id.color",
          total: 1,
          sold: 1,
          inStock: { $subtract: ["$total", "$sold"] },
          _id: 0,
        },
      },
      {
        $sort: { model: 1 },
      },
    ]);

    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
