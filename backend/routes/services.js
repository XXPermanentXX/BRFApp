const express = require('express');
const request = require('request');

const router = express.Router();

router.get('/geoip', function (req, res) {
  let getIP = Promise.resolve(req.ip);

  if (process.env.NODE_ENV === 'development') {
    getIP = require('public-ip').v4();
  }

  getIP.then(ip => {
    request({
      json: true,
      method: 'GET',
      uri: `http://freegeoip.net/json/${ ip }`
    }).pipe(res);
  });
});

module.exports = router;
