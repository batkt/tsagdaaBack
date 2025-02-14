const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const kheltesSchema = new Schema(
  {
    id: String,
    ner: String,
    tovchlol: String,
  },
  {
    timestamps: true,
  }
);

const KheltesModel = mongoose.model("kheltes", kheltesSchema);

module.exports = KheltesModel;
