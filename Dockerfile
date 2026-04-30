FROM node:24-alpine

WORKDIR /app

ADD ./data/example.js /data/example.js
COPY . /app

VOLUME /data
VOLUME /docs

RUN yarn --production --non-interactive \
    && yarn cache clean

# For 26-alpine review yarn cmd
CMD ["yarn", "start"]
