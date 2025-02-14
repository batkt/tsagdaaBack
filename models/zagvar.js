const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const zagvarSchema = new Schema(
  {
    id: String,
    ner: String,
    turul: String,
    tolgoi: String,
    baruunTolgoi: String,
    zuunTolgoi: String,
    baruunKhul: String,
    zuunKhul: String,
    khul: String,
    dedKhesguud: Array,
  },
  {
    timestamps: true,
  }
);

const zagvarModel = mongoose.model("zagvar", zagvarSchema);
module.exports = zagvarModel;
