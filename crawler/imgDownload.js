const fs = require('fs');
const http = require('http');
const https = require('https');
const {awsS3} = require('../CommenUtil');
var Stream = require('stream').Transform;

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