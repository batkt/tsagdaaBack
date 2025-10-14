const mongoose = require("mongoose");

const habeaSchema = new mongoose.Schema(
  {
    tovchlol: {
      type: String,
      required: true,
      trim: true,
    },
    ner: {
      type: String,
      required: true,
      trim: true,
    },
    ontsgoiBolgoh: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "habea",
  }
);

module.exports = mongoose.model("Habea", habeaSchema);
