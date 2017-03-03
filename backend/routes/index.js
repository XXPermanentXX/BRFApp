const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('/'));
router.use('/user', require('./user'));
router.use('/cooperatives', require('./cooperative'));
router.use('/actions', require('./action'));
router.use('/auth', require('./auth'));
router.use('/services', require('./services'));

module.exports = router;
