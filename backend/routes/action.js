const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const Actions = require('../models/actions');
const Cooperatives = require('../models/cooperatives');
const Comments = require('../models/comments');
const Log = require('../models').logs;

router.post('/:id/comments', isMongoId('id'), auth.authenticate(), (req, res) => {
  Actions.get(req.params.id, (err, action) => {
    if (err) {
      res.status(500).render(
        `/actions/${ req.params.id }`,
        Object.assign({ err: err.message }, req.body)
      );
    } else {
      Comment.create(req.body, req.user, action, (err, comment) => {
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
        Comments.getByAction(action, req.query.limit, (err, comments) => {
          if (err) {
            res.status(500).render('/error', { err: err.message });
          } else {
            res.render(comments);
          }
        });
      }
    });

    Log.create({
      userId: req.user && req.user._id,
      category: 'Action Comments',
      type: 'get',
      data: {
        actionId: req.params.id,
        limit: req.query.limit
      }
    });
  }
});

router.delete('/:id/comment/:commentId', isMongoId('id', 'commentId'), auth.authenticate(), (req, res) => {
  Comments.delete(req.params.commentId, err => {
    if (err) {
      res.status(500);
    }

    res.redirect(`/actions/${ req.params.id }/comments`);
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

  const err = req.validationErrors();

  if (err) {
    res.status(400).render('/error', err);
  } else {
    Actions.create(req.body, req.user, req.body.cooperative, (err, action) => {
      if (err) {
        res.status(500).render(
          `/actions${ req.url }`,
          Object.assign({ err: err.message}, req.body)
        );
      } else {
        res.render(
          `/actions/${ action._id }`,
          action,
          (data, done) => Cooperatives.get(action.cooperative, (err, cooperative) => {
            if (err) { return done(err); }
            done(null, { cooperatives: [ cooperative ], actions: [ action ] });
          })
        );
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

router.get('/:id', isMongoId('id'), (req, res) => {
  Actions.get(req.params.id, (err, action) => {
    if (err) {
      res.status(404).render('/error', { err: err.message });
    } else {
      res.render(
        `/actions${ req.url }`,
        action,
        (data, done) => Cooperatives.get(action.cooperative, (err, cooperative) => {
          if (err) { return done(err); }
          done(null, { cooperatives: [ cooperative ], actions: [ action ] });
        })
      );
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

router.delete('/:id', isMongoId('id'), auth.authenticate(), (req, res) => {
  Actions.get(req.params.id, (err, action) => {
    if (err) {
      res.status(404).render('/error', { err: err.message });
    }
    else {
      Actions.delete(req.params.id, err => {
        if (err) {
          res.status(500).render('/error', { err: err.message });
        } else {
          res.redirect(`/cooperatives/${ action.cooperative }`);
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
      res.render(
        '/actions',
        actions,
        (data, done) => done(null, { actions: [ data ]})
      );
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
      res.render('/search', actions, (data, done) => done(null, { actions }));
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
