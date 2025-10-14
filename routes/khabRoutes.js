// routes/khabRoutes.js
const express = require("express");
const router = express.Router();
const Habea = require("../models/habea");
const moment = require("moment");

// Save KHAB answers with signature (shared with web)
router.post("/khabTuukhKhadgalya", async (req, res) => {
  try {
    const {
      ajiltniiId,
      baiguullagiinId,
      salbariinId,
      ognoo,
      asuulguud,
      gariinUseg,
      platform = "mobile", // 'mobile' or 'web'
    } = req.body;

    console.log("Saving KHAB data from", platform, ":", {
      ajiltniiId,
      baiguullagiinId,
      salbariinId,
      ognoo,
      asuulguudCount: asuulguud?.length,
      hasSignature: !!gariinUseg,
    });

    // Validate required fields
    if (!ajiltniiId || !ognoo || !asuulguud || asuulguud.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Шаардлагатай талбаруудыг бөглөнө үү",
      });
    }

    // Signature is required for mobile, optional for web
    if (platform === "mobile" && !gariinUseg) {
      return res.status(400).json({
        success: false,
        message: "Гарын үсэг шаардлагатай",
      });
    }

    const formattedDate = moment(ognoo).format("YYYY-MM-DD");

    // Save each question-answer pair as a separate document
    const operations = asuulguud.map((asuult) => ({
      updateOne: {
        filter: {
          ajiltanId: ajiltniiId,
          baiguullagiinId,
          salbariinId,
          asuult: asuult.asuulga,
          ognoo: {
            $gte: moment(formattedDate).startOf("day").toDate(),
            $lte: moment(formattedDate).endOf("day").toDate(),
          },
          turul: "khariult",
        },
        update: {
          $set: {
            ajiltanId: ajiltniiId,
            baiguullagiinId,
            salbariinId,
            asuult: asuult.asuulga,
            ognoo: moment(formattedDate).toDate(),
            asuulguud: [
              {
                asuulga: asuult.asuulga,
                khariult: asuult.khariult,
                tailbar: asuult.tailbar || "",
              },
            ],
            gariinUseg: gariinUseg || null,
            turul: "khariult",
            platform,
          },
        },
        upsert: true,
      },
    }));

    const result = await Habea.bulkWrite(operations);

    console.log("Bulk write result:", {
      inserted: result.upsertedCount,
      modified: result.modifiedCount,
      matched: result.matchedCount,
    });

    res.json("Amjilttai");
  } catch (error) {
    console.error("Error saving KHAB:", error);
    res.status(500).json({
      success: false,
      message: "Хадгалахад алдаа гарлаа",
      error: error.message,
    });
  }
});

// Get KHAB history (shared with web)
router.post("/khabTuukhAvya", async (req, res) => {
  try {
    const { query, khuudasniiDugaar = 1, khuudasniiKhemjee = 20 } = req.body;

    console.log("Fetching KHAB history with query:", query);

    // Build query for answers only
    const searchQuery = {
      turul: "khariult",
      ...query,
    };

    // Remove null values
    Object.keys(searchQuery).forEach((key) => {
      if (searchQuery[key] === null) {
        delete searchQuery[key];
      }
    });

    const skip = (khuudasniiDugaar - 1) * khuudasniiKhemjee;

    const [jagsaalt, niitMur] = await Promise.all([
      Habea.find(searchQuery)
        .sort({ ognoo: -1, createdAt: -1 })
        .skip(skip)
        .limit(khuudasniiKhemjee)
        .lean(),
      Habea.countDocuments(searchQuery),
    ]);

    // Group by date for mobile app
    const groupedByDate = {};
    jagsaalt.forEach((item) => {
      const dateKey = moment(item.ognoo).format("YYYY-MM-DD");
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          ognoo: item.ognoo,
          ajiltanId: item.ajiltanId,
          baiguullagiinId: item.baiguullagiinId,
          salbariinId: item.salbariinId,
          gariinUseg: item.gariinUseg,
          asuulguud: [],
          platform: item.platform,
        };
      }
      groupedByDate[dateKey].asuulguud.push(...(item.asuulguud || []));
    });

    const formattedJagsaalt = Object.values(groupedByDate);

    const niitKhuudas = Math.ceil(niitMur / khuudasniiKhemjee);

    res.json({
      jagsaalt: formattedJagsaalt,
      niitMur,
      niitKhuudas,
      khuudasniiDugaar,
    });
  } catch (error) {
    console.error("Error fetching KHAB history:", error);
    res.status(500).json({
      success: false,
      message: "Өгөгдөл татахад алдаа гарлаа",
      error: error.message,
    });
  }
});

// Get HABEA questions (shared with web)
router.post("/habeaAvyaFiltered", async (req, res) => {
  try {
    const { baiguullagiinId, salbariinId } = req.body;

    console.log("Fetching HABEA questions");

    // Get only question templates (turul: 'asuult')
    const questions = await Habea.find({
      turul: "asuult",
      ...(baiguullagiinId && { baiguullagiinId }),
      ...(salbariinId && { salbariinId }),
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      jagsaalt: questions.map((q) => ({
        _id: q._id,
        asuult: q.asuult,
        asuulga: q.asuult,
      })),
      niitMur: questions.length,
    });
  } catch (error) {
    console.error("Error fetching HABEA questions:", error);
    res.status(500).json({
      success: false,
      message: "Асуултууд татахад алдаа гарлаа",
      error: error.message,
    });
  }
});

// Create/Update HABEA question (admin - web only)
router.post("/habeaUusgeh", async (req, res) => {
  try {
    const { asuult, baiguullagiinId, salbariinId, ajiltanId } = req.body;

    if (!asuult) {
      return res.status(400).json({
        success: false,
        message: "Асуулт оруулна уу",
      });
    }

    const newQuestion = new Habea({
      asuult,
      baiguullagiinId,
      salbariinId,
      ajiltanId,
      turul: "asuult",
    });

    await newQuestion.save();

    res.json({
      success: true,
      message: "Асуулт амжилттай нэмэгдлээ",
      data: newQuestion,
    });
  } catch (error) {
    console.error("Error creating HABEA question:", error);
    res.status(500).json({
      success: false,
      message: "Асуулт үүсгэхэд алдаа гарлаа",
      error: error.message,
    });
  }
});

// Delete HABEA question (admin - web only)
router.delete("/habeaUstgah/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await Habea.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Асуулт олдсонгүй",
      });
    }

    res.json({
      success: true,
      message: "Асуулт амжилттай устгагдлаа",
    });
  } catch (error) {
    console.error("Error deleting HABEA question:", error);
    res.status(500).json({
      success: false,
      message: "Асуулт устгахад алдаа гарлаа",
      error: error.message,
    });
  }
});

module.exports = router;
