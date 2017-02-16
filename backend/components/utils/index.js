const REQ_VALUE = 70;
exports.getEnergyClass = function getEnergyClass(performance) {
  if (performance <= REQ_VALUE * 0.5) {
    return 'A';
  } else if(performance > REQ_VALUE * 0.5 && performance <= REQ_VALUE * 0.75) {
    return 'B';
  } else if(performance > REQ_VALUE * 0.75 && performance <= REQ_VALUE * 1.0) {
    return 'C';
  } else if(performance > REQ_VALUE * 1.0 && performance <= REQ_VALUE * 1.35) {
    return 'D';
  } else if(performance > REQ_VALUE * 1.35 && performance <= REQ_VALUE * 1.8) {
    return 'E';
  } else if(performance > REQ_VALUE * 1.8 && performance <= REQ_VALUE * 2.35) {
    return 'F';
  } else if(performance > REQ_VALUE * 2.35) {
    return 'G';
  }
};
