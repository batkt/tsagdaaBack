const express = require("express");
const router = express.Router();
const { tokenShalgakh } = require("zevback");

const ZurchliinTurulModel = require("../models/zurchliinTurul");

router.post(
  "/zurchliinTurulShineerBurtgeh",
  tokenShalgakh,
  async (req, res, next) => {
    try {
      const dawhardal = await ZurchliinTurulModel.find({
        tovchlol: req.body?.tovchlol,
        ner: req.body?.ner,
      });

      if (dawhardal?.length > 0) {
        return res.status(400).json({ message: "Давхардаж байна" });
      }

      var newData = new ZurchliinTurulModel(req.body);
      await newData.save();
      return res.json({
        message: "Амжилттай үүслээ",
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/zurchliinTurulZasah", tokenShalgakh, async (req, res, next) => {
  try {
    const oldson = await ZurchliinTurulModel.findById(req.body?._id);

    if (!oldson) {
      return res.status(400).json({ message: "Зөрчлийн төрөл олдсонгүй." });
    }

    await ZurchliinTurulModel.updateOne(
      {
        _id: req.body?._id,
      },
      {
        $set: {
          tovchlol: req.body?.tovchlol,
          ner: req.body?.ner,
        },
      }
    );

    return res.json({
      message: "Амжилттай хадгалагдлаа",
    });
  } catch (err) {
    next(err);
  }
});

router.get("/zurchliinTurulAvya", tokenShalgakh, async (req, res, next) => {
  try {
    var data = await ZurchliinTurulModel.find().sort({ ner: 1 });
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
