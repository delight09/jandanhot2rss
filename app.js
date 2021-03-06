#!/bin/env node
// Fetch JSONP and parse entry title, fetch entry url, get content summary.
// USAGE: app.js

var request = require('./node_modules/request');
var Feed = require('./node_modules/feed');
var express = require('./node_modules/express');
var htmlparser2 = require('./node_modules/htmlparser2');

// options to play around
var reqHeaders = {
    "User-Agent": "Moeela/5.0 (X1337; Wonders x86_64) AppleWebKit/666 (KHTML, like Gecko) Chrome/666 Safari/666",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8"
};
var api_getHotTopic = "http://jandan.net/2010/06/24/feedsky-feed.html";
var limit_article_length = 300; // using 99999 instead, for full article in feed
var xml_entry_footer = '<hr /><small style="color:#757575;">使用经BSD许可证分发的<a href="https://github.com/delight09/jandanhot2rss">jandanhot2rss</a>项目生成</small>'
var obj_contributor = {
    "name": "delight09",
    "url": "https://github.com/delight09",
    "contact": "https://github.com/delight09/jandanhot2rss"
}

// global variables
var app = express();
var domUtils = htmlparser2.DomUtils;
var raw_JSONP = '';
var feed = {};
var arr_feed_structure = [];


// http Server
app.get('/feed.xml', function(req, res) {
    let _req_output = req.query.output;
    let _req_type = req.query.type;

    if (_req_output) {
        if (_req_output === 'rss') {
            res.type('application/rss+xml');
        } else if (_req_output === 'json') {
            res.type('application/json');
        } else { // catch all bad output
            res.type('application/atom+xml');
            _req_output = 'atom';
        }
    } else {
        res.type('application/atom+xml');
        _req_output = 'atom';
    }

    if (_req_type) {
        if (_req_type === 'hotcomments') {
            // do nothing
        } else if (_req_type === 'hotlike') {
            // do nothing
        } else { // catch all bad type
            _req_type = 'hotposts';
        }
    } else {
        _req_type = 'hotposts';
    }

    work_hard(_req_type, function() {
        if (feed) {
            if (_req_output == 'rss') {
                res.send(feed.rss2());
            } else if (_req_output == 'json') {
                res.send(feed.json1());
            } else {
                res.send(feed.atom1());
            }
            res.end();
        } else {
            res.send('API parse failure, please consider contact contributor: ' + obj_contributor.contact);
        }
    });

});
app.listen(3000, () => console.log('App is running...'));


var work_hard = function(req_type, callback) {
    let _obj_type_keyword = {
        "hotposts": /%E6%AC%A1%E6%B5%8F%E8%A7%88/, //urlencoded '次浏览'
        "hotlike": /%20\d+%E8%B5%9E/, // url encoded ' xx赞', ' xx评论'
        "hotcomments": /%20\d+%E8%AF%84%E8%AE%BA/
    }
    let _reg_type_keyword = _obj_type_keyword[req_type];

    // parser for API's entire HTML
    let parserHTML = new htmlparser2.Parser({
        ontext: function(text) {
            let _t = '';
            if (text.indexOf('document.write(decodeURIComponent(') !== -1) { // keyword for jandan JSONP
                if (_reg_type_keyword.test(text)) {
                    _t = text.trim();
                    raw_JSONP = _t;
                }
            }
        }
    }, {
        decodeEntities: false
    });
    let _xml_feed_structure = '';

    (function(req_type) {
        request({
            url: api_getHotTopic,
            headers: reqHeaders
        }, function(err, res, data) {
            if (err || res.statusCode !== 200) {
                if (err) {
                    console.error(err);
                } else {
                    console.error('API request failed with response code ' + res.statusCode);
                }
                callback();
            } else {
                parserHTML.parseComplete(data); //raw_JSONP is ready
                _xml_feed_structure = decodeURIComponent(cleanupJSONP(raw_JSONP)); // cleanup raw_JSONP
                arr_feed_structure = getFeedStructure(req_type, _xml_feed_structure); // get array of title metadata
                getFeedEntry(function() {
                    feed = buildFeed(req_type); // feed object is ready
                    callback();
                });

            }
        });
    })(req_type); // credit to https://stackoverflow.com/a/36802485/4349454

}

function cleanupJSONP(data) {
    let _cleanstr = '';
    let keyword1 = 'document.write(decodeURIComponent(\''; // remove padding
    let keyword2 = '\'));'; // remove padding
    _cleanstr = data.replace(keyword1, '').replace(keyword2, '');
    return _cleanstr;
}

function getFeedStructure(req_type, data) {
    let _cleanstr = '';
    if (req_type === 'hotposts') {
        // layout example:
        // <li><a href="http://jandan.net/2017/11/13/hahaha-58.html" title="11647次浏览">无聊图大吐槽</a></li>
        let re_keyword1 = /<li><a href=/gi;
        let re_keyword2 = /<\/a><\/li>/gi;
        let re_keyword3 = /title=/gi;
        let re_keyword4 = /"/gi;
        let re_keyword5 = />/gi;
        _cleanstr = data.replace(re_keyword1, '%').replace(re_keyword2, '%'); // clean xml tags
        _cleanstr = _cleanstr.replace(re_keyword3, '%-%-'); // split metadata with %-%- mark
        _cleanstr = _cleanstr.replace(re_keyword5, '%-%-'); // split metadata with %-%- mark
        _cleanstr = _cleanstr.replace(re_keyword4, ''); // clean up quote mark
        _cleanstr = _cleanstr.substring(1, _cleanstr.length - 1); // remove % from head and tail
    } else {
        // layout example:
        // <li><a href="http://jandan.net/2017/11/13/hahaha-58.html">无聊图大吐槽</a>  64赞</li>
        let re_keyword1 = /<li><a href=/gi;
        let re_keyword2 = /<\/li>/gi;
        let re_keyword3 = /<\/a>/gi;
        let re_keyword4 = /"/gi;
        let re_keyword5 = />/gi;
        _cleanstr = data.replace(re_keyword1, '%').replace(re_keyword2, '%'); // clean xml tags
        _cleanstr = _cleanstr.replace(re_keyword3, '%-%-'); // split metadata with %-%- mark
        _cleanstr = _cleanstr.replace(re_keyword5, '%-%-'); // split metadata with %-%- mark
        _cleanstr = _cleanstr.replace(re_keyword4, ''); // clean up quote mark
        _cleanstr = _cleanstr.substring(1, _cleanstr.length - 1); // remove % from head and tail

    }

    let arr_str_entry = _cleanstr.split('%%');
    let arr_obj_header1 = [];

    if (req_type === 'hotposts') { // TODO meta is useless
        arr_obj_header1 = ['url', 'meta', 'title'];
    } else {
        arr_obj_header1 = ['url', 'title', 'meta'];
    }

    let arr_feed_entry = [];

    arr_str_entry.forEach(function(e, i) {
        let _t = {};
        let _obj = {};
        e.split('%-%-').forEach(function(val, int) {
            _obj[arr_obj_header1[int]] = val.trim(); // remove tailing space in url
        });
        _t = _obj; // fix javascript obj referring
        arr_feed_entry.push(_t);

    });
    return arr_feed_entry;
}

var getFeedEntry = function(origin_callback) {
    let _arr_structure_seq = [];
    let i = 0;

    for (i = 0; i < arr_feed_structure.length; i++) {
        _arr_structure_seq.push(i);
    }

    let requests = _arr_structure_seq.map((index) => {
        return new Promise((resolve) => {
            getArticleJSON(index, resolve);
        });
    }); // credit to https://stackoverflow.com/a/18983245/4349454

    Promise.all(requests).then(() => {
        origin_callback();
    });

}

function buildFeed(req_type) {
    let _feed_subtitle = '';

    if (req_type === 'hotposts') {
        _feed_subtitle = '24H热文';
    } else if (req_type === 'hotlike') {
        _feed_subtitle = '三日最赞';
    } else {
        _feed_subtitle = '一周话题';
    }

    data = arr_feed_structure;
    // build feed header
    let feed = new Feed({
        title: '煎蛋 - ' + _feed_subtitle,
        description: '地球上没有新鲜事 | 第三方订阅源 由jandanhot2rss强力驱动',
        id: 'http://jandan.net/',
        link: 'http://jandan.net/',
        favicon: 'http://cdn.jandan.net/static/img/favicon.ico',
        copyright: 'Copycenter under BSD licenses 2017, ' + obj_contributor.name,
        generator: 'https://github.com/delight09/jandanhot2rss'
    });
    feed.addContributor({
        name: obj_contributor.name,
        link: obj_contributor.url
    });
    feed.addCategory('Blog');

    function parseDate(jandan_datestring) {
        let _arr_date = [];
        _arr_date = jandan_datestring.match(/^\s*@\s*(\d+).(\d+).(\d+)\s*,\s*(\d+):(\d+)\s*/);

        return new Date(_arr_date[1], (_arr_date[2] - 1), _arr_date[3], _arr_date[4], _arr_date[5]);
        // month is 0-based, refer:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
    }

    function jandanAuthorURLHelper(url) { // output absolute author URL
        if (url.indexOf('/author/') == 0) {
            url = 'http://jandan.net' + url
        }
    }

    let _date_generate = (new Date()).toLocaleDateString('zh-CN');
    data.forEach(e => {
        feed.addItem({
            title: e.title,
            id: e.url,
            link: e.url,
            description: '煎蛋最热文章 - ' + _date_generate,
            content: e.content + xml_entry_footer, // feed contributor footer
            author: [{
                name: e.author_name,
                link: jandanAuthorURLHelper(e.author_url)
            }],
            date: parseDate(e.timestamp)
        })
    });

    return feed;
}

var getArticleJSON = function(given_index, callback) {
    let _dom = {};
    // parser for article's entire HTML
    let articleHandler = new htmlparser2.DomHandler(function(error, dom) {
        _dom = dom;
    });

    request({
        url: arr_feed_structure[given_index].url,
        headers: reqHeaders
    }, function(err, res, data) {
        if (err || res.statusCode !== 200) {
            if (err) {
                console.error(err);
            } else {
                console.error('Article request failed with response code ' + res.statusCode);
            }
            callback();
        } else {
            new htmlparser2.Parser(articleHandler).parseComplete(data);

            let _dom_article = {};
            let _dom_author = {};
            let _dom_author_url = {};
            let _dom_author_ts = {};
            let _str_author_url = '';
            let _str_author_name = '';
            let _str_author_ts = '';

            _dom_article = domUtils.getElements({
                id: "content"
            }, _dom, true)[0]; // keyword for article wrapper
            _dom_author = domUtils.getElements({
                class: "time_s"
            }, _dom_article, true)[0]; // keyword for author wrapper
            _dom_author_url = domUtils.getElements({
                class: "post-author"
            }, _dom_author, true)[0]; // keyword for author url

            _dom_author_name = domUtils.getElementsByTagType("text", _dom_author_url, true)[0];
            _arr_dom_author_ts = domUtils.getElementsByTagType("text", _dom_author, true);

            _arr_dom_author_ts.forEach(function(e, i) {
                if (/^\s*@\s*\d+.\d+.\d+\s*,.*/.test(e.data)) { // keyword for article timestamp
                    _str_author_ts = e.data;
                }
            })

            _str_author_url = _dom_author_url.attribs.href;
            _str_author_name = _dom_author_name.data;

            // get post content
            function isEndOfPost(_dom) {
                if (_dom.attribs == null || (Object.keys(_dom.attribs).length === 0 && _dom.attribs.constructor === Object)) {
                    // credit to https://stackoverflow.com/a/32108184/4349454
                    return false;
                } else {
                    if (_dom.attribs.class == "shang") {
                        return true;
                    } else {
                        return false;
                    }
                }
            }

            function getExceedLengthWarning(url) {
                return '<div><a href="' + url + '">前往<img src="http://cdn.jandan.net/static/img/favicon.ico" />煎蛋&nbsp;阅读全文...</a></div>'
            }


            let _dom_curr = {};
            let _dom_content_title = {};
            let _xml_content = '';
            let _count_content_length = 0;
            let _t = '';

            _dom_content_title = domUtils.getElements({
                tag_name: "h1"
            }, _dom_article, true)[0]; // keyword for post title
            _dom_curr = _dom_content_title.next; // no title in feed content

            while ((!isEndOfPost(_dom_curr)) && _count_content_length < limit_article_length) {
                _t = domUtils.getInnerHTML(_dom_curr).trim();
                _xml_content += _t + '<br />'; // carriage return after per tag
                _count_content_length += _t.length;

                _dom_curr = _dom_curr.next;
            }

            if (_count_content_length >= limit_article_length) {
                _xml_content += getExceedLengthWarning(arr_feed_structure[given_index].url);
            }

            _xml_content = _xml_content.replace(/data-original=/g, 'src='); // remove lazy load feature

            arr_feed_structure[given_index].author_url = _str_author_url;
            arr_feed_structure[given_index].author_name = _str_author_name;
            arr_feed_structure[given_index].timestamp = _str_author_ts;
            arr_feed_structure[given_index].content = _xml_content;

            callback();
        }
    });
};
