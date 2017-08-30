const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const Users = require('../models/users');
const Cooperatives = require('../models/cooperatives');
const Log = require('../models/logs');
const { __ } = require('../locale');

router.get('/', (req, res) => {
  // All traffic to cooperatives root are redirected to site root
  res.redirect('/');
});

router.post('/', auth.authenticate(), (req, res) => {
  const { body } = req;

  Cooperatives.create(body, req.user, (err, cooperative) => {
    if (err) {
      res.status(500).render(
        `/cooperatives${ req.url }`,
        Object.assign({ error: err.message }, body)
      );
    } else {
      res.locals.title = cooperative.name;
      res.render(`/cooperatives/${ cooperative._id }`, cooperative, done => {
        done(null, { cooperatives: [ cooperative.toJSON() ]});
      });
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'create',
    data: body
  });
});

router.get('/:id', isMongoId('id'), (req, res) => {
  const { params: { id }} = req;

  Cooperatives.get(id, (err, cooperative) => {
    if (err) {
      if (cooperative) {
        res.locals.error = err.message;
      } else {
        res.status(500).render('/error', { error: err.message });
      }
    }

    if (!err && !cooperative) {
      res.status(404).render('/404');
    } else {
      res.locals.title = cooperative.name;
      res.render(`/cooperatives${ req.url }`, cooperative, done => {
        done(null, {
          cooperatives: [ cooperative.toJSON() ],
          actions: cooperative.actions.map(action => action.toJSON())
        });
      });
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Cooperative',
    type: 'get',
    data: {
      cooperativeId: id
    }
  });
});

router.get('/:id/add-action', isMongoId('id'), isEditor('id'), (req, res) => {
  if (!req.accepts('html')) {
    res.status(406).end();
  } else {
    Cooperatives.get(req.params.id, (err, cooperative) => {
      if (err) {
        if (cooperative) {
          res.locals.error = err.message;
        } else {
          res.status(500).render('/error', { error: err.message });
        }
      }

      if (cooperative) {
        res.locals.title = __('Add energy action');
        res.render(`/cooperatives/${ cooperative._id }/add-action`, {
          cooperatives: [ cooperative.toJSON() ]
        });
      }
    });
  }

  Log.create({
    userId: req.user._id,
    category: 'Action',
    type: 'add',
    data: {
      cooperativeId: req.params.id
    }
  });
});

router.put('/:id', isMongoId('id'), isEditor('id'), (req, res) => {
  const { body, params: { id }} = req;

  Cooperatives.update(id, body, (err, cooperative) => {
    if (err) {
      if (cooperative) {
        res.locals.error = err.message;
      } else {
        res.status(500).render(`/cooperatives/${ id }`, Object.assign({
          error: err.message
        }, body));
      }
    }

    if (cooperative) {
      res.locals.title = cooperative.name;
      res.render(`/cooperatives/${ id }`,  cooperative, done => {
        done(null, {
          cooperatives: [ cooperative.toJSON() ],
          actions: cooperative.actions.map(action => action.toJSON())
        });
      });
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'update',
    data: body
  });
});

router.get('/:id/edit', isMongoId('id'), isEditor('id'), (req, res, next) => {
  if (!req.accepts('html')) {
    res.status(406).end();
  } else {
    Cooperatives.get(req.params.id, (err, cooperative) => {
      if (err) {
        if (cooperative) {
          res.locals.error = err.message;
        } else {
          res.status(500).render('/error', { error: err.message });
        }
      }

      if (cooperative) {
        req.prismic.api.getSingle('registration').then(doc => {
          res.locals.title = `${ __('Edit') } ${ cooperative.name }`;
          res.locals.content.registration = doc;
          res.render(`/cooperatives/${ req.params.id }/edit`, {
            cooperatives: [ cooperative.toJSON() ]
          });
        }, next);
      }
    });
  }
});

router.post('/:id/editor', isMongoId('id'), isEditor('id'), (req, res) => {
  Cooperatives.addEditor(req.params.id, req.user, err => {
    if (err) {
      res.status(500).render('/error', { error: err.message });
    } else {
      res.redirect(`/cooperatives/${ req.params.id }`);
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'addEditor',
    data: {
      cooperativeId: req.params.id,
      editor: req.body
    }
  });
});

router.delete('/:id/editor/:editorId', isMongoId('id', 'editorId'), isEditor('id'), (req, res) => {
  Users.get(req.params.editorId, (err, user) => {
    Cooperatives.deleteEditor(req.params.id, user, err => {
      if (err) {
        res.status(500).render('/error', { error: err.message });
      } else {
        res.redirect(`/cooperatives/${ req.params.id }`);
      }
    });
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'deleteEditor',
    data: {
      cooperativeId: req.params.id,
      coopEditorId: req.params.coopEditorId
    }
  });
});

router.get('/:id/consumption', isMongoId('id'), (req, res) => {
  const { params: { id }, query } = req;
  const options = Object.assign({
    normalized: query.type === 'heat'
  }, query);

  if (typeof options.normalized === 'string') {
    options.normalized = options.normalized === 'true';
  }

  options.types = options.types.split(',');

  if (req.accepts('html')) {
    res.redirect(`/cooperatives/${ id }`);
  } else {
    Cooperatives.getConsumption(id, options, (err, consumption) => {
      if (err) {
        res.status(500).render('/error', { error: err.message });
      } else {
        res.render(consumption);

        Log.create({
          userId: req.user && req.user._id,
          category: 'Cooperative',
          type: 'getConsumption',
          data: {
            cooperativeId: id,
            query: query
          }
        });
      }
    });
  }
});

module.exports = router;

function isEditor(param) {
  return function (req, res, next) {
    auth.authenticate()(req, res, () => {
      Cooperatives.get(req.params[param], (err, cooperative) => {
        if (err && !cooperative) { return next(err); }

        const editor = cooperative.editors.find(editor => {
          return editor._id.toString() === req.user._id.toString();
        });

        if (editor) {
          next();
        } else {
          res.status(401).redirect('/auth');
        }
      });
    });
  };
}

function isMongoId(...params) {
  return (req, res, next) => {
    for (let param of params) {
      req.checkParams(param, `Invalid cooperative ${ param }`).isMongoId();
    }

    const err = req.validationErrors();

    if (err) {
      res.status(404).render('/404', err);
    } else {
      next();
    }
  };
}