let {dbQuery, init} = require('./controllers/dbController');
var fs = require("fs").promises;

let testFolder = "./public/images/uploads/";

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

let resizingImages = async () => {
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
            .toFile('./public/images/resized/'+fileName, (err, info)=>{
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
(async () => {
    await resizingImages();
    // await console.log("finished");
})();
