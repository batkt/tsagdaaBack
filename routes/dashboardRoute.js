const express = require("express");
const router = express.Router();

const ZurchilModel = require("../models/zurchil");
const AjiltanModel = require("../models/ajiltan");
const HariyaNegjModel = require("../models/hariyaNegj");
const TsegModel = require("../models/tseg");
const { tokenShalgakh } = require("zevback");

function countByHariyaPipeline(params = {}) {
  const { startDate, endDate, buleg } = params;

  const match = {};
  if (startDate && endDate) {
    match.ognoo = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (startDate) {
    match.ognoo = { $gte: new Date(startDate) };
  } else if (endDate) {
    match.ognoo = { $lte: new Date(endDate) };
  }

  const pipeline = [];

  if (Object.keys(match).length) pipeline.push({ $match: match });

  pipeline.push({
    $lookup: {
      from: "hariyaNegj",
      let: { duuregStr: "$ajiltan.duureg" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: [{ $toString: "$_id" }, "$$duuregStr"] },
          },
        },
        ...(buleg && buleg !== "Улс" ? [{ $match: { buleg: buleg } }] : []),
      ],
      as: "hariyaMatched",
    },
  });

  if (buleg && buleg !== "Улс") {
    pipeline.push({ $match: { "hariyaMatched.0": { $exists: true } } });
  }

  pipeline.push({
    $unwind: {
      path: "$hariyaMatched",
      preserveNullAndEmptyArrays: false,
    },
  });

  pipeline.push({
    $group: {
      _id: {
        id: { $toString: "$hariyaMatched._id" },
        ner: "$hariyaMatched.ner",
        buleg: "$hariyaMatched.buleg",
      },
      count: { $sum: 1 },
    },
  });

  pipeline.push({
    $project: {
      _id: "$_id.id",
      ner: "$_id.ner",
      buleg: "$_id.buleg",
      count: 1,
    },
  });

  pipeline.push({ $sort: { count: -1, ner: 1 } });

  return pipeline;
}

function groupByZurchliinNer(params = {}) {
  const { startDate, endDate, duuregId, buleg, sort = "desc" } = params;

  const match = {};
  if (startDate && endDate) {
    match.ognoo = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (startDate) {
    match.ognoo = { $gte: new Date(startDate) };
  } else if (endDate) {
    match.ognoo = { $lte: new Date(endDate) };
  }

  if (duuregId) {
    match["ajiltan.duureg"] = duuregId;
  }

  const pipeline = [];

  if (Object.keys(match).length) pipeline.push({ $match: match });

  // Бүлгийн шүүлт хэрэгтэй бол харьяа нэгжийг lookup
  if (buleg && buleg !== "Улс") {
    pipeline.push({
      $lookup: {
        from: "hariyaNegj",
        let: { ajDuureg: "$ajiltan.duureg" },
        pipeline: [
          {
            $addFields: {
              ajDuuregAsObjectId: {
                $convert: {
                  input: "$$ajDuureg",
                  to: "objectId",
                  onError: null,
                },
              },
            },
          },
          {
            $match: {
              $expr: {
                $or: [
                  // ajiltan.duureg нь ObjectId болж чадвал
                  {
                    $and: [
                      { $ne: ["$ajDuuregAsObjectId", null] },
                      { $eq: ["$_id", "$ajDuuregAsObjectId"] },
                    ],
                  },
                  // Эсвэл string хэлбэрээр харьцуулах
                  { $eq: [{ $toString: "$_id" }, "$$ajDuureg"] },
                ],
              },
            },
          },
          { $match: { buleg: buleg } },
        ],
        as: "hariyaMatched",
      },
    });

    pipeline.push({
      $match: { "hariyaMatched.0": { $exists: true } },
    });
  }

  pipeline.push({
    $group: {
      _id: {
        zurchliinNer: "$zurchliinNer",
        zurchliinTovchlol: "$zurchliinTovchlol",
      },
      count: { $sum: 1 },
    },
  });

  pipeline.push({
    $project: {
      _id: "$_id.zurchliinNer",
      zurchliinTovchlol: "$_id.zurchliinTovchlol",
      total: "$count",
    },
  });

  const sortDir = sort === "asc" ? 1 : -1;
  pipeline.push({ $sort: { total: sortDir, _id: 1 } });

  return pipeline;
}

function groupByOntsgoiZurchliinNer(params = {}) {
  const { startDate, endDate, duuregId, buleg, sort = "desc" } = params;

  const match = {};
  if (startDate && endDate) {
    match.ognoo = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (startDate) {
    match.ognoo = { $gte: new Date(startDate) };
  } else if (endDate) {
    match.ognoo = { $lte: new Date(endDate) };
  }

  const pipeline = [];

  if (Object.keys(match).length) pipeline.push({ $match: match });

  // Зөрчлийн төрлийн мэдээллийг lookup
  pipeline.push({
    $lookup: {
      from: "zurchliinTurul",
      let: {
        zurchNer: "$zurchliinNer",
        zurchTovchlol: "$zurchliinTovchlol",
      },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$ontsgoiBolgoh", true] },
                {
                  $or: [
                    { $eq: ["$ner", "$$zurchNer"] },
                    { $eq: ["$tovchNer", "$$zurchTovchlol"] },
                  ],
                },
              ],
            },
          },
        },
      ],
      as: "zurchliinTurul",
    },
  });

  // Зөвхөн онцгой болгосон зөрчлүүдийг үлдээх
  pipeline.push({
    $match: {
      "zurchliinTurul.0": { $exists: true },
    },
  });

  pipeline.push({
    $addFields: {
      tovchNer: { $arrayElemAt: ["$zurchliinTurul.tovchNer", 0] },
    },
  });

  // Дүүрэгийн шүүлт
  if (duuregId) {
    pipeline.push({
      $match: {
        "ajiltan.duureg": duuregId,
      },
    });
  }

  // Бүлгийн шүүлт хэрэгтэй бол харьяа нэгжийг lookup
  if (buleg && buleg !== "Улс") {
    // ajiltan.duureg-ийг ObjectId болгох (onError нэмсэн)
    pipeline.push({
      $addFields: {
        ajiltanDuuregOid: {
          $convert: {
            input: "$ajiltan.duureg",
            to: "objectId",
            onError: null,
          },
        },
      },
    });

    pipeline.push({
      $lookup: {
        from: "hariyaNegj",
        let: {
          ajDuuregOid: "$ajiltanDuuregOid",
          ajDuuregStr: "$ajiltan.duureg",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  // ObjectId хэлбэрээр харьцуулах
                  {
                    $and: [
                      { $ne: ["$$ajDuuregOid", null] },
                      { $eq: ["$_id", "$$ajDuuregOid"] },
                    ],
                  },
                  // String хэлбэрээр харьцуулах
                  { $eq: [{ $toString: "$_id" }, "$$ajDuuregStr"] },
                ],
              },
            },
          },
          { $match: { buleg: buleg } },
        ],
        as: "hariyaMatched",
      },
    });

    // Харьяа нэгж олдсон эсэхийг шалгах
    pipeline.push({
      $match: { "hariyaMatched.0": { $exists: true } },
    });
  }

  pipeline.push({
    $group: {
      _id: {
        zurchliinNer: "$zurchliinNer",
        zurchliinTovchlol: "$zurchliinTovchlol",
      },
      count: { $sum: 1 },
      tovchNer: { $first: "$tovchNer" },
    },
  });

  pipeline.push({
    $project: {
      _id: "$_id.zurchliinNer",
      tovchNer: 1,
      zurchliinTovchlol: "$_id.zurchliinTovchlol",
      total: "$count",
    },
  });

  const sortDir = sort === "asc" ? 1 : -1;
  pipeline.push({ $sort: { total: sortDir, _id: 1 } });

  return pipeline;
}

function ajiltanZurchilPaginationPipeline(params) {
  const {
    startDate,
    endDate,
    duuregId,
    buleg,
    order = "desc",
    page = 1,
    pageSize = 10,
  } = params || {};

  const match = {};
  if (startDate && endDate) {
    match.ognoo = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (startDate) {
    match.ognoo = { $gte: new Date(startDate) };
  } else if (endDate) {
    match.ognoo = { $lte: new Date(endDate) };
  }

  if (duuregId) {
    match["ajiltan.duureg"] = duuregId;
  }

  const skip = Math.max(0, (Math.max(1, page) - 1) * Math.max(1, pageSize));
  const limit = Math.max(1, pageSize);

  const pipeline = [];

  if (Object.keys(match).length) pipeline.push({ $match: match });

  pipeline.push({
    $lookup: {
      from: "hariyaNegj",
      let: { aj_duureg: "$ajiltan.duureg" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: [{ $toString: "$_id" }, "$$aj_duureg"] },
          },
        },
        ...(buleg && buleg !== "Улс" ? [{ $match: { buleg: buleg } }] : []),
      ],
      as: "hariyaMatched",
    },
  });

  if (buleg && buleg !== "Улс") {
    pipeline.push({ $match: { "hariyaMatched.0": { $exists: true } } });
  }

  pipeline.push({
    $addFields: {
      hariya: { $arrayElemAt: ["$hariyaMatched", 0] },
      aj_id: { $ifNull: ["$ajiltan.id", null] },
      aj_ner: { $ifNull: ["$ajiltan.ner", ""] },
      aj_nevtrekhNer: { $ifNull: ["$ajiltan.nevtrekhNer", ""] },
      aj_duuregStr: { $ifNull: ["$ajiltan.duureg", null] },
      aj_tsol: { $ifNull: ["$ajiltan.tsol", ""] },
      aj_duuregId: { $ifNull: ["$ajiltan.duureg", null] },
    },
  });

  pipeline.push({
    $group: {
      _id: {
        aj_id: { $ifNull: ["$aj_id", "$aj_nevtrekhNer"] },
        ner: "$aj_ner",
        nevtrekhNer: "$aj_nevtrekhNer",
        duuregStr: "$aj_duuregStr",
        hariyaNer: "$hariya.ner",
        tsol: "$aj_tsol",
        duuregId: "$aj_duuregId",
      },
      total: { $sum: 1 },
    },
  });

  pipeline.push({
    $project: {
      _id: "$_id.aj_id",
      ner: "$_id.ner",
      nevtrekhNer: "$_id.nevtrekhNer",
      duureg: {
        $ifNull: ["$_id.hariyaNer", "$_id.duuregStr"],
      },
      tsol: "$_id.tsol",
      duuregId: "$_id.duuregId",
      total: 1,
    },
  });

  const sortDir = order === "asc" ? 1 : -1;
  pipeline.push({ $sort: { total: sortDir, ner: 1 } });

  // Facet-д: paginated data, мөрийн тоо (totalRow), ба бүх 'total' утгын нийлбэр (total)
  pipeline.push({
    $facet: {
      data: [{ $skip: skip }, { $limit: limit }],
      totalCount: [{ $count: "count" }],
      totalSum: [
        {
          $group: {
            _id: null,
            sum: { $sum: "$total" },
          },
        },
      ],
    },
  });

  // Проекц: хүссэн бүтэцтэй болгох
  pipeline.push({
    $project: {
      data: 1,
      totalRow: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
      total: { $ifNull: [{ $arrayElemAt: ["$totalSum.sum", 0] }, 0] },
    },
  });

  return pipeline;
}

const getAllAjiltnuudWithStatus = async (
  tuluvluguuniiId,
  page = 1,
  limit = 10
) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: {
        tuluvluguuniiId: tuluvluguuniiId,
      },
    },
    {
      $unwind: "$ajiltnuud",
    },
    {
      $addFields: {
        tsegNer: "$ner",
        tsegDuureg: "$duureg",
        ajilEkhlekhOgnoo: "$ajiltnuud.khuvaariinEkhlekhOgnoo",
        ajilDuusakhOgnoo: "$ajiltnuud.khuvaariinDuusakhOgnoo",
      },
    },
    {
      $unwind: {
        path: "$irts",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        irtsMatch: {
          $and: [
            { $ifNull: ["$irts", false] },
            { $eq: ["$irts.ajiltan.nevtrekhNer", "$ajiltnuud.nevtrekhNer"] },
            { $gte: ["$irts.ognoo", today] },
            { $lte: ["$irts.ognoo", todayEnd] },
          ],
        },
      },
    },
    {
      $sort: { "irts.ognoo": 1 },
    },

    // Ажилтан + цэг комбинаци бүрээр бүлэглэх
    {
      $group: {
        _id: {
          nevtrekhNer: "$ajiltnuud.nevtrekhNer",
          tsegId: "$_id",
        },
        ajiltan: { $first: "$ajiltnuud" },
        tsegNer: { $first: "$tsegNer" },
        tsegDuureg: { $first: "$tsegDuureg" },
        ajilEkhlekhOgnoo: { $first: "$ajilEkhlekhOgnoo" },
        ajilDuusakhOgnoo: { $first: "$ajilDuusakhOgnoo" },
        irsenOgnoo: {
          $first: {
            $cond: ["$irtsMatch", "$irts.ognoo", null],
          },
        },
      },
    },

    // Статус болон хоцорсон минутыг тооцоолох
    {
      $addFields: {
        odoo: new Date(),
        ajilEkhelsen: {
          $lte: ["$ajilEkhlekhOgnoo", "$$NOW"],
        },
      },
    },
    {
      $addFields: {
        khotorsonMinut: {
          $cond: [
            {
              $and: [
                "$ajilEkhelsen",
                { $ne: ["$irsenOgnoo", null] },
                { $gt: ["$irsenOgnoo", "$ajilEkhlekhOgnoo"] },
              ],
            },
            {
              $round: [
                {
                  $divide: [
                    { $subtract: ["$irsenOgnoo", "$ajilEkhlekhOgnoo"] },
                    60000,
                  ],
                },
                0,
              ],
            },
            0,
          ],
        },
        status: {
          $switch: {
            branches: [
              {
                case: { $gt: ["$ajilEkhlekhOgnoo", "$$NOW"] },
                then: "Ажил эхлээгүй",
              },
              {
                case: { $eq: ["$irsenOgnoo", null] },
                then: "Ирээгүй",
              },
              {
                case: { $gt: ["$irsenOgnoo", "$ajilEkhlekhOgnoo"] },
                then: "Хоцорсон",
              },
            ],
            default: "Цагтаа ирсэн",
          },
        },
      },
    },

    {
      $facet: {
        // Нийт тоо
        totalCount: [{ $count: "count" }],

        // Хоцорсон тоо
        khotsorsonCount: [
          { $match: { status: "Хоцорсон" } },
          { $count: "count" },
        ],

        // Тасалсан (ирээгүй) тоо
        tasalsanCount: [{ $match: { status: "Ирээгүй" } }, { $count: "count" }],

        // Цагтаа ирсэн тоо
        tsagtaaIrsenCount: [
          { $match: { status: "Цагтаа ирсэн" } },
          { $count: "count" },
        ],

        // Ажил эхлээгүй тоо
        ajilEkhleeguiCount: [
          { $match: { status: "Ажил эхлээгүй" } },
          { $count: "count" },
        ],

        data: [
          { $sort: { ajilEkhlekhOgnoo: 1, "ajiltan.ovog": 1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              nevtrekhNer: "$_id.nevtrekhNer",
              tsegId: "$_id.tsegId",
              tsegNer: 1,
              tsegDuureg: 1,
              ovog: "$ajiltan.ovog",
              ner: "$ajiltan.ner",
              kheltes: "$ajiltan.kheltes",
              tasag: "$ajiltan.tasag",
              tsol: "$ajiltan.tsol",
              albanTushaal: "$ajiltan.albanTushaal",
              duureg: "$ajiltan.duureg",
              utas: "$ajiltan.utas",
              mail: "$ajiltan.mail",
              register: "$ajiltan.register",
              khuvaariinNer: "$ajiltan.khuvaariinNer",
              ajilEkhlekhOgnoo: 1,
              ajilDuusakhOgnoo: 1,
              irsenOgnoo: 1,
              khotorsonMinut: 1,
              status: 1,
            },
          },
        ],
      },
    },

    // 10. Эцсийн бүтцийг тохируулах
    {
      $project: {
        niitAjilchdynToo: {
          $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
        },
        khotsorsonToo: {
          $ifNull: [{ $arrayElemAt: ["$khotsorsonCount.count", 0] }, 0],
        },
        tasalsanToo: {
          $ifNull: [{ $arrayElemAt: ["$tasalsanCount.count", 0] }, 0],
        },
        tsagtaaIrsenToo: {
          $ifNull: [{ $arrayElemAt: ["$tsagtaaIrsenCount.count", 0] }, 0],
        },
        ajilEkhleeguiToo: {
          $ifNull: [{ $arrayElemAt: ["$ajilEkhleeguiCount.count", 0] }, 0],
        },
        page: { $literal: page },
        limit: { $literal: limit },
        data: 1,
      },
    },

    {
      $addFields: {
        totalPages: {
          $ceil: { $divide: ["$niitAjilchdiinToo", limit] },
        },
      },
    },
  ];

  const result = await TsegModel.aggregate(pipeline);

  if (result.length === 0) {
    return {
      niitAjilchdiinToo: 0,
      khotsorsonToo: 0,
      tasalsanToo: 0,
      tsagtaaIrsenToo: 0,
      ajilEkhleeguiToo: 0,
      page: page,
      limit: limit,
      totalPages: 0,
      data: [],
    };
  }

  return result[0];
};

const getHariyaNegjAjiltnuudynStatusByBuleg = async (buleg) => {
  // Монголын цагийн бүс (+8 UTC)
  const odoo = new Date();
  const mongolTime = new Date(odoo.getTime() + 8 * 60 * 60 * 1000);

  const today = new Date(mongolTime);
  today.setHours(0, 0, 0, 0);

  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  // АЛХАМ 1: Бүх харьяа нэгжүүдийг авах (бүлгээр шүүсэн)
  const hariyaNegjFilter = buleg ? { buleg: buleg } : {};
  const allHariyaNegj = await HariyaNegjModel.find(hariyaNegjFilter).lean();

  // АЛХАМ 2: Ажилчдын мэдээллийг aggregation-аар авах
  const ajiltnuudPipeline = [
    {
      $lookup: {
        from: "tuluvluguu",
        let: { tuluvluguuniiId: "$tuluvluguuniiId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$_id", { $toObjectId: "$$tuluvluguuniiId" }] },
                  { $eq: ["$idevkhiteiEsekh", true] },
                  { $lte: ["$ekhlekhOgnoo", todayEnd] },
                  { $gte: ["$duusakhOgnoo", today] },
                ],
              },
            },
          },
        ],
        as: "tuluvluguu",
      },
    },

    {
      $match: {
        "tuluvluguu.0": { $exists: true },
      },
    },

    {
      $unwind: "$ajiltnuud",
    },

    {
      $addFields: {
        khuvaariinEkhlekhMongolTime: {
          $add: ["$ajiltnuud.khuvaariinEkhlekhOgnoo", 8 * 60 * 60 * 1000],
        },
        khuvaariinDuusakhMongolTime: {
          $add: ["$ajiltnuud.khuvaariinDuusakhOgnoo", 8 * 60 * 60 * 1000],
        },
      },
    },

    {
      $addFields: {
        onoodrKhuvaartai: {
          $and: [
            { $lte: ["$khuvaariinEkhlekhMongolTime", todayEnd] },
            { $gte: ["$khuvaariinDuusakhMongolTime", today] },
          ],
        },
        ajillajBaigaa: {
          $and: [
            { $lte: ["$khuvaariinEkhlekhMongolTime", mongolTime] },
            { $gte: ["$khuvaariinDuusakhMongolTime", mongolTime] },
          ],
        },
      },
    },

    {
      $match: {
        onoodrKhuvaartai: true,
      },
    },

    // ЦЭГИЙН ДҮҮРЭГ + UNIQUE ажилтан тоолохын тулд
    {
      $group: {
        _id: {
          hariyaNegj: "$duureg", // ЗАСАВ: ajiltnuud.duureg -> $duureg (цэгийн дүүрэг)
          nevtrekhNer: "$ajiltnuud.nevtrekhNer",
        },
        ajillajBaigaa: { $max: "$ajillajBaigaa" },
      },
    },

    // Харьяа нэгж бүрээр дахин бүлэглэх
    {
      $group: {
        _id: "$_id.hariyaNegj",
        onoodrKhuvaartaiAjiltnuudynToo: { $sum: 1 },
        ajillajBaigaaAjiltnuudynToo: {
          $sum: { $cond: ["$ajillajBaigaa", 1, 0] },
        },
        amarchBaigaaAjiltnuudynToo: {
          $sum: { $cond: ["$ajillajBaigaa", 0, 1] },
        },
      },
    },
  ];

  const ajiltnuudResult = await TsegModel.aggregate(ajiltnuudPipeline);

  // АЛХАМ 3: Ажилчдын мэдээллийг Map руу хөрвүүлэх
  const ajiltnuudMap = new Map();
  ajiltnuudResult.forEach((item) => {
    if (item._id) {
      ajiltnuudMap.set(item._id.toString(), {
        onoodrKhuvaartaiAjiltnuudynToo:
          item.onoodrKhuvaartaiAjiltnuudynToo || 0,
        ajillajBaigaaAjiltnuudynToo: item.ajillajBaigaaAjiltnuudynToo || 0,
        amarchBaigaaAjiltnuudynToo: item.amarchBaigaaAjiltnuudynToo || 0,
      });
    }
  });

  // АЛХАМ 4: Бүх харьяа нэгжийг ажилчдын мэдээлэлтэй нэгтгэх
  const duurguud = allHariyaNegj.map((hariyaNegj) => {
    const ajiltnuudData = ajiltnuudMap.get(hariyaNegj._id.toString()) || {
      onoodrKhuvaartaiAjiltnuudynToo: 0,
      ajillajBaigaaAjiltnuudynToo: 0,
      amarchBaigaaAjiltnuudynToo: 0,
    };

    return {
      _id: hariyaNegj._id,
      buleg: hariyaNegj.buleg,
      ner: hariyaNegj.ner,
      onoodrKhuvaartaiAjiltnuudynToo:
        ajiltnuudData.onoodrKhuvaartaiAjiltnuudynToo,
      ajillajBaigaaAjiltnuudynToo: ajiltnuudData.ajillajBaigaaAjiltnuudynToo,
      amarchBaigaaAjiltnuudynToo: ajiltnuudData.amarchBaigaaAjiltnuudynToo,
    };
  });

  // Ажилчдын тоогоор эрэмбэлэх
  duurguud.sort(
    (a, b) =>
      b.onoodrKhuvaartaiAjiltnuudynToo - a.onoodrKhuvaartaiAjiltnuudynToo
  );

  // АЛХАМ 5: Нэгтгэл тооцоолох
  const summary = {
    niitDuureg: duurguud.length,
    niitOnoodrKhuvaartai: duurguud.reduce(
      (sum, d) => sum + d.onoodrKhuvaartaiAjiltnuudynToo,
      0
    ),
    niitAjillajBaigaa: duurguud.reduce(
      (sum, d) => sum + d.ajillajBaigaaAjiltnuudynToo,
      0
    ),
    niitAmarchBaigaa: duurguud.reduce(
      (sum, d) => sum + d.amarchBaigaaAjiltnuudynToo,
      0
    ),
  };

  return {
    buleg: buleg,
    summary,
    duurguud,
  };
};

const getTseguudCountByDuureg = async (params = {}) => {
  const { startDate, endDate, buleg } = params;

  const getMongoTime = (date) => {
    if (!date) return null;
    const d = new Date(date);
    return new Date(d.getTime() + 8 * 60 * 60 * 1000);
  };

  const start = getMongoTime(startDate);
  const end = getMongoTime(endDate);

  const pipeline = [];

  // 1. Төлөвлөгөөнүүдийг огнооны хоорондоос олох
  const tuluvluguuMatch = {};

  if (start && end) {
    tuluvluguuMatch.$or = [
      { ekhlekhOgnoo: { $gte: start, $lte: end } },
      { duusakhOgnoo: { $gte: start, $lte: end } },
      { ekhlekhOgnoo: { $lte: start }, duusakhOgnoo: { $gte: end } },
    ];
  } else if (start) {
    tuluvluguuMatch.duusakhOgnoo = { $gte: start };
  } else if (end) {
    tuluvluguuMatch.ekhlekhOgnoo = { $lte: end };
  }

  pipeline.push({
    $lookup: {
      from: "tuluvluguu",
      let: { tuluvluguuniiId: "$tuluvluguuniiId" },
      pipeline: [
        {
          $match: {
            $expr: { $eq: ["$_id", { $toObjectId: "$$tuluvluguuniiId" }] },
          },
        },
        ...(Object.keys(tuluvluguuMatch).length > 0
          ? [{ $match: tuluvluguuMatch }]
          : []),
      ],
      as: "tuluvluguu",
    },
  });

  pipeline.push({
    $match: {
      "tuluvluguu.0": { $exists: true },
    },
  });

  // Харьяа нэгжийг lookup хийх
  pipeline.push({
    $lookup: {
      from: "hariyaNegj",
      let: { duuregValue: "$duureg" },
      pipeline: [
        {
          $addFields: {
            duuregAsObjectId: {
              $convert: {
                input: "$$duuregValue",
                to: "objectId",
                onError: null,
              },
            },
          },
        },
        {
          $match: {
            $expr: {
              $or: [
                // duureg нь ObjectId болж чадвал _id-тай харьцуулах
                {
                  $and: [
                    { $ne: ["$duuregAsObjectId", null] },
                    { $eq: ["$_id", "$duuregAsObjectId"] },
                  ],
                },
                // duureg нь нэр бол ner-тэй харьцуулах
                { $eq: ["$ner", "$$duuregValue"] },
              ],
            },
          },
        },
        ...(buleg ? [{ $match: { buleg: buleg } }] : []),
      ],
      as: "hariyaNegj",
    },
  });

  pipeline.push({
    $match: {
      "hariyaNegj.0": { $exists: true },
    },
  });

  pipeline.push({
    $unwind: {
      path: "$hariyaNegj",
      preserveNullAndEmptyArrays: false,
    },
  });

  // Дүүргээр бүлэглэх
  pipeline.push({
    $group: {
      _id: "$duureg",
      duureg: { $first: "$hariyaNegj.ner" },
      buleg: { $first: "$hariyaNegj.buleg" },
      tseguudynToo: { $sum: 1 },
    },
  });

  pipeline.push({
    $project: {
      _id: 1,
      duureg: 1,
      buleg: 1,
      tseguudynToo: 1,
    },
  });

  pipeline.push({
    $sort: { tseguudynToo: -1 },
  });

  const result = await TsegModel.aggregate(pipeline);

  const summary = {
    niitDuureg: result.length,
    niitTseg: result.reduce((sum, d) => sum + d.tseguudynToo, 0),
  };

  return { summary, duurguud: result };
};

async function getAttendanceStatistics(input) {
  const { startDate, endDate, duureg, buleg } = input;

  // Огнооны интервал - datetime string-ийг шууд Date object болгоно
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Match шалгуур үүсгэх
  let matchCriteria = {};

  // Бүлгээр шүүх
  if (buleg !== "Улс") {
    // Харьяа нэгжийн ID-г олох
    const hariyaNegjQuery = { buleg };

    if (duureg && duureg !== "Бүх дүүрэг" && duureg !== "Бүх аймаг") {
      // Тодорхой дүүрэг/аймаг сонгосон бол
      hariyaNegjQuery._id = duureg;
    }

    const hariyaNegjList = await HariyaNegjModel.find(hariyaNegjQuery).select("_id");
    const hariyaNegjIds = hariyaNegjList.map((h) => h._id);

    if (hariyaNegjIds.length > 0) {
      matchCriteria.duureg = { $in: hariyaNegjIds };
    } else {
      // Харьяа нэгж олдоогүй бол хоосон үр дүн буцаана
      return {
        totalWorkers: 0,
        onTime: 0,
        late: 0,
        absent: 0,
      };
    }
  }

  // Ажилтнуудын хуваарь огноо интервалд багтах цэгүүдийг олох
  matchCriteria["ajiltnuud.khuvaariinEkhlekhOgnoo"] = { $lte: end };
  matchCriteria["ajiltnuud.khuvaariinDuusakhOgnoo"] = { $gte: start };

  const tsegList = await TsegModel.find(matchCriteria);

  let totalWorkers = 0;
  let onTime = 0;
  let late = 0;
  let absent = 0;

  // Цэг бүрээр давтах
  for (const tseg of tsegList) {
    // Ажилтан бүрээр давтах
    for (const ajiltan of tseg.ajiltnuud) {
      const khuvaariinEkhlekh = new Date(ajiltan.khuvaariinEkhlekhOgnoo);
      const khuvaariinDuusakh = new Date(ajiltan.khuvaariinDuusakhOgnoo);

      // Хуваарийн огноо интервалтай огцолдож байгаа эсэх
      if (khuvaariinEkhlekh <= end && khuvaariinDuusakh >= start) {
        // Тасалсан ажилтан эсэхийг шалгах
        // Дуусах огноо нь endDate-с өмнө бол тасалсан гэж үзнэ
        const isFired = khuvaариinDuusakh < end;

        // Тухайн ажилтны ирцийг шалгах
        const ajiltanIrts = tseg.irts.filter((irts) => {
          // ajiltan object-тэй харьцуулах (register эсвэл бусад unique field ашиглах)
          const irtsAjiltan = irts.ajiltan;
          const irtsOgnoo = new Date(irts.ognoo);

          // Ажилтан таарч байгаа эсэх (register-ээр харьцуулах нь хамгийн найдвартай)
          const isMatchingAjiltan =
            irtsAjiltan &&
            ajiltan.register &&
            irtsAjiltan.register === ajiltan.register;

          // Огноо интервалд багтаж байгаа эсэх
          const isInDateRange = irtsOgnoo >= start && irtsOgnoo <= end;

          return isMatchingAjiltan && isInDateRange;
        });

        totalWorkers++;

        // Тасалсан ажилтан бол ирц байхгүй байж болно
        if (isFired && ajiltanIrts.length === 0) {
          // Тасалсан, ирц байхгүй - тооцохгүй эсвэл тусгай шалгуур хэрэглэх
          // Тасалсан огнооноос өмнөх хугацаанд ирц байгаа эсэхийг шалгах
          const irtsBeforeFired = tseg.irts.filter((irts) => {
            const irtsAjiltan = irts.ajiltan;
            const irtsOgnoo = new Date(irts.ognoo);

            const isMatchingAjiltan =
              irtsAjiltan &&
              ajiltan.register &&
              irtsAjiltan.register === ajiltan.register;

            // Эхлэх огнооноос тасалсан огноо хүртэлх хугацаанд ирц байгаа эсэх
            const isBeforeFired =
              irtsOgnoo >= start && irtsOgnoo <= khuvaариinDuusakh;

            return isMatchingAjiltan && isBeforeFired;
          });

          if (irtsBeforeFired.length === 0) {
            // Тасалсан хүртэл огт ирээгүй
            absent++;
          } else {
            // Тасалсан хүртэл ирцтэй байсан - цагтаа эсвэл хоцорсон шалгах
            const isLate = irtsBeforeFired.some((irts) => {
              const irtsTime = new Date(irts.ognoo);
              const scheduleStart = new Date(khuvaариinEkhlekh);
              scheduleStart.setHours(9, 0, 0, 0);

              return irtsTime > scheduleStart;
            });

            if (isLate) {
              late++;
            } else {
              onTime++;
            }
          }
        } else if (ajiltanIrts.length > 0) {
          // Идэвхтэй ажилтан, ирцтэй
          const isLate = ajiltanIrts.some((irts) => {
            const irtsTime = new Date(irts.ognoo);
            const scheduleStart = new Date(khuvaариinEkhlekh);
            scheduleStart.setHours(9, 0, 0, 0);

            return irtsTime > scheduleStart;
          });

          if (isLate) {
            late++;
          } else {
            onTime++;
          }
        } else {
          // Идэвхтэй ажилтан, ирц байхгүй
          absent++;
        }
      }
    }
  }

  return {
    totalWorkers, // Нийт ажиллах ёстой ажилтан
    onTime, // Цагтаа ирсэн
    late, // Хоцорсон
    absent, // Ирээгүй
  };
}

router.get("/dashboardEmployees", tokenShalgakh, async (req, res, next) => {
  try {
    const {
      start,
      end,
      buleg = "Улс",
      duuregId,
      order = "desc",
      page = "1",
      pageSize = "5",
    } = req.query;
    const tokenData = req.body?.nevtersenAjiltniiToken;
    const userId = tokenData?.id;
    if (!userId) {
      throw new Error("Энэ үйлдлийг хийх эрх байхгүй байна!", 401);
    }

    const dateRange = { startDate: new Date(start), endDate: new Date(end) };

    const match = ajiltanZurchilPaginationPipeline({
      ...dateRange,
      buleg,
      duuregId,
      order,
      page: Number(page),
      pageSize: Number(pageSize),
    });

    const result = await ZurchilModel.aggregate(match);

    return res.json({
      totalRow: result?.[0]?.totalRow || 0,
      employees: result?.[0]?.data || [],
    });
  } catch (err) {
    next(err);
  }
});

router.get(
  "/dashboardZurchilDuurgeer",
  tokenShalgakh,
  async (req, res, next) => {
    try {
      const { start, end, duuregId, buleg = "Улс" } = req.query;
      const tokenData = req.body?.nevtersenAjiltniiToken;
      const userId = tokenData?.id;
      if (!userId) {
        throw new Error("Энэ үйлдлийг хийх эрх байхгүй байна!", 401);
      }

      const dateRange = { startDate: new Date(start), endDate: new Date(end) };

      const pipeline1 = countByHariyaPipeline({
        ...dateRange,
        buleg,
      });
      const duurguudZurchil = await ZurchilModel.aggregate(pipeline1);
      return res.json({
        duurguudZurchil,
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/dashboardZurchilTurluur",
  tokenShalgakh,
  async (req, res, next) => {
    try {
      const { start, end, duuregId, buleg = "Улс" } = req.query;
      const tokenData = req.body?.nevtersenAjiltniiToken;
      const userId = tokenData?.id;
      if (!userId) {
        throw new Error("Энэ үйлдлийг хийх эрх байхгүй байна!", 401);
      }
      const ajiltan = await AjiltanModel.findById(userId);

      const dateRange = { startDate: new Date(start), endDate: new Date(end) };

      const pipeline1 = groupByZurchliinNer({
        ...dateRange,
        buleg,
        duuregId: duuregId,
        ajiltan,
      });

      const pipeline2 = groupByOntsgoiZurchliinNer({
        ...dateRange,
        buleg,
        duuregId: duuregId,
      });

      const result = await ZurchilModel.aggregate(pipeline1);
      const result2 = await ZurchilModel.aggregate(pipeline2);

      const totalSum = result.reduce((sum, item) => sum + item.total, 0);
      return res.json({
        zurchilOntsgoi: result2,
        overview: {
          data: result,
          total: totalSum,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/dashboardIrtsAjiltnuud", tokenShalgakh, async (req, res, next) => {
  const { tuluvluguuniiId } = req.query;

  const ajiltnuud = await getAllAjiltnuudWithStatus(tuluvluguuniiId, 1, 20);
  return res.json(ajiltnuud);
});

router.get("/dashboardIrtsTotal", tokenShalgakh, async (req, res, next) => {
  const { startDate, endDate, buleg, negj } = req.query;

  const result = await getAttendanceStatistics({
    startDate,
    endDate,
    buleg,
    negj,
  });
  return res.json(result);
});

router.get("/dashboardIrtsDuurgeer", tokenShalgakh, async (req, res, next) => {
  const { buleg } = req.query;

  const result = await getHariyaNegjAjiltnuudynStatusByBuleg(buleg);
  return res.json(result);
});

router.get("/dashboardTsegData", tokenShalgakh, async (req, res, next) => {
  try {
    const { start, end, duuregId, buleg } = req.query;
    const tokenData = req.body?.nevtersenAjiltniiToken;
    const userId = tokenData?.id;
    if (!userId) {
      throw new Error("Энэ үйлдлийг хийх эрх байхгүй байна!", 401);
    }

    const result = await getTseguudCountByDuureg({
      startDate: start,
      endDate: end,
      buleg: buleg, // эсвэл null
      duuregId: duuregId, // эсвэл харьяа нэгжийн ID
    });
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
