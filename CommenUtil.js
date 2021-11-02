exports.getNowDateToYYMMDD =  () => {
  let d = new Date();
  let fomatDate = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString();
  return fomatDate.replace("T", " ").slice(0, -5);
}

/* ==== Local ==== */
const multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {cb(null,'./public/images/users')},
  filename: function (req, file, cb) { cb(null, `${Date.now()}_${file.originalname}`) }
});
exports.localFormDataUpload = multer({storage: storage});
/* ============== */
// const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

const dotenv = require('dotenv');
dotenv.config(); // env
// aws.config.loadFromPath(__dirname + '/../config/s3.json');
aws.config.update({
"accessKeyId": process.env.AWS_ACCESS_KEY_ID,
"secretAccessKey": process.env.AWS_SECRET_ACCESS_KEY,
"region" : "ap-northeast-2"
});

const s3 = new aws.S3();

const upload = multer({
  storage: multerS3({
      s3: s3,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      bucket: 'cinema-s3-upload/posters',
      acl: 'public-read',
      key: function(req, file, cb){
        console.log(file);
          cb(null, Date.now() + '.' + file.originalname.split('.').pop()); // 이름 설정
      }
  })
});
exports.formDataUpload = upload;
exports.awsS3 = s3;


/* ==== chrome load ==== */

const chrome = require('selenium-webdriver/chrome');
const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const chromedriver = require('chromedriver');

chrome.setDefaultService(new chrome.ServiceBuilder(chromedriver.path).build());

exports.loadChromeDriver = async (extOptions = []) => {
  const defaultOptions = [
    '--headless',
    '--disable-dev-shm-usage',
    '--window-size=1280,960',
    '--no-sandbox', // required for Linux without GUI
    '--disable-gpu' // required for Windows,
  ];
  extOptions = (typeof extOptions === 'string') ? [extOptions] : extOptions;
  extOptions.forEach(opt => defaultOptions.push(opt));

  const options = new chrome.Options();
  defaultOptions.forEach(opt => options.addArguments(opt));
  const builder = new Builder().forBrowser('chrome').setChromeOptions(options);
  return (await builder.build());
}



