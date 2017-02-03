var VASTClient, VASTParser, VASTUtil;

VASTParser = require('./parser');

VASTUtil = require('./util');

VASTClient = (function() {
  function VASTClient() {}

  VASTClient.cappingFreeLunch = 0;

  VASTClient.cappingMinimumTimeInterval = 0;

  VASTClient.options = {
    withCredentials: false,
    timeout: 0
  };

  VASTClient.get = function(url, opts, cb) {
    var extend, now, options, timeSinceLastCall;
    now = +new Date();
    extend = exports.extend = function(object, properties) {
      var key, val;
      for (key in properties) {
        val = properties[key];
        object[key] = val;
      }
      return object;
    };
    if (!cb) {
      if (typeof opts === 'function') {
        cb = opts;
      }
      options = {};
    }
    options = extend(this.options, opts);
    if (this.totalCallsTimeout < now) {
      this.totalCalls = 1;
      this.totalCallsTimeout = now + (60 * 60 * 1000);
    } else {
      this.totalCalls++;
    }
    if (this.cappingFreeLunch >= this.totalCalls) {
      cb(null, new Error("VAST call canceled – FreeLunch capping not reached yet " + this.totalCalls + "/" + this.cappingFreeLunch));
      return;
    }
    timeSinceLastCall = now - this.lastSuccessfullAd;
    if (timeSinceLastCall < 0) {
      this.lastSuccessfullAd = 0;
    } else if (timeSinceLastCall < this.cappingMinimumTimeInterval) {
      cb(null, new Error("VAST call canceled – (" + this.cappingMinimumTimeInterval + ")ms minimum interval reached"));
      return;
    }
    return VASTParser.parse(url, options, (function(_this) {
      return function(response, err) {
        return cb(response, err);
      };
    })(this));
  };

  (function() {
    var defineProperty, storage;
    storage = VASTUtil.storage;
    defineProperty = Object.defineProperty;
    ['lastSuccessfullAd', 'totalCalls', 'totalCallsTimeout'].forEach(function(property) {
      defineProperty(VASTClient, property, {
        get: function() {
          return storage.getItem(property);
        },
        set: function(value) {
          return storage.setItem(property, value);
        },
        configurable: false,
        enumerable: true
      });
    });
    if (VASTClient.lastSuccessfullAd == null) {
      VASTClient.lastSuccessfullAd = 0;
    }
    if (VASTClient.totalCalls == null) {
      VASTClient.totalCalls = 0;
    }
    if (VASTClient.totalCallsTimeout == null) {
      VASTClient.totalCallsTimeout = 0;
    }
  })();

  return VASTClient;

})();

module.exports = VASTClient;