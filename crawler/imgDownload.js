const fs = require('fs');
const http = require('http');
const https = require('https');
const {awsS3} = require('../CommenUtil');
var Stream = require('stream').Transform;

const resize_image = image => {
   let canvas = document.createElement("canvas"),
     max_size = 1280,
     // 최대 기준을 1280으로 잡음.
     width = image.width,
     height = image.height;
 
   if (width > height) {
     // 가로가 길 경우
     if (width > max_size) {
       height *= max_size / width;
       width = max_size;
     }
   } else {
     // 세로가 길 경우
     if (height > max_size) {
       width *= max_size / height;
       height = max_size;
     }
   }
   canvas.width = width;
   canvas.height = height;
   canvas.getContext("2d").drawImage(image, 0, 0, width, height);
   const dataUrl = canvas.toDataURL("image/jpeg");
   // 미리보기 위해서 마크업 추가.
   // $(".image-preview").append('<img src="' + dataUrl + '" class="img-item">');
 };

exports.downloadImageToUrl = (url,fileName, callback) => {

    var client = http;
    if (url.toString().indexOf("https") === 0){
      client = https;
     }

    client.request(url, function(response) {                                        
      var data = new Stream();                                                    

      response.on('data', function(chunk) {                                       
         data.push(chunk);                                                         
      });                                                                         

      response.on('end', () => {
         try {
            fs.writeFileSync(`./public/images/uploads/${fileName}`, data.read());
            console.log("img upload Success");
         } catch (error) {
            console.log("img upload Failed : " + error);
         }
         
      });                                                                         
   }).end();
};


exports.downloadImageToUrlInS3 = (url,fileName, callback) => {

   var client = http;
   if (url.toString().indexOf("https") === 0){
     client = https;
    }

   client.request(url, function(response) {                                        
     var data = new Stream();                                                    

     response.on('data', function(chunk) {                                       
        data.push(chunk);                                                         
     });                                                                         

     response.on('end', () => {
        try {
         var param = {
            'Bucket':'cinema-s3-upload',
            'Key': 'posters/' + fileName,
            'ACL':'public-read',
            'Body':data.read()
         };

         awsS3.upload(param, function(err, data){
               console.log(err);
               console.log(data);
         //   console.log("img upload Success");
         });
         //   console.log(data.read());
         //   fs.writeFileSync(`./public/images/uploads/${fileName}`, data.read());
        } catch (error) {
           console.log("img upload Failed : " + error);
        }
        
     });                                                                         
  }).end();
};