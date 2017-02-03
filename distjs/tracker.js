var EventEmitter, VASTClient, VASTCreativeLinear, VASTTracker, VASTUtil,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

VASTClient = require('./client');

VASTUtil = require('./util');

VASTCreativeLinear = require('./creative').VASTCreativeLinear;

EventEmitter = require('events').EventEmitter;

VASTTracker = (function(superClass) {
  extend(VASTTracker, superClass);

  function VASTTracker(ad, creative) {
    var eventName, events, ref;
    this.ad = ad;
    this.creative = creative;
    this.muted = false;
    this.impressed = false;
    this.skipable = false;
    this.skipDelayDefault = -1;
    this.trackingEvents = {};
    this.emitAlwaysEvents = ['creativeView', 'start', 'firstQuartile', 'midpoint', 'thirdQuartile', 'complete', 'resume', 'pause', 'rewind', 'skip', 'closeLinear', 'close'];
    ref = this.creative.trackingEvents;
    for (eventName in ref) {
      events = ref[eventName];
      this.trackingEvents[eventName] = events.slice(0);
    }
    if (this.creative instanceof VASTCreativeLinear) {
      this.setDuration(this.creative.duration);
      this.skipDelay = this.creative.skipDelay;
      this.linear = true;
      this.clickThroughURLTemplate = this.creative.videoClickThroughURLTemplate;
      this.clickTrackingURLTemplates = this.creative.videoClickTrackingURLTemplates;
    } else {
      this.skipDelay = -1;
      this.linear = false;
    }
    this.on('start', function() {
      VASTClient.lastSuccessfullAd = +new Date();
    });
  }

  VASTTracker.prototype.setDuration = function(duration) {
    this.assetDuration = duration;
    return this.quartiles = {
      'firstQuartile': Math.round(25 * this.assetDuration) / 100,
      'midpoint': Math.round(50 * this.assetDuration) / 100,
      'thirdQuartile': Math.round(75 * this.assetDuration) / 100
    };
  };

  VASTTracker.prototype.setProgress = function(progress) {
    var eventName, events, i, len, percent, quartile, ref, skipDelay, time;
    skipDelay = this.skipDelay === null ? this.skipDelayDefault : this.skipDelay;
    if (skipDelay !== -1 && !this.skipable) {
      if (skipDelay > progress) {
        this.emit('skip-countdown', skipDelay - progress);
      } else {
        this.skipable = true;
        this.emit('skip-countdown', 0);
      }
    }
    if (this.linear && this.assetDuration > 0) {
      events = [];
      if (progress > 0) {
        events.push("start");
        percent = Math.round(progress / this.assetDuration * 100);
        events.push("progress-" + percent + "%");
        events.push("progress-" + (Math.round(progress)));
        ref = this.quartiles;
        for (quartile in ref) {
          time = ref[quartile];
          if ((time <= progress && progress <= (time + 1))) {
            events.push(quartile);
          }
        }
      }
      for (i = 0, len = events.length; i < len; i++) {
        eventName = events[i];
        this.track(eventName, true);
      }
      if (progress < this.progress) {
        this.track("rewind");
      }
    }
    return this.progress = progress;
  };

  VASTTracker.prototype.setMuted = function(muted) {
    if (this.muted !== muted) {
      this.track(muted ? "mute" : "unmute");
    }
    return this.muted = muted;
  };

  VASTTracker.prototype.setPaused = function(paused) {
    if (this.paused !== paused) {
      this.track(paused ? "pause" : "resume");
    }
    return this.paused = paused;
  };

  VASTTracker.prototype.setFullscreen = function(fullscreen) {
    if (this.fullscreen !== fullscreen) {
      this.track(fullscreen ? "fullscreen" : "exitFullscreen");
    }
    return this.fullscreen = fullscreen;
  };

  VASTTracker.prototype.setExpand = function(expanded) {
    if (this.expanded !== expanded) {
      this.track(expanded ? "expand" : "collapse");
    }
    return this.expanded = expanded;
  };

  VASTTracker.prototype.setSkipDelay = function(duration) {
    if (typeof duration === 'number') {
      return this.skipDelay = duration;
    }
  };

  VASTTracker.prototype.load = function() {
    if (!this.impressed) {
      this.impressed = true;
      this.trackURLs(this.ad.impressionURLTemplates);
      return this.track("creativeView");
    }
  };

  VASTTracker.prototype.errorWithCode = function(errorCode) {
    return this.trackURLs(this.ad.errorURLTemplates, {
      ERRORCODE: errorCode
    });
  };

  VASTTracker.prototype.complete = function() {
    return this.track("complete");
  };

  VASTTracker.prototype.close = function() {
    return this.track(this.linear ? "closeLinear" : "close");
  };

  VASTTracker.prototype.stop = function() {};

  VASTTracker.prototype.skip = function() {
    this.track("skip");
    return this.trackingEvents = [];
  };

  VASTTracker.prototype.click = function() {
    var clickThroughURL, ref, variables;
    if ((ref = this.clickTrackingURLTemplates) != null ? ref.length : void 0) {
      this.trackURLs(this.clickTrackingURLTemplates);
    }
    if (this.clickThroughURLTemplate != null) {
      if (this.linear) {
        variables = {
          CONTENTPLAYHEAD: this.progressFormated()
        };
      }
      clickThroughURL = VASTUtil.resolveURLTemplates([this.clickThroughURLTemplate], variables)[0];
      return this.emit("clickthrough", clickThroughURL);
    }
  };

  VASTTracker.prototype.track = function(eventName, once) {
    var idx, trackingURLTemplates;
    if (once == null) {
      once = false;
    }
    if (eventName === 'closeLinear' && ((this.trackingEvents[eventName] == null) && (this.trackingEvents['close'] != null))) {
      eventName = 'close';
    }
    trackingURLTemplates = this.trackingEvents[eventName];
    idx = this.emitAlwaysEvents.indexOf(eventName);
    if (trackingURLTemplates != null) {
      this.emit(eventName, '');
      this.trackURLs(trackingURLTemplates);
    } else if (idx !== -1) {
      this.emit(eventName, '');
    }
    if (once === true) {
      delete this.trackingEvents[eventName];
      if (idx > -1) {
        this.emitAlwaysEvents.splice(idx, 1);
      }
    }
  };

  VASTTracker.prototype.trackURLs = function(URLTemplates, variables) {
    var ref;
    if (variables == null) {
      variables = {};
    }
    if (this.linear) {
      if (((ref = this.creative.mediaFiles[0]) != null ? ref.fileURL : void 0) != null) {
        variables["ASSETURI"] = this.creative.mediaFiles[0].fileURL;
      }
      variables["CONTENTPLAYHEAD"] = this.progressFormated();
    }
    return VASTUtil.track(URLTemplates, variables);
  };

  VASTTracker.prototype.progressFormated = function() {
    var h, m, ms, s, seconds;
    seconds = parseInt(this.progress);
    h = seconds / (60 * 60);
    if (h.length < 2) {
      h = "0" + h;
    }
    m = seconds / 60 % 60;
    if (m.length < 2) {
      m = "0" + m;
    }
    s = seconds % 60;
    if (s.length < 2) {
      s = "0" + m;
    }
    ms = parseInt((this.progress - seconds) * 100);
    return h + ":" + m + ":" + s + "." + ms;
  };

  return VASTTracker;

})(EventEmitter);

module.exports = VASTTracker;