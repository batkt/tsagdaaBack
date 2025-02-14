const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const tsegSchema = new Schema(
  {
    kod: String,
    ner: String,
    duureg: String,
    ajiltniiToo: Number,
    ajiltniiKod: String,
    tuluvluguuniiId: String,
    tuluvluguuniiNer: String,
    ajiltnuud: [
      {
        khuvaariinNer: String,
        khuvaariinEkhlekhOgnoo: Date,
        khuvaariinDuusakhOgnoo: Date,
        nevtrekhNer: String,
        porool: String,
        ovog: String,
        ner: String,
        kheltes: String,
        tasag: String,
        tsol: String,
        albanTushaal: String,
        duureg: String,
        utas: String,
        mail: String,
        register: String,
        khayag: String,
        zurgiinId: String,
      },
    ],
    irts: [
      {
        ajiltan: Schema.Types.Mixed,
        ognoo: Date,
      },
    ],
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

//tsegSchema.index({ bairshil: "2dsphere" });
module.exports = mongoose.model("tseg", tsegSchema);
