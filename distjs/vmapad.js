var VMAPAd, VMAPAdBreak, VMAPAdSource, VMAPAdSourceAdTagData;

VMAPAd = (function() {
  function VMAPAd() {
    this.version = null;
    this.adBreak = [];
    this.extensions = [];
  }

  return VMAPAd;

})();

VMAPAdBreak = (function() {
  function VMAPAdBreak() {
    this.timeOffset = null;
    this.breakType = null;
    this.breakId = null;
    this.adSource = [];
    this.trackingEvents = [];
    this.extensions = [];
  }

  return VMAPAdBreak;

})();

VMAPAdSource = (function() {
  function VMAPAdSource() {
    this.id = null;
    this.allowMultipleAds = null;
    this.followRedirects = null;
    this.adTagData = null;
  }

  return VMAPAdSource;

})();

VMAPAdSourceAdTagData = (function() {
  function VMAPAdSourceAdTagData() {
    this.templateType = null;
    this.templateTagName = null;
    this.templateData = null;
  }

  return VMAPAdSourceAdTagData;

})();

module.exports = {
  VMAPAd: VMAPAd,
  VMAPAdBreak: VMAPAdBreak,
  VMAPAdSource: VMAPAdSource,
  VMAPAdSourceAdTagData: VMAPAdSourceAdTagData
};