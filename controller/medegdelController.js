const asyncHandler = require("express-async-handler");
const Medegdel = require("../models/medegdel");
const Ajiltan = require("../models/ajiltan");
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
    })
  });
  console.log('🔥 Firebase Admin initialized successfully');
}

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
      const notification = JSON.parse(message);
      const userId = channel.replace('user_', '');
      io.to(userId).emit('notification', notification);
    } catch (error) {
    }
  });
};

// Send Firebase push notification
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      token: fcmToken,
      notification: {
        title: title,
        body: body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      }
    };
    
    const response = await admin.messaging().send(message);
    console.log('🔥 Firebase push sent:', response);
    return response;
  } catch (error) {
    console.error('Firebase push error:', error);
    throw error;
  }
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
  
  // Send via Redis
  await redisPublisher.publish(`user_${ajiltniiId}`, JSON.stringify(notificationData));
  
  // Get FCM token from database and send push notification
  try {
    const ajiltan = await Ajiltan.findById(ajiltniiId);
    if (ajiltan?.fcmToken) {
      await sendPushNotification(ajiltan.fcmToken, garchig, aguulga, {
        notificationId: medegdel._id.toString(),
        ajiltniiId: ajiltniiId
      });
    } else {
      console.log('No FCM token found for user:', ajiltniiId);
    }
  } catch (error) {
    console.error('Push notification failed:', error);
    // Don't fail the whole request if push fails
  }
  
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
