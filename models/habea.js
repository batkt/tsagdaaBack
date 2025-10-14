const mongoose = require("mongoose");

const habeaSchema = new mongoose.Schema(
  {
    asuult: {
      type: String,
      required: true,
      trim: true,
    },
    ajiltanId: {
      type: String,
      required: true,
    },
    tuluvluguuniiID: {
      type: String,
      required: false,
    },
    baiguullagiinId: {
      type: String,
      required: false,
    },
    salbariinId: {
      type: String,
      required: false,
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
