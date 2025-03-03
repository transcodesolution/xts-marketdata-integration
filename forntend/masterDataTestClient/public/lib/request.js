// var requestPromise = require("request-promise");
const axios = require('axios');
var logger = require('./logger');
module.exports.processRequest =async function(method, url, headers, data) {
    try {
        var options = {};
        if (method == "POST" || method == "PUT") {
            options = {
                "method": method,
                "uri": url,
                "json": true,
                "headers": {
                    "authorization": headers.authorization
                },
                "body": data
            }

        } else {
            options = {
                "method": method,
                "uri": url,
                "json": true,
                "headers": {
                    "authorization": headers.authorization
                }
            }
        }
        logger.logFile("request object sent to the server");
        logger.logFile(JSON.stringify(options));
        let result = await axios(options);
        logger.logFile("request object received from the server");
        logger.logFile(JSON.stringify(result));
        return result;
    } catch (error) {
        logger.logFile("exception object received from the server");
        logger.logFile(JSON.stringify(error));
        throw (error);
    }
}