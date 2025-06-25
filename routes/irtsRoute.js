const express = require('express');
const router = express.Router();
const TsagdaagiinGazar = require('../models/tsagdaagiinGazar');
const Tukhuurumj = require('../models/tukhuurumj');
const Irts = require('../models/irts');
const { tokenShalgakh, crud, UstsanBarimt } = require('zevback');

const { startOfDay, endOfDay } = require('date-fns');

crud(router, 'tukhuurumj', Tukhuurumj, UstsanBarimt);
crud(router, 'irts', Irts, UstsanBarimt);
crud(router, 'tsagdaagiinGazar', TsagdaagiinGazar, UstsanBarimt);

/*router.get("/locationZasya", tokenShalgakh, async (req, res, next) => {
  try {
    var baiguullaguud = await TsagdaagiinGazar.find({ "bairshil.type": "Point" });
    for await (const tsagdaagiinGazar of baiguullaguud) {
      await TsagdaagiinGazar.updateOne(
        { _id: tsagdaagiinGazar._id },
        {
          $set: {
            "bairshil.coordinates": [
              tsagdaagiinGazar.bairshil.coordinates[1],
              tsagdaagiinGazar.bairshil.coordinates[0],
            ],
          },
        }
      );
    }
    res.send("Amjilttai");
  } catch (err) {
    next(err);
  }
});*/

router.get(
  '/tsagdaagiinGazriinLocationZasya',
  tokenShalgakh,
  async (req, res, next) => {
    try {
      var tsagdaagiinGazaruud = await TsagdaagiinGazar.find({
        'bairshil.type': 'Point',
      });
      for await (const tsagdaagiinGazar of tsagdaagiinGazaruud) {
        tsagdaagiinGazar.bairshil.coordinates = [
          // Swapping Lat/Lon
          tsagdaagiinGazar.bairshil.coordinates[1], // Longitude goes first
          tsagdaagiinGazar.bairshil.coordinates[0], // Latitude goes last
        ];
        tsagdaagiinGazar.save();
      }
      res.send('Amjilttai');
    } catch (err) {
      next(err);
    }
  }
);

router.post('/tukhuurumjBurtgey', tokenShalgakh, async (req, res, next) => {
  try {
    if (!req.body.macKhayag) throw new Error('Төхөөрөмж олдсонгүй!');
    var umnukhTukhuurumj = await Tukhuurumj.findOne({
      tsagdaagiinGazriinId: req.body.tsagdaagiinGazriinId,
      macKhayag: req.body.macKhayag,
    });
    if (umnukhTukhuurumj) throw new Error('Бүртгэлтэй төхөөрөмж байна!');
    var tukhuurumj = new Tukhuurumj();
    tukhuurumj.burtgesenAjiltniiId = req.body.nevtersenAjiltniiToken.id;
    tukhuurumj.burtgesenAjiltniiNer = req.body.nevtersenAjiltniiToken.ner;
    tukhuurumj.turul = 'tukhuurumj';
    tukhuurumj.tsagdaagiinGazriinId = req.body.tsagdaagiinGazriinId;
    tukhuurumj.macKhayag = req.body.macKhayag;
    await tukhuurumj.save();
    res.send('Amjilttai');
  } catch (err) {
    next(err);
  }
});

router.post('/irtsBurtguulye', tokenShalgakh, async (req, res, next) => {
  // console.log('req.body-------- ', req.body);
  try {
    var bairshil = req.body.bairshil;
    var suljeeniiMacKhayag = req.body.suljeeniiMacKhayag;
    if (
      (!suljeeniiMacKhayag || suljeeniiMacKhayag === '02:00:00:00:00:00') &&
      (!bairshil ||
        !Array.isArray(bairshil) ||
        bairshil.length != 2 ||
        bairshil[0] == null ||
        bairshil[0] == undefined ||
        bairshil[1] == null ||
        bairshil[1] == undefined)
    )
      throw new Error(
        'Та байршлын мэдээллийг асаах эсвэл ажлын интернет сүлжээнд холбогдож ирцээ бүртгүүлэх боломжтой!'
      );
    console.log('bairshil', bairshil);
    console.log('suljeeniiMacKhayag', suljeeniiMacKhayag);
    var unuudur = new Date();
    var unuudriinIrts = await Irts.findOne({
      ognoo: new Date(
        unuudur.getFullYear(),
        unuudur.getMonth(),
        unuudur.getDate()
      ),
      ajiltniiId: req.body.nevtersenAjiltniiToken.id,
      tsagdaagiinGazriinId: req.body.tsagdaagiinGazriinId,
    });
    if (unuudriinIrts) throw new Error('Өнөөдрийн ирц бүртгэгдсэн байна!');
    var tsagdaagiinGazar = await TsagdaagiinGazar.findById(
      req.body.tsagdaagiinGazriinId
    ).lean();
    console.log('tsagdaagiinGazar', tsagdaagiinGazar);
    var tukhainTukhuurumj = await Tukhuurumj.findOne({
      tsagdaagiinGazriinId: req.body.tsagdaagiinGazriinId,
      macKhayag: suljeeniiMacKhayag,
    });

    if (!tukhainTukhuurumj && bairshil) {
      if ((bairshil = [null, null])) {
        throw new Error(
          'Та ажлын интернет сүлжээнд холбогдож ирцээ бүртгүүлэх боломжтой!'
        );
      }
      var ObjectId = require('mongodb').ObjectId;
      var query = [
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: bairshil,
            },
            distanceField: 'zai',
          },
        },
      ];
      console.log('query', JSON.stringify(query, null, 4));
      var agg = await TsagdaagiinGazar.aggregate(query);
      console.log('agg', agg);
      if (!agg || agg.length == 0 || agg[0].zai > 200)
        throw new Error('Зөвхөн ажлын байр дээрээс бүртгэл хийх боломжтой!');
    }

    var ekhlekhTsag = new Date(
      unuudur.getFullYear(),
      unuudur.getMonth(),
      unuudur.getDate(),
      0,
      0
    );
    var irts = new Irts();
    irts.ajiltniiId = req.body.nevtersenAjiltniiToken.id;
    irts.ajiltniiNer = req.body.nevtersenAjiltniiToken.ner;
    irts.irsenTsag = new Date();
    irts.ognoo = new Date(
      unuudur.getFullYear(),
      unuudur.getMonth(),
      unuudur.getDate()
    );
    if (irts.irsenTsag > ekhlekhTsag) {
      var khotsorson = irts.irsenTsag - ekhlekhTsag;
      irts.khotsorsonMinut = Math.floor(khotsorson / 1000 / 60);
      irts.turul = 'khotsorson';
    } else if (irts.irsenTsag < ekhlekhTsag) {
      var ertIrsen = ekhlekhTsag - irts.irsenTsag;
      irts.ertIrsenMinut = Math.floor(ertIrsen / 1000 / 60);
    }
    if (tukhainTukhuurumj)
      irts.orsonTurul = {
        tukhuruumjiinId: tukhainTukhuurumj._id,
      };
    else
      irts.orsonTurul = {
        bairlal: bairshil,
        zai: agg[0].zai,
      };
    irts.tsagdaagiinGazriinId = req.body.tsagdaagiinGazriinId;
    irts.save();
    res.send('Amjilttai');
  } catch (err) {
    next(err);
  }
});

router.post('/garsanTsagBurtguulye', tokenShalgakh, async (req, res, next) => {
  try {
    var bairshil = req.body.bairshil;
    var suljeeniiMacKhayag = req.body.suljeeniiMacKhayag;
    console.log('suljeeniiMacKhayag', suljeeniiMacKhayag);
    console.log('bairshil', bairshil);
    if (
      (!suljeeniiMacKhayag || suljeeniiMacKhayag == '02:00:00:00:00:00') &&
      (!bairshil ||
        !Array.isArray(bairshil) ||
        bairshil.length != 2 ||
        bairshil[0] == null ||
        bairshil[0] == undefined ||
        bairshil[1] == null ||
        bairshil[1] == undefined)
    )
      throw new Error(
        'Та байршлын мэдээллийг асаах эсвэл ажлын интернет сүлжээнд холбогдож ирцээ бүртгүүлэх боломжтой!'
      );
    var unuudur = new Date();
    var unuudriinIrts = await Irts.findOne({
      ognoo: new Date(
        unuudur.getFullYear(),
        unuudur.getMonth(),
        unuudur.getDate()
      ),
      ajiltniiId: req.body.nevtersenAjiltniiToken.id,
      tsagdaagiinGazriinId: req.body.tsagdaagiinGazriinId,
    });
    if (unuudriinIrts && unuudriinIrts.yawsanTsag)
      throw new Error('Өнөөдрийн гарсан цаг бүртгэгдсэн байна!');
    else if (!unuudriinIrts)
      throw new Error(
        'Өнөөдрийн ирсэн цаг бүртгэгдээгүй тул гарсан цаг бүртгэх боломжгүй!'
      );
    var tsagdaagiinGazar = await TsagdaagiinGazar.findById(
      req.body.tsagdaagiinGazriinId
    ).lean();
    console.log('tsagdaagiinGazar', tsagdaagiinGazar);

    var tukhainTukhuurumj = await Tukhuurumj.findOne({
      tsagdaagiinGazriinId: req.body.tsagdaagiinGazriinId,
      macKhayag: suljeeniiMacKhayag,
    });
    console.log('tukhainTukhuurumj', tukhainTukhuurumj);
    if (!tukhainTukhuurumj) {
      var ObjectId = require('mongodb').ObjectId;
      var agg = await TsagdaagiinGazar.aggregate([
        {
          $geoNear: {
            near: {
              type: 'Point',
              coordinates: bairshil,
            },
            distanceField: 'zai',
          },
        },
      ]);
      if (!agg || agg.length == 0 || agg[0].zai > 50)
        throw new Error('Зөвхөн ажлын байр дээрээс бүртгэл хийх боломжтой!');
    }
    var tarsanTsag = new Date();
    unuudriinIrts.yawsanTsag = tarsanTsag;
    var khaakhTsag = new Date(
      unuudur.getFullYear(),
      unuudur.getMonth(),
      unuudur.getDate(),
      0,
      0
    );
    if (tarsanTsag > khaakhTsag)
      unuudriinIrts.ajillasanMinut =
        Math.floor(khaakhTsag / 1000 / 60) -
        Math.floor(unuudriinIrts.irsenTsag / 1000 / 60);
    else {
      if (unuudriinIrts.khotsorsonMinut == 0) unuudriinIrts.tuluv == 'kheviin';
      unuudriinIrts.ajillasanMinut =
        Math.floor(tarsanTsag / 1000 / 60) -
        Math.floor(unuudriinIrts.irsenTsag / 1000 / 60);
    }
    if (tukhainTukhuurumj)
      unuudriinIrts.garsanTurul = {
        tukhuruumjiinId: tukhainTukhuurumj._id,
      };
    else
      unuudriinIrts.garsanTurul = {
        bairlal: bairshil,
        zai: agg[0].zai,
      };
    unuudriinIrts.isNew = false;
    unuudriinIrts.save();
    res.send('Amjilttai');
  } catch (err) {
    next(err);
  }
});

router.post('/irtsZasya', tokenShalgakh, async (req, res, next) => {
  try {
    if (!req.body.ognoo) throw Error('Огноо сонгоогүй байна!');
    var ognoo = new Date(req.body.ognoo);
    var irts = await Irts.findOne({
      ognoo: ognoo,
      ajiltniiId: req.body.ajiltniiId,
      tsagdaagiinGazriinId: req.body.tsagdaagiinGazriinId,
    });
    if (!irts) {
      irts = new Irts();
      irts.ajiltniiId = req.body.ajiltniiId;
      irts.ajiltniiNer = req.body.ajiltniiNer;
      irts.ognoo = ognoo;
      irts.tsagdaagiinGazriinId = req.body.tsagdaagiinGazriinId;
    } else irts.isNew = false;
    if (req.body.irsenTsag) {
      irts.irsenTsag = new Date(req.body.irsenTsag);
      irts.orsonTurul = {
        burtgesenTsag: new Date(),
        ajiltniiId: req.body.nevtersenAjiltniiToken.id,
        ajiltniiNer: req.body.nevtersenAjiltniiToken.ner,
      };
    }
    if (req.body.yawsanTsag) {
      irts.yawsanTsag = new Date(req.body.yawsanTsag);
      irts.garsanTurul = {
        burtgesenTsag: new Date(),
        ajiltniiId: req.body.nevtersenAjiltniiToken.id,
        ajiltniiNer: req.body.nevtersenAjiltniiToken.ner,
      };
    }
    if (req.body.chuluuniiTurul) {
      irts.chuluuniiTurul = {
        burtgesenTsag: new Date(),
        tailbar: req.body.chuluuniiTurul.tailbar,
        ekhlekhOgnoo: new Date(req.body.chuluuniiTurul.ekhlekhOgnoo),
        duusakhOgnoo: new Date(req.body.chuluuniiTurul.duusakhOgnoo),
        ajiltniiId: req.body.nevtersenAjiltniiToken.id,
        ajiltniiNer: req.body.nevtersenAjiltniiToken.ner,
      };
    } else irts.chuluuniiTurul = {};
    if (req.body.tasalsanTurul) {
      irts.tasalsanTurul = {
        burtgesenTsag: new Date(),
        tailbar: req.body.tasalsanTurul.tailbar,
        ekhlekhOgnoo: new Date(req.body.tasalsanTurul.ekhlekhOgnoo),
        duusakhOgnoo: new Date(req.body.tasalsanTurul.duusakhOgnoo),
        ajiltniiId: req.body.nevtersenAjiltniiToken.id,
        ajiltniiNer: req.body.nevtersenAjiltniiToken.ner,
      };
    } else irts.tasalsanTurul = {};
    var tsagdaagiinGazar = await TsagdaagiinGazar.findById(
      req.body.tsagdaagiinGazriinId
    ).lean();
    console.log('tsagdaagiinGazar', tsagdaagiinGazar);

    var ekhlekhTsag = new Date(
      ognoo.getFullYear(),
      ognoo.getMonth(),
      ognoo.getDate(),
      0,
      0
    );

    var khaakhTsag = new Date(
      ognoo.getFullYear(),
      ognoo.getMonth(),
      ognoo.getDate(),
      0,
      0
    );
    if (irts.irsenTsag && irts.yawsanTsag) {
      if (irts.irsenTsag > ekhlekhTsag) {
        var khotsorson = irts.irsenTsag - ekhlekhTsag;
        irts.khotsorsonMinut = Math.floor(khotsorson / 1000 / 60);
        irts.ertIrsenMinut = 0;
        if (irts.yawsanTsag > khaakhTsag)
          irts.ajillasanMinut =
            Math.floor(khaakhTsag / 1000 / 60) -
            Math.floor(irts.irsenTsag / 1000 / 60);
        else
          irts.ajillasanMinut =
            Math.floor(irts.yawsanTsag / 1000 / 60) -
            Math.floor(irts.irsenTsag / 1000 / 60);
        irts.tuluv = 'khotsorson';
      } else if (irts.irsenTsag <= ekhlekhTsag) {
        var ertIrsen = ekhlekhTsag - irts.irsenTsag;
        irts.khotsorsonMinut = 0;
        irts.ertIrsenMinut = Math.floor(ertIrsen / 1000 / 60);
        irts.tuluv = 'kheviin';
        if (irts.yawsanTsag > khaakhTsag)
          irts.ajillasanMinut =
            Math.floor(khaakhTsag / 1000 / 60) -
            Math.floor(ekhlekhTsag / 1000 / 60);
        else
          irts.ajillasanMinut =
            Math.floor(irts.yawsanTsag / 1000 / 60) -
            Math.floor(ekhlekhTsag / 1000 / 60);
      }
    }
    if (irts.ajillasanMinut < 0) irts.ajillasanMinut = 0;
    if (irts.khotsorsonMinut > 0) {
      if (
        (irts.chuluuniiTurul && irts.chuluuniiTurul.ekhlekhOgnoo) ||
        (irts.tasalsanTurul && irts.tasalsanTurul.ekhlekhOgnoo)
      )
        irts.tuluv = 'hagas';
    } else if (irts.chuluuniiTurul && irts.chuluuniiTurul.ekhlekhOgnoo)
      irts.tuluv = 'chuluu';
    else if (irts.tasalsanTurul && irts.tasalsanTurul.ekhlekhOgnoo)
      irts.tuluv = 'tasalsan';
    await irts.save();
    res.send('Amjilttai');
  } catch (err) {
    next(err);
  }
});

router.post('/irtsiinMedeeAvya', tokenShalgakh, async (req, res, next) => {
  try {
    var ekhlekhOgnoo = new Date(req.body.ekhlekhOgnoo);
    var duusakhOgnoo = new Date(req.body.duusakhOgnoo);
    var match = {
      ognoo: {
        $gte: ekhlekhOgnoo,
        $lte: duusakhOgnoo,
      },
    };
    if (req.body.ajiltniiId) match.ajiltniiId = req.body.ajiltniiId;
    var khariu = await Irts.aggregate([
      {
        $match: match,
      },
      {
        $group: {
          _id: 'id',
          khotsorson: {
            $sum: {
              $cond: [{ $gt: ['$khotsorsonMinut', 0] }, 1, 0],
            },
          },
          kheviin: {
            $sum: {
              $cond: [{ $eq: ['$tuluv', 'kheviin'] }, 1, 0],
            },
          },
          tasalsan: {
            $sum: {
              $cond: ['$tasalsanTurul.ekhlekhOgnoo', 1, 0],
            },
          },
          chuluu: {
            $sum: {
              $cond: ['$chuluuniiTurul.ekhlekhOgnoo', 1, 0],
            },
          },
        },
      },
    ]);
    res.send(khariu);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/irtsiinMedeeAjiltnaarAvya',
  tokenShalgakh,
  async (req, res, next) => {
    try {
      var ekhlekhOgnoo = new Date(req.body.ekhlekhOgnoo);
      var duusakhOgnoo = new Date(req.body.duusakhOgnoo);
      var match = {
        ognoo: {
          $gte: ekhlekhOgnoo,
          $lte: duusakhOgnoo,
        },
      };
      if (req.body.ajiltniiId) match.ajiltniiId = req.body.ajiltniiId;
      var khariu = await Irts.aggregate([
        {
          $match: match,
        },
        {
          $addFields: {
            objectId: {
              $toObjectId: '$ajiltniiId',
            },
          },
        },
        {
          $lookup: {
            from: 'ajiltan',
            let: {
              ajiltniiId: '$objectId',
              tsagdaagiinGazriinId: '$tsagdaagiinGazriinId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$ajiltniiId'] },
                      {
                        $eq: [
                          '$tsagdaagiinGazriinId',
                          '$$tsagdaagiinGazriinId',
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'ajiltan',
          },
        },
        {
          $project: {
            khotsorsonMinut: 1,
            ajillasanMinut: 1,
            tasalsanTurul: 1,
            chuluuniiTurul: 1,
            ajiltan: { $arrayElemAt: ['$ajiltan', 0] },
            tasalsanMinut: '0',
            chuluuniiMinut: '0',
          },
        },
        {
          $group: {
            _id: {
              ajiltniiId: '$ajiltan._id',
              ajiltniiNer: '$ajiltan.ner',
              zurgiinNer: '$ajiltan.zurgiinNer',
            },
            khotsorsonMinut: {
              $sum: '$khotsorsonMinut',
            },
            ajillasanMinut: {
              $sum: '$ajillasanMinut',
            },
            tasalsanMinut: {
              $sum: '$tasalsanMinut',
            },
            chuluuniiMinut: {
              $sum: '$chuluuniiMinut',
            },
          },
        },
      ]);
      res.send(khariu);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/irtsiinMedeeSaraarAvya',
  tokenShalgakh,
  async (req, res, next) => {
    try {
      var ekhlekhOgnoo = new Date(req.body.ekhlekhOgnoo);
      var duusakhOgnoo = new Date(req.body.duusakhOgnoo);
      var khariu = await Irts.aggregate([
        {
          $match: {
            ognoo: {
              $gte: ekhlekhOgnoo,
              $lte: duusakhOgnoo,
            },
            tsagdaagiinGazriinId: req.body.tsagdaagiinGazriinId,
          },
        },
        {
          $addFields: {
            objectId: {
              $toObjectId: '$ajiltniiId',
            },
          },
        },
        {
          $lookup: {
            from: 'ajiltan',
            let: {
              ajiltniiId: '$objectId',
              tsagdaagiinGazriinId: '$tsagdaagiinGazriinId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$_id', '$$ajiltniiId'] },
                      {
                        $eq: [
                          '$tsagdaagiinGazriinId',
                          '$$tsagdaagiinGazriinId',
                        ],
                      },
                    ],
                  },
                },
              },
            ],
            as: 'ajiltan',
          },
        },

        {
          $project: {
            ajiltniiNer: 1,
            ognoo: 1,
            tuluv: 1,
            ajiltan: { $arrayElemAt: ['$ajiltan', 0] },
          },
        },
        {
          $group: {
            _id: {
              ajiltniiId: '$ajiltan._id',
              ajiltniiNer: '$ajiltniiNer',
              zurgiinNer: '$ajiltan.zurgiinNer',
            },
            irts: {
              $push: {
                udur: {
                  $dayOfMonth: {
                    date: '$ognoo',
                    timezone: 'Asia/Ulaanbaatar',
                  },
                },
                tuluv: '$tuluv',
              },
            },
          },
        },
      ]);
      res.send(khariu);
    } catch (err) {
      next(err);
    }
  }
);

router.get('/unuudriinIrtsAvya', tokenShalgakh, async (req, res, next) => {
  try {
    if (!req.body.nevtersenAjiltniiToken || !req.body.nevtersenAjiltniiToken.id)
      throw Error('Токены мэдээлэл дутуу байна!');
    var unuudur = new Date();
    var unuudriinIrts = await Irts.findOne({
      ognoo: new Date(
        unuudur.getFullYear(),
        unuudur.getMonth(),
        unuudur.getDate()
      ),
      ajiltniiId: req.body.nevtersenAjiltniiToken.id,
      tsagdaagiinGazriinId: req.body.tsagdaagiinGazriinId,
    });
    res.send(unuudriinIrts);
  } catch (err) {
    next(err);
  }
});

router.get('/irtsStats', tokenShalgakh, async (req, res, next) => {
  try {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);

    const [workingToday, onLeave, absentCount, lateCount, groupedByGazriinId] =
      await Promise.all([
        // 1. Үүрэг гүйцэтгэж байгаа ажилчид
        Irts.countDocuments({
          ognoo: { $gte: start, $lte: end },
          // yawsanTsag: null,
          chuluuniiTurul: null,
          tasalsanTurul: null,
        }),

        // 2. Чөлөөтэй ажилчид
        Irts.countDocuments({
          ognoo: { $gte: start, $lte: end },
          tuluv: 'chuluu',
        }),

        // 4. Тасалсан ажилчид
        Irts.countDocuments({
          ognoo: { $gte: start, $lte: end },
          tuluv: 'tasalsan',
        }),

        // 5. Хоцорсон ажилчид
        Irts.countDocuments({
          ognoo: { $gte: start, $lte: end },
          tuluv: 'khotsorson',
        }),

        // 3. Үүрэг гүйцэтгэж байгаа ажилчидыг tsagdaagiinGazriinId-р бүлэглэх
        Irts.aggregate([
          {
            $match: {
              ognoo: { $gte: start, $lte: end },
              // yawsanTsag: null,
              chuluuniiTurul: null,
              tasalsanTurul: null,
            },
          },
          {
            $group: {
              _id: '$tsagdaagiinGazriinId',
              count: { $sum: 1 },
            },
          },
          {
            $addFields: {
              objectIdField: { $toObjectId: '$_id' },
            },
          },
          {
            $lookup: {
              from: 'tsagdaagiinGazar', // жинхэнэ collection нэр
              localField: 'objectIdField',
              foreignField: '_id',
              as: 'gazriinMedeelel',
            },
          },
          { $unwind: '$gazriinMedeelel' },
          {
            $project: {
              _id: 0,
              tsagdaagiinGazriinId: '$_id',
              ajillajBuigToo: '$count',
              kod: '$gazriinMedeelel.kod',
              ner: '$gazriinMedeelel.ner',
            },
          },
        ]),
      ]);

    return res.send({
      workingToday,
      onLeave,
      absentCount,
      lateCount,
      groupedByGazriinId,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Чөлөө, амралт, өвчтэй бүртгэх
 */
router.post('/irtsChuluu', tokenShalgakh, async (req, res) => {
  try {
    const {
      ajiltniiId,
      ajiltniiNer,
      turul,
      tailbar, // Амралт, Өвчтэй гэх мэт
      ekhlekhOgnoo,
      duusakhOgnoo,
      burtgesenAjiltniiId,
      burtgesenAjiltniiNer,
    } = req.body;

    if (!ajiltniiId || !ekhlekhOgnoo || !duusakhOgnoo) {
      return res
        .status(400)
        .json({ message: 'Заавал шаардлагатай талбар дутуу байна.' });
    }

    const startDate = new Date(ekhlekhOgnoo);
    const endDate = new Date(duusakhOgnoo);

    const days = [];
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      days.push(new Date(d));
    }

    // Амралттай бүх өдрүүдээр ирц үүсгэх
    const newIrtsList = days.map((day) => ({
      ajiltniiId,
      ajiltniiNer,
      ognoo: day,
      tuluv: 'chuluu',
      turul,
      chuluuniiTurul: {
        ajiltniiId,
        ajiltniiNer,
        tailbar,
        ekhlekhOgnoo: startDate,
        duusakhOgnoo: endDate,
        burtgesenTsag: new Date(),
      },
      burtgesenOgnoo: new Date(),
      burtgesenAjiltniiId,
      burtgesenAjiltniiNer,
    }));

    await Irts.insertMany(newIrtsList);
    return res.status(201).json({
      isOk: true,
      message: 'Амжилттай бүртгэгдлээ.',
      days: newIrtsList.length,
    });
  } catch (error) {
    console.error('Ирц бүртгэхэд алдаа:', error);
    return res.status(500).json({ message: 'Серверийн алдаа.' });
  }
});

module.exports = router;
