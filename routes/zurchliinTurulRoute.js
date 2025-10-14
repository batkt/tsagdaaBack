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
      if (!Array.isArray(req.body) || req.body.length === 0)
        return res.status(400).json({ message: "Асуумж хоосон байна" });

      // Get ajiltan info from token
      const ajiltan = await AjiltanModel.findById(req.ajiltanId);

      if (!ajiltan) {
        return res.status(401).json({ message: "Хэрэглэгч олдсонгүй" });
      }

      const baiguullagiinId = ajiltan.duureg;
      const salbariinId = ajiltan.tasag || ajiltan.kheltes;

      if (!baiguullagiinId || !salbariinId) {
        return res.status(400).json({
          message: "Дүүрэг эсвэл тасаг/хэлтсийн мэдээлэл олдсонгүй",
        });
      }

      const dataToInsert = req.body.map((item) => ({
        asuult: item.asuult,
        baiguullagiinId: baiguullagiinId,
        salbariinId: salbariinId,
        ognoo: item.ognoo || new Date(),
      }));

      await HabeaModel.insertMany(dataToInsert);
      res.json({ message: "Амжилттай бүртгэгдлээ" });
    } catch (err) {
      console.error("Error in asuulgaOlnoorKhadgalya:", err);
      next(err);
    }
  }
);

router.post("/asuulgaUstgay", tokenShalgakh, async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "ID байхгүй байна" });

    const deleted = await HabeaModel.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Асуумж олдсонгүй" });
    }

    res.json({ message: "Амжилттай устгалаа" });
  } catch (err) {
    next(err);
  }
});

router.post("/asuulgaAvya", tokenShalgakh, async (req, res, next) => {
  try {
    const {
      query = {},
      khuudasniiDugaar = 1,
      khuudasniiKhemjee = 20,
    } = req.body;
    const skip = (khuudasniiDugaar - 1) * khuudasniiKhemjee;

    const ajiltan = await AjiltanModel.findById(req.ajiltanId);

    if (ajiltan && ajiltan.erkh !== "Super admin") {
      query.baiguullagiinId = ajiltan.duureg;
      query.salbariinId = ajiltan.tasag || ajiltan.kheltes;
    }

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
    const ajiltan = await AjiltanModel.findById(req.ajiltanId);

    if (!ajiltan) {
      return res.status(401).json({ message: "Хэрэглэгч олдсонгүй" });
    }

    let query = {};

    if (ajiltan.erkh !== "Super admin") {
      query.baiguullagiinId = ajiltan.duureg;
      query.salbariinId = ajiltan.tasag || ajiltan.kheltes;
    }

    const data = await HabeaModel.find(query).sort({ createdAt: -1 });

    return res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
