const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();
const apiJsonFile = process.env.FILE || path.join(__dirname, './example.json');
const apiJson = JSON.parse(fs.readFileSync(apiJsonFile, 'utf8'));
const port = process.env.PORT || 8000;

let routesLoaded = 0;

app.use((request, response, next) => {
  const hasOrigin = request.headers.origin != null;

  response.set('Access-Control-Allow-Origin', hasOrigin ? request.headers.origin : '*');
  response.set('Access-Control-Allow-Credentials', !hasOrigin);
  response.set('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, HEAD, OPTIONS, PATCH');

  const requestHeaders = request.headers['access-control-request-headers'];

  if (requestHeaders != null) {
    response.set('Access-Control-Allow-Headers', requestHeaders);
  }

  if (request.method === 'OPTIONS') {
    response.end();
  } else {
    next();
  }
});

apiJson.forEach(value => {
  try {
    if (value.success.examples && value.success.examples.length) {
      const example =
        value.success.examples[Math.floor(Math.random() * value.success.examples.length)];

      if (example.type === 'json') {
        app[value.type](value.url, (req, res) => {
          const content = `{ ${example.content
            .split('{')
            .slice(1)
            .join('{')}`;

          if (value.header && value.header.fields.Header && value.header.fields.Header.length) {
            for (let i = 0; i < value.header.fields.Header.length; i++) {
              const headerValue = value.header.fields.Header[i];

              if (
                !headerValue.optional &&
                headerValue.field &&
                /authorization/i.test(headerValue.field)
              ) {
                const authorization = req.get('authorization');

                if (!authorization) {
                  res.append('WWW-Authenticate', 'Spoof response');
                  res.status(401);
                  res.end('Authorization Required');
                  return;
                }
              }
            }
          }

          res.set('Content-Type', 'application/json');
          res.send(content);
        });

        routesLoaded += 1;
        console.info(`Loading "${value.type}" route ${value.url}...`);
      }
    }
  } catch (e) {
    console.warn(e.message);
  }
});

if (routesLoaded) {
  app.listen(port, () => console.info(`Mock server listening on port ${port}`));
}
