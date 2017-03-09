const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();
const Cooperative = require('../models').cooperatives;
const Log = require('../models').logs;

/**
 * @api {post} /cooperative Create new cooperative
 * @apiGroup Cooperative
 *
 * @apiParam {String} name Cooperative name
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "name": "BRF Hamarby",
 *  }' \
 *  http://localhost:3000/api/cooperative
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 0,
 *     "_id": "55f14ce337d4bef728a861ab",
 *     "name": "BRF Hamarby"
 *   }
 */
router.post('/', auth.authenticate(), function (req, res) {
  const { body } = req;

  Cooperative.create(body, (err, cooperative) => {
    if (err) {
      res.status(500).render(
        `/cooperatives${ req.url }`,
        Object.assign({ err: err.message }, body)
      );
    } else {
      res.render(
        `/cooperatives${ req.url }/${ cooperative._id }`,
        cooperative,
        (data, done) => done(null, { cooperatives: [ data ] })
      );
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'create',
    data: body
  });
});


/**
 * @api {get} /cooperative/consumption Get average consumption for cooperatives
 * @apiGroup Cooperative
 *
 * @apiParam {String} name Cooperative name
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "name": "BRF Hamarby",
 *  }' \
 *  http://localhost:3000/api/cooperative
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 0,
 *     "_id": "55f14ce337d4bef728a861ab",
 *     "name": "BRF Hamarby"
 *   }
 */
router.get('/consumption/:type/:granularity', function (req, res) {
  const { params: { type, granularity }, query: { from, to }} = req;

  Cooperative.getAvgConsumption(type, granularity, from, to, (err, data) => {
    if (err) {
      res.status(400).render('/error', { err: err.message });
    } else if (req.accepts('html')) {
      res.redirect('/cooperatives');
    } else {
      res.json(data);
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Cooperative',
    type: 'geAvgConsumption',
    data: {
      params: req.params
    }
  });
});

/**
 * @api {get} /cooperative/:id Fetch an cooperative by id
 * @apiGroup Cooperative
 *
 * @apiParam {String} id MongoId of cooperative
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X GET -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/cooperative/55f14ce337d4bef728a861ab
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "name": "BRF Hamarby"
 *   }
 */
router.get('/:id', checkParams('id'), function (req, res) {
  const { params: { id }} = req;

  Cooperative.get(id, null, (err, cooperative) => {
    if (err) {
      res.status(404).render('/404', { err: err.message });
    } else {
      res.render(
        `/cooperatives${ req.url }`,
        cooperative,
        (data, done) => done(null, { cooperatives: [ data ] })
      );
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


/**
 * @api {get} /cooperative/ Get list of all cooperatives
 * @apiGroup Cooperative
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X GET -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/cooperative/
 *
 * @apiSuccessExample {json} Success-Response:
 *   [{
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "name": "BRF Hamarby"
 *     ...
 *   }
 *   ...
 *   ]
 */
router.get('/', function (req, res) {
  Cooperative.all((err, cooperatives) => {
    if (err) {
      res.status(500).render('/error', { err: err.message });
    } else {
      res.render(
        '/cooperatives',
        cooperatives,
        (data, done) => done(null, { cooperatives })
      );
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Cooperative',
    type: 'get'
  });
});

/**
 * @api {put} /cooperative/:id Update the cooperative information
 * @apiGroup Cooperative
 *
 * @apiParam {String} id MongoId of cooperative
 * @apiParam (Body) {String} name Cooperative name
 * @apiParam (Body) {String} email Cooperative contact email
 * @apiParam (Body) {Number} yearOfConst Year of construction of the cooperative
 * @apiParam (Body) {Number} area Area in square meters of the cooperative shared space
 * @apiParam (Body) {Number} numOfApartments Number of apartments in the cooperative
 * @apiParam (Body) {String} ventilationType Ventilation type
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "name": "New Cooperative"
 *    "email": "new@example.com"
 *  }' \
 *  http://localhost:3000/api/cooperative/55f14ce337d4bef728a861ab
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "name": "BRF Hamarby"
 *     ...
 *   }
 */
router.put('/:id', auth.authenticate(), checkParams('id'), function (req, res) {
  const { body, params: { id }} = req;

  Cooperative.update(id, body, (err, result) => {
    if (err) {
      res.status(500).render(
        `/cooperatives/${ id }`,
        Object.assign({ err: err.message }, body)
      );
    } else {
      req.render(
        `/cooperatives/${ id }`,
        result,
        (data, done) => done(null, { cooperatives: [ data ] })
      );
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'update',
    data: body
  });
});

/**
 * @api {post} /cooperative/:id/meter Add new cooperative action
 * @apiGroup Cooperative
 *
 * @apiParam {String} id MongoId of cooperative
 * @apiParam (Body) {String} name Name of the action
 * @apiParam (Body) {Date} date Date when action was taken
 * @apiParam (Body) {String} description Action description
 * @apiParam (Body) {Number} cost Action cost
 * @apiParam (Body) {Number[]} types Action types
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X PUSH -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "name": "Ventilation change",
 *    "cost": "120"
 *  }' \
 *  http://localhost:3000/api/cooperative/55f14ce337d4bef728a861ab/action
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "name": "BRF Hamarby"
 *     ...
 *   }
 */

router.post('/:id/actions', auth.authenticate(), checkParams('id'), function (req, res) {
  const { body, params: { id }} = req;

  Cooperative.addAction(id, body, null, (err, action) => {
    if (err) {
      res.status(500).render(
        `/cooperatives${ req.url }`,
        Object.assign({ err: err.message }, body)
      );
    } else {
      res.render(
        `/cooperatives${ req.url }/${ action._id }`,
        action,
        (data, done) => Cooperative.get(id, null, (err, cooperative) => {
          if (err) { return done(err); }
          done(null, { cooperatives: [ cooperative ], actions: [ action ] });
        })
      );
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'addAction',
    data: {
      cooperativeId: id,
      action: body
    }
  });
});

router.get('/:id/actions', checkParams('id'), function (req, res) {
  const { params: { id }} = req;

  Cooperative.get(id, null, (err, cooperative) => {
    if (err) {
      res.status(404).render('/404', { err: err.message });
    } else {
      res.render(
        `/cooperatives${ req.url }`,
        cooperative.actions,
        (data, done) => done(null, { cooperatives: [ cooperative ], actions: data })
      );
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Actions',
    type: 'get',
    data: {
      cooperativeId: id
    }
  });
});


/**
 * @api {put} /cooperative/:id/action/:actionId Update cooperative action
 * @apiGroup Cooperative
 *
 * @apiParam {String} id MongoId of cooperative
 * @apiParam {String} actionId MongoId of the action
 * @apiParam (Body) {String} name Name of the action
 * @apiParam (Body) {Date} date Date when action was taken
 * @apiParam (Body) {String} description Action description
 * @apiParam (Body) {Number} cost Action cost
 * @apiParam (Body) {Number[]} types Action types
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "name": "Ventilation change",
 *    "cost": "120"
 *  }' \
 *  http://localhost:3000/api/cooperative/55f14ce337d4bef728a861ab/action/55f14ce337dlkabef728a861ab
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "name": "BRF Hamarby"
 *     ...
 *   }
 */

router.put('/:id/actions/:actionId', auth.authenticate(), checkParams('id', 'actionId'), function (req, res) {
  const { body, params: { id, actionId }} = req;

  Cooperative.updateAction(id, actionId, body, (err, action) => {
    if (err) {
      res.status(500).render(
        `/cooperatives${ req.url }`,
        Object.assign({ err: err.message }, body)
      );
    } else {
      res.render(
        `/cooperatives${ req.url }`,
        action,
        (data, done) => Cooperative.get(id, null, (err, cooperative) => {
          if (err) { return done(err); }
          done(null, { cooperatives: [ cooperative ], actions: [ data ] });
        })
      );
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'updateAction',
    data: {
      cooperativeId: id,
      actionId: actionId,
      action: body
    }
  });
});

router.get('/:id/actions/:actionId', checkParams('id', 'actionId'), function (req, res) {
  const { params: { id, actionId }} = req;

  Cooperative.get(id, null, (err, cooperative) => {
    let action;

    if (!err) {
      action = cooperative.actions.find(action => action._id.toString() === actionId);
    }

    if (err || !action) {
      res.status(404).render('/404', { err: err && err.message });
    } else {
      res.render(
        `/cooperatives${ req.url }`,
        action,
        (data, done) => done(null, { cooperatives: [ cooperative ], actions: [ action ] })
      );
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Actions',
    type: 'get',
    data: {
      cooperativeId: id
    }
  });
});

/**
 * @api {delete} /cooperative/:id/action/:actionId Delet cooperative action
 * @apiGroup Cooperative
 *
 * @apiParam {String} id MongoId of cooperative
 * @apiParam {String} actionId MongoId of the action
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X DELETE -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/cooperative/55f14ce337d4bef728a861ab/action/55f14ce337dlkabef728a861ab
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "name": "BRF Hamarby"
 *     ...
 *   }
 */

router.delete('/:id/actions/:actionId', auth.authenticate(), checkParams('id', 'actionId'), function (req, res) {
  const { params: { id, actionId }} = req;

  Cooperative.deleteAction(id, actionId, err => {
    if (err) {
      res.status(500).redirect(`/cooperatives${ req.url }`);
    } else {
      res.redirect(`/cooperatives/${ id }/actions`);
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'deleteAction',
    data: {
      cooperativeId: req.params.id,
      actionId: req.params.actionId
    }
  });
});

/**
 * @api {post} /cooperative/:id/action/:actionId/comment Comment cooperative action
 * @apiGroup Cooperative
 *
 * @apiParam {String} id MongoId of cooperative
 * @apiParam {String} actionId MongoId of the action
 * @apiParam (Body) {String} comment The text of the comment
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "comment": "Nice job"
 *  }' \
 *  http://localhost:3000/api/cooperative/55f14ce337d4bef728a861ab/action/55f14ce337dlkabef728a861ab
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "name": "BRF Hamarby"
 *     ...
 *   }
 */
router.post('/:id/actions/:actionId/comments', auth.authenticate(), checkParams('id', 'actionId'), function (req, res) {
  const { body, user, params: { id, actionId }} = req;

  Cooperative.commentAction(id, actionId, body, user, (err, comment) => {
    if (err) {
      req.status(500).render(
        `/cooperatives${ req.url }`,
        Object.assign({ err: err.message }, body)
      );
    } else {
      if (req.accepts('html')) {
        res.redirect(`/cooperatives/${ id }/actions/${ actionId }`);
      } else {
        res.render(`/cooperatives${ req.url }/${ id }`, comment);
      }
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'commentAction',
    data: {
      cooperativeId: id,
      actionId: actionId,
      comment: body
    }
  });
});

/**
 * @api {get} /cooperative/:id/action/:actionId/comment Load more comments
 * @apiGroup Cooperative
 *
 * @apiParam {String} id MongoId of cooperative
 * @apiParam {String} actionId MongoId of the action
 * @apiParam (Query) {String} lastCommentId MongoId of the last comment retrieved
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/cooperative/55f14ce337d4bef728a861ab/action/55f14ce337dlkabef728a861ab/comment?lastCommentId=65f14ce337dlkabef728a861ab
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "name": "BRF Hamarby"
 *     ...
 *   }
 */
router.get('/:id/actions/:actionId/comments', checkParams('id', 'actionId'), function (req, res) {
  const { params: { id, actionId }} = req;

  Cooperative.getComments(id, actionId, null, (err, comments) => {
    if (err) {
      res.status(404).render('/404', { err: err.message });
    } else {
      if (req.accepts('html')) {
        res.redirect(`/cooperatives/${ id }/actions/${ actionId }`);
      } else {
        res.render(`/cooperatives${ req.url }`, comments);
      }
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Cooperative',
    type: 'getComments',
    data: {
      cooperativeId: id,
      actionId: actionId
    }
  });
});

router.get('/:id/actions/:actionId/comments/:commentId', checkParams('id', 'actionId', 'commentId'), function (req, res) {
  const { params: { id, actionId, commentId }} = req;

  Cooperative.getComments(id, actionId, null, (err, comments) => {
    let comment;

    if (!err) {
      comment = comments.find(comment => comment._id.toString() === commentId);
    }

    if (err || !comment) {
      res.status(404).render('/404', { err: err && err.message });
    } else {
      res.render(
        `/cooperatives${ req.url }`,
        comment,
        (data, done) => Cooperative.get(id, null, (err, cooperative) => {
          if (err) { return done(err); }
          done(null, {
            cooperatives: [ cooperative ],
            actions: cooperative.actions,
            comments: comments
          });
        })
      );
    }
  });

  Log.create({
    userId: req.user && req.user._id,
    category: 'Cooperative',
    type: 'getComments',
    data: {
      cooperativeId: id,
      actionId: actionId
    }
  });
});

/**
 * @api {delete} /cooperative/:id/action/:actionId/comment/:commentId Delete cooperative action comments
 * @apiGroup Cooperative
 *
 * @apiParam {String} id MongoId of cooperative
 * @apiParam {String} actionId MongoId of the action
 * @apiParam {String} commentId MongoId of the comment
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X DELETE -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/cooperative/55f14ce337d4bef728a861ab/action/55f14ce337dlkabef728a861ab/comment/12983ujaw9210
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "name": "BRF Hamarby"
 *     ...
 *   }
 */
router.delete('/:id/actions/:actionId/comments/:commentId', auth.authenticate(), checkParams('id', 'actionId', 'commentId'), function(req, res) {
  const { params: { id, actionId, commentId }} = req;

  Cooperative.deleteActionComment(id, actionId, commentId, null, err => {
    if (err) {
      res.status(500).redirect(`/cooperatives${ req.url }`);
    } else {
      res.redirect(`/cooperatives/${ id }/actions/${ actionId }/comments`);
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Cooperative',
    type: 'deleteActionComment',
    data: {
      cooperativeId: id,
      actionId: actionId,
      commentId: commentId
    }
  });
});


/*
curl  -X POST http://localhost:3000/api/cooperative/5623feb4fa9bee84098e7ce0/editor -d'{"editorId" : "55f91cacf9b31654b8758efd"}' -H "Content-Type: application/json" | python -m json.tool
*/
router.post('/:id/editor', checkParams('id'), function(req, res) {
  Cooperative.addEditor(req.params.id, req.body, null, res.successRes);

  Log.create({
    // userId: req.user._id,
    category: 'Cooperative',
    type: 'addEditor',
    data: {
      cooperativeId: req.params.id,
      editor: req.body
    }
  });
});

/**
 curl  -X DELETE http://localhost:3000/api/cooperative/5623feb4fa9bee84098e7ce0/editor/56240d8a830db5840a70571a | python -m json.tool
*/
router.delete('/:id/editor/:coopEditorId', checkParams('id', 'coopEditorId'), function(req, res) {
  Cooperative.deleteEditor(req.params.id, req.params.coopEditorId, null, res.successRes);

  Log.create({
    // userId: req.user._id,
    category: 'Cooperative',
    type: 'deleteEditor',
    data: {
      cooperativeId: req.params.id,
      coopEditorId: req.params.coopEditorId
    }
  });
});

/**
 * @api {get} /cooperative/:id/consumption/:type/:granularity Get cooperative consumption
 * @apiGroup Cooperative
 *
 * @apiParam {String} id MongoId of cooperative
 * @apiParam {String} type Consumption type (e.g. electricity, heating)
 * @apiParam {String} granularity Granularity (e.g. year, month)
 * @apiParam {String} from Range date of consumption in YYYYMM-YYYYMM format (MM is optional)
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/cooperative/55f14ce337d4bef728a861ab/consumption/electricity/month?from=201505-201604&normalized=false
 *
 * @apiSuccessExample {json} Success-Response:
 *   [
 *   5.335204147764095,
 *   3.957101425793908,
 *   3.3761681788723266
 *   ...
 *   ]
 */
router.get('/:id/consumption', checkParams('id'), function (req, res) {
  const { params: { id }, query } = req;
  const options = Object.assign({ id, normalized: false }, query);

  Cooperative.getConsumption(options, (err, consumption) => {
    if (err) {
      res.status(404).render('/404', { err: err.message });
    } else {
      res.render(`/cooperatives${ req.url }`, consumption);

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

});

function checkParams(...params) {
  return (req, res, next) => {
    for (let param of params) {
      req.checkParams(param, `Invalid cooperative ${ param }`).isMongoId();
    }

    const err = req.validationErrors();

    if (err) {
      res.status(404).render('/404', { err: err.message });
    } else {
      next();
    }
  };
}

module.exports = router;
