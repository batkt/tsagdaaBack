const express = require("express");
const router = express.Router();
const { tokenShalgakh } = require("zevback");
const HabeaModel = require("../models/habea");
const AjiltanModel = require("../models/ajiltan");

router.post(
  "/asuulgaOlnoorKhadgalya",
  tokenShalgakh,
  async (req, res, next) => {
    try {
      const body = req.body;

      if (!Array.isArray(body) || body.length === 0)
        return res.status(400).json({ error: "Асуулга хоосон байна" });

      const asuulguud = body.map((mur) => {
        const newItem = {
          asuult: mur.asuult,
          ajiltanId: mur.ajiltanId,
          tuluvluguuniiID: mur.tuluvluguuniiID,
          ognoo: mur.ognoo || new Date(),
          turul: "asuult",
        };

        if (mur.baiguullagiinId || req.user?.baiguullagaId) {
          newItem.baiguullagiinId =
            mur.baiguullagiinId || req.user?.baiguullagaId;
        }
        if (mur.salbariinId || req.user?.salbarId) {
          newItem.salbariinId = mur.salbariinId || req.user?.salbarId;
        }

        return newItem;
      });

      await HabeaModel.insertMany(asuulguud);
      res.json(true);
    } catch (error) {
      console.error("Error saving asuulga:", error);
      next(error);
    }
  }
);

router.post("/asuulgaUstgay", tokenShalgakh, async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID шаардлагатай" });

    await HabeaModel.deleteOne({ _id: id });
    res.json(true);
  } catch (error) {
    next(error);
  }
});

router.post("/asuulgaAvya", tokenShalgakh, async (req, res, next) => {
  try {
    const {
      query = {},
      khuudasniiDugaar = 1,
      khuudasniiKhemjee = 20,
    } = req.body;

    query.turul = "asuult";

    const skip = (khuudasniiDugaar - 1) * khuudasniiKhemjee;

    const total = await HabeaModel.countDocuments(query);
    const jagsaalt = await HabeaModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(khuudasniiKhemjee)
      .lean();

    res.json({
      niitMur: total,
      khuudasniiDugaar,
      khuudasniiKhemjee,
      jagsaalt,
    });
  } catch (err) {
    console.error("Error fetching questions:", err);
    next(err);
  }
});

router.post("/khabAsuulgaAvya", tokenShalgakh, async (req, res, next) => {
  try {
    const { ajiltniiId, ognoo } = req.body;

    if (!ajiltniiId) {
      return res.status(400).json({ error: "Ajiltan ID шаардлагатай" });
    }

    const asuulguud = await HabeaModel.find({ turul: "asuult" })
      .sort({ createdAt: -1 })
      .lean();

    console.log("Found active questions:", asuulguud.length);

    if (asuulguud.length === 0) {
      return res.json({
        niitMur: 0,
        khuudasniiDugaar: 1,
        khuudasniiKhemjee: 20,
        jagsaalt: [],
      });
    }

    const targetDate = ognoo ? new Date(ognoo) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const existingAnswer = await HabeaModel.findOne({
      ajiltniiId,
      ognoo: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      },
      turul: "khariult",
    }).lean();

    console.log("Existing answer found:", !!existingAnswer);

    const mappedAsuulguud = asuulguud.map((asuult) => {
      const existingAsuult = existingAnswer?.asuulguud?.find(
        (a) => a.asuultId === asuult._id.toString()
      );

      return {
        _id: asuult._id,
        asuulga: asuult.asuult,
        asuultId: asuult._id.toString(),
        khariult: existingAsuult?.khariult ?? null,
        tailbar: existingAsuult?.tailbar || "",
      };
    });

    const responseData = {
      _id: existingAnswer?._id,
      ajiltniiId,
      ognoo: targetDate,
      asuulguud: mappedAsuulguud,
      gariinUseg: existingAnswer?.gariinUseg,
      zasakhEsekh: false,
    };

    res.json({
      niitMur: 1,
      khuudasniiDugaar: 1,
      khuudasniiKhemjee: 20,
      jagsaalt: [responseData],
    });
  } catch (err) {
    console.error("Error fetching questions for mobile:", err);
    next(err);
  }
});

router.post("/khabTuukhKhadgalya", tokenShalgakh, async (req, res, next) => {
  try {
    const { asuulguud, ajiltniiId, ognoo, gariinUseg } = req.body;

    console.log("Received save request:", {
      hasAsuulguud: !!asuulguud,
      asuulguudLength: asuulguud?.length,
      ajiltniiId,
      ognoo,
      hasSignature: !!gariinUseg,
    });

    if (!asuulguud || !Array.isArray(asuulguud) || asuulguud.length === 0) {
      return res.status(400).json({ error: "Asuulguud хоосон байна" });
    }

    if (!ajiltniiId) {
      return res.status(400).json({ error: "Ajiltan ID шаардлагатай" });
    }

    const dateToSave = ognoo ? new Date(ognoo) : new Date();
    dateToSave.setHours(0, 0, 0, 0);

    const formattedAsuulguud = asuulguud.map((a) => ({
      asuultId: a.asuultId,
      khariult: a.khariult,
      tailbar: a.tailbar || "",
      status: a.khariult === true ? "accepted" : "declined",
    }));

    const existingRecord = await HabeaModel.findOne({
      ajiltniiId,
      ognoo: {
        $gte: dateToSave,
        $lt: new Date(dateToSave.getTime() + 24 * 60 * 60 * 1000),
      },
      turul: "khariult",
    });

    if (existingRecord) {
      existingRecord.asuulguud = formattedAsuulguud;
      if (gariinUseg) {
        existingRecord.gariinUseg = gariinUseg;
      }
      existingRecord.updatedAt = new Date();
      await existingRecord.save();
      console.log("Updated existing answer record:", existingRecord._id);
    } else {
      const newRecord = await HabeaModel.create({
        ajiltniiId,
        ognoo: dateToSave,
        asuulguud: formattedAsuulguud,
        gariinUseg: gariinUseg || null,
        turul: "khariult",
      });
      console.log("Created new answer record:", newRecord._id);
    }

    res.json("Amjilttai");
  } catch (error) {
    console.error("Error saving khabTuukh:", error);
    res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
});

router.post("/khabTuukhAvya", tokenShalgakh, async (req, res, next) => {
  try {
    const {
      query = {},
      khuudasniiDugaar = 1,
      khuudasniiKhemjee = 20,
    } = req.body;

    query.turul = "khariult";

    console.log("Fetching saved answers with query:", query);

    const skip = (khuudasniiDugaar - 1) * khuudasniiKhemjee;

    const total = await HabeaModel.countDocuments(query);
    const jagsaalt = await HabeaModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(khuudasniiKhemjee)
      .lean();

    console.log("Found saved answers:", jagsaalt.length);

    const jagsaaltWithUserInfo = await Promise.all(
      jagsaalt.map(async (item) => {
        let ajiltanInfo = null;

        if (item.ajiltniiId) {
          try {
            const ajiltan = await AjiltanModel.findById(item.ajiltniiId)
              .select("ner ovog mail")
              .lean();

            if (ajiltan) {
              ajiltanInfo = {
                ner: ajiltan.ner,
                ovog: ajiltan.ovog,
                mail: ajiltan.mail,
                fullName: `${ajiltan.ovog || ""} ${ajiltan.ner || ""}`.trim(),
              };
            }
          } catch (err) {
            console.error("Error fetching ajiltan:", err);
          }
        }

        if (item.asuulguud && Array.isArray(item.asuulguud)) {
          const populatedAsuulguud = await Promise.all(
            item.asuulguud.map(async (asuulga) => {
              try {
                const question = await HabeaModel.findById(asuulga.asuultId)
                  .select("asuult")
                  .lean();

                return {
                  ...asuulga,
                  asuultText: question?.asuult || "Асуулт олдсонгүй",
                };
              } catch (err) {
                console.error("Error fetching question:", err);
                return {
                  ...asuulga,
                  asuultText: "Асуулт олдсонгүй",
                };
              }
            })
          );

          return {
            ...item,
            ajiltanInfo,
            asuulguud: populatedAsuulguud,
          };
        }

        return { ...item, ajiltanInfo };
      })
    );

    res.json({
      niitMur: total,
      khuudasniiDugaar,
      khuudasniiKhemjee,
      jagsaalt: jagsaaltWithUserInfo,
    });
  } catch (err) {
    console.error("Error fetching saved answers:", err);
    next(err);
  }
});

module.exports = router;
