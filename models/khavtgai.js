const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const khavtgaiSchema = new Schema(
  {
    kod: String,
    ner: String,
    ungu: String,
    tuluvluguuniiId: String,
    tuluvluguuniiNer: String,
    bairshil: {
      type: {
        type: String,
        enum: ["Polygon"],
      },
      coordinates: {
        type: [[[Number]]],
      },
    },
    ajiltan: [
      {
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("khavtgai", khavtgaiSchema);
