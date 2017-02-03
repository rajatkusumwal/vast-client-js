var EventEmitter, URLHandler, VASTResponse, VASTUtil, VMAPAdBreak, VMAPAdSource, VMAPAdSourceAdTagData, VMAPParser, VMAPResponse;

URLHandler = require('./urlhandler');

VMAPResponse = require('./vmapad').VMAPAd;

VMAPAdBreak = require('./vmapad').VMAPAdBreak;

VMAPAdSource = require('./vmapad').VMAPAdSource;

VMAPAdSourceAdTagData = require('./vmapad').VMAPAdSourceAdTagData;

VASTResponse = require('./client');

VASTUtil = require('./util');

EventEmitter = require('events').EventEmitter;

VMAPParser = (function() {
  var URLTemplateFilters;

  function VMAPParser() {}

  URLTemplateFilters = [];

  VMAPParser.addURLTemplateFilter = function(func) {
    if (typeof func === 'function') {
      URLTemplateFilters.push(func);
    }
  };

  VMAPParser.removeURLTemplateFilter = function() {
    return URLTemplateFilters.pop();
  };

  VMAPParser.countURLTemplateFilters = function() {
    return URLTemplateFilters.length;
  };

  VMAPParser.clearUrlTemplateFilters = function() {
    return URLTemplateFilters = [];
  };

  VMAPParser.parse = function(url, options, cb) {
    if (!cb) {
      if (typeof options === 'function') {
        cb = options;
      }
      options = {};
    }
    return this._parse(url, null, options, function(err, response) {
      return cb(response, err);
    });
  };

  VMAPParser._parse = function(url, parentURLs, options, cb) {
    var filter, i, len;
    if (!cb) {
      if (typeof options === 'function') {
        cb = options;
      }
      options = {};
    }
    for (i = 0, len = URLTemplateFilters.length; i < len; i++) {
      filter = URLTemplateFilters[i];
      url = filter(url);
    }
    return URLHandler.get(url, options, (function(_this) {
      return function(err, xml) {
        var adBreak, j, len1, node, ref, response;
        if (err != null) {
          return cb(err);
        }
        response = new VMAPResponse();
        if (!(((xml != null ? xml.documentElement : void 0) != null) && xml.documentElement.nodeName === "vmap:VMAP")) {
          return cb(new Error('Invalid VMAP XMLDocument or Tag name is not vmap:VMAP'));
        }
        if (xml.documentElement.attributes.version.nodeValue !== "1.0") {
          return cb(new Error('Invalid VMAP version we support version 1.0 currently or verion attribute is not present.'));
        }
        response.version = xml.documentElement.attributes.version.nodeValue;
        ref = xml.documentElement.childNodes;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          node = ref[j];
          if (node.nodeName === 'vmap:AdBreak') {
            adBreak = _this.parseAdBreak(node);
            if (adBreak != null) {
              response.adBreak.push(adBreak);
            }
          }
        }
        return cb(null, response);
      };
    })(this));
  };

  VMAPParser.parseAdBreak = function(adBreakElement) {
    var adBreakResponse, adSource, i, len, node, ref, trackingEvents;
    adBreakResponse = new VMAPAdBreak();
    adBreakResponse.timeOffset = adBreakElement.getAttribute("timeOffset") || null;
    adBreakResponse.breakType = adBreakElement.getAttribute("breakType") || null;
    adBreakResponse.breakId = adBreakElement.getAttribute("breakId") || null;
    ref = adBreakElement.childNodes;
    for (i = 0, len = ref.length; i < len; i++) {
      node = ref[i];
      if (node.nodeName === 'vmap:AdSource') {
        adSource = this.parseAdSource(node);
        if (adSource != null) {
          adBreakResponse.adSource.push(adSource);
        }
      } else if (node.nodeName === 'vmap:TrackingEvents') {
        trackingEvents = this.parseAdSourceTrackingEvents(node);
        if (trackingEvents != null) {
          adBreakResponse.adSource.push(adSource);
        }
      }
    }
    return adBreakResponse;
  };

  VMAPParser.parseAdSource = function(adSourceElement) {
    var VASTAdData, adSourceResponse, adTagURI, customAdData, i, len, node, ref;
    adSourceResponse = new VMAPAdSource();
    adSourceResponse.id = adSourceElement.getAttribute("id") || null;
    adSourceResponse.allowMultipleAds = adSourceElement.getAttribute("allowMultipleAds") || null;
    adSourceResponse.followRedirects = adSourceElement.getAttribute("followRedirects") || null;
    ref = adSourceElement.childNodes;
    for (i = 0, len = ref.length; i < len; i++) {
      node = ref[i];
      if (node.nodeName === 'vmap:VASTAdData') {
        VASTAdData = this.parseAdSourceVASTAdData(node);
        if (VASTAdData != null) {
          adSourceResponse.adTagData = VASTAdData;
        }
      } else if (node.nodeName === 'vmap:CustomAdData') {
        customAdData = this.parseAdSourceCustomAdData(node);
        if (customAdData != null) {
          adSourceResponse.adTagData = customAdData;
        }
      } else if (node.nodeName === 'vmap:AdTagURI') {
        adTagURI = this.parseAdSourceAdTagURI(node);
        if (adTagURI != null) {
          adSourceResponse.adTagData = adTagURI;
        }
      }
    }
    return adSourceResponse;
  };

  VMAPParser.parseAdSourceVASTAdData = function(VASTAdDataElement) {
    var adDataResponse, i, len, node, ref;
    adDataResponse = new VMAPAdSourceAdTagData;
    adDataResponse.templateTagName = "vmap:VASTAdData";
    adDataResponse.templateType = "vast3";
    ref = VASTAdDataElement.childNodes;
    for (i = 0, len = ref.length; i < len; i++) {
      node = ref[i];
      if (node.nodeName === 'VAST') {
        adDataResponse.templateData = node.outerHTML;
        break;
      }
    }
    return adDataResponse;
  };

  VMAPParser.parseAdSourceCustomAdData = function(VASTCustomAdDataElement) {
    var adDataResponse;
    adDataResponse = new VMAPAdSourceAdTagData;
    adDataResponse.templateTagName = "vmap:CustomAdData";
    adDataResponse.templateType = VASTCustomAdDataElement.getAttribute("templateType") || null;
    adDataResponse.templateData = this.parseNodeText(VASTCustomAdDataElement);
    return adDataResponse;
  };

  VMAPParser.parseAdSourceAdTagURI = function(VASTAdTagURIElement) {
    var adDataResponse;
    adDataResponse = new VMAPAdSourceAdTagData;
    adDataResponse.templateTagName = "vmap:AdTagURI";
    adDataResponse.templateType = VASTAdTagURIElement.getAttribute("templateType") || null;
    adDataResponse.templateData = this.parseNodeText(VASTAdTagURIElement);
    return adDataResponse;
  };

  VMAPParser.parseNodeText = function(node) {
    return node && (node.textContent || node.text || '').trim();
  };

  return VMAPParser;

})();

module.exports = VMAPParser;