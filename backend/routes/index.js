const express = require('express');

const router = express.Router();

router.use('/user', require('./user'));
router.use('/cooperatives', require('./cooperative'));
router.use('/actions', require('./action'));
router.use('/auth', require('./auth'));

router.get('/', (req, res) => res.render('/'));
router.get('/how-it-works', (req, res, next) => {
  req.prismic.api.getSingle('faq').then(doc => {
    // doc.toJSON = () => doc.rawJSON;
    res.locals.title = doc.getStructuredText('faq.title').asText();
    res.render('/how-it-works', { faq: doc });
  }, next);
});

module.exports = router;
