// require
const express = require('express');
const app = express();
var {formDataUpload} = require('./CommenUtil');
var {init} = require('./controllers/dbController');
init();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/upload', formDataUpload.single("img"), function (req, file, next) {
  console.log("file");
  console.log(file);
});

Array.prototype.division = function (n) {
  let arr = this;
  let len = arr.length;
  let cnt = Math.floor(len / n) + (Math.floor(len % n) > 0 ? 1 : 0);
  let ret = [];
  for (let i = 0; i < cnt; i++) {
    ret.push(arr.splice(0, n));
  }
  return ret;
}

const prevConsoleLog = console.log;
console.log = (...params) => {
  // prevConsoleLog(callerSrc = (new Error()).stack.split("\n"));
  let callerSrc = (new Error()).stack.split("\n")[2];
  prevConsoleLog('(' + callerSrc.substr(callerSrc.lastIndexOf('\\') + 1), params);
};

let {crawleReservationRate} = require('./crawler/movieCrawler/crawleReservationRateRank');
// let {crawleGraph} = require('./crawler/movieCrawler/crawleGraphInNaver');
(async () => {
  try {
    await crawleReservationRate();
    // await crawleGraph();
    await require('./crawler/movieCrawler/crawleGraphInNaver').crawleGraph2();
  } catch (error) {
    console.log(error);
  }
  
})();
let crawlerInterval = setInterval(async () => {
  try {
    await crawleReservationRate();
    // await crawleGraph();
    await require('./crawler/movieCrawler/crawleGraphInNaver').crawleGraph2();
  } catch (error) {
    console.log(error);
  }
}, 300000);

app.listen(53000, () => {
  console.log("crawle server used 53000 port.");
})