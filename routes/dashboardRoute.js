const express = require("express");
const router = express.Router();

const ZurchilModel = require("../models/zurchil");
const AjiltanModel = require("../models/ajiltan");
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

router.get("/dashboardDataAvya", tokenShalgakh, async (req, res, next) => {
  try {
    const { start, end, negj, buleg = "Улс" } = req.query;
    const tokenData = req.body?.nevtersenAjiltniiToken;
    const userId = tokenData?.id;
    if (!userId) {
      throw new Error("Энэ үйлдлийг хийх эрх байхгүй байна!", 401);
    }
    const ajiltan = await AjiltanModel.findById(userId);

    const dateRange = { startDate: new Date(start), endDate: new Date(end) };

    const pipeline1 = countByHariyaPipeline({
      ...dateRange,
      buleg,
    });
    const duurguudZurchil = await ZurchilModel.aggregate(pipeline1);
    const pipeline2 = groupByZurchliinNer({
      ...dateRange,
      buleg,
      duuregId: negj,
      ajiltan,
    });
    const result = await ZurchilModel.aggregate(pipeline2);
    const totalSum = result.reduce((sum, item) => sum + item.total, 0);
    return res.json({
      duurguudZurchil,
      overview: {
        data: result,
        total: totalSum,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/dashboardIrtsAjiltnuud", tokenShalgakh, async (req, res, next) => {
  const { tuluvluguuniiId } = req.query;

  const ajiltnuud = await getAllAjiltnuudWithStatus(tuluvluguuniiId, 1, 20);
  console.log(ajiltnuud);
  return res.json(ajiltnuud);
});

module.exports = router;
