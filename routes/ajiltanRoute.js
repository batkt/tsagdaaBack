const express = require('express');
const router = express.Router();
const {
  ajiltanTatya,
  ajiltanZagvarAvya,
  tsegTatya,
  tsegZagvarAvya,
  tsegGaraarBurtgeh,
} = require('../controller/ajiltanController');
const excel = require('exceljs');
const { crud, UstsanBarimt, tokenShalgakh, khuudaslalt } = require('zevback');
const multer = require('multer');
const mimetype = require('mime');
const storage = multer.memoryStorage();
const Ajiltan = require('../models/ajiltan');
const Tsol = require('../models/tsol');
const Tasag = require('../models/tasag');
const Tuluvluguu = require('../models/tuluvluguu');
const Kheltes = require('../models/kheltes');
const Zagvar = require('../models/zagvar');
const Zurchil = require('../models/zurchil');
const ZurchliinTurul = require('../models/zurchliinTurul');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const Tseg = require('../models/tseg');
const filter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png'
  )
    cb(null, true);
  else cb(null, false);
};
const upload = multer({
  storage: storage,
  fileFilter: filter,
});
const uploadFile = multer({
  storage: storage,
});

crud(router, 'ajiltan', Ajiltan, UstsanBarimt);
crud(router, 'tsol', Tsol, UstsanBarimt);
crud(router, 'kheltes', Kheltes, UstsanBarimt);
crud(router, 'tasag', Tasag, UstsanBarimt);
crud(router, 'zagvar', Zagvar, UstsanBarimt);
crud(router, 'tuluvluguu', Tuluvluguu, UstsanBarimt);
crud(router, 'zurchil', Zurchil, UstsanBarimt);
crud(router, 'zurchliinTurul', ZurchliinTurul, UstsanBarimt);

router.get('/ajiltanIdgaarAvya/:id', async (req, res, next) => {
  try {
    var asuult = await Ajiltan.findById(req.params.id);
    res.send(asuult);
  } catch (error) {
    next(error);
  }
});
router.get('/ajiltanZagvarAvya', ajiltanZagvarAvya);
router.post('/ajiltanTatya', uploadFile.single('file'), ajiltanTatya);

router.get('/tsegZagvarAvya', tsegZagvarAvya);
router.post('/tsegTatya', uploadFile.single('file'), tsegTatya);
router.post('/tsegGaraarBurtgeh', tsegGaraarBurtgeh);

router.post('/ajiltanNevtrey', async (req, res, next) => {
  try {
    const ajiltan = await Ajiltan.findOne()
      .where('nevtrekhNer')
      .equals(req.body.nevtrekhNer)
      .select('+nuutsUg')
      .catch((err) => {
        next(err);
      });
    console.log(ajiltan);
    if (!ajiltan)
      throw new Error('Хэрэглэгчийн нэр эсвэл нууц үг буруу байна!');
    var ok = await ajiltan.passwordShalgaya(req.body.nuutsUg);
    if (!ok) throw new Error('Хэрэглэгчийн нэр эсвэл нууц үг буруу байна!');

    const jwt = await ajiltan.tokenUusgeye();
    var butsaakhObject = {
      token: jwt,
      result: ajiltan,
      success: true,
    };
    res.send(butsaakhObject);
  } catch (err) {
    next(err);
  }
});

router.post('/nuutsUgSoliyo/:id', tokenShalgakh, async (req, res, next) => {
  try {
    const ajiltan = await Ajiltan.findById(req.params.id);
    ajiltan.isNew = false;
    ajiltan.nuutsUg = req.body.nuutsUg;
    await ajiltan.save();
    res.send('Amjilttai');
  } catch (err) {
    next(err);
  }
});

router.post(
  '/tuluvluguuIdevkhuuljye',
  tokenShalgakh,
  async (req, res, next) => {
    try {
      var tuluvluguuId = req.body.id;
      await Tuluvluguu.updateMany(
        { idevkhiteiEsekh: true },
        { idevkhiteiEsekh: false }
      );
      await Tuluvluguu.findOneAndUpdate(
        { _id: tuluvluguuId },
        { idevkhiteiEsekh: true }
      );
      res.send('Amjilttai');
    } catch (err) {
      next(err);
    }
  }
);
router.get(
  '/idevkhiteiTuluvluguuAvya',
  tokenShalgakh,
  async (req, res, next) => {
    try {
      var a = await Tuluvluguu.findOne({ idevkhiteiEsekh: true });
      res.send(a);
    } catch (err) {
      next(err);
    }
  }
);

router.post('/tokenoorAjiltanAvya', (req, res, next) => {
  try {
    if (!req.headers.authorization) {
      throw new Error('Энэ үйлдлийг хийх эрх байхгүй байна!', 401);
    }
    const token = req.headers.authorization.split(' ')[1];
    const tokenObject = jwt.verify(token, process.env.APP_SECRET, 401);
    console.log(tokenObject);
    Ajiltan.findById(tokenObject.id)
      .then((urDun) => {
        var urdunJson = urDun.toJSON();
        res.send(urdunJson);
      })
      .catch((err) => {
        console.log('aldaa');
        next(err);
      });
  } catch (error) {
    next(error);
  }
});

router.post('/zogsokhTsegAvya', tokenShalgakh, async (req, res, next) => {
  try {
    var idevkhiteiTuluvluguu = await Tuluvluguu.findOne({
      idevkhiteiEsekh: true,
    });
    console.log('idevkhiteiTuluvluguu', idevkhiteiTuluvluguu);
    var ObjectId = require('mongodb').ObjectId;
    console.log('idevkhiteiTuluvluguu', req.body.ajiltniiId);
    var tseg = await Tseg.findOne({
      tuluvluguuniiId: idevkhiteiTuluvluguu._id,
      'ajiltnuud._id': new ObjectId(req.body.nevtersenAjiltniiToken.id),
    });
    res.send(tseg);
  } catch (error) {
    next(error);
  }
});

router.get(
  '/zoogdooguiAjiltniiJagsaaltAvya',
  tokenShalgakh,
  async (req, res, next) => {
    try {
      var body = req.query;
      if (!!body?.query) body.query = JSON.parse(body.query);
      if (!!body?.order) body.order = JSON.parse(body.order);
      if (!!body?.khuudasniiDugaar)
        body.khuudasniiDugaar = Number(body.khuudasniiDugaar);
      if (!!body?.khuudasniiKhemjee)
        body.khuudasniiKhemjee = Number(body.khuudasniiKhemjee);

      var idevkhiteiTuluvluguu = await Tuluvluguu.findOne({
        idevkhiteiEsekh: true,
      });
      var ObjectId = require('mongodb').ObjectId;
      var ajiltniiIdnuud = await Tseg.aggregate([
        {
          $match: {
            tuluvluguuniiId: idevkhiteiTuluvluguu._id.toString(),
            'ajiltnuud.0': {
              $exists: true,
            },
          },
        },
        {
          $unwind: '$ajiltnuud',
        },
        {
          $project: {
            id: {
              $toString: '$ajiltnuud._id',
            },
          },
        },
      ]);
      console.log('ajiltniiIdnuud', ajiltniiIdnuud);
      var idnuud = [];
      if (ajiltniiIdnuud && ajiltniiIdnuud.length > 0) {
        ajiltniiIdnuud.forEach((x) => idnuud.push(ObjectId(x.id)));
      }
      console.log('idnuud', idnuud);

      if (body?.query) {
        body.query['_id'] = {
          $nin: idnuud,
        };
      } else
        body = {
          query: {
            _id: {
              $nin: idnuud,
            },
          },
        };
      khuudaslalt(Ajiltan, body)
        .then((result) => {
          res.send(result);
        })
        .catch((err) => {
          next(err);
        });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
