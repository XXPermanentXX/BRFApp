const Prismic = require('prismic.io');
const { Document } = require('prismic.io/lib/documents');

const ARGS = [
  'id', 'uid', 'type', 'href', 'tags', 'slugs','firstPublicationDate',
  'lastPublicationDate', 'lang', 'alternateLanguages', 'data', 'rawJSON'
];

const api = Prismic.api(process.env.PRISMIC_API);

module.exports = function cms(initialState) {
  return (state, emitter) => {

    /**
     * Reconstruct Prismic `Document` from JSON formated dumps
     */

    Object.keys(initialState).forEach(key => {
      let doc = initialState[key];

      if (!doc) { return; }

      if (!(doc instanceof Document)) {
        doc = new Document(...ARGS.map(arg => doc[arg]));
      }

      state[key] = doc;
    });

    emitter.on('*', event => {
      if (/^cms:/.test(event)) {
        const name = event.split(':')[1];

        api.then(api => {
          api.getSingle(name).then(doc => {
            state[name] = doc;
            emitter.emit('render');
          }, err => emitter.emit('error', err));
        });
      }
    });
  };
};
