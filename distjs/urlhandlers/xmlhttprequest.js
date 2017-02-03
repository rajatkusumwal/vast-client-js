var XHRURLHandler;

XHRURLHandler = (function() {
  function XHRURLHandler() {}

  XHRURLHandler.xhr = function() {
    var xhr;
    xhr = new window.XMLHttpRequest();
    if ('withCredentials' in xhr) {
      return xhr;
    }
  };

  XHRURLHandler.supported = function() {
    return !!this.xhr();
  };

  XHRURLHandler.get = function(url, options, cb) {
    var xhr;
    if (window.location.protocol === 'https:' && url.indexOf('http://') === 0) {
      return cb(new Error('XHRURLHandler: Cannot go from HTTPS to HTTP.'));
    }
    try {
      xhr = this.xhr();
      xhr.open('GET', url);
      xhr.timeout = options.timeout || 0;
      xhr.withCredentials = options.withCredentials || false;
      xhr.overrideMimeType && xhr.overrideMimeType('text/xml');
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            return cb(null, xhr.responseXML);
          } else {
            return cb(new Error("XHRURLHandler: " + xhr.statusText));
          }
        }
      };
      return xhr.send();
    } catch (error) {
      return cb(new Error('XHRURLHandler: Unexpected error'));
    }
  };

  return XHRURLHandler;

})();

module.exports = XHRURLHandler;