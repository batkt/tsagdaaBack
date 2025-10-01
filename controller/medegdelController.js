const asyncHandler = require("express-async-handler");
const Medegdel = require("../models/medegdel");

let redisSubscriber = null;
let redisPublisher = null;
let io = null;

const initializeNotificationService = (redisClient, socketIO) => {
  io = socketIO;
  
  redisSubscriber = redisClient.duplicate();
  redisPublisher = redisClient.duplicate();
  
  redisSubscriber.psubscribe('user_*');
  redisSubscriber.on('pmessage', (pattern, channel, message) => {
    try {
      console.log('📥 Received from Redis:', channel, message);
      const notification = JSON.parse(message);
      const userId = channel.replace('user_', '');
      console.log('🎯 Sending to user:', userId);
      io.to(userId).emit('notification', notification);
      console.log('✅ Sent via Socket.IO');
    } catch (error) {
      console.error('Redis notification error:', error);
    }
  });
};

const sendNotification = async (ajiltniiId, garchig, aguulga) => {
  const medegdel = await Medegdel.create({ ajiltniiId, garchig, aguulga });
  
  const notificationData = {
    id: medegdel._id,
    ajiltniiId,
    garchig,
    aguulga,
    unshsan: false,
    createdAt: medegdel.createdAt
  };
  
  console.log('📤 Publishing to Redis:', `user_${ajiltniiId}`, notificationData);
  
  await redisPublisher.publish(`user_${ajiltniiId}`, JSON.stringify(notificationData));
  
  console.log('✅ Published successfully to Redis');
  
  return medegdel;
};

exports.medegdelAvya = asyncHandler(async (req, res, next) => {
  try {
    const { ajiltniiId } = req.query;
    const medegdeluud = await Medegdel.find({ ajiltniiId })
      .sort({ createdAt: -1 })
      .limit(20);
    res.send(medegdeluud);
  } catch (error) {
    next(error);
  }
});

exports.medegdelBurtgeh = asyncHandler(async (req, res, next) => {
  try {
    const { ajiltniiId, garchig, aguulga } = req.body;
    
    if (!ajiltniiId || !garchig || !aguulga) {
      return res.status(400).json({
        message: "Ажилтны ID, гарчиг, агуулга шаардлагатай!"
      });
    }

    const result = await sendNotification(ajiltniiId, garchig, aguulga);
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
