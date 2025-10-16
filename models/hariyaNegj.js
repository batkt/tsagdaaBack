const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const hariyaNegjSchema = new Schema(
  {
    buleg: String,
    ner: String,
    tovchlol: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("hariyaNegj", hariyaNegjSchema);
