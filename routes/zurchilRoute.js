const express = require("express");
const router = express.Router();
const { tokenShalgakh } = require("zevback");

const ZurchilModel = require("../models/zurchil");
const AjiltanModel = require("../models/ajiltan");
const ZurchliinTurulModel = require("../models/zurchliinTurul");
const TsegModel = require("../models/tseg");

router.post("/zurchilShineerBurtgeh", tokenShalgakh, async (req, res, next) => {
  const {
    ajiltanId,
    zurchliinTurulId,
    tsegId,
    register,
    mashiniiDugaar,
    ...otherData
  } = req.body || {};
  try {
    if (!otherData?.tuluvluguuniiID || !otherData?.tuluvluguuniiNer) {
      throw new Error("Төлөвлөгөний мэдээлэл оруулна уу!");
    }
    if (!register) {
      throw new Error("Зөрчил гаргагчийн регистр оруулна уу!");
    }
    if (!mashiniiDugaar) {
      throw new Error("Зөрчил гаргагчийн машины дугаар оруулна уу!");
    }
    if (!tsegId) {
      throw new Error("Цэгийн мэдээлэл оруулаагүй байна!");
    }
    const tseg = await TsegModel.findById(tsegId);
    if (!tseg) {
      throw new Error("Цэгийн мэдээлэл олдсонгүй!");
    }
    if (!ajiltanId) {
      throw new Error("Алба хаагчийн мэдээлэл оруулаагүй байна!");
    }
    const ajiltan = await AjiltanModel.findById(ajiltanId);
    if (!ajiltan) {
      throw new Error("Алба хаагчийн мэдээлэл олдсонгүй!");
    }
    if (!zurchliinTurulId) {
      throw new Error("Зөрчлийн төрлийн мэдээлэл оруулаагүй байна!");
    }
    const zurchliinTurul = await ZurchliinTurulModel.findById(zurchliinTurulId);

    if (!zurchliinTurul) {
      throw new Error("Зөрчлийн төрлийн мэдээлэл олдсонгүй!");
    }

    var newData = new ZurchilModel({
      ...otherData,
      ajiltan,
      tseg,
      register: register?.toLowerCase(),
      mashiniiDugaar: mashiniiDugaar?.toLowerCase(),
      zurchliinId: zurchliinTurul._id,
      zurchliinNer: zurchliinTurul.ner,
      zurchliinTovchlol: zurchliinTurul.tovchlol,
    });
    await newData.save();
    return res.json({
      message: "Амжилттай үүслээ",
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
