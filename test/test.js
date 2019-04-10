const net = require('net');
const client = net.createConnection({ port: 9999 }, () => {
  console.log('connected to server!');
  // client.write([
  //   "POST / HTTP/1.1",
  //   "Content-Type: application/x-www-form-urlencoded",
  //   "Postman-Token: a9fa78f4-70e2-4c2a-bedd-75088eeb8b3f",
  //   "User-Agent: PostmanRuntime/7.6.0",
  //   "Accept: */*",
  //   "Host: localhost:9999",
  //   "accept-encoding: gzip, deflate",
  //   "content-length: 0",
  //   "Connection: keep-alive",
  //   "\r\n"
  // ].join("\r\n"));
});
client.on('data', (data) => {
  console.log(data.toString());
  //client.end();
});

setInterval(() => {
  const content = [
    "POST / HTTP/1.1",
    "Content-Type: application/x-www-form-urlencoded",
    "Postman-Token: a9fa78f4-70e2-4c2a-bedd-75088eeb8b3f",
    "User-Agent: PostmanRuntime/7.6.0",
    "Accept: */*",
    "Host: localhost:9999",
    "accept-encoding: gzip, deflate",
    "content-length: 0",
    "Connection: keep-alive"
  ].join("\r\n").concat("\r\n\r\n");
  client.write(content);
}, 2000);
client.on('end', () => {
  console.log('disconnected from server');
});
