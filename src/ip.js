const { HttpsProxyAgent } = require("https-proxy-agent");
const axios = require("axios");

let ip = "117.68.38.183";
let port = "27845";
const proxy = new HttpsProxyAgent(`http://${ip}:${port}`);

axios
  .get("https://httpbin.org/ip", {
    httpsAgent: proxy,
  })
  .then((response) => {
    console.log("Your IP via proxy:", response.data);
  })
  .catch((error) => {
    console.error("Error:", error.message);
  });
