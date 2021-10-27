let {dbQuery, init} = require('./controllers/dbController');
var fs = require("fs").promises;

let testFolder = "./public/images/uploads";
const {awsS3} = require('./CommenUtil');

downloadImageToUrlInS3 = (url,fileName, callback) => {

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
        //   var param = {
        //      'Bucket':'cinema-s3-upload',
        //      'Key': 'posters/' + fileName,
        //      'ACL':'public-read',
        //      'Body':data.read()
        //   };
          
        
        //   awsS3.deleteObject()
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

(async () => {
    await init();
    let res = await dbQuery("GET", "SELECT DISTINCT poster_img FROM `movie`", []);
    console.log(res.row.length);
    res.row.forEach(m => {
        console.log(m.poster_img);
        const param = {
            'Bucket':'cinema-s3-upload',
            'Key': 'posters/' + m.poster_img
        }

        awsS3.headObject(param).on('success', function(response) {
            // console.log("Key was", response.request.params.Key);
        }).on('error',function(error) {
            awsS3.deleteObject(param,(err, data) => {
                if (err) { throw err; }
                console.log('s3 deleteObject ', data);
            });
            // console.log("file is not found 404");
            //error return a object with status code 404
        }).send();
    });
})();