var VASTCreative, VASTCreativeCompanion, VASTCreativeLinear, VASTCreativeNonLinear,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

VASTCreative = (function() {
  function VASTCreative() {
    this.trackingEvents = {};
  }

  return VASTCreative;

})();

VASTCreativeLinear = (function(superClass) {
  extend(VASTCreativeLinear, superClass);

  function VASTCreativeLinear() {
    VASTCreativeLinear.__super__.constructor.apply(this, arguments);
    this.type = "linear";
    this.duration = 0;
    this.skipDelay = null;
    this.mediaFiles = [];
    this.videoClickThroughURLTemplate = null;
    this.videoClickTrackingURLTemplates = [];
    this.videoCustomClickURLTemplates = [];
    this.adParameters = null;
    this.icons = [];
  }

  return VASTCreativeLinear;

})(VASTCreative);

VASTCreativeNonLinear = (function(superClass) {
  extend(VASTCreativeNonLinear, superClass);

  function VASTCreativeNonLinear() {
    VASTCreativeNonLinear.__super__.constructor.apply(this, arguments);
    this.type = "nonlinear";
    this.variations = [];
  }

  return VASTCreativeNonLinear;

})(VASTCreative);

VASTCreativeCompanion = (function(superClass) {
  extend(VASTCreativeCompanion, superClass);

  function VASTCreativeCompanion() {
    this.type = "companion";
    this.variations = [];
  }

  return VASTCreativeCompanion;

})(VASTCreative);

module.exports = {
  VASTCreativeLinear: VASTCreativeLinear,
  VASTCreativeNonLinear: VASTCreativeNonLinear,
  VASTCreativeCompanion: VASTCreativeCompanion
};