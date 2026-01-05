import mongoose from "mongoose";

const bikeSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: true,
      trim: true,
      default: "TVS"
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    engineCC: {
      type: Number,
      required: true,
    },
    purchasePrice: {
      type: Number,
      required: true,
    },
    sellingPrice: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0
    },
    status: {
      type: String,
      enum: ["IN_STOCK", "SOLD"],
      default: "IN_STOCK",
    },
  },
  {
    timestamps: true,
  }
);

const Bike = mongoose.model("Bike", bikeSchema);
export default Bike;
