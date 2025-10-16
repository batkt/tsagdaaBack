const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const tuluvluguuSchema = new Schema(
  {
    ner: String,
    turul: String,
    ekhlekhOgnoo: Date,
    duusakhOgnoo: Date,
    niislelEeljuud: [
      {
        ner: String,
        ekhlekhOgnoo: Date,
        duusakhOgnoo: Date,
      },
    ],
    oronNutagEeljuud: [
      {
        ner: String,
        ekhlekhOgnoo: Date,
        duusakhOgnoo: Date,
      },
    ],
    idevkhiteiEsekh: { type: Boolean, default: true },
    tuluv: { type: String, default: "Эхэлсэн" },
  },
  {
    timestamps: true,
  }
);

tuluvluguuSchema.index({ tuluv: 1 });
tuluvluguuSchema.index({ tuluv: 1, ekhlekhOgnoo: 1, duusakhOgnoo: 1 });

const TuluvluguuModel = mongoose.model("tuluvluguu", tuluvluguuSchema);
module.exports = TuluvluguuModel;
