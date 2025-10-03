const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const zurchliinTurulSchema = new Schema(
  {
    ner: String,
    tovchlol: String,
  },
  {
    timestamps: true,
  }
);
const ZurchliinTurulModel = mongoose.model(
  "zurchliinTurul",
  zurchliinTurulSchema
);
// ZurchliinTurulModel.estimatedDocumentCount().then((count) => {
//   console.dir(count);

//   if (count == 0) {
//     ZurchliinTurulModel.insertMany([
//       {
//         ner: "Согтуу жолооч",
//         tovchlol: "97",
//       },
//       {
//         ner: "Эрхгүй жолооч",
//         tovchlol: "99",
//       },
//       {
//         ner: "Цагдаагийн нийтлэг үүрэг",
//         tovchlol: "ЦНҮ",
//       },
//       {
//         ner: "Эрэн сурвалжилж буй хүн, эд зүйл",
//         tovchlol: "ASAP",
//       },
//     ]);
//   }
// });
module.exports = ZurchliinTurulModel;
