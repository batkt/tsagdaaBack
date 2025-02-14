const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const tsolSchema = new Schema(
  {
    id: String,
    ner: String,
  },
  {
    timestamps: true,
  }
);

const TsolModel = mongoose.model("tsol", tsolSchema);
TsolModel.estimatedDocumentCount().then((count) => {
  console.dir(count);

  if (count == 0) {
    TsolModel.insertMany([
      {
        ner: "Цагдаагийн хурандаа",
      },
      {
        ner: "Цагдаагийн дэд хурандаа",
      },
      {
        ner: "Цагдаагийн хошууч",
      },
      {
        ner: "Цагдаагийн ахмад",
      },
      {
        ner: "Цагдаагийн ахлах дэслэгч",
      },
      {
        ner: "Цагдаагийн дэслэгч",
      },
      {
        ner: "Цагдаагийн ахлах ахлагч",
      },
      {
        ner: "Цагдаагийн ахлагч",
      },
      {
        ner: "Цагдаагийн дэд ахлагч",
      },
      {
        ner: "ОНЦ",
      },
    ]);
  }
});

module.exports = TsolModel;
