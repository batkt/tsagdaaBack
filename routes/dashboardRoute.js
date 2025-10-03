const express = require("express");
const router = express.Router();

const ZurchilModel = require("../models/zurchil");
const AjiltanModel = require("../models/ajiltan");
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
      _id: { zurchliinNer: "$zurchliinNer" },
      count: { $sum: 1 },
    },
  });

  pipeline.push({
    $project: {
      _id: "$_id.zurchliinNer",
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

  pipeline.push({
    $facet: {
      data: [{ $skip: skip }, { $limit: limit }],
      totalCount: [{ $count: "count" }],
    },
  });

  pipeline.push({
    $project: {
      data: 1,
      total: { $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0] },
    },
  });

  return pipeline;
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

module.exports = router;
