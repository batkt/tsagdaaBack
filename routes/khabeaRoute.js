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
          turul: "asuult", // Mark as question
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

    console.log("Web query received:", query);

    const skip = (khuudasniiDugaar - 1) * khuudasniiKhemjee;

    const total = await HabeaModel.countDocuments(query);
    const jagsaalt = await HabeaModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(khuudasniiKhemjee);

    console.log("Found items:", jagsaalt.length);

    res.json({
      niitMur: total,
      khuudasniiDugaar,
      khuudasniiKhemjee,
      jagsaalt,
    });
  } catch (err) {
    console.error("Error fetching asuulga:", err);
    next(err);
  }
});

router.post("/habeaAvyaFiltered", tokenShalgakh, async (req, res, next) => {
  try {
    const { ognoo } = req.body;

    console.log("Mobile fetch request:", req.body);

    const query = {
      turul: "asuult",
    };

    if (ognoo && ognoo.$gte && ognoo.$lte) {
      query.ognoo = {
        $gte: new Date(ognoo.$gte),
        $lte: new Date(ognoo.$lte),
      };
    }

    console.log("Query:", query);

    const data = await HabeaModel.find(query).sort({ createdAt: -1 }).lean();

    console.log("Found items:", data.length);

    return res.json({
      jagsaalt: data.map((item) => ({
        _id: item._id,
        asuulga: item.asuult,
        asuult: item.asuult,
        ognoo: item.ognoo,
        ajiltanId: item.ajiltanId,
        tuluvluguuniiID: item.tuluvluguuniiID,
        createdAt: item.createdAt,
      })),
      niitMur: data.length,
    });
  } catch (err) {
    console.error("Error in habeaAvyaFiltered:", err);
    return res.status(500).json({
      error: "Server error",
      message: err.message,
    });
  }
});

router.post("/khabTuukhKhadgalya", tokenShalgakh, async (req, res, next) => {
  try {
    const { asuulguud, ajiltniiId, ognoo } = req.body;

    console.log("Received save request:", req.body);

    if (!asuulguud || !Array.isArray(asuulguud) || asuulguud.length === 0) {
      return res.status(400).json({ error: "Asuulguud хоосон байна" });
    }

    if (!ajiltniiId) {
      return res.status(400).json({ error: "Ajiltan ID шаардлагатай" });
    }

    const existingRecord = await HabeaModel.findOne({
      ajiltniiId,
      ognoo: new Date(ognoo),
      turul: "khariult",
    });

    if (existingRecord) {
      existingRecord.asuulguud = asuulguud;
      existingRecord.updatedAt = new Date();
      await existingRecord.save();
      console.log("Updated existing answer record");
    } else {
      await HabeaModel.create({
        ajiltniiId,
        ognoo: new Date(ognoo),
        asuulguud,
        turul: "khariult",
      });
      console.log("Created new answer record");
    }

    res.json("Amjilttai");
  } catch (error) {
    console.error("Error saving khabTuukh:", error);
    next(error);
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

    console.log("Fetching khabTuukh with query:", query);

    const skip = (khuudasniiDugaar - 1) * khuudasniiKhemjee;

    const total = await HabeaModel.countDocuments(query);
    const jagsaalt = await HabeaModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(khuudasniiKhemjee);

    console.log("Found answer records:", jagsaalt.length);

    res.json({
      niitMur: total,
      khuudasniiDugaar,
      khuudasniiKhemjee,
      jagsaalt,
    });
  } catch (err) {
    console.error("Error fetching khabTuukh:", err);
    next(err);
  }
});

module.exports = router;
