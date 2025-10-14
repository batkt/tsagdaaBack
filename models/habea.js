const habeaSchema = new mongoose.Schema(
  {
    asuult: {
      type: String,
      required: false,
      trim: true,
    },
    ajiltanId: {
      type: String,
      required: false,
    },
    tuluvluguuniiID: {
      type: String,
      required: false,
    },
    baiguullagiinId: {
      type: String,
      required: false,
    },
    salbariinId: {
      type: String,
      required: false,
    },
    ognoo: {
      type: Date,
      default: Date.now,
    },

    ajiltniiId: String,
    asuulguud: Array,
    turul: {
      type: String,
      enum: ["asuult", "khariult"],
      default: "asuult",
    },
  },
  {
    timestamps: true,
    collection: "habea",
  }
);
