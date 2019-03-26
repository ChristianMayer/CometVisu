const express = require('express');
const cors = require('cors');
const exegesisExpress = require('exegesis-express');
const http = require('http');
const path = require('path');
const multer = require('multer');
const upload = multer();


async function createServer() {
  // See https://github.com/exegesis-js/exegesis/blob/master/docs/Options.md
  const options = {
    controllers: path.resolve(__dirname, './controllers'),
    allowMissingControllers: false,
    mimeTypeParsers: {
      'multipart/form-data': {
        parseReq: upload.single('file')
      }
    }
  };

  // This creates an exgesis middleware, which can be used with express,
  // connect, or even just by itself.
  const exegesisMiddleware = await exegesisExpress.middleware(
    path.resolve(__dirname, './openapi.yaml'),
    options
  );

  const app = express();

  // enable CORS
  app.use(cors());

  // If you have any body parsers, this should go before them.
  app.use(exegesisMiddleware);

  // Return a 404
  app.use((req, res) => {
    res.status(404).json({message: `No handler found`});
  });

  // Handle any unexpected errors
  app.use((err, req, res, next) => {
    res.status(500).json({message: `Internal error: ${err.message}`});
  });

  const server = http.createServer(app);

  return server;
}

createServer()
  .then(server => {
    server.listen(3000);
    console.log("Listening on port 3000");
  })
  .catch(err => {
    console.error(err.stack);
    process.exit(1);
  });