const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const tsagdaagiinGazarSchema = new Schema(
  {
    kod: String,
    ner: String,
    bairshilUgeer: String,
    bairshil: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("tsagdaagiinGazar", tsagdaagiinGazarSchema);
