FROM node:20-alpine

WORKDIR /app

ADD ./data/example.js /data/example.js
COPY . .

VOLUME /data

RUN npm install --omit=dev

CMD ["npm", "start"]
