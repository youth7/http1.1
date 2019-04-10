"use strict";
const EventEmitter = require("events");
const emitter = new EventEmitter();
//让response任务排队，为支持pipelining做准备
const tasks = [];
const crnl = "\r\n";
const blankLine = crnl + crnl;
const writeSafely = function (socket, content) {
    return new Promise((resolve) => {
        const result = socket.write(content);
        if (result) {
            resolve();
        } else {
            socket.on("drain", resolve);
        }
    });

}

let isLastTaskCompleted = true;
const sendData = async function () {
    if (!isLastTaskCompleted) {
        return;
    }
    isLastTaskCompleted = false;
    while (tasks.length > 0) {
        const { socket, resetHttpKeepAlive } = tasks.shift();
        const data = new Date().toISOString();
        const content = [
            "HTTP/1.1 200 OK",
            "Content-Type: text/html;charset=UTF-8",
            `Content-Length: ${data.length}`
        ].join(crnl).concat(blankLine).concat(data);
        resetHttpKeepAlive();
        await writeSafely(socket, content);
        //console.log("写入完成");
        isLastTaskCompleted = true;
    }
}
emitter.on("send", sendData);

const push = function (context) {
    tasks.push(context);
    emitter.emit("send");
};
module.exports = {
    push
};