/* globals db */

var USERS = [
  [ '593e60db1bb9ff006c029859', [ 'martin@keysento.se', 'kenneth@gronlund.nu' ]],
  [ '593e60db426e38006c03cca4', [ 'strahle@gmail.com', 'goranisak@hotmail.com' ]],
  [ '593e60dc1bb9ff006e782b46', [ 'linus.plym.forshell@brfgrynnan.se' ]],
  [ '593e60dc1bb9ff006d6fefeb', [ 'allanlarsson@telia.com', 'elisabeth.ollesdotter@lr.se' ]],
  [ '593e60dc1bb9ff006d6fefee', [ 'jorgen@atmosfar.se' ]],
  [ '593e60dc426e38006f59df5e', [ 'jakob.jonsson@nordicgreen.se' ]],
  [ '593e60dc1bb9ff006f3d91b4', [ 'eje.eriksson@comhem.se' ]],
  [ '593e60dc1bb9ff006c02985c', [ 'peter@mandel.se' ]],
  [ '593e60dc426e38006d620cc3', [ 'yngve.ulsrod@brfsjoportalen.se' ]],
  [ '593e60dc1bb9ff006e782b49', [ 'cg.sjomark@bahnhof.se' ]],
  [ '593e60dc426e38006e3f321e', [ 'johan.nissen@gmail.com' ]],
  [ '593e60dc1bb9ff006c02985f', [ 'tommy.ure@gmail.com' ]],
  [ '593e60dc1bb9ff006f3d91b7', [ 'ralf.bergne@gmail.com' ]]
];

/**
 * Assign metry ID to existing users
 */

USERS.forEach(function (set) {
  var metryId = set[0];
  var emails = set[1];

  emails.forEach(function (email) {
    var user;
    var users = db.users.find({ email: email });

    while (users.hasNext()) {
      user = users.next();
      db.users.update({ _id: user._id }, { $set: { metryId: metryId }});
    }
  });
});

/**
 * Refactor user model
 */

db.users.find({}).forEach(user => {
  const profile = assign({}, user.profile, {
    language: lang(user.profile.language)
  });
  const props = { profile: profile };

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
