const express = require("express");
const router = express.Router();
const { tokenShalgakh } = require("zevback");
const HabeaModel = require("../models/habea");

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

    console.log("Fetch questions query:", query);

    const skip = (khuudasniiDugaar - 1) * khuudasniiKhemjee;

    const total = await HabeaModel.countDocuments(query);
    const jagsaalt = await HabeaModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(khuudasniiKhemjee)
      .lean();

    console.log("Found questions:", jagsaalt.length);

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

    const existingRecord = await HabeaModel.findOne({
      ajiltniiId,
      ognoo: {
        $gte: dateToSave,
        $lt: new Date(dateToSave.getTime() + 24 * 60 * 60 * 1000),
      },
      turul: "khariult",
    });

    if (existingRecord) {
      existingRecord.asuulguud = asuulguud;
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
        asuulguud,
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

    res.json({
      niitMur: total,
      khuudasniiDugaar,
      khuudasniiKhemjee,
      jagsaalt,
    });
  } catch (err) {
    console.error("Error fetching saved answers:", err);
    next(err);
  }
});

module.exports = router;
