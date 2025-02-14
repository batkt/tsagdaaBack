const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const irtsSchema = new Schema(
  {
    ajiltniiId: String,
    ajiltniiNer: String,
    ognoo: Date,
    irsenTsag: Date,
    yawsanTsag: Date,
    khotsorsonMinut: {
      type: Number,
      default: 0,
    },
    ertIrsenMinut: {
      type: Number,
      default: 0,
    },
    ajillasanMinut: Number,
    orsonTurul: {
      ajiltniiId: String,
      ajiltniiNer: String,
      burtgesenTsag: Date,
      tukhuruumjiinId: String,
      bairlal: [Number],
      zai: Number,
    },
    garsanTurul: {
      ajiltniiId: String,
      ajiltniiNer: String,
      burtgesenTsag: Date,
      tukhuruumjiinId: String,
      bairlal: [Number],
      zai: Number,
    },
    tuluv: String,
    chuluuniiTurul: {
      ajiltniiId: String,
      ajiltniiNer: String,
      tailbar: String,
      ekhlekhOgnoo: Date,
      duusakhOgnoo: Date,
      burtgesenTsag: Date,
    },
    tasalsanTurul: {
      ajiltniiId: String,
      ajiltniiNer: String,
      tailbar: String,
      ekhlekhOgnoo: Date,
      duusakhOgnoo: Date,
      burtgesenTsag: Date,
    },
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
module.exports = mongoose.model("irts", irtsSchema);
