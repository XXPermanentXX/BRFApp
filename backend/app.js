const choo = require('choo');

const app = module.exports = choo();

app.model({
  state: {},
  reducers: {}
});

app.router({ default: '/404' }, [
  [ '/', require('./views/landing') ],
  [ '/404', require('./views/error') ]
]);
