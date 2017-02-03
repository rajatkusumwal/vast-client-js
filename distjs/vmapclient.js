var VMAPClient, VMAPParser;

VMAPParser = require('./vmapparser');

VMAPClient = (function() {
  function VMAPClient() {}

  VMAPClient.get = function(url, cb) {
    return VMAPParser.parse(url, (function(_this) {
      return function(response, err) {
        return cb(response, err);
      };
    })(this));
  };

  return VMAPClient;

})();

module.exports = VMAPClient;