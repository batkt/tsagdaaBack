const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const zurchilSchema = new Schema(
  {
    ognoo: {
      type: Date,
      default: Date.now,
    },
    zurchliinNer: String,
    zurchliinTovchlol: String,
    zurgiinId: String,
    mashiniiDugaar: String,
    register: String,
    ajiltan: Schema.Types.Mixed,
    tseg: Schema.Types.Mixed,
    tuluvluguuniiId: String,
    tuluvluguuniiNer: String,
  },
  {
    timestamps: true,
  }
);
const ZurchilModel = mongoose.model("zurchil", zurchilSchema);

module.exports = ZurchilModel;
