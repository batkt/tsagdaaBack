const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const medegdelSchema = new Schema(
  {
    ajiltniiId: String, 
    garchig: String,
    aguulga: String, 
    unshsan: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

const MedegdelModel = mongoose.model("medegdel", medegdelSchema);

module.exports = MedegdelModel;
