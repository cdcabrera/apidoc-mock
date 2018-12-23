FROM node:10-alpine

WORKDIR /app

COPY package.json /app/
ADD ./data/example.js /data/example.js
COPY . /app

VOLUME /data
VOLUME /docs

RUN yarn --production --non-interactive \
    && yarn cache clean

ENV PORT=8000

EXPOSE ${PORT}
CMD ["yarn", "start:container"]
