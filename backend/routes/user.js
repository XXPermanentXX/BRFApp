'use strict';

var auth = require('../middleware/auth');
var express = require('express');
var util = require('util');
var _ = require('underscore');
var router = express.Router();
var achievements = require('../common/achievements');
var User = require('../models').users;
var Log = require('../models').logs;
var Household = require('../models').households;
var mailer = require('../mailer');

router.use('/action', require('./userAction'));
router.use('/community', require('./community'));

/**
 * @api {post} /user/register New user registration
 * @apiGroup User
 *
 * @apiParam {String} email User's e-mail address
 * @apiParam {String} name User's nickname
 * @apiParam {String} password User's password
 * @apiParam {String} [language] User's preferred language; for now have support for English (default), Italian and Swedish
 * @apiParam {String} [household] Optional household object containing info for automatically creating a household during user registration
 * @apiParam {String} testLocation The test site a user is participating, Trento users should take the default setting, as "Trento"
 * @apiParam {String} contractId The contact Id a test user took, highly advisable for Trento test site users
 * @apiParam {String} apartmentId The apartment number a test user took, highly advisable for Trento test site users
 *
 * @apiExample {curl} Example usage:
 *  # NOTE: this is the only API call which does not require authentication!
 *
 *  curl -i -X POST -H "Content-Type: application/json" -d \
 *  '{
 *    "email": "testuser@test.com",
 *    "name": "Test User",
 *    "password": "topsecret",
 *    "language": "Swedish",
 *    "testLocation": "Sweden",
 *    "contractId": 1234,
 *    "apartmentId": 1
 *  }' \
 *  http://localhost:3000/api/user/register
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "token": "2af38938a7e2aa3daa429278a8f4..."
 *   }
 */
router.post('/', function(req, res) {
  req.checkBody('email').notEmpty();
  req.checkBody('password').notEmpty();
  req.checkBody('name').notEmpty();

  var err;
  if ((err = req.validationErrors())) {
    res.status(500).send('There have been validation errors: ' + util.inspect(err));
  } else {
    var newUser = {
      email: req.body.email,
      profile: {
        name: req.body.name,
        language: req.body.language || 'English',
        testLocation: req.body.testLocation,
        contractId: req.body.contractId,
      }
    };
    // Adding testbed and cooperative info to user if present
    // TODO: this info should be moved to household
    if (!_.isEmpty(req.body.household)) {
      newUser.testbed = req.body.household.testbed;
      newUser.cooperativeId = req.body.household.cooperativeId;
    }
    User.register(newUser, req.body.password, function(err, user) {
      if (err) {
        return res.status(500).send('Error while registering. ' + err);
      }

      auth.newUserToken(user, function(err, token) {
        if (achievements.isBeta) {
          achievements.updateAchievement(user, 'betaTester', function() {
            return 1;
          });
        }

        // Creating a household if data is present
        if (!_.isEmpty(req.body.household)) {
          var household = req.body.household;
          household.ownerId = user._id;
          Household.create(household, function(er2) {
            if (!er2 && household && household.extraInfo && household.extraInfo.invoiceNo) {
              mailer.notifyNewUserRegistered(user, household);
            }

            res.successRes(err, {
              token: token
            });
          });
        } else {
          res.successRes(err, {
            token: token
          });
        }
      });
    });
  }

  Log.create({
    category: 'Register User',
    type: 'create',
    data: req.body
  });
});

/**
 * @apiDefine Authorization
 * @apiHeader {String} Authorization Authorization token
 * @apiHeaderExample {String} Authorization-Example:
 *   "Authorization: Bearer 615ea82f7fec0ffaee5..."
 */

/**
 * @api {get} /user/profile Get your profile
 * @apiGroup User
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X GET -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/user/profile
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "email": "testuser1@test.com",
 *     "profile": {
 *       "name": "Test User"
 *     },
 *     "actions": {
 *       "pending": {},
 *       "inProgress": {},
 *       "done": {},
 *       "declined": {},
 *       "na": {}
 *     },
 *     "leaves": 42,
 *     "householdId": null,
 *     "pendingHouseholdInvites": [
 *      '5562c1d46b1083a13e5b7843'
 *     ],
 *     "pendingCommunityInvites" [
 *      '5562c1d46b1083a13e5b7844'
 *     ],
 *     "energyConsumption": {},
 *     "production": 0
 *   }
 *
 * @apiVersion 1.0.0
 */
router.get('/', auth.authenticate(), function (req, res) {
  User.getProfile(req.user._id, (err, profile) => {
    if (err) {
      res.status(404).render('/404', { err: err.message });
    } else {
      res.render('/user', profile);
    }
  });

  Log.create({
    userId: req.user._id,
    category: 'Own User Profile',
    type: 'get'
  });
});

/**
 * @api {post} /user/profile Update your profile
 * @apiGroup User
 *
 * @apiParam {String} [name] Your nickname
 * @apiParam {Date} [dob] Your date of birth
 * @apiParam {String} [photo] Profile photo
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/profile
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "name": "New Name",
 *    "dob": "11 25 1990"
 *  }' \
 *  http://localhost:3000/api/user/profile
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "dob": "1990-11-25T00:00:00.000Z",
 *   "name": "New Name"
 * }
 */
router.put('/', auth.authenticate(), function(req, res) {
  req.checkBody('dob').optional().isDate();
  const err = req.validationErrors();

  if (err) {
    res.status(400).render(
      '/user',
      Object.assign({ err: err.message }, req.body)
    );
  } else {
    User.updateProfile(req.user, req.body, (err, user) => {
      if (err) {
        res.status(500).render(
          '/user',
          Object.assign({ err: err.message }, req.body)
        );
      } else {
        res.render('/user', user);
      }
    });

    Log.create({
      userId: req.user._id,
      category: 'Own User Profile',
      type: 'update',
      data: req.body
    });
  }
});

module.exports = router;
