"use strict";
const EventEmitter = require("events");
const emitter = new EventEmitter();
//让response任务排队，为支持pipelining做准备
const tasks = [];
const crnl = "\r\n";
const writeSafely = function (content) {
    this.resetHttpKeepAlive();
    return new Promise((resolve, reject) => {
        this.socket.write(content, function(e){
            if (e) {
                reject(e);
            }else{
                resolve();
            }
        });
    });
}

const writeDelay = async function (content, delay = Math.random() * 1000) {
    await writeSafely.call(this, content)
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}

function sendHeader() {
    const content = [
        "HTTP/1.1 200 OK",
        "Content-Type: text/html;charset=UTF-8",
        "Transfer-Encoding: chunked",
        // "Content-Length:23",
        "Content-Encoding: gzip"
    ]
    .join(crnl)
    .concat(crnl)//最后一个header的换行符
    .concat(crnl);//空行
    return writeSafely.call(this, content);
}
//const gzip = require("util").promisify(require("zlib").gzip);
async function sendBody() {

    const chunks = await prepareChunks();
    for (const chunk of chunks) {
        await writeDelay.call(this, chunk);
    }
    async function prepareChunks() {
        const end = `0${crnl}${crnl}`;
        const rawChunks = await Promise.all([
            require("zlib").gzipSync("1").toString()
            //"12"
        ]);
        const chunks = rawChunks.map(rawChunk => {
            const content = rawChunk;
            console.log(content)
            return `${content.length.toString(16)}${crnl}${content}${crnl}`
        });
        chunks.push(end);
        return chunks;
    }
}

let isProcessing = false;
const sendData = async function () {
    if (isProcessing) {
        return;
    }
    isProcessing = true;
    try{
        while (tasks.length > 0) {
            const context = tasks.shift();
            await sendHeader.call(context);
            await sendBody.call(context)
            //console.log("写入完成");
        } 
        isProcessing = false;
    }catch(e){
        console.error(e);
        isProcessing = false;
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