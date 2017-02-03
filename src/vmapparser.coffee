URLHandler = require './urlhandler'
VMAPResponse = require('./vmapad').VMAPAd
VMAPAdBreak = require('./vmapad').VMAPAdBreak
VMAPAdSource = require('./vmapad').VMAPAdSource
VMAPAdSourceAdTagData = require('./vmapad').VMAPAdSourceAdTagData
VASTResponse = require('./client')
VASTUtil = require './util'
EventEmitter = require('events').EventEmitter

class VMAPParser
    URLTemplateFilters = []

    @addURLTemplateFilter: (func) ->
        URLTemplateFilters.push(func) if typeof func is 'function'
        return

    @removeURLTemplateFilter: () -> URLTemplateFilters.pop()
    @countURLTemplateFilters: () -> URLTemplateFilters.length
    @clearUrlTemplateFilters: () -> URLTemplateFilters = []

    @parse: (url, options, cb) ->
        if not cb
            cb = options if typeof options is 'function'
            options = {}

        @_parse url, null, options, (err, response) ->
            cb(response, err)

    @_parse: (url, parentURLs, options, cb) ->
        # Options param can be skipped
        if not cb
            cb = options if typeof options is 'function'
            options = {}

        # Process url with defined filter
        url = filter(url) for filter in URLTemplateFilters

        URLHandler.get url, options, (err, xml) =>
            return cb(err) if err?

            response=new VMAPResponse()


            unless xml?.documentElement? and xml.documentElement.nodeName is "vmap:VMAP"
                return cb(new Error('Invalid VMAP XMLDocument or Tag name is not vmap:VMAP'))

            unless xml.documentElement.attributes.version.nodeValue is "1.0"
                return cb(new Error('Invalid VMAP version we support version 1.0 currently or verion attribute is not present.'))

            response.version = xml.documentElement.attributes.version.nodeValue

            for node in xml.documentElement.childNodes
                if node.nodeName is 'vmap:AdBreak'
                    adBreak = @parseAdBreak node
                    if adBreak?
                        response.adBreak.push adBreak
            cb(null,response)


    #TODO:Add timeOffset and breakType logic add extension and trackingevents parser
    @parseAdBreak: (adBreakElement) ->
        adBreakResponse = new VMAPAdBreak()
        adBreakResponse.timeOffset = adBreakElement.getAttribute("timeOffset") || null
        adBreakResponse.breakType = adBreakElement.getAttribute("breakType") || null
        adBreakResponse.breakId = adBreakElement.getAttribute("breakId") || null

        for node in adBreakElement.childNodes
            if node.nodeName is 'vmap:AdSource'
                adSource = @parseAdSource node
                if adSource?
                        adBreakResponse.adSource.push adSource
            else if node.nodeName is 'vmap:TrackingEvents'
                trackingEvents = @parseAdSourceTrackingEvents node
                if  trackingEvents?
                        adBreakResponse.adSource.push adSource

        return  adBreakResponse

    #TODO:Add allowMultipleAds and followRedirect logic
    @parseAdSource: (adSourceElement) ->
        adSourceResponse = new VMAPAdSource()


        adSourceResponse.id = adSourceElement.getAttribute("id") || null
        adSourceResponse.allowMultipleAds = adSourceElement.getAttribute("allowMultipleAds") || null
        adSourceResponse.followRedirects = adSourceElement.getAttribute("followRedirects") || null

        for node in adSourceElement.childNodes
            if node.nodeName is 'vmap:VASTAdData'
                VASTAdData = @parseAdSourceVASTAdData node
                if VASTAdData?
                        adSourceResponse.adTagData = VASTAdData
            else if node.nodeName is 'vmap:CustomAdData'
                customAdData = @parseAdSourceCustomAdData node
                if  customAdData?
                        adSourceResponse.adTagData = customAdData
            else if node.nodeName is 'vmap:AdTagURI'
                adTagURI = @parseAdSourceAdTagURI node
                if  adTagURI?
                        adSourceResponse.adTagData = adTagURI

        return adSourceResponse


    @parseAdSourceVASTAdData: (VASTAdDataElement) ->
        adDataResponse = new VMAPAdSourceAdTagData

        adDataResponse.templateTagName = "vmap:VASTAdData"
        adDataResponse.templateType = "vast3"

        for node in VASTAdDataElement.childNodes
            if node.nodeName is 'VAST'
                adDataResponse.templateData = node.outerHTML
                break

        return adDataResponse

    #TODO: Logic for templateType parse templateData according to it
    @parseAdSourceCustomAdData: (VASTCustomAdDataElement) ->
        adDataResponse = new VMAPAdSourceAdTagData
        adDataResponse.templateTagName = "vmap:CustomAdData"
        adDataResponse.templateType = VASTCustomAdDataElement.getAttribute("templateType") || null
        adDataResponse.templateData = @parseNodeText VASTCustomAdDataElement
        return adDataResponse


    #TODO: Logic for check of the templateType
    @parseAdSourceAdTagURI: (VASTAdTagURIElement) ->
        adDataResponse = new VMAPAdSourceAdTagData
        adDataResponse.templateTagName = "vmap:AdTagURI"
        adDataResponse.templateType = VASTAdTagURIElement.getAttribute("templateType") || null
        adDataResponse.templateData = @parseNodeText VASTAdTagURIElement
        return adDataResponse


    # Parsing node text for legacy support
    @parseNodeText: (node) ->
        return node and (node.textContent or node.text or '').trim()


module.exports = VMAPParser