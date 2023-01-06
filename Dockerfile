FROM node:16-alpine

WORKDIR /app

ADD ./data/example.js /data/example.js
COPY . /app

VOLUME /data
VOLUME /docs

RUN yarn --production --non-interactive \
    && yarn cache clean

CMD ["yarn", "start"]
