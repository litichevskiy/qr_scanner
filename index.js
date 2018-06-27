const PORT = process.env.PORT || 3000;
const path = require('path');
const fs = require('fs');
const express = require('express');
const https = require('https');
const app = express();

const certOptions = {
    key: fs.readFileSync('./certificate/server.key'),
    cert: fs.readFileSync('./certificate/server.crt'),
}

app.use('/dist', express.static(__dirname + '/dist'));
app.use('/images', express.static(__dirname + '/src/images'));
app.use('/workers', express.static(__dirname + '/src/js/workers'));
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname+'/index.html'));
});

https.createServer(certOptions, app)
    .listen( PORT, console.log(`server listening on port ${PORT}`))