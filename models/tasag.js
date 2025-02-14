const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const tasagSchema = new Schema(
  {
    id: String,
    ner: String,
    tovchlol: String,
  },
  {
    timestamps: true,
  }
);

const TasagModel = mongoose.model("tasag", tasagSchema);
TasagModel.estimatedDocumentCount().then((count) => {
  console.dir(count);

  if (count == 0) {
    TasagModel.insertMany([
      {
        ner: "Захиргааны удирдлагын хэлтэс",
        tovchlol: "ЗУХ",
      },
      {
        ner: "Дүн шинжилгээ, үнэлгээ, хяналт шалгалтын хэлтэс",
        tovchlol: "ДШҮХШХ",
      },
      {
        ner: "Урьдчилан сэргийлэх хэлтэс",
        tovchlol: "УСХ",
      },
      {
        ner: "Мэдээллийн технологи, холбооны хэлтэс",
        tovchlol: "МТХХ",
      },
      {
        ner: "Замын цагдаагийн газар",
        tovchlol: "ЗЦГ",
      },
      {
        tovchlol: "ЗХБТХ",
        ner: "Замын хөдөлгөөний бодлого, төлөвлөлтийн хдэлтэс",
      },
      {
        tovchlol: "НЗХЗХ",
        ner: "Нийслэлийн замын хөдөлгөөн зохицуулах хэлтэс",
      },
      {
        tovchlol: "ЗХУХ",
        ner: "Замын хөдөлгөөний удирдлагын хэлтэс",
      },
      {
        tovchlol: "ЗТХХ",
        ner: "Зам Тээврийн хяналтын хдэлтэс",
      },
      {
        tovchlol: "ОНЗХХ",
        ner: "Орон нутгийн замын хяналтын хэлтэс",
      },
      {
        tovchlol: "ХХ",
        ner: "Хамгаалалтын хэлтэс",
      },
      {
        tovchlol: "ЗТГЦТ",
        ner: "Зам, Тээврийн гэрээт цагдаагийн тасаг",
      },
      {
        tovchlol: "МШГ",
        ner: "Мөрдөн шалгах газар",
      },
      {
        tovchlol: "МШХ",
        ner: "Мөрдөн шалгах хэлтэс",
      },
      {
        tovchlol: "ЭЦХ",
        ner: "Эрүүгийн цагдаагийн хэлтэс",
      },
      {
        tovchlol: "ЗШХ",
        ner: "Зөрчил шалгах хэлтэс",
      },
      {
        tovchlol: "ЖШУХ",
        ner: "Жижүүрийн шуурхай удирдлагын хэлтэс",
      },
      {
        tovchlol: "ТЗЦГ",
        ner: "Төмөр замын цагдаагийн газар",
      },
      {
        tovchlol: "ТЗЦГ ЗЦТ",
        ner: "Төмөр замын цагдаагийн газрын замын цагдаагийн тасаг",
      },
      {
        tovchlol: "ИАТЦХ",
        ner: "Иргэний агаарын тээврийн цагдаагийн хэлтэс",
      },
      {
        tovchlol: "ИАТЦХ",
        ner: "Иргэний агаарын тээврийн цагдаагийн хэлтсийн замын цагдаагийн тасаг",
      },
    ]);
  }
});

module.exports = TasagModel;
