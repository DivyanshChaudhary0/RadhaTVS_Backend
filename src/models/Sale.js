import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    // References
    bikeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bike",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
    },

    invoiceNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    
    // Discount
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    // Totals
    subtotal: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    // Payment
    paymentMethod: {
      type: String,
      enum: ["CASH", "CARD", "UPI", "cash", "card", "upi"],
      default: "CASH",
      required: true,
    },

    // Sale Date
    saleDate: {
      type: Date,
      default: Date.now,
    },

    // Status
    status: {
      type: String,
      enum: ["ACTIVE", "CANCELLED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

const Sale = mongoose.model("Sale", saleSchema);
export default Sale;
