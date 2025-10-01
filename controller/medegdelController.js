const asyncHandler = require("express-async-handler");
const Medegdel = require("../models/medegdel");

let redis = null;
let io = null;

const initializeNotificationService = (redisClient, socketIO) => {
  redis = redisClient;
  io = socketIO;
  
  redis.psubscribe('user_*');
  redis.on('pmessage', (pattern, channel, message) => {
    try {
      const notification = JSON.parse(message);
      const userId = channel.replace('user_', '');
      io.to(userId).emit('notification', notification);
    } catch (error) {
      console.error('Redis notification error:', error);
    }
  });
};

const sendNotification = async (ajiltniiId, garchig, aguulga) => {
  const medegdel = await Medegdel.create({ ajiltniiId, garchig, aguulga });
  
  await redis.publish(`user_${ajiltniiId}`, JSON.stringify({
    id: medegdel._id,
    ajiltniiId,
    garchig,
    aguulga,
    unshsan: false,
    createdAt: medegdel.createdAt
  }));
  
  return medegdel;
};

exports.medegdelAvya = asyncHandler(async (req, res, next) => {
  try {
    const { userId } = req.query;
    const medegdeluud = await Medegdel.find({ avakh: userId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.send(medegdeluud);
  } catch (error) {
    next(error);
  }
});

exports.medegdelBurtgeh = asyncHandler(async (req, res, next) => {
  try {
    const { avakh, garchig, aguulga } = req.body;
    
    if (!avakh || !garchig || !aguulga) {
      return res.status(400).json({
        message: "Хүлээн авагч, гарчиг, агуулга шаардлагатай!"
      });
    }

    const result = await sendNotification(avakh, garchig, aguulga);
    res.status(200).json({ message: "Мэдэгдэл илгээгдлээ", result });
  } catch (error) {
    next(error);
  }
});

exports.medegdelUnshsan = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    await Medegdel.findByIdAndUpdate(id, { unshsan: true });
    res.status(200).json({ message: "Уншсан гэж тэмдэглэгдлээ" });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  ...exports,
  initializeNotificationService
};
