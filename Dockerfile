FROM node:16.14.2

WORKDIR /app/tuluvluguu-back

RUN npm config set registry "http://103.143.40.90:4873"

COPY package.json yarn.lock ./

#RUN apt-get update
#RUN apt-get install -y libgbm-dev gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libnss3 lsb-release xdg-utils wget

#RUN yarn add bcrypt ioredis multer@2.0.1 date-fns node-cron
#RUN yarn add --registry http://103.143.40.90:4873 zevback@1.1.43 zuragpack@1.0.17 http@0.0.1-security
RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 8084

CMD ["npm", "start"]