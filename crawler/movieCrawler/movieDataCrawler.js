const {loadChromeDriver} = require("../../CommenUtil");
const {Builder, By, Key, until, Capabilities} = require('selenium-webdriver');
const { getJsonData, appendDataInJson, appendLinkToTxt } = require('./fileController');
const { downloadImageToUrl } = require('./imgDownload');
const {dbQuery} = require("../../../controllers/dbController");
(async function init() {
    const driver = await loadChromeDriver();
    try {
        await dbInit();
        let movieData = await getJsonData("movie/movieGraph.json");

        // Navigate to Url
        await driver.get('http://ticket.cgv.co.kr/Reservation/Reservation.aspx?MOVIE_CD=&MOVIE_CD_GROUP=&PLAY_YMD=&THEATER_CD=&PLAY_NUM=&PLAY_START_TM=&AREA_CD=&SCREEN_CD=&THIRD_ITEM=');
        await driver.sleep(1000);
        let mIdArr = [];
        let movieViewList = await driver.findElements(By.css("#movie_list > ul > li"));
        // console.log(movieViewList);
        for(let m of movieViewList) {
            let mId = await m.getAttribute("movie_idx");
            mIdArr.push(mId);
        };
        for(let mId of mIdArr) {
            await driver.get("http://www.cgv.co.kr/movies/detail-view/?midx="+ mId);
            await driver.sleep(1500);

            try {
                let jqpsexView = await driver.findElements(By.css("#jqplot_sex > span"));
                let jqpageView = await driver.findElements(By.css("#jqplot_age > div.jqplot-point-label"));
                let charmView = await driver.findElements(By.css("#charm > div > div > svg > g:nth-child(13) > g > circle"));
                let emotionView = await driver.findElements(By.css("#emotion > div > div > svg > g:nth-child(13) > g > circle"));
                let now = new Date().toISOString();

                let derected = (await charmView[0].getAttribute("aria-label")).trim().split(" ");
                let story = (await charmView[1].getAttribute("aria-label")).trim().split(" ");
                let visual_beauty = (await charmView[2].getAttribute("aria-label")).trim().split(" ");
                let actor = (await charmView[3].getAttribute("aria-label")).trim().split(" ");
                let ost = (await charmView[4].getAttribute("aria-label")).trim().split(" ");

                let stress_relief = (await emotionView[0].getAttribute("aria-label")).trim().split(" ");
                let fun = (await emotionView[1].getAttribute("aria-label")).trim().split(" ");
                let tension = (await emotionView[2].getAttribute("aria-label")).trim().split(" ");
                let immersion = (await emotionView[3].getAttribute("aria-label")).trim().split(" ");
                let moving = (await emotionView[4].getAttribute("aria-label")).trim().split(" ");
                let mData = {
                    "movie_id": mId,
                    "site": "cgv",
                    "created": now,
                    "jqplot_sex": { "mal": (await jqpsexView[0].getText()).split(" ")[1], "fem":(await jqpsexView[1].getText()).split(" ")[1]},
                    "jqplot_age": { 
                        "10": Number((await jqpageView[4].getText()).trim()), 
                        "20": Number((await jqpageView[3].getText()).trim()), 
                        "30": Number((await jqpageView[2].getText()).trim()), 
                        "40": Number((await jqpageView[1].getText()).trim()), 
                        "50": Number((await jqpageView[0].getText()).trim())
                    },
                    "charm_point": {
                        "derected":Number(derected[derected.length-1]),
                        "story":Number(story[story.length-1]),
                        "visual_beauty":Number(visual_beauty[visual_beauty.length-1]),
                        "actor": Number(actor[actor.length-1]),
                        "ost":Number(ost[ost.length-1])
                    },
                    "emotion_point": {
                        "stress_relief":Number(stress_relief[stress_relief.length-1]),
                        "fun":Number(fun[fun.length-1]),
                        "tension":Number(tension[tension.length-1]),
                        "immersion":Number(immersion[immersion.length-1]),
                        "moving":Number(moving[moving.length-1])
                    }
                };
                let sql =  "INSERT INTO movie_graph VALUES (?,?,?, ?,?,?,?)";
                let params = [mData.movie_id, mData.site, mData.created, JSON.stringify(mData.jqplot_sex),
                    JSON.stringify(mData.jqplot_age), JSON.stringify(mData.charm_point), JSON.stringify(mData.emotion_point)];
                let queryRes = await dbQuery("INSERT", sql, params);
               
                appendDataInJson(["movie/movieGraph.json", mData, movieData], (res)=> {});
                console.log(mData);
            } catch (error) {
              console.log(error);
            }
            
        }
        
    } catch(err) {
        console.log(err);
    }
    finally{
        await driver.quit(); 
    }
})();
