const express = require("express");
const router = express.Router();
const { tokenShalgakh } = require("zevback");
const TuluvluguuModel = require("../models/tuluvluguu");

router.post(
  "/tuluvluguundHariyaNegjZooy",
  tokenShalgakh,
  async (req, res, next) => {
    try {
      const oldson = await TuluvluguuModel.findById(req.body?._id);

      if (!oldson) {
        return res.status(400).json({ message: "Төлөвлөгөө олдсонгүй." });
      }

      const tuluvuguuniiEeljuud = [];
      // niislelEeljuud baigaa eseh
      if (oldson?.niislelEeljuud && oldson.niislelEeljuud?.length > 0) {
        oldson.niislelEeljuud.forEach((item) => {
          if (item?.ner) {
            const nerDavhardalt = tuluvuguuniiEeljuud.find(
              (eelj) => eelj.ner === item.ner
            );
            if (!nerDavhardalt) {
              tuluvuguuniiEeljuud.push(item);
            } else {
              tuluvuguuniiEeljuud.push({
                ...item,
                ner: `${item}_1`,
              });
            }
          }
        });
      }

      if (oldson?.oronNutagEeljuud && oldson.oronNutagEeljuud?.length > 0) {
        oldson.oronNutagEeljuud.forEach((item) => {
          if (item?.ner) {
            const nerDavhardalt = tuluvuguuniiEeljuud.find(
              (eelj) => eelj.ner === item.ner
            );
            if (!nerDavhardalt) {
              tuluvuguuniiEeljuud.push(item);
            } else {
              tuluvuguuniiEeljuud.push({
                ...item,
                ner: `${item}_1`,
              });
            }
          }
        });
      }
      await TuluvluguuModel.updateOne(
        {
          _id: req.body?._id,
        },
        {
          $set: {
            ner: req.body?.ner,
            buleg: req.body?.buleg,
            negj: req.body?.negj,
            niislelEeljuud: tuluvuguuniiEeljuud,
            oronNutagEeljuud: [],
          },
        }
      );

      return res.json({
        message: "Амжилттай хадгалагдлаа",
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
