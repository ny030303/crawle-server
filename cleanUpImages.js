let {dbQuery, init, connectionClose} = require('./controllers/dbController');
var fs = require("fs").promises;

let testFolder = "./public/images/tempFile/";
let resizedFolder = "./public/images/tempResized/";

// (async () => {
let removeImges = async () => {
    await init();
    let res = await dbQuery("GET", "SELECT DISTINCT poster_img FROM `movie`", []);

    let filelist = await fs.readdir(testFolder);

    let removeImges = JSON.parse(JSON.stringify(filelist));
    console.log(removeImges.length);
    // console.log(filelist);
    
    res.row.forEach(m => {
        // removeImges.map( (v) => m != v);
        let useImgIdx = removeImges.findIndex(v => v == m.poster_img);
        if(useImgIdx >=0) {
            removeImges.splice(useImgIdx, 1);
        }
    });
    console.log(removeImges);

    // removeImges.forEach(img => {
    //     fs.unlink("./public/images/uploads/"+img);
    // });
    // console.log(res.row.length);
// })();
};

const sharp = require('sharp');

let resizingDBImages = async () => {
    await init();
    let res = await dbQuery("GET", "SELECT DISTINCT poster_img FROM movie_beta", []);
    res.row.forEach(async imgTextRow => {
        let fileName = imgTextRow.poster_img;
    let imgFile = await fs.readFile(testFolder+fileName);
    // let imgNames = JSON.parse(JSON.stringify(getName));
    // console.log(imgNames);
    // imgNames.forEach(async fileName => {
        // console.log(imgFile.toJSON());
        // if(imgFile.toJSON().type != 'Buffer') {
            console.log(testFolder+fileName +" 원본 : "+ (await fs.stat(testFolder+fileName)).size);
            sharp(imgFile)	// 리사이징할 파일의 경로
            .resize({width:500})	// 원본 비율 유지하면서 width 크기만 설정
            .withMetadata()
            .toFile(resizedFolder+fileName, (err, info)=>{
                if(err) throw err;
                console.log(info.size);
                // fs.unlink('[삭제할 파일의 경로]', (err)=>{	
                // // 원본파일은 삭제해줍니다
                // // 원본파일을 삭제하지 않을거면 생략해줍니다
                //   if(err) throw err				            
      
                // })                  
            })
        // }
        // let url = resize_image(imgFile);
        // console.log(url);
    });

};

let resizingFileImages = async () => {
    let filelist = await fs.readdir(testFolder);

    let imgesName = JSON.parse(JSON.stringify(filelist));

    imgesName.forEach(async fileName => {
        console.log(fileName);
        // if(imgFile.toJSON().type != 'Buffer') {
            console.log(testFolder+fileName + " 원본 : " + (await fs.stat(testFolder+fileName)).size);
            sharp(testFolder+fileName)	// 리사이징할 파일의 경로
            .resize({width:500})	// 원본 비율 유지하면서 width 크기만 설정
            .withMetadata()
            .toFile(resizedFolder+fileName, (err, info)=>{
                if(err) console.log(err);
                else {
                    console.log(info);
                }
                
                // fs.unlink('[삭제할 파일의 경로]', (err)=>{	
                // // 원본파일은 삭제해줍니다
                // // 원본파일을 삭제하지 않을거면 생략해줍니다
                //   if(err) throw err				            
      
                // })                  
            })
        // }
        // let url = resize_image(imgFile);
        // console.log(url);
    });

};
exports.checkImagesExist = async () => {

    testFolder = "../cinema_server/public/images/uploads/";
    resizedFolder = "../cinema_server/public/images/resized/";
    await init();
    let res = await dbQuery("GET", "SELECT DISTINCT movie_id, title, poster_img FROM `movie`", []);

    await connectionClose();
    // let filelist = await fs.readdir(resizedFolder);
    
    // let shoudFindImges = JSON.parse(JSON.stringify(filelist));
    let shoudFindImges = [];
    for(let m of res.row) {
        try {
            if(m.poster_img.length > 0) {
                let existsRes = await fs.stat(resizedFolder+m.poster_img);
                // shoudFindImges.push(m);
            } else { // 공백임
                // shoudFindImges.push(m); 
            }
        // console.log(`${fileName}: `,existsRes);
        } catch (error) {
            // console.log("ERROR: { ",error," }");
            shoudFindImges.push(m);
        }
    }
    await console.log("전체 movie: ", res.row.length, ", 찾아야할 없는 movie: ", shoudFindImges.length);
    // await console.log(shoudFindImges);
    return shoudFindImges;
};
(async () => {
    await resizingFileImages();
    // await console.log("finished");
})();
