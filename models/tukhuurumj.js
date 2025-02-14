const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const tukhuurumjSchema = new Schema(
  {
    ajiltniiId: String,
    ajiltniiNer: String,
    turul: String, //utas, tukhuurumj
    macKhayag: String, //orokh, garakh
    burtgesenOgnoo: {
      type: Date,
      default: Date.now,
    },
    burtgesenAjiltniiId: String,
    burtgesenAjiltniiNer: String,
    tsagdaagiinGazriinId: String,
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("tukhuurumj", tukhuurumjSchema);
