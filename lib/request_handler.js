"use strit";
const { toHeaderObj } = require("./header_parser");
const responder = require("./responder");

const status = {
    waittingForHeaders: "waittingForHeaders",
    parsingHeaders: "parsingHeaders",
    parsingBody: "parsingBody",
};
const RequestHandler = function (socket) {
    this.socket = socket;
    initHttpKeepAlive.call(this);
    this.init();
};

RequestHandler.prototype.init = function () {
    this.status = status.waittingForHeaders;
    this.rawHeaders = [];
    this.headers = null;
    this.rawBody = [];
    this.body = null
    this.numberOfReceivedBody = 0;
}


function resetHttpKeepAlive() {
    this.lastActiveTime = Date.now();
}
function initHttpKeepAlive() {
    const aliveTime = 60000;
    this.httpKeepAlive = setInterval(() => {//天生支持http keep alive
        if (Date.now() - this.lastActiveTime < aliveTime) {
            return;
        }
        console.log("关闭超时socket");
        this.socket.end();
        clearInterval(this.httpKeepAlive);
    }, aliveTime);
}

RequestHandler.prototype.handle = function () {
    this.socket.on("data", data => {
        resetHttpKeepAlive.call(this);
        switch (this.status) {
            case status.waittingForHeaders:
            case status.parsingHeaders:
                this.parseHeaders(data);
                break;
            case status.parsingBody:
                this.parseBody(data);
                break;
            default: throw new Error(`unexpected status: ${this.status}`)
        }
    });
    this.socket.on("error", e => {
        console.error("socket错误", e);
    });
    this.socket.on("close", e => {
        console.error("socket关闭", e);
    });
}

RequestHandler.prototype.parseHeaders = function (data) {
    console.log(data.toString());
    const parseBodyIfNecessary = () => {
        if (this.headers["content-length"] == null && this.headers["transfer-encoding"] !== "chunked") {
            console.log("没有body，可以直接response");
            this.response();
        } else {
            this.parseBody(data, index);//否则将残余的数据放到body中，暂时不支持pipelining，有点复杂
        }
    }
    const index = data.indexOf("\r\n\r\n") + 4;
    if (index > -1) {//检测到header结束
        //console.log("header结束", index);
        this.rawHeaders.push(Buffer.from(data.buffer, 0, index));
        this.headers = toHeaderObj(this.rawHeaders);
        parseBodyIfNecessary();
    } else {
        this.rawHeaders.push(data.buffer);
    }
};

RequestHandler.prototype.parseBody = function (data, index = 0) {
    const detectByContentLength = () => {
        if (this.headers["content-length"] - 0 === this.numberOfReceivedBody) {
            console.log("body接收完毕", Buffer.concat(this.rawBody).toString());
            this.response();
        } else {
            this.status = status.parsingBody;
        }
    }
    const detectByChunked = () => { throw new Error("不支持chunked") }
    console.log("接收到的body长度是", data.length - index);
    this.rawBody.push(Buffer.from(data.buffer, index));
    this.numberOfReceivedBody += (data.length - index);
    if (this.headers["transfer-encoding"] === "chunked") {//根据chunked来判断body是否结束
        detectByChunked();
    } else {//根据content length 来判断body是否结束
        detectByContentLength();
    }
};



RequestHandler.prototype.response = function () {
    const context = {
        header: this.headers,
        body: this.rawBody,
        socket: this.socket,
        resetHttpKeepAlive: resetHttpKeepAlive.bind(this)
    };
    responder.push(context);
    this.init();
};




module.exports = {
    RequestHandler
};