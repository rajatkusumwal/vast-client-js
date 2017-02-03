var URLHandler, flash, xhr;

xhr = require('./urlhandlers/xmlhttprequest');

flash = require('./urlhandlers/flash');

URLHandler = (function() {
  function URLHandler() {}

  URLHandler.get = function(url, options, cb) {
    var ref, response;
    if (!cb) {
      if (typeof options === 'function') {
        cb = options;
      }
      options = {};
    }
    if (options.response != null) {
      response = (new DOMParser()).parseFromString(options.response, "text/xml");
      delete options.response;
      return cb(null, response);
    } else if ((ref = options.urlhandler) != null ? ref.supported() : void 0) {
      return options.urlhandler.get(url, options, cb);
    } else if (typeof window === "undefined" || window === null) {
      return require('./urlhandlers/' + 'node').get(url, options, cb);
    } else if (xhr.supported()) {
      return xhr.get(url, options, cb);
    } else if (flash.supported()) {
      return flash.get(url, options, cb);
    } else {
      return cb(new Error('Current context is not supported by any of the default URLHandlers. Please provide a custom URLHandler'));
    }
  };

  return URLHandler;

})();

module.exports = URLHandler;