const express = require('express');
const app = express();
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const server = http.Server(app);
const io = require('socket.io')(server);
const dotenv = require('dotenv');
dotenv.config({ path: './tokhirgoo/tokhirgoo.env' });
const Redis = require('ioredis');
const { zuragPack } = require('zuragpack');
const tsegRoute = require('./routes/tsegRoute');
const irtsRoute = require('./routes/irtsRoute');
const ajiltanRoute = require('./routes/ajiltanRoute');
const aldaaBarigch = require('./middleware/aldaaBarigch');

const dbUrl = 'mongodb://localhost:27017/tsagdaa'; // mongo

mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((result) => {
    console.log('xolbogdson');
    server.listen(8084);
  })
  .catch((err) => console.log(err));

process.env.TZ = 'Asia/Ulaanbaatar';

const redis = new Redis();

app.set('socketio', io);
app.use(cors());
app.use(
  express.json({
    limit: '50mb',
  })
);
app.use(tsegRoute);
app.use(ajiltanRoute);
app.use(irtsRoute);
zuragPack(app);

app.use(aldaaBarigch);

async function broadcastActiveUserCount() {
  const count = await redis.scard('online-users');
  io.emit('active-users', count);
}

io.on('connection', async (socket) => {
  const userId = socket.handshake.query.userId;

  if (!userId) return;

  await redis.sadd('online-users', userId);
  await broadcastActiveUserCount();

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
  socket.on('disconnect', async () => {
    await redis.srem('online-users', userId);
    await broadcastActiveUserCount();
  });
});
