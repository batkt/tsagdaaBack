const asyncHandler = require("express-async-handler");
const excel = require("exceljs");
const Ajiltan = require("../models/ajiltan");
const Tuluvluguu = require("../models/tuluvluguu");
const Tseg = require("../models/tseg");
const xlsx = require("xlsx");
const jwt = require("jsonwebtoken");
const HariyaNegj = require("../models/hariyaNegj");

function usegTooruuKhurvuulekh(useg) {
  if (!!useg) return useg.charCodeAt() - 65;
  else return 0;
}

function toogUsegruuKhurvuulekh(too) {
  if (!!too) {
    if (too < 26) return String.fromCharCode(too + 65);
    else {
      var orongiinToo = Math.floor(too / 26);
      var uldegdel = too % 26;
      return (
        String.fromCharCode(orongiinToo + 64) +
        String.fromCharCode(uldegdel + 65)
      );
    }
  } else return 0;
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

async function ajiltanOruulya(tseguud, aldaaniiMsg) {
  var jagsaalt = [];
  var shineAldaaniiMsg = "";
  for await (const a of tseguud) {
    if (a.ajiltniiKod && a.ajiltniiKod.includes(",")) {
      jagsaalt = [...jagsaalt, ...a.ajiltniiKod.split(",")];
    } else if (
      a.ajiltniiKod &&
      a.ajiltniiKod != null &&
      a.ajiltniiKod != "" &&
      a.ajiltniiKod != " "
    )
      jagsaalt.push(a.ajiltniiKod);
  }
  console.log("jagsaalt", jagsaalt);
  if (jagsaalt.length > 0)
    jagsaalt = jagsaalt.filter((a) => a && a != null && a != "" && a != " ");
  var ajiltniiJagsaalt = await Ajiltan.find({
    nevtrekhNer: { $in: jagsaalt },
  });
  if (ajiltniiJagsaalt.length !== 0) {
    oldooguiJagsaalt = [];
    jagsaalt.forEach((x) => {
      if (ajiltniiJagsaalt.find((a) => a.nevtrekhNer == x) == null)
        oldooguiJagsaalt.push(x);
    });
    if (oldooguiJagsaalt.length !== 0)
      shineAldaaniiMsg =
        aldaaniiMsg +
        "Дараах кодтой ажилтнуудын мэдээлэл олдсонгүй! : " +
        oldooguiJagsaalt +
        "<br/>";
  } else if (jagsaalt && jagsaalt.length > 0)
    shineAldaaniiMsg =
      aldaaniiMsg +
      "Дараах кодтой ажилтнуудын мэдээлэл олдсонгүй! : " +
      jagsaalt +
      "<br/>";

  if (shineAldaaniiMsg) aldaaniiMsg = shineAldaaniiMsg;
  else {
    tseguud.forEach((x) => {
      if (x.ajiltniiKod) {
        if (x.ajiltniiKod.includes(",")) {
          var tukhainAjiltnuud = ajiltniiJagsaalt.filter((a) =>
            x.ajiltniiKod.split(",").includes(a.nevtrekhNer)
          );
          x.ajiltnuud = tukhainAjiltnuud;
        } else {
          var tukhainAjiltan = ajiltniiJagsaalt.find(
            (a) => a.kod == x.talbainDugaar
          );
          x.ajiltnuud = tukhainAjiltan;
        }
      }
    });
  }
  return aldaaniiMsg;
}

exports.ajiltanTatya = asyncHandler(async (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw new Error("Энэ үйлдлийг хийх эрх байхгүй байна!", 401);
    }
    const token = req.headers.authorization.split(" ")[1];
    const tokenObject = jwt.verify(token, process.env.APP_SECRET, 401);

    if (!tokenObject) {
      throw new Error("Энэ үйлдлийг хийх эрх байхгүй байна!", 401);
    }
    const nevtersenAjiltan = await Ajiltan.findById(tokenObject.id);
    if (!nevtersenAjiltan) {
      throw new Error("Энэ үйлдлийг хийх эрх байхгүй байна!", 401);
    }
    if (!nevtersenAjiltan?.duureg) {
      throw new Error(
        "Та ямар нэг харьяа нэгжид бүртгэлгүй байна. Системийн админд хандана уу.",
        500
      );
    }
    const nevtersenAjiltaniiHariyaNegj = await HariyaNegj.findById(
      nevtersenAjiltan.duureg
    );
    if (!nevtersenAjiltaniiHariyaNegj) {
      throw new Error(
        "Таны харьяа нэгж алдаатай байна. Системийн админд хандана уу.",
        500
      );
    }
    console.log("nevtersenAjiltniiToken ", nevtersenAjiltan);
    const workbook = xlsx.read(req.file.buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jagsaalt = [];
    var tolgoinObject = {};
    var data = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 1,
    });
    if (workbook.SheetNames[0] != "Ажилтан")
      throw new Error("Буруу файл байна!");
    if (
      !worksheet["A1"]?.v?.includes("Овог") ||
      !worksheet["B1"]?.v?.includes("Нэр") ||
      !worksheet["C1"]?.v?.includes("Цол") ||
      !worksheet["D1"]?.v?.includes("Албан тушаал") ||
      !worksheet["E1"]?.v?.includes("Регистр") ||
      !worksheet["F1"]?.v?.includes("Хувийн дугаар") ||
      !worksheet["G1"]?.v?.includes("Дуудлага") ||
      !worksheet["H1"]?.v?.includes("Утас") ||
      !worksheet["I1"]?.v?.includes("Хэлтэс") ||
      !worksheet["J1"]?.v?.includes("Тасаг")
    ) {
      throw new Error("Та загварын дагуу бөглөөгүй байна!");
    }
    for (let cell in worksheet) {
      const cellAsString = cell.toString();
      if (
        cellAsString[1] === "1" &&
        cellAsString.length == 2 &&
        !!worksheet[cellAsString].v
      ) {
        if (worksheet[cellAsString].v === "Овог")
          tolgoinObject.ovog = cellAsString[0];
        else if (worksheet[cellAsString].v === "Нэр")
          tolgoinObject.ner = cellAsString[0];
        else if (worksheet[cellAsString].v === "Цол")
          tolgoinObject.tsol = cellAsString[0];
        else if (worksheet[cellAsString].v === "Албан тушаал")
          tolgoinObject.albanTushaal = cellAsString[0];
        else if (worksheet[cellAsString].v === "Регистр")
          tolgoinObject.register = cellAsString[0];
        else if (worksheet[cellAsString].v === "Хувийн дугаар")
          tolgoinObject.nevtrekhNer = cellAsString[0];
        else if (worksheet[cellAsString].v === "Дуудлага")
          tolgoinObject.porool = cellAsString[0];
        else if (worksheet[cellAsString].v === "Утас")
          tolgoinObject.utas = cellAsString[0];
        else if (worksheet[cellAsString].v === "Хэлтэс")
          tolgoinObject.kheltes = cellAsString[0];
        else if (worksheet[cellAsString].v === "Тасаг")
          tolgoinObject.tasag = cellAsString[0];
      }
    }
    var aldaaniiMsg = "";
    var muriinDugaar = 1;
    var shalgakhJagsaalt = [];
    for await (const mur of data) {
      muriinDugaar++;
      let object = new Ajiltan();
      object.tasag = mur[usegTooruuKhurvuulekh(tolgoinObject.tasag)];
      object.kheltes = mur[usegTooruuKhurvuulekh(tolgoinObject.kheltes)];
      object.tsol = mur[usegTooruuKhurvuulekh(tolgoinObject.tsol)];
      object.ovog = mur[usegTooruuKhurvuulekh(tolgoinObject.ovog)];
      object.ner = mur[usegTooruuKhurvuulekh(tolgoinObject.ner)];
      object.register = mur[usegTooruuKhurvuulekh(tolgoinObject.register)];
      object.albanTushaal =
        mur[usegTooruuKhurvuulekh(tolgoinObject.albanTushaal)];
      object.porool = mur[usegTooruuKhurvuulekh(tolgoinObject.porool)];
      object.utas = mur[usegTooruuKhurvuulekh(tolgoinObject.utas)];

      // const duuregCellValue = mur[usegTooruuKhurvuulekh(tolgoinObject?.duureg)];
      // const ajiltanDuureg = hariyaNegjData?.find(
      //   (item) => item?.ner?.toLowerCase() === duuregCellValue?.toLowerCase()
      // );
      object.duureg = nevtersenAjiltaniiHariyaNegj._id.toString();
      object.nevtrekhNer =
        mur[usegTooruuKhurvuulekh(tolgoinObject.nevtrekhNer)];
      if (
        object.tasag ||
        object.kheltes ||
        object.tsol ||
        object.ovog ||
        object.ner ||
        object.register ||
        object.albanTushaal ||
        object.porool ||
        object.utas ||
        object.duureg ||
        object.nevtrekhNer
      ) {
        if (!object.ner || !object.nevtrekhNer) {
          aldaaniiMsg = aldaaniiMsg + muriinDugaar + " дугаар мөрөнд";
          if (!object.ner) aldaaniiMsg = aldaaniiMsg + " Нэр ";
          if (!object.nevtrekhNer) aldaaniiMsg = aldaaniiMsg + " Хувийн дугаар";
          aldaaniiMsg = aldaaniiMsg + " талбар бөглөгдөөгүй байна! ";
        } else {
          shalgakhJagsaalt.push(object.nevtrekhNer);
          jagsaalt.push(object);
        }
      }
    }
    if (shalgakhJagsaalt && shalgakhJagsaalt.length > 0) {
      var oldsonJagsaalt = await Ajiltan.find({
        nevtrekhNer: { $in: shalgakhJagsaalt },
      });
      if (oldsonJagsaalt && oldsonJagsaalt.length > 0) {
        aldaaniiMsg =
          aldaaniiMsg +
          " Дараах хувийн дугаартай алба хаагчид бүртгэлтэй байна! ";
        for await (const a of oldsonJagsaalt) {
          aldaaniiMsg = aldaaniiMsg + a.nevtrekhNer + ", ";
        }
      }
    }
    if (aldaaniiMsg) throw new Error(aldaaniiMsg);
    Ajiltan.insertMany(jagsaalt)
      .then((result) => {
        res.status(200).send("Amjilttai");
      })
      .catch((err) => {
        next(err);
      });
  } catch (error) {
    next(error);
  }
});

exports.ajiltanZagvarAvya = asyncHandler(async (req, res, next) => {
  let workbook = new excel.Workbook();
  let worksheet = workbook.addWorksheet("Ажилтан");
  var baganuud = [
    {
      header: "Овог",
      key: "Овог",
      width: 30,
    },
    {
      header: "Нэр",
      key: "Нэр",
      width: 20,
    },
    {
      header: "Цол",
      key: "Цол",
      width: 30,
    },
    {
      header: "Албан тушаал",
      key: "Албан тушаал",
      width: 20,
    },
    {
      header: "Регистр",
      key: "Регистр",
      width: 20,
    },
    {
      header: "Хувийн дугаар",
      key: "Хувийн дугаар",
      width: 20,
    },
    {
      header: "Дуудлага",
      key: "Дуудлага",
      width: 20,
    },
    {
      header: "Утас",
      key: "Утас",
      width: 20,
    },
    {
      header: "Хэлтэс",
      key: "Хэлтэс",
      width: 20,
    },
    {
      header: "Тасаг",
      key: "Тасаг",
      width: 20,
    },
  ];
  // const duuregColLetter = "I";
  // const hariyaNegjData = await HariyaNegj.find();
  // const DUUREG_LIST = hariyaNegjData?.map((item) => item.ner);
  worksheet.columns = baganuud;
  // worksheet.dataValidations.add(`${duuregColLetter}2:${duuregColLetter}1000`, {
  //   type: "list",
  //   allowBlank: true,
  //   formulae: [`"${DUUREG_LIST.join(",")}"`],
  //   showErrorMessage: true,
  //   errorStyle: "stop",
  //   errorTitle: "Буруу утга",
  //   error: "Жагсаалтаас Дүүргийг сонгоно уу.",
  // });
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  return workbook.xlsx.write(res).then(function () {
    res.status(200).end();
  });
});

exports.tsegTatya = asyncHandler(async (req, res, next) => {
  try {
    const workbook = xlsx.read(req.file.buffer);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jagsaalt = [];
    var tolgoinObject = {};
    var data = xlsx.utils.sheet_to_json(worksheet, {
      header: 1,
      range: 1,
    });
    if (workbook.SheetNames[0] != "Пост") throw new Error("Буруу файл байна!");
    if (
      !worksheet["A1"]?.v?.includes("Дүүрэг") ||
      !worksheet["B1"]?.v?.includes("Код") ||
      !worksheet["C1"]?.v?.includes("Нэршил")
    ) {
      throw new Error("Та загварын дагуу бөглөөгүй байна!");
    }
    for (let cell in worksheet) {
      const cellAsString = cell.toString();
      if (
        cellAsString[1] === "1" &&
        cellAsString.length == 2 &&
        !!worksheet[cellAsString].v
      ) {
        if (worksheet[cellAsString].v === "Дүүрэг")
          tolgoinObject.duureg = cellAsString[0];
        else if (worksheet[cellAsString].v === "Код")
          tolgoinObject.kod = cellAsString[0];
        else if (worksheet[cellAsString].v === "Нэршил")
          tolgoinObject.ner = cellAsString[0];
        else if (worksheet[cellAsString].v === "Ажилтны код")
          tolgoinObject.ajiltniiKod = cellAsString[0];
      }
    }
    var aldaaniiMsg = "";
    var muriinDugaar = 1;

    for await (const mur of data) {
      muriinDugaar++;
      let object = new Tseg();
      object.duureg = mur[usegTooruuKhurvuulekh(tolgoinObject.duureg)];
      object.kod = mur[usegTooruuKhurvuulekh(tolgoinObject.kod)];
      object.ner = mur[usegTooruuKhurvuulekh(tolgoinObject.ner)];
      object.ajiltniiKod =
        mur[usegTooruuKhurvuulekh(tolgoinObject.ajiltniiKod)];
      if (object.ajiltniiKod) {
        object.ajiltniiKod = object.ajiltniiKod.replace(/\s+/g, "");
      }
      jagsaalt.push(object);
    }

    aldaaniiMsg = await ajiltanOruulya(jagsaalt, aldaaniiMsg);
    if (aldaaniiMsg) throw new Error(aldaaniiMsg);
    var idevkhteiTuluvluguu = await Tuluvluguu.findOne({
      idevkhiteiEsekh: true,
    });

    var bulkOps = [];
    for await (const mur of jagsaalt) {
      let upsertDoc = {
        updateOne: {
          filter: { ner: mur.ner, tuluvluguuniiId: idevkhteiTuluvluguu._id },
          update: {
            kod: mur.kod,
            ner: mur.ner,
            duureg: mur.duureg,
            ajiltniiToo: mur.ajiltniiToo,
            ajiltniiKod: mur.ajiltniiKod,
            ajiltnuud: mur.ajiltnuud,
            tuluvluguuniiId: idevkhteiTuluvluguu._id,
            tuluvluguuniiNer: idevkhteiTuluvluguu.ner,
          },
          upsert: true,
        },
      };
      bulkOps.push(upsertDoc);
    }
    Tseg.bulkWrite(bulkOps)
      .then((result) => {
        res.status(200).send("Amjilttai");
      })
      .catch((err) => {
        next(err);
      });
  } catch (error) {
    next(error);
  }
});

exports.tsegZagvarAvya = asyncHandler(async (req, res, next) => {
  let workbook = new excel.Workbook();
  let worksheet = workbook.addWorksheet("Пост");
  var baganuud = [
    {
      header: "Дүүрэг",
      key: "Дүүрэг",
      width: 20,
    },
    {
      header: "Код",
      key: "Код",
      width: 10,
    },
    {
      header: "Нэршил",
      key: "Нэршил",
      width: 40,
    },
    {
      header: "Ажилтны код",
      key: "Ажилтны код",
      width: 20,
    },
  ];
  worksheet.columns = baganuud;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  return workbook.xlsx.write(res).then(function () {
    res.status(200).end();
  });
});

exports.tsegGaraarBurtgeh = asyncHandler(async (req, res, next) => {
  try {
    const { ner, duureg, kod, ajiltnuud, tuluvluguuID } = req.body;

    if (!ner || !duureg || !kod) {
      return res.status(400).json({ message: "Бүх талбаруудыг бөглөнө үү." });
    }

    let ajiltanList = [];
    if (ajiltnuud && ajiltnuud.length > 0) {
      const ajiltniiKodList = ajiltnuud
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

      // Ажилтнуудын бүртгэлээс хайна
      ajiltanList = await Ajiltan.find({
        nevtrekhNer: { $in: ajiltniiKodList },
      });

      // Олдоогүй кодыг шалгах
      const oldoogui = ajiltniiKodList.filter(
        (kod) => !ajiltanList.some((a) => a.nevtrekhNer === kod)
      );

      if (oldoogui.length > 0) {
        return res.status(400).json({
          message: `Дараах ажилтнуудын код олдсонгүй: ${oldoogui.join(", ")}`,
        });
      }
    }

    const tuluvluguu = await Tuluvluguu.findById(tuluvluguuID);

    if (!tuluvluguu) {
      return res.status(400).json({ message: "Төлөвлөгөө олдсонгүй." });
    }

    const tseg = await Tseg.findOneAndUpdate(
      { ner, tuluvluguuniiId: tuluvluguuID },
      {
        $set: {
          ner,
          duureg,
          kod,
          ajiltniiKod: ajiltnuud,
          ajiltniiToo: ajiltanList.length,
          ajiltnuud: ajiltanList,
          tuluvluguuniiId: tuluvluguuID,
          tuluvluguuniiNer: tuluvluguu.ner,
        },
      },
      { upsert: true, new: true }
    );

    return res
      .status(200)
      .json({ message: "Байршил амжилттай бүртгэгдлээ", isOK: true, tseg });
  } catch (error) {
    next(error);
  }
});

exports.ajiltanGaraarBurtgeh = asyncHandler(async (req, res, next) => {
  try {
    const {
      tasag,
      kheltes,
      tsol,
      ovog,
      ner,
      register,
      albanTushaal,
      porool,
      erkh,
      utas,
      duureg,
      nevtrekhNer,
    } = req.body;

    if (!ner || !nevtrekhNer) {
      return res.status(400).json({
        message: "Нэр болон Хувийн дугаар (nevtrekhNer) шаардлагатай!",
      });
    }

    const exists = await Ajiltan.findOne({ nevtrekhNer });
    if (exists) {
      return res.status(400).json({
        message: `Хувийн дугаар "${nevtrekhNer}"-тай ажилтан аль хэдийн бүртгэгдсэн байна.`,
      });
    }

    const ajiltan = await Ajiltan.create({
      tasag,
      kheltes,
      tsol,
      ovog,
      ner,
      erkh: erkh || "Member",
      register,
      albanTushaal,
      porool,
      utas,
      duureg,
      nevtrekhNer,
    });

    res.status(200).json({ message: "Амжилттай бүртгэгдлээ", ajiltan });
  } catch (error) {
    next(error);
  }
});
