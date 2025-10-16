const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const idevkhiteiTuluvluguuSchema = new Schema(
  {
    ajiltanId: String,
    tuluvluguuID: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("idevkhiteiTuluvluguu", idevkhiteiTuluvluguuSchema);
