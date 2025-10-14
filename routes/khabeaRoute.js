const express = require("express");
const router = express.Router();
const { tokenShalgakh } = require("zevback");
const HabeaModel = require("../models/habea");

router.post(
  "/asuulgaOlnoorKhadgalya",
  tokenShalgakh,
  async (req, res, next) => {
    try {
      if (!Array.isArray(req.body) || req.body.length === 0)
        return res.status(400).json({ message: "Асуумж хоосон байна" });

      await HabeaModel.insertMany(req.body);
      res.json({ message: "Амжилттай бүртгэгдлээ" });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/asuulgaUstgay", tokenShalgakh, async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "ID байхгүй байна" });

    await HabeaModel.findByIdAndDelete(id);
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

module.exports = router;
