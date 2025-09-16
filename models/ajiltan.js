const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Schema = mongoose.Schema;

mongoose.pluralize(null);
const ajiltanSchema = new Schema(
  {
    id: String,
    nevtrekhNer: String, //xuwiin dugaar
    erkh: String,
    porool: String,
    ner: String,
    ovog: String,
    albanTushaal: String,
    duureg: String,
    tsol: String,
    tasag: String,
    kheltes: String,
    utas: String,
    mail: String,
    register: String,
    khayag: String,
    zurgiinId: String,
    nuutsUg: {
      type: String,
      select: false,
      default: "123",
    },
  },
  {
    timestamps: true,
  }
);

ajiltanSchema.methods.tokenUusgeye = function () {
  const token = jwt.sign(
    {
      id: this._id,
      ner: this.ner,
    },
    process.env.APP_SECRET,
    {
      expiresIn: "12h",
    }
  );
  return token;
};

ajiltanSchema.pre("save", async function () {
  const salt = await bcrypt.genSalt(12);
  this.nuutsUg = await bcrypt.hash(this.nuutsUg, salt);
});

ajiltanSchema.pre("updateOne", async function () {
  const salt = await bcrypt.genSalt(12);
  if (this._update.nuutsUg)
    this._update.nuutsUg = await bcrypt.hash(this._update.nuutsUg, salt);
});

ajiltanSchema.methods.passwordShalgaya = async function (pass) {
  return await bcrypt.compare(pass, this.nuutsUg);
};

const AjiltanModel = mongoose.model("ajiltan", ajiltanSchema);
AjiltanModel.estimatedDocumentCount().then((count) => {
  console.dir(count);

  if (count == 0) {
    AjiltanModel.create(
      new AjiltanModel({
        ner: "Admin",
        nevtrekhNer: "Admin",
        utas: "Admin",
        mail: "Admin",
        erkh: "Super admin",
        register: "Admin",
        albanTushaal: "Admin",
        nuutsUg: "123",
      })
    );
  }
});

module.exports = AjiltanModel;
