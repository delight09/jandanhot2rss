var request = require('./node_modules/request');
var Feed = require('./node_modules/feed');
var express = require('./node_modules/express')
var htmlparser2 = require('./node_modules/htmlparser2')

// global variables
var app = express();
var raw_JSONP = '';
var feed = '';


// http Server
app.get('/', function(req, res) {
work_hard(function() {
res.send(feed.atom1());
console.log(feed.atom1());
});

});
app.listen(3000, () => console.log('Example app listening on port 3000!')); //TODO


var work_hard = function (callback) {
// API releated
    let reqHeaders = {
        "User-Agent": "Moeela/5.0 (X1337; Wonders x86_64) AppleWebKit/666 (KHTML, like Gecko) Chrome/666 Safari/666",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
    };
    let api_getHotTopic = "http://jandan.net/2010/06/24/feedsky-feed.html";

// parser for entire HTML from API
    let parserHTML = new htmlparser2.Parser({
        ontext: function(text) {
            let _t = '';
            if (text.indexOf('document.write(decodeURIComponent(') !== -1) { // keyword-1
                if (text.indexOf('%E6%AC%A1%E6%B5%8F%E8%A7%88') !== -1) { // keyword-2
                    _t = text.trim();
                    raw_JSONP = _t;
                }
            }
        }
    }, {
        decodeEntities: false
    });
    let xml_feed_entry = '';
    let arr_feed_entry = '';
    // let feed = {};

    request({
        url: api_getHotTopic,
        headers: reqHeaders
    }, function(err, res, data) {
        if (err || res.statusCode !== 200) {
            console.error('Request failed with response code ' + res.statusCode); //TODO error handle
        } else {
            parserHTML.parseComplete(data);  //raw_JSONP is ready
            xml_feed_entry = decodeURIComponent(cleanupJSONP(raw_JSONP)); // cleanup raw_JSONP
            arr_feed_entry = getDOM(xml_feed_entry); // feed entry in array
            feed = buildFeed(arr_feed_entry, ''); // feed object is ready TODO

callback();

        }
    });
}

function cleanupJSONP(data) {
    let _cleanstr = '';
    let keyword1 = 'document.write(decodeURIComponent(\'';
    let keyword2 = '\'));';
    _cleanstr = data.replace(keyword1, '').replace(keyword2, '');
    return _cleanstr;
}

function getDOM(data) {
    let re_keyword1 = /<li><a href=/gi;
    let re_keyword2 = /<\/a><\/li>/gi;
    let re_keyword3 = /title=/gi;
    let re_keyword4 = /"/gi;
    let re_keyword5 = />/gi;
    _cleanstr = data.replace(re_keyword1, '%').replace(re_keyword2, '%');
    _cleanstr = _cleanstr.replace(re_keyword3, '').replace(re_keyword4, '').replace(re_keyword5, '');
    _cleanstr = _cleanstr.replace(/次浏览/g, '次浏览 {'); // split content with space, title wrapped with {}
    _cleanstr = _cleanstr.substring(1, _cleanstr.length - 1); // remove % from head and tail
    _cleanstr = _cleanstr.replace(/%%/g, '}%%') + '}'; //  title wrapped with {}

    let arr_str_entry = _cleanstr.split('%%');
    let arr_obj_header = ['url', 'click', 'title'];
    let arr_feed_entry = [];
    arr_str_entry.forEach(function(e, i){
        let _t = {};
        let _obj = {};
        e.split(' ').forEach(function(val,int){
            _obj[arr_obj_header[int]] = val;
        });
        _t = _obj; // fix js obj referring
        arr_feed_entry.push(_t);
        
    });
    return arr_feed_entry;
}

function buildFeed(data, type) {
 // type ajust la // TODO

// build feed header
let feed = new Feed({
    title: '煎蛋 - 24H最热',
    description: 'Power by jandanhot2rss',
    id: 'http://jandan.net/',
    link: 'http://jandan.net/',
    favicon: 'http://cdn.jandan.net/static/img/favicon.ico',
    copyright: 'Copyleft under BSD licenses 2017, delight09@github',
    generator: 'https://github.com/delight09/jandanhot2rss',
    feedLinks: {
        json: 'https://go.djh.im/jandan-hot.json',
        atom: 'https://go.djh.im/jandan-hot.atom'
    }
});
feed.addContributor({
    name: 'delight09',
    link: 'https://github.com/delight09'
});
feed.addCategory('Forum');

     data.forEach(e => {
    feed.addItem({
        title: e.title,
        id: e.url,
        link: e.url,
        description: '煎蛋最热', //TODO
        content: e.click, //TODO
        author: [{
            name: '煎蛋', // TODO
            link: 'http://jandan.net' // TODO
        }],
        date: new Date(2013, 06, 14)
    })
});

return feed;
}
