const mongoose = require("mongoose");

const habeaSchema = new mongoose.Schema(
  {
    asuult: {
      type: String,
      required: true,
      trim: true,
    },
    ajiltanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ajiltan",
      required: true,
    },
    tuluvluguuniiID: {
      type: String,
      required: true,
    },
    baiguullagiinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Baiguullaga",
      required: false,  
    },
    salbariinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Salbar",
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
