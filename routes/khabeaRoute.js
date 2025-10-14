const express = require("express");
const router = express.Router();
const { tokenShalgakh } = require("zevback");

const HabeaModel = require("../models/habea");

router.post("/habeaShineerBurtgeh", tokenShalgakh, async (req, res, next) => {
  try {
    const dawhardal = await HabeaModel.find({
      tovchlol: req.body?.tovchlol,
      ner: req.body?.ner,
    });

    if (dawhardal?.length > 0) {
      return res.status(400).json({ message: "Давхардаж байна" });
    }

    var newData = new HabeaModel(req.body);
    await newData.save();
    return res.json({
      message: "Амжилттай үүслээ",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/habeaZasah", tokenShalgakh, async (req, res, next) => {
  try {
    const oldson = await HabeaModel.findById(req.body?._id);

    if (!oldson) {
      return res.status(400).json({ message: "ХАБЭА олдсонгүй." });
    }

    console.log(req.body);
    await HabeaModel.updateOne(
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

router.post("/habeaOntsgoiBolgoh", tokenShalgakh, async (req, res, next) => {
  try {
    const oldson = await HabeaModel.findById(req.body?._id);

    if (!oldson) {
      return res.status(400).json({ message: "ХАБЭА олдсонгүй." });
    }

    await HabeaModel.updateOne(
      {
        _id: req.body?._id,
      },
      {
        $set: {
          ontsgoiBolgoh: !oldson.ontsgoiBolgoh,
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

router.get("/habeaAvya", tokenShalgakh, async (req, res, next) => {
  try {
    var data = await HabeaModel.find().sort({ ner: 1 });
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
