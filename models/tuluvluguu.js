const mongoose = require('mongoose');
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
    idevkhiteiEsekh: Boolean,
  },
  {
    timestamps: true,
  }
);

const TuluvluguuModel = mongoose.model('tuluvluguu', tuluvluguuSchema);
module.exports = TuluvluguuModel;
