"use strict";
const EventEmitter = require("events");
const emitter = new EventEmitter();
//让response任务排队，为支持pipelining做准备
const tasks = [];
const crnl = "\r\n";
const writeSafely = function (content) {
    this.resetHttpKeepAlive();
    return new Promise((resolve, reject) => {
        this.socket.write(content, function (e) {
            if (e) {
                reject(e);
            } else {
                resolve();
            }
        });
    });
}

const writeAfterSometime = async function (content, delay = Math.random() * 200) {
    await writeSafely.call(this, content)
    return new Promise(resolve => {
        setTimeout(resolve, delay);
    });
}

function sendHeaders() {
    const content = [
        "HTTP/1.1 200 OK",
        "Content-Type: text/html;charset=UTF-8",
        "Content-Encoding: gzip",
        "Transfer-Encoding: chunked",
    ]
        .join(crnl)
        .concat(crnl)//最后一个header的换行符
        .concat(crnl);//空行
    return writeSafely.call(this, content);

}
const gzip = require("util").promisify(require("zlib").gzip);
const readFile = require("util").promisify(require("fs").readFile);
async function sendBody() {
    const chunks = await prepareChunks();
    for (const chunk of chunks) {
        await writeAfterSometime.call(this, chunk);
    }
    async function prepareChunks() {
        const chunks = [];
        const compressedData = await gzip(await readFile("./lib/heart_sutra.html"));
        splitIntoChunks(compressedData).forEach(rawChunk => {
            const content = rawChunk;
            /* `${content.length.toString(16)}${crnl}${content}${crnl}`
            终于找到bug所在了，草泥马的，原来是字符串转接的问题，用以下例子可以解释
            bf = Buffer.from([239]);
            bf2 = Buffer.from(`${bf}`)
            仔细观察bf和bf2是不同的！！
            */
           chunks.push(`${content.length.toString(16)}${crnl}`);
           chunks.push(content);
           chunks.push(crnl);
        });
        const end = `0${crnl}${crnl}`;
        chunks.push(end);
        return chunks;
    }
    function splitIntoChunks(compressedData, size=20) {
        const numberOfChunks = Math.ceil(compressedData.length / size);
        const chunks = [];
        for (let i = 0; i < numberOfChunks; i++) {
            chunks.push(compressedData.slice(i  * size,( i+1) * size))
        }
        return chunks;
    }
}

let isProcessing = false;
const sendData = async function () {
    if (isProcessing) {
        return;
    }
    isProcessing = true;
    try {
        while (tasks.length > 0) {
            const context = tasks.shift();
            await sendHeaders.call(context);
            await sendBody.call(context)
            //console.log("写入完成");
        }
        isProcessing = false;
    } catch (e) {
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