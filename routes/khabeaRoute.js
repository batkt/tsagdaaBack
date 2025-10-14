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

    await HabeaModel.deleteMany({ _id: id });
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
    const data = await HabeaModel.find().sort({ createdAt: -1 });
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
