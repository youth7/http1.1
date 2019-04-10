"use strict";
const toHeaderObj = function(rawHeaders){
    const headersArray = Buffer.concat(rawHeaders).toString().split("\r\n");
    const [method, url, protocal] = headersArray.shift().split(" ");    
    const headers = headersArray.reduce((header, item) => {
        const [key, value] = item.split(":");
        if(!key.trim()){
            return header;
        }
        header[key.trim().toLowerCase()] = value;
        return header;
    }, {});
    Object.assign(headers, {method, url, protocal});
    //console.log(headers);
    return headers;
};
module.exports = {
    toHeaderObj
};