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

const writeDelay = async function (socket, content, delay=1500) {
    await writeSafely(socket, content)
    return new Promise(resolve => {
        setTimeout(resolve, delay);
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
            "Transfer-Encoding: chunked",
        ].join(crnl).concat(blankLine);
        await writeSafely(socket, content);
        const data1 = `1${crnl}a${crnl}`;
        const data2 = `2${crnl}12${crnl}`;
        const data3 = `0${crnl}${crnl}`;
        await writeDelay(socket, data1);
        console.log("数据1发送")
        await writeDelay(socket, data2);
        console.log("数据2发送")
        await writeDelay(socket, data3);
        console.log("数据3发送")
        resetHttpKeepAlive();
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