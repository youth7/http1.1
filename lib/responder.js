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

function sendHeaders() {
    const content = [
        "HTTP/1.1 200 OK",
        "Content-Type: text/html;charset=UTF-8",
        //"Content-Length:" + compressData.length,
        "Content-Encoding: gzip",
        "Transfer-Encoding: chunked",
    ]
/*     已经按照http规范来实现了，但是浏览器还是识别不出
    Content-Encoding: gzip + Transfer-Encoding: chunked with gzip/zlib gives incorrect header check
    发现一个bug的地方就是规范中说明chunked时候必须以16进制的字面值传输，然而gzip encode出来的东西是二进制的，这里怎么办？ */    
    .join(crnl)
    .concat(crnl)//最后一个header的换行符
    .concat(crnl);//空行
    return writeSafely.call(this, content);
    
}
//const gzip = require("util").promisify(require("zlib").gzip);
const compressData = require("zlib").gzipSync("asdfasdfadsfasdfasdf");
async function sendBody() {
    //await writeSafely.call(this, compressData)
    const chunks = await prepareChunks();
    for (const chunk of chunks) {
        await writeDelay.call(this, chunk);
    }
    async function prepareChunks() {
        const end = `0${crnl}${crnl}`;
        const whole =  require("zlib").gzipSync("哈哈哈哈<br>.asdfasdfa<br>asdfasdfasdfasdf<br>sdfasdf手动阀地方<br>阿萨德法师打发阿斯顿发送到发送到<br>");
        const rawChunks = [whole.slice(0,10),whole.slice(10,30),whole.slice(30)]
       
        const chunks = [];
        rawChunks.forEach(rawChunk => {
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
            await sendHeaders.call(context);
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