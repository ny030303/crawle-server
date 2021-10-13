var fs = require('fs');
const { promisify } = require('util');

var multer = require('multer');
var upload = multer({
    dest: './uploadFolder'
});

const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// export const getJsonData = async (fileName) => {
exports.getJsonData = async (fileName) => {
    try {
        const res = await readFileAsync('./crawler/data/'+ fileName);
        return JSON.parse(res);
    } catch (error) {
        console.log(error);
        return null;
    }
}

exports.writeJsonData = async (fileName, json, callback) => {
    fs.writeFileSync('./crawler/'+ fileName, json, callback); // write it back 
}
// export const appendDataInJson = async (params, callback) => {
exports.appendDataInJson = (params, callback)  => {
    //fileName, addData, arrData, 
    obj = params[2]; //now it an object
    obj.push(params[1]); //add some data
    json = JSON.stringify(obj); //convert it back to json
    fs.writeFile('./crawler/data/'+ params[0], json, 'utf8', callback); // write it back 
}

exports.appendLinkToTxt = (params, callback)  => {
    //fileName, addData
    fs.appendFile('./crawler/data/'+ params[0], params[1], 'utf8', callback); // write it back 
}

