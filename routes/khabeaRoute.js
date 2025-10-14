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
        };

        if (mur.baiguullagiinId || req.user?.baiguullagaId) {
          newItem.baiguullagiinId =
            mur.baiguullagiinId || req.user?.baiguullagaId;
        }
        if (mur.salbariinId || req.user?.salbarId) {
          newItem.salbariinId = mur.salbariinId || req.user?.salbarId;
        }

        console.log("Saving item:", newItem);
        return newItem;
      });

      const savedData = await HabeaModel.insertMany(asuulguud);
      console.log("Saved successfully:", savedData);
      res.json(true);
    } catch (error) {
      console.error("Error saving asuulga:", error);
      next(error);
    }
  }
);

router.post("/asuulgaAvya", tokenShalgakh, async (req, res, next) => {
  try {
    const {
      query = {},
      khuudasniiDugaar = 1,
      khuudasniiKhemjee = 20,
    } = req.body;

    console.log("Query received:", query);
    console.log("Pagination:", { khuudasniiDugaar, khuudasniiKhemjee });

    const skip = (khuudasniiDugaar - 1) * khuudasniiKhemjee;

    const total = await HabeaModel.countDocuments(query);
    console.log("Total count:", total);

    const jagsaalt = await HabeaModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(khuudasniiKhemjee);

    console.log("Found items:", jagsaalt.length);
    console.log("First item:", jagsaalt[0]);

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

router.get("/habeaAvya", tokenShalgakh, async (req, res, next) => {
  try {
    const data = await HabeaModel.find().sort({ createdAt: -1 });
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/habeaAvyaFiltered", tokenShalgakh, async (req, res, next) => {
  try {
    const { ognoo, ajiltniiId, tuluvluguuniiID } = req.body;

    const query = {};

    if (tuluvluguuniiID) {
      query.tuluvluguuniiID = tuluvluguuniiID;
    }

    if (ognoo && ognoo.$gte && ognoo.$lte) {
      query.ognoo = ognoo;
    }

    if (ajiltniiId) {
      query.ajiltanId = ajiltniiId;
    }

    const data = await HabeaModel.find(query)
      .sort({ createdAt: -1 })
      .populate("ajiltanId", "ner");

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
    next(err);
  }
});

module.exports = router;
