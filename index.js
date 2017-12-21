var fs = require('fs');
var moment = require('moment');
var superagent = require('superagent');
var cheerio = require('cheerio');
var async = require('async');
const htmlparser2 = require('htmlparser2');
console.log('爬虫程序开始运行......');
// 第一步，发起getData请求，获取所有4星角色的列表
superagent
.get('https://api.nba.net/0/league/collection/64aa8afa-81ff-4b57-a4db-b3cb0ad19030?accessToken=nbainternal|3830242580404678b2552bbdd03b73ee')
//  .send({
//      // 请求的表单信息Form data
//      info: 'isempty',
//      star : [0,0,0,1,0],
//      job : [0,0,0,0,0,0,0,0],
//      type : [0,0,0,0,0,0,0],
//      phase : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
//      cate : [0,0,0,0,0,0,0,0,0,0],
//      phases : ['初代', '第一期','第二期','第三期','第四期','第五期','第六期', '第七期','第八期','第九期','第十期','第十一期','第十二期','第十三期','第十四期', '第十五期', '第十六期'],
//      cates : ['活動限定','限定角色','聖誕限定','正月限定','黑貓限定','中川限定','茶熊限定','夏日限定'] })
//  // Http请求的Header信息
// .set('Accept', 'application/json, text/javascript, */*; q=0.01')
// .set('Content-Type','application/x-www-form-urlencoded; charset=UTF-8')
.end(function(err, res){
    // 请求返回后的处理
    // 将response中返回的结果转换成JSON对象
    // console.log(res);
    var videos = JSON.parse(res.text);
    
    // console.log(videos);
    var xmls = videos.response.result[0].content.map(item=>item.contentXml);
    console.log(xmls.length)


    // // 并发遍历xmls对象
    async.mapLimit(xmls, xmls.length,
        function (xml, callback) {
        // 对每个角色对象的处理逻辑
            fetchInfo(xml, () => {});
        },
        function (err, result) {
            console.log('抓取的角色数：' + xmls.length);
        }
    );
});
var concurrencyCount = 0; // 当前并发数记录
var fetchInfo = function(xml, callback){
    concurrencyCount++;
    console.log("...正在抓取"+ xml+ "...当前并发数记录：" + concurrencyCount);
    superagent
        .get('http://www.nba.com' + xml)
        .end(function(err, res){
            // 获取爬到的角色详细页面内容
            var $ = cheerio.load(res.text, {xmlMode: true});
            var headline = $('headline').text(); 
            var length = $('length').text();
            var description = $('description').text();
            var image = $('image').eq(0).text();

            if(concurrencyCount == 100){
                console.log(image)
            }
            
            var files = $('file').filter(function(){
                return $(this).attr('bitrate') == '1920x1080_5904';
            });
            files.map(function(index, item){                
                fs.appendFile(moment().format('YYYYMMDD')+'.html', ` 

                <div class="view-item">
                <h3>${String(concurrencyCount).padStart(3, '0')}. ${headline} ${length}</h3>
                <a href="${$(this).text().replace('http://nba', 'http://ht')}"><image width="400px" src="${image}"/></a>
                <h5>${description}</h5>
                </div>
                `, ()=>{});
            });
            concurrencyCount--;
            // callback(null, xml);
        });

};

var getText = function(node) {
    return node.contents().eq(0).text();
} 