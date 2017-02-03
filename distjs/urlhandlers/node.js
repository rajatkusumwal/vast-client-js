var DOMParser, NodeURLHandler, fs, http, uri;

uri = require('url');

fs = require('fs');

http = require('http');

DOMParser = require('xmldom').DOMParser;

NodeURLHandler = (function() {
  function NodeURLHandler() {}

  NodeURLHandler.get = function(url, options, cb) {
    var data, fn, req, timeout_wrapper, timing;
    url = uri.parse(url);
    if (url.protocol === 'file:') {
      return fs.readFile(url.pathname, 'utf8', function(err, data) {
        var xml;
        if (err) {
          return cb(err);
        }
        xml = new DOMParser().parseFromString(data);
        return cb(null, xml);
      });
    } else {
      data = '';
      timeout_wrapper = function(req) {
        return function() {
          return req.abort();
        };
      };
      req = http.get(url.href, function(res) {
        res.on('data', function(chunk) {
          var timing;
          data += chunk;
          clearTimeout(timing);
          return timing = setTimeout(fn, options.timeout || 120000);
        });
        return res.on('end', function() {
          var xml;
          clearTimeout(timing);
          xml = new DOMParser().parseFromString(data);
          return cb(null, xml);
        });
      });
      req.on('error', function(err) {
        clearTimeout(timing);
        return cb(err);
      });
      fn = timeout_wrapper(req);
      return timing = setTimeout(fn, options.timeout || 120000);
    }
  };

  return NodeURLHandler;

})();

module.exports = NodeURLHandler;