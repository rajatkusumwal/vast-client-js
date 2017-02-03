var FlashURLHandler;

FlashURLHandler = (function() {
  function FlashURLHandler() {}

  FlashURLHandler.xdr = function() {
    var xdr;
    if (window.XDomainRequest) {
      xdr = new XDomainRequest();
    }
    return xdr;
  };

  FlashURLHandler.supported = function() {
    return !!this.xdr();
  };

  FlashURLHandler.get = function(url, options, cb) {
    var xdr, xmlDocument;
    if (xmlDocument = typeof window.ActiveXObject === "function" ? new window.ActiveXObject("Microsoft.XMLDOM") : void 0) {
      xmlDocument.async = false;
    } else {
      return cb(new Error('FlashURLHandler: Microsoft.XMLDOM format not supported'));
    }
    xdr = this.xdr();
    xdr.open('GET', url);
    xdr.timeout = options.timeout || 0;
    xdr.withCredentials = options.withCredentials || false;
    xdr.send();
    xdr.onprogress = function() {};
    return xdr.onload = function() {
      xmlDocument.loadXML(xdr.responseText);
      return cb(null, xmlDocument);
    };
  };

  return FlashURLHandler;

})();

module.exports = FlashURLHandler;