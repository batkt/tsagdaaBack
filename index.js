const express = require("express");
const app = express();
const mongoose = require("mongoose");
const http = require("http");
const cors = require("cors");
const server = http.Server(app);
const io = require("socket.io")(server);
const dotenv = require("dotenv");
dotenv.config({ path: "./tokhirgoo/tokhirgoo.env" });
const Redis = require("ioredis");
const cron = require("node-cron");
const { zuragPack } = require("zuragpack");
const tsegRoute = require("./routes/tsegRoute");
const irtsRoute = require("./routes/irtsRoute");
const ajiltanRoute = require("./routes/ajiltanRoute");
const hariyaNegjRoute = require("./routes/hariyaNegjRoute");
const medegdelRoute = require("./routes/medegdelRoute");
const zurchliinTurulRoute = require("./routes/zurchliinTurulRoute");
const zurchilRoute = require("./routes/zurchilRoute");
const habeaRoute = require("./routes/khabeaRoute");

const dashboardRoute = require("./routes/dashboardRoute");
const aldaaBarigch = require("./middleware/aldaaBarigch");
const {
  initializeNotificationService,
} = require("./controller/medegdelController");
const TuluvluguuModel = require("./models/tuluvluguu");

const dbUrl = process.env.MONGO_URL || "mongodb://localhost:27017/tsagdaa"; // mongo

mongoose.set("strictQuery", true);
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log("xolbogdson 123");
    server.listen(8084);
  })
  .catch((err) => console.log(err));

process.env.TZ = "Asia/Ulaanbaatar";

const redis = new Redis({
  host: '127.0.0.1',
  port: 6379,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Холбогдсон үед
redis.on('connect', () => {
  console.log('✅ Redis-тэй холбогдож байна...');
});

redis.on('ready', () => {
  console.log('✅ Redis бэлэн болсон!');
});

// Алдаа гарвал
redis.on('error', (err) => {
  console.error('❌ Redis алдаа:', err.message);
});

initializeNotificationService(redis, io);

app.set("socketio", io);
app.use(cors());
app.use(
  express.json({
    limit: "50mb",
  })
);
app.get("/health", (req, res) => {
  res.send("ok");
});
app.use(tsegRoute);
app.use(ajiltanRoute);
app.use(irtsRoute);
app.use(hariyaNegjRoute);
app.use(medegdelRoute);
app.use(zurchliinTurulRoute);
app.use(zurchilRoute);
app.use(dashboardRoute);
app.use(habeaRoute);
zuragPack(app);

app.use(aldaaBarigch);

async function broadcastActiveUserCount() {
  const count = await redis.scard("online-users");
  io.emit("active-users", count);
}

cron.schedule("0 4 * * *", async () => {
  console.log("🕓 Ulaanbaatar-ийн 4 цагт ажиллав (UTC дээр 20 цаг)");
  await redis.del("online-users");
});

io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) return;

  socket.join(userId);

  await redis.sadd("online-users", userId);
  await broadcastActiveUserCount();

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });
  socket.on("disconnect", async () => {
    await redis.srem("online-users", userId);
    await broadcastActiveUserCount();
  });
});

const updateTuluvluguuTuluv = async () => {
  try {
    const now = new Date();

    // 1. Дуусах огноо өнгөрсөн бүгдийг "Дууссан" болгох
    const duussanResult = await TuluvluguuModel.updateMany(
      {
        duusakhOgnoo: { $lt: now },
      },
      {
        $set: {
          tuluv: "Дууссан",
          idevkhiteiEsekh: false,
        },
      }
    );

    console.log(
      `${duussanResult.modifiedCount} төлөвлөгөө "Дууссан" болсон`
    );

    // 2. Бусад бүгдийг "Эхэлсэн" болгож, idevkhiteiEsekh = true
    const ekhelsenResult = await TuluvluguuModel.updateMany(
      {
        duusakhOgnoo: { $gte: now },
      },
      {
        $set: {
          tuluv: "Эхэлсэн",
          idevkhiteiEsekh: true,
        },
      }
    );

    console.log(
      `${ekhelsenResult.modifiedCount} төлөвлөгөө "Эхэлсэн" болж, идэвхтэй болсон`
    );
  } catch (error) {
    console.error("Алдаа гарлаа:", error);
    throw error;
  }
};
