const express = require("express");
const router = express.Router();
const { crud, UstsanBarimt, tokenShalgakh } = require("zevback");

const HariyaNegj = require("../models/hariyaNegj");

crud(router, "hariyaNegj", HariyaNegj, UstsanBarimt);

router.post("/hariyaNegjShineerBurtgeh", tokenShalgakh, async (req, res, next) => {
  try {
    const dawhardal = await HariyaNegj.find({
      buleg: req.body?.buleg,
      ner: req.body?.ner,
      tovchlol: req.body?.tovchlol,
    });

    if (dawhardal?.length > 0) {
      return res.status(400).json({ message: "Давхардаж байна" });
    }

    var hariyaNegj = new HariyaNegj(req.body);
    await hariyaNegj.save();
    return res.json({
      message: "Амжилттай үүслээ",
    });
  } catch (err) {
    next(err);
  }
});

router.post("/hariyaNegjZasah", tokenShalgakh, async (req, res, next) => {
  try {
    const oldson = await HariyaNegj.findById(req.body?._id);

    if (!oldson) {
      return res.status(400).json({ message: "Харьяа нэгж олдсонгүй." });
    }

    await HariyaNegj.updateOne(
      {
        _id: req.body?._id,
      },
      {
        $set: {
          buleg: req.body?.buleg,
          ner: req.body?.ner,
          tovchlol: req.body?.tovchlol,
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

router.get("/hariyaNegjuudAvya", tokenShalgakh, async (req, res, next) => {
  try {
    var hariyaNegjuud = await HariyaNegj.find().sort({ ner: 1 });
    return res.json(hariyaNegjuud);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
