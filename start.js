"use strict";
const net = require("net");
const {RequestHandler} = require("./lib/request_handler");
const server  = net.createServer();
server.listen({
    host:"127.0.0.1",
    port:9999
});
server.on("connection", function(socket){
    console.log("connection is coming==============================================");
    const handler = new RequestHandler(socket);
    handler.handle();
});

server.on("error", function(e){
    console.error("服务器错误", e)
});
server.on("close", console.log);
server.on("listening", console.log);


