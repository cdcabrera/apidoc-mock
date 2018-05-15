FROM node:8-alpine

# Create app directory
WORKDIR /usr/app

# Install app dependencies
COPY package.json /usr/app/
COPY ./src/example.json /data/example.json

VOLUME /data

RUN npm install --only=production

# Bundle app source
COPY . /usr/app

ENV PORT=8000
ENV FILE=/data/example.json

EXPOSE 8000

CMD ["npm", "start"]

USER node
