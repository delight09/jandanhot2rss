# Jandanhot2rss

通过抓取煎蛋网任意页面，解析24H热文 / 三日最赞 / 一周话题脚本标签内的元数据，异步获取榜单内文章内容，输出为合法的全文订阅源。

## 部署

```bash
git clone https://github.com/delight09/jandanhot2rss
cd jandanhot2rss
npm install
npm start
# 返回 App is running..., 服务已成功运行在本地3000端口
```

## 使用方法

浏览器或RSS阅读工具访问 `http://127.0.0.1:3000/feed.xml`

### 支持的参数

* type= { hotposts | hotlike | hotcomments }

> 输出24H热文 / 三日最赞 / 一周话题 的订阅源

* output= { rss | atom | json }

> 输出RSS2.0 / Atom1.0 / JSON1.0 格式的订阅源

举例，输出**格式为Atom1.0**的**24H热文**订阅源:

```bash
http://127.0.0.1:3000/feed.xml?output=atom&type=hotposts
```

## 演示地址

配合修改后的[feedbummer_qiniu.sh](https://github.com/delight09/gadgets/blob/master/network/feedbummer_qiniu.sh)脚本，将订阅源镜像到七牛对象存储服务的CDN上。演示用订阅源输出格式为Atom，一小时为周期更新，**非全文输出**：

24H热文 🐥 [http://oz3vwa495.bkt.clouddn.com/jandanhot2rss-hotposts.xml](http://oz3vwa495.bkt.clouddn.com/jandanhot2rss-hotposts.xml)

三日最赞 🐥 [http://oz3vwa495.bkt.clouddn.com/jandanhot2rss-hotlike.xml](http://oz3vwa495.bkt.clouddn.com/jandanhot2rss-hotlike.xml)

一周话题 🐥 [http://oz3vwa495.bkt.clouddn.com/jandanhot2rss-hotcomments.xml](http://oz3vwa495.bkt.clouddn.com/jandanhot2rss-hotcomments.xml)

W3C订阅源验证 [![W3C Feed Validation Service](https://validator.w3.org/feed/images/valid-atom.png)](https://validator.w3.org/feed/check.cgi?url=http%3A%2F%2Foz3vwa495.bkt.clouddn.com%2Fjandanhot2rss-hotposts.xml)

## 开源许可证

### [BSD 2-clause](https://choosealicense.com/licenses/bsd-2-clause/)

分发软件时，必须保留原始的许可证声明。    --摘自《开源许可证教程》阮一峰
