"use strict";
const URL = require("url").URL;
const parseURLFromStartLine = function (startLine) {
    const [,target,] = startLine.split(" ");
    let url = "";
    if(target.startsWith("/")){
        url += `http://127.0.0.1${target}`   
    }
    url = new URL(url);
    return url;
};
const toHeaderObj = function (rawHeaders) {
    const headersArray = Buffer.concat(rawHeaders).toString().split("\r\n");
    const startLine = headersArray.shift()
    const url = parseURLFromStartLine(startLine);
    const headers = headersArray.reduce((header, item) => {
        if(!item) return header;
        const [key, value] = item.split(":");
        header[key.trim().toLowerCase()] = value.trim();
        return header;
    }, {});
    headers.url = url;
    //console.log(headers);
    return headers;
};
module.exports = {
    toHeaderObj
};