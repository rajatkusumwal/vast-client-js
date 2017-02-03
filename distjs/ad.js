var VASTAd;

VASTAd = (function() {
  function VASTAd() {
    this.id = null;
    this.sequence = null;
    this.system = null;
    this.title = null;
    this.description = null;
    this.advertiser = null;
    this.pricing = null;
    this.survey = null;
    this.errorURLTemplates = [];
    this.impressionURLTemplates = [];
    this.creatives = [];
    this.extensions = [];
  }

  return VASTAd;

})();

module.exports = VASTAd;