const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const Actions = require('../models/actions');
const Cooperatives = require('../models/cooperatives');
const Log = require('../models').logs;
const { __ } = require('../locale');

router.post('/:id/comments', isMongoId('id'), auth.authenticate(), (req, res) => {
  Actions.addComment(req.params.id, req.body, req.user, (err, comment) => {
    if (err) {
      res.status(500).render('/error', { err: err.message });
    } else {
      if (req.accepts('html')) {
        res.redirect(`/actions/${ req.params.id }`);
      } else {
        res.render(comment);
      }
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Action Comments',
    type: 'create',
    data: req.body
  });
});

router.get('/:id/comments', isMongoId('id'), (req, res) => {
  if (req.accepts('html')) {
    res.redirect(`/actions/${ req.params.id }`);
  } else {
    Actions.get(req.params.id, (err, action) => {
      if (err) {
        res.status(404).render('/error', { err: err.message });
      } else {
        res.render(action.comments);
      }
    });

    Log.create({
      userId: req.user && req.user._id,
      category: 'Action Comments',
      type: 'all',
      data: {
        actionId: req.params.id
      }
    });
  }
});

router.get('/:id/comments/:commentId', isMongoId('id', 'commentId'), (req, res) => {
  if (req.accepts('html')) {
    res.redirect(`/actions/${ req.params.id }`);
  } else {
    Actions.getComment(req.params.commentId, (err, comment) => {
      if (err) {
        res.status(404).render('/error', { err: err.message });
      } else {
        res.render(comment);
      }
    });

    Log.create({
      userId: req.user && req.user._id,
      category: 'Action Comments',
      type: 'get',
      data: {
        actionId: req.params.id,
        commentId: req.params.commentId
      }
    });
  }
});

router.delete('/:id/comments/:commentId', isMongoId('id', 'commentId'), auth.authenticate(), (req, res) => {
  Actions.deleteComment(req.params.commentId, err => {
    if (err) {
      res.status(500).render('/error', { err: err.message });
    } else if (req.accepts('html')) {
      res.redirect(`/actions/${ req.params.id }`);
    } else {
      res.redirect(`/actions/${ req.params.id }/comments`);
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Action Comments',
    type: 'delete',
    data: req.params
  });
});

router.post('/', auth.authenticate(), (req, res) => {
  req.checkBody('cooperative').isMongoId();
  req.checkBody('date').isDate();

  const err = req.validationErrors();

  if (err) {
    res.status(400).render('/error', { err });
  } else {
    Cooperatives.get(req.body.cooperative, (err, cooperative) => {
      if (err) {
        res.status(500).render('/error', Object.assign({
          err: err.message
        }, req.body));
      } else {
        Actions.create(req.body, req.user, cooperative, (err, action) => {
          if (err) {
            res.status(500).render('/error', Object.assign({
              err: err.message
            }, req.body));
          } else {
            res.redirect(`/actions/${ action._id }`);
          }
        });
      }
    });
  }

  Log.create({
    userId: req.user._id,
    category: 'Action',
    type: 'create',
    data: req.body
  });
});

router.put('/:id', auth.authenticate(), isMongoId('id'), (req, res) => {
  const { body, params: { id }} = req;

  Actions.update(id, body, (err, action) => {
    if (err) {
      res.status(500).render(`/actions/${ id }`, Object.assign({
        err: err.message
      }, body));
    } else {
      res.locals.title = __(`ACTION_TYPE_${ action.type }`);
      res.render(`/actions/${ id }`, action, done => {
        done(null, {
          cooperatives: [ action.cooperative.toJSON() ],
          actions: [ action.toJSON() ]
        });
      });
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'updateAction',
    data: {
      actionId: id,
      action: body
    }
  });
});

router.get('/:id', isMongoId('id'), (req, res) => {
  Actions.get(req.params.id, (err, action) => {
    if (err) {
      res.status(404).render('/error', { err: err.message });
    } else {
      res.locals.title = __(`ACTION_TYPE_${ action.type }`);
      res.render(`/actions${ req.url }`, action, done => {
        done(null, {
          cooperatives: [ action.cooperative.toJSON() ],
          actions: [ action.toJSON() ]
        });
      });
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Action',
    type: 'get',
    data: {
      actionId: req.params.id
    }
  });
});

router.get('/:id/edit', isMongoId('id'), auth.authenticate(), (req, res) => {
  if (!req.accepts('html')) {
    res.redirect(`/actions/${ req.params.id }`);
  } else {
    Actions.get(req.params.id, (err, action) => {
      if (err) {
        res.status(404).render('/error', { err: err.message });
      } else {
        res.locals.title = action.name;
        res.render(`/actions/${ req.params.id }/edit`, action, done => {
          done(null, {
            cooperatives: [ action.cooperative.toJSON() ],
            actions: [ action.toJSON() ]
          });
        });
      }
    });

    Log.create({
      userId: req.user._id,
      category: 'Action',
      type: 'edit',
      data: {
        actionId: req.params.id
      }
    });
  }
});

router.delete('/:id', isMongoId('id'), auth.authenticate(), (req, res) => {
  Actions.get(req.params.id, (err, action) => {
    if (err) {
      res.status(404).render('/error', { err: err.message });
    } else {
      Actions.delete(req.params.id, err => {
        if (err) {
          res.status(500).render('/error', { err: err.message });
        } else {
          res.redirect(`/cooperatives/${ action.cooperative._id }`);
        }
      });
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Action',
    type: 'delete',
    data: {
      actionId: req.params.id
    }
  });
});

router.get('/', function(req, res) {
  Actions.getAll(req.query.limit, (err, actions) => {
    if (err) {
      res.status(500).render('/error', { err: err.message });
    } else {
      res.locals.title = __('Energy actions');
      res.render('/actions', actions, done => {
        done(null, { actions: actions.map(action => action.toJSON()) });
      });
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Action',
    type: 'all',
    data: req.body
  });
});

router.get('/search', (req, res) => {
  Actions.search(req.query.q, (err, actions) => {
    if (err) {
      res.status(500).render('/error', { err: err.message });
    } else {
      res.render(actions);
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Action',
    type: 'search',
    data: req.query
  });
});

module.exports = router;

function isMongoId(...params) {
  return (req, res, next) => {
    for (let param of params) {
      req.checkParams(param, `Invalid ${ param }`).isMongoId();
    }

    const err = req.validationErrors();

    if (err) {
      res.status(400).render('/error', { err });
    } else {
      next();
    }
  };
}
