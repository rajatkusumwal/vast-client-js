var EventEmitter, URLHandler, VASTAd, VASTAdExtension, VASTAdExtensionChild, VASTCompanionAd, VASTCreativeCompanion, VASTCreativeLinear, VASTCreativeNonLinear, VASTIcon, VASTMediaFile, VASTNonLinear, VASTParser, VASTResponse, VASTUtil,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

URLHandler = require('./urlhandler');

VASTResponse = require('./response');

VASTAd = require('./ad');

VASTAdExtension = require('./extension');

VASTAdExtensionChild = require('./extensionchild');

VASTUtil = require('./util');

VASTCreativeLinear = require('./creative').VASTCreativeLinear;

VASTCreativeCompanion = require('./creative').VASTCreativeCompanion;

VASTCreativeNonLinear = require('./creative').VASTCreativeNonLinear;

VASTMediaFile = require('./mediafile');

VASTIcon = require('./icon');

VASTCompanionAd = require('./companionad');

VASTNonLinear = require('./nonlinear');

EventEmitter = require('events').EventEmitter;

VASTParser = (function() {
  var URLTemplateFilters;

  function VASTParser() {}

  URLTemplateFilters = [];

  VASTParser.addURLTemplateFilter = function(func) {
    if (typeof func === 'function') {
      URLTemplateFilters.push(func);
    }
  };

  VASTParser.removeURLTemplateFilter = function() {
    return URLTemplateFilters.pop();
  };

  VASTParser.countURLTemplateFilters = function() {
    return URLTemplateFilters.length;
  };

  VASTParser.clearUrlTemplateFilters = function() {
    return URLTemplateFilters = [];
  };

  VASTParser.parse = function(url, options, cb) {
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

  VASTParser.vent = new EventEmitter();

  VASTParser.track = function(templates, errorCode) {
    this.vent.emit('VAST-error', errorCode);
    return VASTUtil.track(templates, errorCode);
  };

  VASTParser.on = function(eventName, cb) {
    return this.vent.on(eventName, cb);
  };

  VASTParser.once = function(eventName, cb) {
    return this.vent.once(eventName, cb);
  };

  VASTParser._parse = function(url, parentURLs, options, cb) {
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
    if (parentURLs == null) {
      parentURLs = [];
    }
    parentURLs.push(url);
    return URLHandler.get(url, options, (function(_this) {
      return function(err, xml) {
        var ad, complete, j, k, len1, len2, loopIndex, node, ref, ref1, response;
        if (err != null) {
          return cb(err);
        }
        response = new VASTResponse();
        if (!(((xml != null ? xml.documentElement : void 0) != null) && xml.documentElement.nodeName === "VAST")) {
          return cb(new Error('Invalid VAST XMLDocument'));
        }
        ref = xml.documentElement.childNodes;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          node = ref[j];
          if (node.nodeName === 'Error') {
            response.errorURLTemplates.push(_this.parseNodeText(node));
          }
        }
        ref1 = xml.documentElement.childNodes;
        for (k = 0, len2 = ref1.length; k < len2; k++) {
          node = ref1[k];
          if (node.nodeName === 'Ad') {
            ad = _this.parseAdElement(node);
            if (ad != null) {
              response.ads.push(ad);
            } else {
              _this.track(response.errorURLTemplates, {
                ERRORCODE: 101
              });
            }
          }
        }
        complete = function(errorAlreadyRaised) {
          var l, len3, noCreatives, ref2;
          if (errorAlreadyRaised == null) {
            errorAlreadyRaised = false;
          }
          if (!response) {
            return;
          }
          noCreatives = true;
          ref2 = response.ads;
          for (l = 0, len3 = ref2.length; l < len3; l++) {
            ad = ref2[l];
            if (ad.nextWrapperURL != null) {
              return;
            }
            if (ad.creatives.length > 0) {
              noCreatives = false;
            }
          }
          if (noCreatives) {
            if (!errorAlreadyRaised) {
              _this.track(response.errorURLTemplates, {
                ERRORCODE: 303
              });
            }
          }
          if (response.ads.length === 0) {
            response = null;
          }
          return cb(null, response);
        };
        loopIndex = response.ads.length;
        while (loopIndex--) {
          ad = response.ads[loopIndex];
          if (ad.nextWrapperURL == null) {
            continue;
          }
          (function(ad) {
            var baseURL, protocol, ref2;
            if (parentURLs.length >= 10 || (ref2 = ad.nextWrapperURL, indexOf.call(parentURLs, ref2) >= 0)) {
              _this.track(ad.errorURLTemplates, {
                ERRORCODE: 302
              });
              response.ads.splice(response.ads.indexOf(ad), 1);
              complete();
              return;
            }
            if (ad.nextWrapperURL.indexOf('//') === 0) {
              protocol = location.protocol;
              ad.nextWrapperURL = "" + protocol + ad.nextWrapperURL;
            } else if (ad.nextWrapperURL.indexOf('://') === -1) {
              baseURL = url.slice(0, url.lastIndexOf('/'));
              ad.nextWrapperURL = baseURL + "/" + ad.nextWrapperURL;
            }
            return _this._parse(ad.nextWrapperURL, parentURLs, options, function(err, wrappedResponse) {
              var base, creative, errorAlreadyRaised, eventName, index, l, len3, len4, len5, len6, len7, len8, m, n, o, p, q, ref3, ref4, ref5, ref6, ref7, ref8, wrappedAd;
              errorAlreadyRaised = false;
              if (err != null) {
                _this.track(ad.errorURLTemplates, {
                  ERRORCODE: 301
                });
                response.ads.splice(response.ads.indexOf(ad), 1);
                errorAlreadyRaised = true;
              } else if (wrappedResponse == null) {
                _this.track(ad.errorURLTemplates, {
                  ERRORCODE: 303
                });
                response.ads.splice(response.ads.indexOf(ad), 1);
                errorAlreadyRaised = true;
              } else {
                response.errorURLTemplates = response.errorURLTemplates.concat(wrappedResponse.errorURLTemplates);
                index = response.ads.indexOf(ad);
                response.ads.splice(index, 1);
                ref3 = wrappedResponse.ads;
                for (l = 0, len3 = ref3.length; l < len3; l++) {
                  wrappedAd = ref3[l];
                  wrappedAd.errorURLTemplates = ad.errorURLTemplates.concat(wrappedAd.errorURLTemplates);
                  wrappedAd.impressionURLTemplates = ad.impressionURLTemplates.concat(wrappedAd.impressionURLTemplates);
                  wrappedAd.extensions = ad.extensions.concat(wrappedAd.extensions);
                  if (ad.trackingEvents != null) {
                    ref4 = wrappedAd.creatives;
                    for (m = 0, len4 = ref4.length; m < len4; m++) {
                      creative = ref4[m];
                      if (ad.trackingEvents[creative.type] != null) {
                        ref5 = Object.keys(ad.trackingEvents[creative.type]);
                        for (n = 0, len5 = ref5.length; n < len5; n++) {
                          eventName = ref5[n];
                          (base = creative.trackingEvents)[eventName] || (base[eventName] = []);
                          creative.trackingEvents[eventName] = creative.trackingEvents[eventName].concat(ad.trackingEvents[creative.type][eventName]);
                        }
                      }
                    }
                  }
                  if (ad.videoClickTrackingURLTemplates != null) {
                    ref6 = wrappedAd.creatives;
                    for (o = 0, len6 = ref6.length; o < len6; o++) {
                      creative = ref6[o];
                      if (creative.type === 'linear') {
                        creative.videoClickTrackingURLTemplates = creative.videoClickTrackingURLTemplates.concat(ad.videoClickTrackingURLTemplates);
                      }
                    }
                  }
                  if (ad.videoCustomClickURLTemplates != null) {
                    ref7 = wrappedAd.creatives;
                    for (p = 0, len7 = ref7.length; p < len7; p++) {
                      creative = ref7[p];
                      if (creative.type === 'linear') {
                        creative.videoCustomClickURLTemplates = creative.videoCustomClickURLTemplates.concat(ad.videoCustomClickURLTemplates);
                      }
                    }
                  }
                  if (ad.videoClickThroughURLTemplate != null) {
                    ref8 = wrappedAd.creatives;
                    for (q = 0, len8 = ref8.length; q < len8; q++) {
                      creative = ref8[q];
                      if (creative.type === 'linear' && (creative.videoClickThroughURLTemplate == null)) {
                        creative.videoClickThroughURLTemplate = ad.videoClickThroughURLTemplate;
                      }
                    }
                  }
                  response.ads.splice(++index, 0, wrappedAd);
                }
              }
              delete ad.nextWrapperURL;
              return complete(errorAlreadyRaised);
            });
          })(ad);
        }
        return complete();
      };
    })(this));
  };

  VASTParser.childByName = function(node, name) {
    var child, i, len, ref;
    ref = node.childNodes;
    for (i = 0, len = ref.length; i < len; i++) {
      child = ref[i];
      if (child.nodeName === name) {
        return child;
      }
    }
  };

  VASTParser.childsByName = function(node, name) {
    var child, childs, i, len, ref;
    childs = [];
    ref = node.childNodes;
    for (i = 0, len = ref.length; i < len; i++) {
      child = ref[i];
      if (child.nodeName === name) {
        childs.push(child);
      }
    }
    return childs;
  };

  VASTParser.parseAdElement = function(adElement) {
    var adTypeElement, i, len, ref, ref1;
    ref = adElement.childNodes;
    for (i = 0, len = ref.length; i < len; i++) {
      adTypeElement = ref[i];
      if ((ref1 = adTypeElement.nodeName) !== "Wrapper" && ref1 !== "InLine") {
        continue;
      }
      this.copyNodeAttribute("id", adElement, adTypeElement);
      this.copyNodeAttribute("sequence", adElement, adTypeElement);
      if (adTypeElement.nodeName === "Wrapper") {
        return this.parseWrapperElement(adTypeElement);
      } else if (adTypeElement.nodeName === "InLine") {
        return this.parseInLineElement(adTypeElement);
      }
    }
  };

  VASTParser.parseWrapperElement = function(wrapperElement) {
    var ad, creative, i, len, ref, wrapperCreativeElement, wrapperURLElement;
    ad = this.parseInLineElement(wrapperElement);
    wrapperURLElement = this.childByName(wrapperElement, "VASTAdTagURI");
    if (wrapperURLElement != null) {
      ad.nextWrapperURL = this.parseNodeText(wrapperURLElement);
    } else {
      wrapperURLElement = this.childByName(wrapperElement, "VASTAdTagURL");
      if (wrapperURLElement != null) {
        ad.nextWrapperURL = this.parseNodeText(this.childByName(wrapperURLElement, "URL"));
      }
    }
    ref = ad.creatives;
    for (i = 0, len = ref.length; i < len; i++) {
      creative = ref[i];
      wrapperCreativeElement = null;
      if (creative.type === 'linear' || creative.type === 'nonlinear') {
        wrapperCreativeElement = creative;
        if (wrapperCreativeElement != null) {
          if (wrapperCreativeElement.trackingEvents != null) {
            ad.trackingEvents || (ad.trackingEvents = {});
            ad.trackingEvents[wrapperCreativeElement.type] = wrapperCreativeElement.trackingEvents;
          }
          if (wrapperCreativeElement.videoClickTrackingURLTemplates != null) {
            ad.videoClickTrackingURLTemplates = wrapperCreativeElement.videoClickTrackingURLTemplates;
          }
          if (wrapperCreativeElement.videoClickThroughURLTemplate != null) {
            ad.videoClickThroughURLTemplate = wrapperCreativeElement.videoClickThroughURLTemplate;
          }
          if (wrapperCreativeElement.videoCustomClickURLTemplates != null) {
            ad.videoCustomClickURLTemplates = wrapperCreativeElement.videoCustomClickURLTemplates;
          }
        }
      }
    }
    if (ad.nextWrapperURL != null) {
      return ad;
    }
  };

  VASTParser.parseInLineElement = function(inLineElement) {
    var ad, creative, creativeElement, creativeTypeElement, i, j, k, len, len1, len2, node, ref, ref1, ref2;
    ad = new VASTAd();
    ad.id = inLineElement.getAttribute("id") || null;
    ad.sequence = inLineElement.getAttribute("sequence") || null;
    ref = inLineElement.childNodes;
    for (i = 0, len = ref.length; i < len; i++) {
      node = ref[i];
      switch (node.nodeName) {
        case "Error":
          ad.errorURLTemplates.push(this.parseNodeText(node));
          break;
        case "Impression":
          ad.impressionURLTemplates.push(this.parseNodeText(node));
          break;
        case "Creatives":
          ref1 = this.childsByName(node, "Creative");
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            creativeElement = ref1[j];
            ref2 = creativeElement.childNodes;
            for (k = 0, len2 = ref2.length; k < len2; k++) {
              creativeTypeElement = ref2[k];
              switch (creativeTypeElement.nodeName) {
                case "Linear":
                  creative = this.parseCreativeLinearElement(creativeTypeElement);
                  if (creative) {
                    ad.creatives.push(creative);
                  }
                  break;
                case "NonLinearAds":
                  creative = this.parseNonLinear(creativeTypeElement);
                  if (creative) {
                    ad.creatives.push(creative);
                  }
                  break;
                case "CompanionAds":
                  creative = this.parseCompanionAd(creativeTypeElement);
                  if (creative) {
                    ad.creatives.push(creative);
                  }
              }
            }
          }
          break;
        case "Extensions":
          this.parseExtension(ad.extensions, this.childsByName(node, "Extension"));
          break;
        case "AdSystem":
          ad.system = {
            value: this.parseNodeText(node),
            version: node.getAttribute("version") || null
          };
          break;
        case "AdTitle":
          ad.title = this.parseNodeText(node);
          break;
        case "Description":
          ad.description = this.parseNodeText(node);
          break;
        case "Advertiser":
          ad.advertiser = this.parseNodeText(node);
          break;
        case "Pricing":
          ad.pricing = {
            value: this.parseNodeText(node),
            model: node.getAttribute("model") || null,
            currency: node.getAttribute("currency") || null
          };
          break;
        case "Survey":
          ad.survey = this.parseNodeText(node);
      }
    }
    return ad;
  };

  VASTParser.parseExtension = function(collection, extensions) {
    var childNode, ext, extChild, extChildNodeAttr, extNode, extNodeAttr, i, j, k, l, len, len1, len2, len3, ref, ref1, ref2, results, txt;
    results = [];
    for (i = 0, len = extensions.length; i < len; i++) {
      extNode = extensions[i];
      ext = new VASTAdExtension();
      if (extNode.attributes) {
        ref = extNode.attributes;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          extNodeAttr = ref[j];
          ext.attributes[extNodeAttr.nodeName] = extNodeAttr.nodeValue;
        }
      }
      ref1 = extNode.childNodes;
      for (k = 0, len2 = ref1.length; k < len2; k++) {
        childNode = ref1[k];
        txt = this.parseNodeText(childNode);
        if (childNode.nodeName !== '#comment' && txt !== '') {
          extChild = new VASTAdExtensionChild();
          extChild.name = childNode.nodeName;
          extChild.value = txt;
          if (childNode.attributes) {
            ref2 = childNode.attributes;
            for (l = 0, len3 = ref2.length; l < len3; l++) {
              extChildNodeAttr = ref2[l];
              extChild.attributes[extChildNodeAttr.nodeName] = extChildNodeAttr.nodeValue;
            }
          }
          ext.children.push(extChild);
        }
      }
      results.push(collection.push(ext));
    }
    return results;
  };

  VASTParser.parseCreativeLinearElement = function(creativeElement) {
    var adParamsElement, base, clickTrackingElement, creative, customClickElement, eventName, htmlElement, i, icon, iconClickTrackingElement, iconClicksElement, iconElement, iconsElement, iframeElement, j, k, l, len, len1, len10, len2, len3, len4, len5, len6, len7, len8, len9, m, maintainAspectRatio, mediaFile, mediaFileElement, mediaFilesElement, n, o, offset, p, percent, q, r, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, s, scalable, skipOffset, staticElement, trackingElement, trackingEventsElement, trackingURLTemplate, videoClicksElement;
    creative = new VASTCreativeLinear();
    creative.duration = this.parseDuration(this.parseNodeText(this.childByName(creativeElement, "Duration")));
    if (creative.duration === -1 && creativeElement.parentNode.parentNode.parentNode.nodeName !== 'Wrapper') {
      return null;
    }
    skipOffset = creativeElement.getAttribute("skipoffset");
    if (skipOffset == null) {
      creative.skipDelay = null;
    } else if (skipOffset.charAt(skipOffset.length - 1) === "%") {
      percent = parseInt(skipOffset, 10);
      creative.skipDelay = creative.duration * (percent / 100);
    } else {
      creative.skipDelay = this.parseDuration(skipOffset);
    }
    videoClicksElement = this.childByName(creativeElement, "VideoClicks");
    if (videoClicksElement != null) {
      creative.videoClickThroughURLTemplate = this.parseNodeText(this.childByName(videoClicksElement, "ClickThrough"));
      ref = this.childsByName(videoClicksElement, "ClickTracking");
      for (i = 0, len = ref.length; i < len; i++) {
        clickTrackingElement = ref[i];
        creative.videoClickTrackingURLTemplates.push(this.parseNodeText(clickTrackingElement));
      }
      ref1 = this.childsByName(videoClicksElement, "CustomClick");
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        customClickElement = ref1[j];
        creative.videoCustomClickURLTemplates.push(this.parseNodeText(customClickElement));
      }
    }
    adParamsElement = this.childByName(creativeElement, "AdParameters");
    if (adParamsElement != null) {
      creative.adParameters = this.parseNodeText(adParamsElement);
    }
    ref2 = this.childsByName(creativeElement, "TrackingEvents");
    for (k = 0, len2 = ref2.length; k < len2; k++) {
      trackingEventsElement = ref2[k];
      ref3 = this.childsByName(trackingEventsElement, "Tracking");
      for (l = 0, len3 = ref3.length; l < len3; l++) {
        trackingElement = ref3[l];
        eventName = trackingElement.getAttribute("event");
        trackingURLTemplate = this.parseNodeText(trackingElement);
        if ((eventName != null) && (trackingURLTemplate != null)) {
          if (eventName === "progress") {
            offset = trackingElement.getAttribute("offset");
            if (!offset) {
              continue;
            }
            if (offset.charAt(offset.length - 1) === '%') {
              eventName = "progress-" + offset;
            } else {
              eventName = "progress-" + (Math.round(this.parseDuration(offset)));
            }
          }
          if ((base = creative.trackingEvents)[eventName] == null) {
            base[eventName] = [];
          }
          creative.trackingEvents[eventName].push(trackingURLTemplate);
        }
      }
    }
    ref4 = this.childsByName(creativeElement, "MediaFiles");
    for (m = 0, len4 = ref4.length; m < len4; m++) {
      mediaFilesElement = ref4[m];
      ref5 = this.childsByName(mediaFilesElement, "MediaFile");
      for (n = 0, len5 = ref5.length; n < len5; n++) {
        mediaFileElement = ref5[n];
        mediaFile = new VASTMediaFile();
        mediaFile.id = mediaFileElement.getAttribute("id");
        mediaFile.fileURL = this.parseNodeText(mediaFileElement);
        mediaFile.deliveryType = mediaFileElement.getAttribute("delivery");
        mediaFile.codec = mediaFileElement.getAttribute("codec");
        mediaFile.mimeType = mediaFileElement.getAttribute("type");
        mediaFile.apiFramework = mediaFileElement.getAttribute("apiFramework");
        mediaFile.bitrate = parseInt(mediaFileElement.getAttribute("bitrate") || 0);
        mediaFile.minBitrate = parseInt(mediaFileElement.getAttribute("minBitrate") || 0);
        mediaFile.maxBitrate = parseInt(mediaFileElement.getAttribute("maxBitrate") || 0);
        mediaFile.width = parseInt(mediaFileElement.getAttribute("width") || 0);
        mediaFile.height = parseInt(mediaFileElement.getAttribute("height") || 0);
        scalable = mediaFileElement.getAttribute("scalable");
        if (scalable && typeof scalable === "string") {
          scalable = scalable.toLowerCase();
          if (scalable === "true") {
            mediaFile.scalable = true;
          } else if (scalable === "false") {
            mediaFile.scalable = false;
          }
        }
        maintainAspectRatio = mediaFileElement.getAttribute("maintainAspectRatio");
        if (maintainAspectRatio && typeof maintainAspectRatio === "string") {
          maintainAspectRatio = maintainAspectRatio.toLowerCase();
          if (maintainAspectRatio === "true") {
            mediaFile.maintainAspectRatio = true;
          } else if (maintainAspectRatio === "false") {
            mediaFile.maintainAspectRatio = false;
          }
        }
        creative.mediaFiles.push(mediaFile);
      }
    }
    iconsElement = this.childByName(creativeElement, "Icons");
    if (iconsElement != null) {
      ref6 = this.childsByName(iconsElement, "Icon");
      for (o = 0, len6 = ref6.length; o < len6; o++) {
        iconElement = ref6[o];
        icon = new VASTIcon();
        icon.program = iconElement.getAttribute("program");
        icon.height = parseInt(iconElement.getAttribute("height") || 0);
        icon.width = parseInt(iconElement.getAttribute("width") || 0);
        icon.xPosition = this.parseXPosition(iconElement.getAttribute("xPosition"));
        icon.yPosition = this.parseYPosition(iconElement.getAttribute("yPosition"));
        icon.apiFramework = iconElement.getAttribute("apiFramework");
        icon.offset = this.parseDuration(iconElement.getAttribute("offset"));
        icon.duration = this.parseDuration(iconElement.getAttribute("duration"));
        ref7 = this.childsByName(iconElement, "HTMLResource");
        for (p = 0, len7 = ref7.length; p < len7; p++) {
          htmlElement = ref7[p];
          icon.type = htmlElement.getAttribute("creativeType") || 'text/html';
          icon.htmlResource = this.parseNodeText(htmlElement);
        }
        ref8 = this.childsByName(iconElement, "IFrameResource");
        for (q = 0, len8 = ref8.length; q < len8; q++) {
          iframeElement = ref8[q];
          icon.type = iframeElement.getAttribute("creativeType") || 0;
          icon.iframeResource = this.parseNodeText(iframeElement);
        }
        ref9 = this.childsByName(iconElement, "StaticResource");
        for (r = 0, len9 = ref9.length; r < len9; r++) {
          staticElement = ref9[r];
          icon.type = staticElement.getAttribute("creativeType") || 0;
          icon.staticResource = this.parseNodeText(staticElement);
        }
        iconClicksElement = this.childByName(iconElement, "IconClicks");
        if (iconClicksElement != null) {
          icon.iconClickThroughURLTemplate = this.parseNodeText(this.childByName(iconClicksElement, "IconClickThrough"));
          ref10 = this.childsByName(iconClicksElement, "IconClickTracking");
          for (s = 0, len10 = ref10.length; s < len10; s++) {
            iconClickTrackingElement = ref10[s];
            icon.iconClickTrackingURLTemplates.push(this.parseNodeText(iconClickTrackingElement));
          }
        }
        icon.iconViewTrackingURLTemplate = this.parseNodeText(this.childByName(iconElement, "IconViewTracking"));
        creative.icons.push(icon);
      }
    }
    return creative;
  };

  VASTParser.parseNonLinear = function(creativeElement) {
    var adParamsElement, base, creative, eventName, htmlElement, i, iframeElement, j, k, l, len, len1, len2, len3, len4, len5, m, n, nonlinearAd, nonlinearResource, ref, ref1, ref2, ref3, ref4, ref5, staticElement, trackingElement, trackingEventsElement, trackingURLTemplate;
    creative = new VASTCreativeNonLinear();
    ref = this.childsByName(creativeElement, "TrackingEvents");
    for (i = 0, len = ref.length; i < len; i++) {
      trackingEventsElement = ref[i];
      ref1 = this.childsByName(trackingEventsElement, "Tracking");
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        trackingElement = ref1[j];
        eventName = trackingElement.getAttribute("event");
        trackingURLTemplate = this.parseNodeText(trackingElement);
        if ((eventName != null) && (trackingURLTemplate != null)) {
          if ((base = creative.trackingEvents)[eventName] == null) {
            base[eventName] = [];
          }
          creative.trackingEvents[eventName].push(trackingURLTemplate);
        }
      }
    }
    ref2 = this.childsByName(creativeElement, "NonLinear");
    for (k = 0, len2 = ref2.length; k < len2; k++) {
      nonlinearResource = ref2[k];
      nonlinearAd = new VASTNonLinear();
      nonlinearAd.id = nonlinearResource.getAttribute("id") || null;
      nonlinearAd.width = nonlinearResource.getAttribute("width");
      nonlinearAd.height = nonlinearResource.getAttribute("height");
      nonlinearAd.minSuggestedDuration = nonlinearResource.getAttribute("minSuggestedDuration");
      nonlinearAd.apiFramework = nonlinearResource.getAttribute("apiFramework");
      ref3 = this.childsByName(nonlinearResource, "HTMLResource");
      for (l = 0, len3 = ref3.length; l < len3; l++) {
        htmlElement = ref3[l];
        nonlinearAd.type = htmlElement.getAttribute("creativeType") || 'text/html';
        nonlinearAd.htmlResource = this.parseNodeText(htmlElement);
      }
      ref4 = this.childsByName(nonlinearResource, "IFrameResource");
      for (m = 0, len4 = ref4.length; m < len4; m++) {
        iframeElement = ref4[m];
        nonlinearAd.type = iframeElement.getAttribute("creativeType") || 0;
        nonlinearAd.iframeResource = this.parseNodeText(iframeElement);
      }
      ref5 = this.childsByName(nonlinearResource, "StaticResource");
      for (n = 0, len5 = ref5.length; n < len5; n++) {
        staticElement = ref5[n];
        nonlinearAd.type = staticElement.getAttribute("creativeType") || 0;
        nonlinearAd.staticResource = this.parseNodeText(staticElement);
      }
      adParamsElement = this.childByName(nonlinearResource, "AdParameters");
      if (adParamsElement != null) {
        nonlinearAd.adParameters = this.parseNodeText(adParamsElement);
      }
      nonlinearAd.nonlinearClickThroughURLTemplate = this.parseNodeText(this.childByName(nonlinearResource, "NonLinearClickThrough"));
      creative.variations.push(nonlinearAd);
    }
    return creative;
  };

  VASTParser.parseCompanionAd = function(creativeElement) {
    var base, clickTrackingElement, companionAd, companionResource, creative, eventName, htmlElement, i, iframeElement, j, k, l, len, len1, len2, len3, len4, len5, len6, m, n, o, ref, ref1, ref2, ref3, ref4, ref5, ref6, staticElement, trackingElement, trackingEventsElement, trackingURLTemplate;
    creative = new VASTCreativeCompanion();
    ref = this.childsByName(creativeElement, "Companion");
    for (i = 0, len = ref.length; i < len; i++) {
      companionResource = ref[i];
      companionAd = new VASTCompanionAd();
      companionAd.id = companionResource.getAttribute("id") || null;
      companionAd.width = companionResource.getAttribute("width");
      companionAd.height = companionResource.getAttribute("height");
      companionAd.companionClickTrackingURLTemplates = [];
      ref1 = this.childsByName(companionResource, "HTMLResource");
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        htmlElement = ref1[j];
        companionAd.type = htmlElement.getAttribute("creativeType") || 'text/html';
        companionAd.htmlResource = this.parseNodeText(htmlElement);
      }
      ref2 = this.childsByName(companionResource, "IFrameResource");
      for (k = 0, len2 = ref2.length; k < len2; k++) {
        iframeElement = ref2[k];
        companionAd.type = iframeElement.getAttribute("creativeType") || 0;
        companionAd.iframeResource = this.parseNodeText(iframeElement);
      }
      ref3 = this.childsByName(companionResource, "StaticResource");
      for (l = 0, len3 = ref3.length; l < len3; l++) {
        staticElement = ref3[l];
        companionAd.type = staticElement.getAttribute("creativeType") || 0;
        companionAd.staticResource = this.parseNodeText(staticElement);
      }
      ref4 = this.childsByName(companionResource, "TrackingEvents");
      for (m = 0, len4 = ref4.length; m < len4; m++) {
        trackingEventsElement = ref4[m];
        ref5 = this.childsByName(trackingEventsElement, "Tracking");
        for (n = 0, len5 = ref5.length; n < len5; n++) {
          trackingElement = ref5[n];
          eventName = trackingElement.getAttribute("event");
          trackingURLTemplate = this.parseNodeText(trackingElement);
          if ((eventName != null) && (trackingURLTemplate != null)) {
            if ((base = companionAd.trackingEvents)[eventName] == null) {
              base[eventName] = [];
            }
            companionAd.trackingEvents[eventName].push(trackingURLTemplate);
          }
        }
      }
      ref6 = this.childsByName(companionResource, "CompanionClickTracking");
      for (o = 0, len6 = ref6.length; o < len6; o++) {
        clickTrackingElement = ref6[o];
        companionAd.companionClickTrackingURLTemplates.push(this.parseNodeText(clickTrackingElement));
      }
      companionAd.companionClickThroughURLTemplate = this.parseNodeText(this.childByName(companionResource, "CompanionClickThrough"));
      companionAd.companionClickTrackingURLTemplate = this.parseNodeText(this.childByName(companionResource, "CompanionClickTracking"));
      creative.variations.push(companionAd);
    }
    return creative;
  };

  VASTParser.parseDuration = function(durationString) {
    var durationComponents, hours, minutes, seconds, secondsAndMS;
    if (!(durationString != null)) {
      return -1;
    }
    durationComponents = durationString.split(":");
    if (durationComponents.length !== 3) {
      return -1;
    }
    secondsAndMS = durationComponents[2].split(".");
    seconds = parseInt(secondsAndMS[0]);
    if (secondsAndMS.length === 2) {
      seconds += parseFloat("0." + secondsAndMS[1]);
    }
    minutes = parseInt(durationComponents[1] * 60);
    hours = parseInt(durationComponents[0] * 60 * 60);
    if (isNaN(hours || isNaN(minutes || isNaN(seconds || minutes > 60 * 60 || seconds > 60)))) {
      return -1;
    }
    return hours + minutes + seconds;
  };

  VASTParser.parseXPosition = function(xPosition) {
    if (xPosition === "left" || xPosition === "right") {
      return xPosition;
    }
    return parseInt(xPosition || 0);
  };

  VASTParser.parseYPosition = function(yPosition) {
    if (yPosition === "top" || yPosition === "bottom") {
      return yPosition;
    }
    return parseInt(yPosition || 0);
  };

  VASTParser.parseNodeText = function(node) {
    return node && (node.textContent || node.text || '').trim();
  };

  VASTParser.copyNodeAttribute = function(attributeName, nodeSource, nodeDestination) {
    var attributeValue;
    attributeValue = nodeSource.getAttribute(attributeName);
    if (attributeValue) {
      return nodeDestination.setAttribute(attributeName, attributeValue);
    }
  };

  return VASTParser;

})();

module.exports = VASTParser;