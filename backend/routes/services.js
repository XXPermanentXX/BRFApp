const express = require('express');
const request = require('request');

const router = express.Router();

router.get('/geoip', function (req, res) {
  let getIP = Promise.resolve(req.ip);

  /**
   * We have to query the the DNS records of OpenDNS on local machines since
   * `req.ip` is ::1 on localhost
   */

  if (process.env.NODE_ENV === 'development') {
    getIP = require('public-ip').v4();
  }

  /**
   * Query freegeoip service with our best guess ip
   */

  getIP.then(ip => {
    request({
      json: true,
      method: 'GET',
      uri: `http://freegeoip.net/json/${ ip }`
    }).pipe(res);
  });
});

module.exports = router;
