const mongoose = require("mongoose");

const habeaSchema = new mongoose.Schema(
  {
    asuult: {
      type: String,
      required: true,
      trim: true,
    },
    baiguullagiinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Baiguullaga",
      required: true,
    },
    salbariinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salbar",
      required: true,
    },
    ognoo: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "habea",
  }
);

module.exports = mongoose.model("Habea", habeaSchema);
