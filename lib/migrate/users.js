/* globals db, ObjectId */

/**
 * Map of users matched with cooperative and Metry id
 * <COOPERATIVE_ID>: [
 *   <METRY_ID>,
 *   [ <USER_ID>, [...<USER_ID] ]
 * ]
 */

var USERS = {
  '57f16eaa60a4a9b50a81f89e': [
    '593e60db1bb9ff006c029859',
    [ '5859679b7486e2f732c892a5', '585570327486e2f732c891bf' ]
  ],
  '57f16eaa60a4a9b50a81f89f': [
    '593e60db426e38006c03cca4',
    [ '58170c1b7486e2f732c8664c', '581af0b67486e2f732c866f3' ]
  ],
  '5638c9656579012957b5e267': [
    '593e60dc1bb9ff006e782b46',
    [ '563a49fc16428aa25f766480' ]
  ],
  '5669b1462f939cc69a000001': [
    '593e60dc1bb9ff006d6fefeb',
    [ '569cfff67674b5e84005bfdf', '568cdd707674b5e84005b59d' ]
  ],
  '5638c9656579012957b5e26b': [
    '593e60dc1bb9ff006d6fefee',
    [ '56437ddfc79d1dc1132d8152' ]
  ],
  '573ec27ff7574d0000000001': [
    '593e60dc426e38006f59df5e',
    [ '57fa74444e8fec0a61a3bea6' ]
  ],
  '57f16eaa60a4a9b50a81f8af': [
    '593e60dc1bb9ff006f3d91b4',
    [ '581f28de7486e2f732c87b4b' ]
  ],
  '5638c9656579012957b5e26c': [
    '593e60dc1bb9ff006c02985c',
    [ '5638e0cc9191667857696239' ]
  ],
  '57f16eaa60a4a9b50a81f8b0': [
    '593e60dc426e38006d620cc3',
    [ '59194accd902270a7c8630e6' ]
  ],
  '56cb06c840a4dc186e000001': [
    '593e60dc1bb9ff006e782b49',
    [ '56cc143e807b16de588a8551' ]
  ],
  '57f16eaa60a4a9b50a81f8bb': [
    '593e60dc426e38006e3f321e',
    [ '58ce3e59a9b901f838a19d0a' ]
  ],
  '57f16eaa60a4a9b50a81f8bd': [
    '593e60dc1bb9ff006c02985f',
    [ '58bea63920d4f62716bbcf54' ]
  ],
  '5638c9656579012957b5e273': [
    '593e60dc1bb9ff006f3d91b7',
    [ '565447277c2aeaa206b590e5' ]
  ],
  '5638c9656579012957b5e26f': [
    '59958d95e1b88e006c1f554d',
    [ '5638debc9191667857696206' ]
  ],
  '57f16eaa60a4a9b50a81f8a7': [
    '59958dfce1b88e006c1f5561',
    [ '59a428f48563a4152c6cbacb' ]
  ]
};

/**
 * Assign metry ID to existing users
 */

for (var key in USERS) {
  if (USERS.hasOwnProperty(key)) {
    var metryId = USERS[key][0];
    var users = USERS[key][1].map(function (id) { return ObjectId(id); });

    // eslint-disable-next-line no-loop-func
    db.users.update({ _id: { $in: users }}, { $set: { metryId: metryId }}, {
      multi: true
    });
    db.cooperatives.update({ _id: ObjectId(key) }, { $set: { editors: users }});
  }
}

/**
 * Refactor user model
 */

db.users.find({}).forEach(function (user) {
  var profile = assign({}, user.profile, {
    language: lang(user.profile.language)
  });
  var props = { profile: profile };

  if (user.cooperativeId) {
    props.cooperative = user.cooperativeId;
  }

  delete profile.toRehearse;

  db.users.update({ _id: user._id }, {
    $set: props,
    $unset: {
      language: '',
      actions: '',
      achievements: '',
      numFeedback: '',
      recentAchievements: '',
      cooperativeId: ''
    }
  });
});

function lang(language) {
  switch(language) {
    case 'en':
    case 'English':
      return 'en';
    case 'sv':
    case 'Swedish':
    default:
      return 'sv';
  }
}

function assign() {
  var args = Array.prototype.slice.call(arguments);
  var target = args[0];

  for (var i = 1; i < args.length; i += 1) {
    if (args[i] && typeof args[i] === 'object') {
      for (var key in args[i]) {
        if (args[i].hasOwnProperty(key)) {
          target[key] = args[i][key];
        }
      }
    }
  }

  return target;
}
