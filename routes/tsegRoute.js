const express = require('express');
const router = express.Router();
const Tseg = require('../models/tseg');
const Ajiltan = require('../models/ajiltan');
const Tuluvluguu = require('../models/tuluvluguu');
const Khavtgai = require('../models/khavtgai');
const { crud, UstsanBarimt, tokenShalgakh, khuudaslalt } = require('zevback');

crud(router, 'tseg', Tseg, UstsanBarimt);
crud(router, 'khavtgai', Khavtgai, UstsanBarimt);

router.get('/zoosonTseguudAvya', tokenShalgakh, async (req, res, next) => {
  try {
    var body = req.query;
    if (!!body?.query) body.query = JSON.parse(body.query);
    if (!!body?.order) body.order = JSON.parse(body.order);
    if (!!body?.khuudasniiDugaar)
      body.khuudasniiDugaar = Number(body.khuudasniiDugaar);
    if (!!body?.khuudasniiKhemjee)
      body.khuudasniiKhemjee = Number(body.khuudasniiKhemjee);
    if (body?.query) {
      body.query['bairshil.coordinates.0'] = { $exists: true };
    } else
      body = {
        query: {
          'bairshil.coordinates.0': { $exists: true },
        },
      };
    console.log('body.query', body.query);
    khuudaslalt(Tseg, body)
      .then((result) => {
        res.send(result);
      })
      .catch((err) => {
        next(err);
      });
  } catch (error) {
    next(error);
  }
});

router.get('/tsegiinTooAvya', tokenShalgakh, async (req, res, next) => {
  try {
    var body = req.query;
    var match = {};
    if (!!body?.query) body.query = JSON.parse(body.query);
    if (body?.query) {
      match = body.query;
    }
    body = {
      query: {
        'bairshil.coordinates.type': { $exists: true },
      },
    };
    var tseguud = await Tseg.aggregate([
      {
        $match: match,
      },
      {
        $project: {
          ajiltniiToo: { $size: '$ajiltnuud' },
          ajiltnuud: '$ajiltnuud',
        },
      },
      {
        $group: {
          _id: 'aaa',
          too: { $sum: 1 },
          idevkhtei: {
            $sum: {
              $cond: ['ajiltnuud.0', 1, 0],
            },
          },
          idevkhgui: {
            $sum: {
              $cond: ['ajiltnuud.0', 0, 1],
            },
          },
          ajiltniiToo: {
            $sum: '$ajiltniiToo',
          },
        },
      },
    ]);
    res.send(tseguud);
  } catch (error) {
    next(error);
  }
});

router.post('/tsegOlnoorKhadgalya', tokenShalgakh, async (req, res, next) => {
  try {
    var tseguud = req.body.tseguud;
    if (tseguud && tseguud.length > 0) {
      var khadgalakhTseguud = [];
      for await (const tseg of tseguud) {
        khadgalakhTseguud.push(new Tseg(tseg));
      }
      console.log(
        'khadgalakhTseguud',
        JSON.stringify(khadgalakhTseguud, null, 4)
      );
      await Tseg.insertMany(khadgalakhTseguud);
      res.send('Amjilttai');
    } else {
      throw Error('Буруу мэдээлэл!');
    }
  } catch (error) {
    next(error);
  }
});

router.post('/irtsBurguulye', tokenShalgakh, async (req, res, next) => {
  try {
    var ajiltniiId = req.body.ajiltniiId;
    var tsegiinId = req.body.tsegiinId;
    var tseg = await Tseg.findById(tsegiinId);
    if (tseg && tseg.irts && tseg.irts.length > 0) {
      var oldson = tseg.irts.find((a) => a.ajiltan?._id == ajiltniiId);
      if (oldson) throw new Error('Ирц бүртгэгдсэн байна!');
    }
    var ajiltan = await Ajiltan.findById(ajiltniiId);
    if (tseg.irts && tseg.irts.length > 0) {
      console.log('push');
      tseg.irts.push({
        ajiltan: ajiltan,
        ognoo: new Date(),
      });
    } else {
      console.log('set');
      tseg.irts = [
        {
          ajiltan: ajiltan,
          ognoo: new Date(),
        },
      ];
    }
    console.log('tseg.irts', tseg.irts);
    await Tseg.findByIdAndUpdate(tsegiinId, tseg);
    var io = req.app.get('socketio');
    io.emit('irts');
    res.send('Amjilttai');
  } catch (error) {
    next(error);
  }
});

router.get('/irtsJagsaaltAvya', tokenShalgakh, async (req, res, next) => {
  try {
    var match = { 'irts.0': { $exists: true } };
    if (req.query) {
      var body = req.query;
      var tuluvluguuniiId = '';
      if (!!body?.query) body.query = JSON.parse(body.query);
      tuluvluguuniiId = body.query.tuluvluguuniiId;
      if (tuluvluguuniiId) match.tuluvluguuniiId = tuluvluguuniiId;
    }
    var khariu = await Tseg.aggregate([
      {
        $match: match,
      },
      {
        $unwind: '$irts',
      },
      {
        $sort: { 'irts.ognoo': -1 },
      },
    ]);
    res.send(khariu);
  } catch (error) {
    next(error);
  }
});

router.post('/tuluvluguuKhevlejAvya', tokenShalgakh, async (req, res, next) => {
  try {
    var tuluvluguuniiId = req.body.tuluvluguuniiId;
    var butsakhObject = [];
    var tuluvluguu = await Tuluvluguu.findOne({ _id: tuluvluguuniiId });
    var khavtgainuud = await Khavtgai.find({ tuluvluguuniiId });
    
    khavtgainuud.sort((a, b) => {
      return a.kod - b.kod;
    });
    
    for await (const khavtgai of khavtgainuud) {
      var turObject = {};
      turObject.ajiltan = khavtgai.ajiltan;
      turObject.khavtgainNer = khavtgai.ner;
      turObject.khavtgainKod = khavtgai.kod;
      
      // Polygon coordinates бүтэц: coordinates = [[[lon, lat], [lon, lat], ...]]
      // Бидэнд хэрэгтэй нь coordinates[0] (координатуудын массив)
      var tseguud = khavtgai.bairshil.coordinates[0];
      
      // DEBUG: Бүтцийг шалгах
      console.log('Original tseguud:', JSON.stringify(tseguud));
      console.log('First point:', tseguud[0]);
      console.log('Is array of arrays?', Array.isArray(tseguud) && Array.isArray(tseguud[0]));
      
      // Эхний цэгийг төгсгөлд нэмэх (зөвхөн эхнийх нь давтагдаагүй бол)
      if (tseguud.length > 0) {
        const ekhiin = tseguud[0];
        const suuliin = tseguud[tseguud.length - 1];
        
        // Эхний болон сүүлийн цэг ялгаатай бол л нэмнэ
        if (ekhiin[0] !== suuliin[0] || ekhiin[1] !== suuliin[1]) {
          tseguud = [...tseguud, ekhiin];
        }
      }
      
      console.log('Modified tseguud:', JSON.stringify(tseguud));
      
      var oldsonTseguud = await Tseg.aggregate([
        {
          $match: {
            tuluvluguuniiId: tuluvluguuniiId,
            bairshil: {
              $geoWithin: {
                $geometry: {
                  type: 'Polygon',
                  coordinates: [tseguud],
                },
              },
            },
          },
        },
      ]);
      
      turObject.tseguud = oldsonTseguud;
      butsakhObject.push(turObject);
    }
    
    res.send(butsakhObject);
  } catch (error) {
    console.error('Error:', error);
    next(error);
  }
});

router.get('/tuluvluguuStats', tokenShalgakh, async (req, res) => {
  try {
    // Зөвхөн цэг зоосон төвөлөгөөнүүд
    const { year, turul } = req.query;

    if (!year || !turul) {
      return res.status(400).json({
        message: 'Он болон болон орон нутгийн төрөл параметр шаардлагатай.',
      });
    }
    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year}-12-31T23:59:59Z`);

    const matchStage = {
      'tuluvluguu.duusakhOgnoo': {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    if (turul === 'Нийслэл') {
      matchStage['tuluvluguu.niislelEeljuud.0'] = { $exists: true };
    } else {
      matchStage['tuluvluguu.oronNutagEeljuud.0'] = { $exists: true };
    }

    const result = await Tseg.aggregate([
      {
        $addFields: {
          tuluvluguuniiObjectId: { $toObjectId: '$tuluvluguuniiId' },
        },
      },
      {
        $lookup: {
          from: 'tuluvluguu',
          localField: 'tuluvluguuniiObjectId',
          foreignField: '_id',
          as: 'tuluvluguu',
        },
      },
      { $unwind: '$tuluvluguu' },
      {
        $match: matchStage,
      },
      {
        $group: {
          _id: '$tuluvluguuniiId',
          tuluvluguuNer: { $first: '$tuluvluguu.ner' },
          turul: { $first: '$tuluvluguu.turul' },
          duusakhOgnoo: { $first: '$tuluvluguu.duusakhOgnoo' },
          tsegCount: { $sum: 1 },
          ajiltanCount: {
            $sum: {
              $size: { $ifNull: ['$ajiltan', []] },
            },
          },
        },
      },

      {
        $project: {
          _id: 0,
          tuluvluguuniiId: '$_id',
          tuluvluguuNer: 1,
          turul: 1,
          duusakhOgnoo: 1,
          tsegCount: 1,
          ajiltanCount: 1,
        },
      },
    ]);

    return res.json(result);
  } catch (error) {
    console.error('Төлөвлөгөөний статистик алдаа:', error);
    return res.status(500).json({ message: 'Серверийн алдаа.' });
  }
});

module.exports = router;
