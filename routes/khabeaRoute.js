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
        if (!mur.baiguullagiinId) mur.baiguullagiinId = req.user?.baiguullagaId;
        if (!mur.salbariinId) mur.salbariinId = req.user?.salbarId;
        if (!mur.ajiltanId) mur.ajiltanId = req.user?._id;
        return new HabeaModel(mur);
      });

      await HabeaModel.insertMany(asuulguud);
      res.json({ message: "Амжилттай хадгалагдлаа" });
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
    res.json({ message: "Амжилттай устгагдлаа" });
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

    if (!query.baiguullagiinId && req.user?.baiguullagaId) {
      query.baiguullagiinId = req.user.baiguullagaId;
    }
    if (!query.salbariinId && req.user?.salbarId) {
      query.salbariinId = req.user.salbarId;
    }

    const skip = (khuudasniiDugaar - 1) * khuudasniiKhemjee;

    const total = await HabeaModel.countDocuments(query);
    const jagsaalt = await HabeaModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(khuudasniiKhemjee);

    res.json({
      niitMur: total,
      khuudasniiDugaar,
      khuudasniiKhemjee,
      jagsaalt,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/habeaAvya", tokenShalgakh, async (req, res, next) => {
  try {
    const query = {};

    if (req.user?.baiguullagaId) {
      query.baiguullagiinId = req.user.baiguullagaId;
    }
    if (req.user?.salbarId) {
      query.salbariinId = req.user.salbarId;
    }

    const data = await HabeaModel.find(query).sort({ createdAt: -1 });
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post("/habeaAvyaFiltered", tokenShalgakh, async (req, res, next) => {
  try {
    const { ognoo, ajiltniiId } = req.body;

    const query = {
      baiguullagiinId: req.user?.baiguullagaId,
      salbariinId: req.user?.salbarId,
    };

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
        baiguullagiinId: item.baiguullagiinId,
        salbariinId: item.salbariinId,
        createdAt: item.createdAt,
      })),
      niitMur: data.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
