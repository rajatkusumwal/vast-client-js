VMAPParser = require './vmapparser'

class VMAPClient
    @get : (url,cb) ->
        VMAPParser.parse url, (response, err) =>
            cb(response, err)

module.exports = VMAPClient