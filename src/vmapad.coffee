class VMAPAd
    constructor: ->
        @version = null
        @adBreak = []
        @extensions = []

class VMAPAdBreak
    constructor: ->
        @timeOffset = null
        @breakType = null
        @breakId = null
        @adSource = []
        @trackingEvents = []
        @extensions = []

class VMAPAdSource
    constructor: ->
        @id = null
        @allowMultipleAds = null
        @followRedirects = null
        @adTagData = null

class VMAPAdSourceAdTagData
    constructor: ->
        @templateType = null
        @templateTagName = null
        @templateData = null

module.exports =
    VMAPAd : VMAPAd
    VMAPAdBreak : VMAPAdBreak
    VMAPAdSource : VMAPAdSource
    VMAPAdSourceAdTagData : VMAPAdSourceAdTagData
