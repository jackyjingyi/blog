/*TMODJS:{"version":"1.0.0"}*/
!function () {

    function template (filename, content) {
        return (
            /string|function/.test(typeof content)
            ? compile : renderFile
        )(filename, content);
    };


    var cache = template.cache = {};
    var String = this.String;

    function toString (value, type) {

        if (typeof value !== 'string') {

            type = typeof value;
            if (type === 'number') {
                value += '';
            } else if (type === 'function') {
                value = toString(value.call(value));
            } else {
                value = '';
            }
        }

        return value;

    };


    var escapeMap = {
        "<": "&#60;",
        ">": "&#62;",
        '"': "&#34;",
        "'": "&#39;",
        "&": "&#38;"
    };


    function escapeFn (s) {
        return escapeMap[s];
    }


    function escapeHTML (content) {
        return toString(content)
        .replace(/&(?![\w#]+;)|[<>"']/g, escapeFn);
    };


    var isArray = Array.isArray || function(obj) {
        return ({}).toString.call(obj) === '[object Array]';
    };


    function each (data, callback) {
        if (isArray(data)) {
            for (var i = 0, len = data.length; i < len; i++) {
                callback.call(data, data[i], i, data);
            }
        } else {
            for (i in data) {
                callback.call(data, data[i], i);
            }
        }
    };


    function resolve (from, to) {
        var DOUBLE_DOT_RE = /(\/)[^/]+\1\.\.\1/;
        var dirname = ('./' + from).replace(/[^/]+$/, "");
        var filename = dirname + to;
        filename = filename.replace(/\/\.\//g, "/");
        while (filename.match(DOUBLE_DOT_RE)) {
            filename = filename.replace(DOUBLE_DOT_RE, "/");
        }
        return filename;
    };


    var utils = template.utils = {

        $helpers: {},

        $include: function (filename, data, from) {
            filename = resolve(from, filename);
            return renderFile(filename, data);
        },

        $string: toString,

        $escape: escapeHTML,

        $each: each
        
    };


    var helpers = template.helpers = utils.$helpers;


    function renderFile (filename, data) {
        var fn = template.get(filename) || showDebugInfo({
            filename: filename,
            name: 'Render Error',
            message: 'Template not found'
        });
        return data ? fn(data) : fn; 
    };


    function compile (filename, fn) {

        if (typeof fn === 'string') {
            var string = fn;
            fn = function () {
                return new String(string);
            };
        }

        var render = cache[filename] = function (data) {
            try {
                return new fn(data, filename) + '';
            } catch (e) {
                return showDebugInfo(e)();
            }
        };

        render.prototype = fn.prototype = utils;
        render.toString = function () {
            return fn + '';
        };

        return render;
    };


    function showDebugInfo (e) {

        var type = "{Template Error}";
        var message = e.stack || '';

        if (message) {
            // 利用报错堆栈信息
            message = message.split('\n').slice(0,2).join('\n');
        } else {
            // 调试版本，直接给出模板语句行
            for (var name in e) {
                message += "<" + name + ">\n" + e[name] + "\n\n";
            }  
        }

        return function () {
            if (typeof console === "object") {
                console.error(type + "\n\n" + message);
            }
            return type;
        };
    };


    template.get = function (filename) {
        return cache[filename.replace(/^\.\//, '')];
    };


    template.helper = function (name, helper) {
        helpers[name] = helper;
    };


    if (typeof define === 'function') {define(function() {return template;});} else if (typeof exports !== 'undefined') {module.exports = template;} else {this.template = template;}
    /**
 * Created by Wuwq on 2017/1/12.
 */


/*自动组合rootPath生成完整URL*/
template.helper('_url', function (url) {
    return window.rootPath + url;
});
template.helper('_serverUrl', function (url) {
    return window.serverPath + url;
});

/*自动组合rootPath生成完整URL*/
template.helper('_fastdfsUrl', function (url) {
    return window.fastdfsUrl + url;
});


/*语言化描述过滤日期*/
template.helper('_filterDateRangeToString', function (filterValue) {
    var split = filterValue.split(',');
    if (split[0] === split[1])
        return split[0];
    else {
        if (isNullOrBlank(split[0]) && !isNullOrBlank(split[1]))
            return split[1] + ' 及以前';
        else if (!isNullOrBlank(split[0]) && isNullOrBlank(split[1]))
            return split[0] + ' 及以后';
        else
            return split[0] + ' ~ ' + split[1];
    }
});

/*Join某个数组的指定字段*/
template.helper('_mapJoin', function (array, field, separator) {
    if (array === undefined || array === null || array.length === 0)
        return '';
    return _.map(array, function (o) {
        return o[field];
    }).join(separator);
});


/*判断是否为空字符串*/
template.helper('_isBlank', function (str) {
    return _.isBlank(str);
});

/*判断是否为空字符串*/
template.helper('_styleType', function (str,index) {
    var classStr = '';
    switch (str){
        case '1':
            switch (index) {
                case '1':
                    classStr = 'col-md-5 col-custom-5';
                    break;
                case '2':
                    classStr = 'col-md-7 col-custom-7';
                    break;
            }
            break;
        case '2':
            switch (index) {
                case '1':
                    classStr = 'col-md-7 col-custom-7';
                    break;
                case '2':
                    classStr = 'col-md-5 col-custom-5';
                    break;
            }
            break;
        default:
            classStr = 'col-md-5 col-custom-5';
            break;
    }
    return classStr;
});
/*判断是否为空字符串*/
template.helper('_styleTypeEdit', function (str,index) {
    var classStr = '';
    switch (str){
        case '1':
            switch (index) {
                case '1':
                    classStr = 'col-md-5';
                    break;
                case '2':
                    classStr = 'col-md-7';
                    break;
            }
            break;
        case '2':
            switch (index) {
                case '1':
                    classStr = 'col-md-7';
                    break;
                case '2':
                    classStr = 'col-md-5';
                    break;
            }
            break;
        default:
            classStr = 'col-md-5';
            break;
    }
    return classStr;
});
/*判断字符串是否为undefined、Null或空*/
template.helper('_isNullOrBlank', function (str) {
    return isNullOrBlank(str);
});
template.helper('_isNull', function (str) {
    return isNull(str);
});

/*字符串固定长度，不足位则左边补充指定字符*/
template.helper('_lpad', function (o, len, c) {
    if (len < 2) len = 2;
    return _.lpad(o, len, c);
});

/*生成唯一DOM元素唯一ID*/
template.helper('_uniqueId', function (prefix) {
    return _.uniqueId(prefix);
});

/*截断字符串*/
template.helper('_cutString', function (str, length, suffix) {
    return cutString(str, length, suffix)
});
/*TextArea文本转换为Html*/
template.helper('_text2Html', function (str) {
    if (str == null) {
        return '';
    }else if (str.length == 0) {
        return '';
    }
    str = str.replaceAll('\n', '<br />');
    str = str.replaceAll('\r', '<br />');
    return str;
});


/*短格式时间
 * 1：00
 * 2：00
 * */
template.helper('_shortTime', function (datetime) {
    return shortTime(datetime);
});

/*格式化日期*/
template.helper('_momentFormat', function (datetime, pattern) {

    if(datetime==null||datetime=='')
        return '';

    if(pattern == "A") {
        var date = new Date(Date.parse(datetime.replace(/-/g, "/")));
        if (date.getHours() <= 12) {
            return date.getFullYear().toString() + "/" + (date.getMonth() + 1).toString() + "/" + date.getDate().toString() + " 上午";

        } else {

            return date.getFullYear().toString() + "/" + (date.getMonth() + 1).toString() + "/" + date.getDate().toString() + " 下午";
        }
    }else if(pattern == "B"){//当YYYY/MM/DD 转为格式YYYY-MM-DD

        return new Date(Date.parse(datetime.replace(/\//g, "-")));

    }else {
        var m = moment(datetime);
        if(datetime.length>10 && !(pattern.indexOf('HH')>-1)){
            return moment(datetime.substring(0,10)).locale("zh-cn").format(pattern) + '' + datetime.substring(10,datetime.length);
        }else{
            if (m.isValid())
                return moment(datetime).locale("zh-cn").format(pattern);
        }
        return '';
    }

});

/*格式化日期
 * 今天 1：00
 * 昨天 2：00
 * 2017-01-01 2：00
 * */
template.helper('_dateSpecFormat', function (datetime, pattern) {
    return dateSpecFormat(datetime, pattern);
});

/**
 * 两日期天数差值
 */
template.helper('_timeDifference', function (time1,time2) {

    if(time1!=null && time1!='' && time2!=null && time2!=''){
        return diffDays(time1,time2)+1;
    }
    return '';
});
/**
 * 第N年后的日期
 */
template.helper('_dateAddByYears', function (date,years) {

    if(date!=undefined){
        return moment(date).add(years, 'years').format('YYYY/MM/DD');
    }else{
        return '';
    }
});

/**
 * 作用：财务相关金额的格式控制
 * 显示：项目相关的金额数字位数与小数点后面数字的控制，如：23456.13显示为23,456.13;且小数位控制在两位内
 */
template.helper('_expNumberFilter', function (value) {
    return expNumberFilter(value);
});

template.helper('_expNumberFilterPoint2', function (value) {
    if(isNullOrBlank(value)){
        value = 0;
    }else{
        value = Math.round(value*100)/100;
    }
    return expNumberFilter(value);
});
/**Number(-10000023).toFixed(2)
 * 当负数时，转为正数
 */
template.helper('_expPositiveNumberFilter', function (value) {
    value = value+'';
    if(value.indexOf('-')>-1){
        value = value.substring(1,value.length);
    }
    return expNumberFilter(value);
});
/**
 * Number(-10000023).toFixed(2)
 */
template.helper('_expNumberDecimalFilter', function (value) {

    value = Number(value).toFixed(2);
    return expNumberFilter(value);
});

/*格式化日期
 * 今天
 * 昨天
 * 2017-01-01
 * */
template.helper('_dateSpecShortFormat', function (datetime) {
    return dateSpecShortFormat(datetime);
});

template.helper('_ifPresent', function (s, presentVal, elseVal) {
    if (s !== null && s !== void 0)
        return presentVal;
    return elseVal;
});

template.helper('_include',function(tpl,obj){
   return template(tpl, obj);
});

template.helper('_jsonStringify',function(obj){
    return JSON.stringify(obj);
});
/**
 * 截取字符串
 * str:字符串
 * s:以此截取
 * i:下标
 */
template.helper('_subStr', function (str,s,i) {
    if(str!=null && s!=''){
        var strArr = str.split(s);
        return strArr[i];
    }else{
        return '';
    }
});
/**
 * 周几格式化
 * workDays: "1,2,3,4,5"
 */
template.helper('_daysFormat', function (workDays) {

    if(typeof workDays === 'string')
        workDays = workDays.split(',');

    var converTitle = function (item) {
        var title = '';
        switch (item){
            case '1':
                title = '周一';
                break;
            case '2':
                title = '周二';
                break;
            case '3':
                title = '周三';
                break;
            case '4':
                title = '周四';
                break;
            case '5':
                title = '周五';
                break;
            case '6':
                title = '周六';
                break;
            case '7':
                title = '周日';
                break;
        }
        return title;
    };
    var timeTitle = '';
    $.each(workDays,function (i,item) {
        var title = converTitle(item);
        timeTitle += '、' + title ;
    });
    timeTitle = timeTitle.substring(1,timeTitle.length);

    if(workDays.length>4){
        var interval = parseInt(workDays[workDays.length-1]) - parseInt(workDays[0]);
        if(interval==workDays.length-1)
            timeTitle = converTitle(workDays[0])+'至'+converTitle(workDays[workDays.length-1]);
    }
    return timeTitle;
});
/**
 * 日期转星期
 */
template.helper('_dateToWeekFormat', function (date) {

    var today = new Array('星期日','星期一','星期二','星期三','星期四','星期五','星期六');
    date = new Date(Date.parse(date));
    return today[date.getDay()];
});
/**
 * M转G
 */
template.helper('_storageMToG', function (data) {

    if(data>1024){

        return Math.round((math.divide(math.bignumber(data),math.bignumber(1024)))*100)/100 + 'G';

    }else{

        return data + 'M';
    }

});

/**
 * 数组转为字符串
 */
template.helper('_arrToString', function (data) {

    if(data && data.length>0){
        return JSON.stringify(data)
    }else{
        return '';
    }

});
/**
 * 获取图标颜色
 */
template.helper('_getIconColor', function (id) {

    if(isNullOrBlank(id))
        return '';

    var dataItem = getObjectInArray(window.icon_list_form,id);

    if(dataItem==null)
        return '';

    return dataItem.color;

});

/**
 * 文件大小单位自动转换
 */
template.helper('_fileSizeFormat', function (num) {

    if(isNullOrBlank(num))
        return '0';

    return WebUploader.Base.formatSize(num);

});
/**
 * 任务状态背景色
 */
template.helper('_getStatusColor', function (status) {

    var classStr = '';
    switch (status){
        case 'status_not_start':
            classStr = 'btn-green';
            break;
        case 'status_end':
            classStr = 'btn-grey';
            break;
        default:
            classStr = 'selected';
            break;
    }

    return classStr;

});
/**
 * 任务状态背景色
 */
template.helper('_getProjectTempIcon', function (name) {

    var iconStr = '';
    switch (name){
        case '企业模板':
            iconStr = 'icon-qiye';
            break;
        case '行政人事':
            iconStr = 'icon-xingzheng';
            break;
        case '销售服务':
            iconStr = 'icon-xiaoshouyuan';
            break;
        case '工程建筑':
            iconStr = 'icon-mingshandachuanfaxiandijiashouye';
            break;
        default:
            iconStr = 'icon-wangluo';
            break;
    }

    return iconStr;

});
/**
 * 计算百分比
 */
template.helper('_getPercentage', function (num1,num2) {

    if(isNullOrBlank(num1))
        num1 = 0;
    if(isNullOrBlank(num2))
        num2 = 0;

    var percentage = Math.round((math.divide(math.bignumber(num1),math.bignumber(num2)))*100);
    if(num1==0)
        percentage = 0;
    return percentage;
});
/**
 * 截取名字
 * name 名字
 * num 截取个数
 */
template.helper('_interceptName', function (name,num) {

    var newName = '';
    if(!isNullOrBlank(name)){

        var re=/^[a-zA-Z]+$/;
        var reName = function (name,num) {
            if(name.length>num){
                newName = name.substring(name.length-num,name.length);
            }else{
                newName = name;
            }
        };
        if(!re.test(name)){//中文
            reName(name,num);
        }else{//英文
            reName(name,num*2);
        }
    }
    return newName;
});
/**
 * 或取list下child的length
 * name 名字
 * num 截取个数
 */
template.helper('_allChildrenLen', function (child,childKey) {

    var len = 0;
    if(child && child.length>0){
        $.each(child,function(i,item){
            if(item[childKey] && item[childKey].length>0){
                len = len + item[childKey].length;
            }
        });
    }
    return len;
});
/**
 * 为空显示--
 */
template.helper('_emptyDisplay', function (value) {

    if(isNullOrBlank(value)){
        return '--';
    }
    return value;
});

/**
 * 相减
 */
template.helper('_mathSubtract', function (num1,num2) {

    if(isNullOrBlank(num1))
        num1 = 0;
    if(isNullOrBlank(num2))
        num2 = 0;

    var subtractNum = math.subtract(math.bignumber(num1),math.bignumber(num2))-0;
    return subtractNum;
});
/**
 * 转码
 */
template.helper('_encodeURI', function (value) {

    if(isNullOrBlank(value))
       return '';

    return encodeURI(value);
});

    /*v:1*/
template('m_website/m_website_footer',' <div class="brd-y brd-gray-light-v1 m-website-footer"> <div class="container product-introduction p-h-100"> <div class="row p-l-md"> <div class="col-xs-4 col-sm-3 product-link"> <h2 class="f-s-xl m-b-md">产品</h2> <div class="row"> <div class="col-6 m-b-md">  <ul class="list-unstyled f-s-m m-b-none m-l"> <li class="m-b-sm"> <a class=" fc-v2-grey u-link" href="#/products">产品介绍</a> </li> <li class="m-b-sm"> <a class=" fc-v2-grey u-link" href="#/pricing">产品价格</a> </li> </ul>  </div> </div> </div> <div class="col-xs-4 col-sm-3 product-link"> <h2 class="f-s-xl m-b-md">服务</h2> <div class="row"> <div class="col-6 m-b-md">  <ul class="list-unstyled f-s-m m-b-none m-l">  <li class="m-b-sm"><a class=" fc-v2-grey u-link" href="#/faq">帮助中心</a></li> </ul>  </div> </div> </div> <div class="col-xs-4 col-sm-3 product-link"> <h2 class="f-s-xl m-b-md">保障</h2> <div class="row"> <div class="col-6 m-b-md">  <ul class="list-unstyled f-s-m m-b-none m-l"> <li class="m-b-sm"> <a class=" fc-v2-grey u-link" href="#/terms">服务协议</a> </li> <li class="m-b-sm"> <a class=" fc-v2-grey u-link" href="#/security">安全保障</a> </li> </ul>  </div> </div> </div> <div class="col-xs-12 col-sm-3 product-contact"> <h2 class="f-s-xl m-b-md">联系我们</h2>  <ul class="list-unstyled fc-v2-grey f-s-m"> <li class="media m-b-xs"> <i class="m-r-sm m-t-xxs pull-left glyphicon glyphicon-user"></i> <div class="media-body"> 中国 广东 深圳<br>前海深港合作区前湾一路1号A栋201室 </div> </li> <li class="media m-b-xs"> <i class="m-r-sm m-t-xxs pull-left glyphicon glyphicon-envelope"></i> <div class="media-body"> services@imaoding.com </div> </li> <li class="media m-b-xs"> <i class="m-r-sm m-t-xxs pull-left glyphicon glyphicon-phone-alt"></i> <div class="media-body"> 0755-83235535 </div> </li> </ul>  </div> </div> </div> </div>   <div class="container p-t-xxl p-b-lg copyright"> <div class="row"> <div class="col-md-9 m-b-md"> <p class="f-s-sm m-b-none">2018 © www.imaoding.com All Rights Reserved.</p> </div> <div class="col-md-3 m-b-md p-l-lg">  <p><a href="http://beian.miit.gov.cn" target="_blank">ICP备案号：粤ICP备2020097205号-3</a></p> </div> </div> </div> ');/*v:1*/
template('m_website/m_website_header',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_serverUrl=$helpers._serverUrl,_url=$helpers._url,userInfo=$data.userInfo,_isNullOrBlank=$helpers._isNullOrBlank,rootPath=$data.rootPath,$out='';$out+='<nav class="navbar navbar-no-bg m-website-header m-b-none" role="navigation"> <div class="container "> <div class="navbar-header"> <a href="';
$out+=$escape(_serverUrl('/'));
$out+='" class="navbar-brand"> <img src="';
$out+=$escape(_url('/img/logo_white.png'));
$out+='" width="50" alt=""> </a> </div>  <div class="collapse navbar-collapse" id="top-navbar-1"> <ul class="nav navbar-nav navbar-right "> <li data-type="products"> <a class="nav-link nav-link-bar f-s-md" href="javascript:void(0);">产品</a> <div class="menu-bar"> <div class="container"> <a class="nav-link no-padding" data-type="pricing" href="#/pricing">产品价格</a> <a class="nav-link no-padding" data-type="products" href="#/products">产品介绍</a> </div> </div> </li> <li class="" data-type="service"> <a class="nav-link nav-link-bar f-s-md" href="javascript:void(0);">服务</a> <div class="menu-bar"> <div class="container">  <a class="nav-link no-padding" data-type="faq" href="#/faq">帮助中心</a> <a class="nav-link no-padding" data-type="faq" href="#/updateLog">更新日志</a> </div> </div> </li> <li class="m-r-xxl" data-type="maoDingYun"> <a class="nav-link nav-link-bar f-s-md" href="javascript:void(0);">云系统</a> <div class="menu-bar"> <div class="container">  <a class="nav-link no-padding" href="javascript:;" data-action="downLoadMaoDingYun">下载</a> </div> </div> </li> ';
if(userInfo ){
$out+=' <li class="li-user-info"> <a class="fc-v2-grey nav-link f-s-md no-padding" href="';
$out+=$escape(_serverUrl('/iWork/home/workbench'));
$out+='"> ';
if(userInfo && !_isNullOrBlank(userInfo.imgUrl)){
$out+=' <img alt="image" class="img-circle m-t-n-xs" src="';
$out+=$escape(userInfo.imgUrl);
$out+='" onerror=javascript:this.src="';
$out+=$escape(_url('/img/head_default.png'));
$out+='" width="40" height="40"> ';
}else{
$out+=' <img alt="image" class="img-circle m-t-n-xs" src="';
$out+=$escape(_url('/img/head_default.png'));
$out+='" width="40" height="40"> ';
}
$out+=' <span>';
$out+=$escape(userInfo.userName);
$out+='</span> </a> </li> ';
}else{
$out+=' ';
if(!(rootPath.indexOf('www.imaoding.net')>-1)){
$out+=' <li class="m-r-xs"> <a class="nav-link btn-register " href="#/register">注册</a> </li> ';
}
$out+=' <li class="pt-relative"> <a class="nav-link btn-login" href="javascript:void(0);" data-action="showLoginBox">登录</a> <div class="login-box" style="display: none;"> <div class="row"> <div class="col-sm-12 col-lg-12"> <div class="" id="loginBox"> </div> </div> </div> </div> </li> ';
}
$out+=' </ul> </div> <div class="small-nav"> <a href="javascript:void(0);" data-action="showSmallNav"><i class="fa fa-bars"></i></a> <ul class="list-group small-nav-menu" style="display: none;"> <li class="list-group-item no-borders text-center"><a href="#/products" class="fc-dark-grey f-s-md">产品介绍</a></li> <li class="list-group-item no-borders text-center"><a href="#/pricing" class="fc-dark-grey f-s-md">产品价格</a></li> <li class="list-group-item no-borders text-center"><a href="#/faq" class="fc-dark-grey f-s-md">帮助中心</a></li> <li class="list-group-item no-borders text-center"><a href="#/updateLog" class="fc-dark-grey f-s-md">更新日志</a></li> </ul> </div> </div> </nav> ';
return new String($out);
});/*v:1*/
template('m_website/m_website_login',' <div class="tabs-container tabs-container-1"> <ul class="nav nav-tabs"> <li class="active"><a data-toggle="tab" href="#tab-1" aria-expanded="true">账号登录</a></li> <li class=""><a data-toggle="tab" href="#tab-2" aria-expanded="false">手机登录</a></li> </ul> <div class="tab-content min-h-50"> <div id="tab-1" class="tab-pane active"> <div class="panel-body no-padding" data-type="accountLogin"> <form id="loginForm" class="p-h-sm"> <div class="m-b-md"> <label class="fc-dark-grey fw-bold f-s-sm">账号:</label> <input id="account" name="account" class="form-control fc-black bg-white brd-gray-light-v1 rounded-5" type="account" placeholder="请输入您注册使用的手机号码"> </div> <div class="m-b-lg"> <div class="row"> <div class="col-md-6 text-left"> <label class="fc-dark-grey fw-bold f-s-sm">密码:</label> </div> <div class="col-md-6 text-right"> <a tabindex="-1" class="d-inline-block f-s-xs m-b-xxs" href="#/forgetLoginPwd">忘记密码?</a> </div> </div> <input id="password" name="password" class="form-control fc-black bg-white brd-gray-light-v1 rounded-5" type="password" placeholder="请输入您的账号密码"> <div class="row m-t"> <div class="col-md-8 p-t-sm">  </div> <div class="col-md-4 text-center text-right"> <a href="javascript:void(0);" id="btnLogin" class="btn btn-md u-btn-primary rounded-5" style="padding: 13px 25px;">登录</a> </div> </div> </div> </form> </div> </div> <div id="tab-2" class="tab-pane"> <div class="panel-body no-padding" data-type="mobileLogin"> <form id="mobileLoginForm" class="p-h-sm"> <div class="row m-b-md"> <div class="col-sm-12"> <label class="fc-dark-grey fw-bold f-s-sm">手机号码:</label> <input id="cellphone" name="cellphone" class="form-control fc-black bg-white brd-gray-light-v1 rounded-5" type="account" placeholder="请输入您注册使用的手机号码"> </div> </div> <div class="row"> <div class="col-md-6 text-left"> <label class="fc-dark-grey fw-bold f-s-sm">验证码:</label> </div> </div> <div class="row"> <div class="col-sm-12"> <div class="input-group"> <input class="form-control fc-black bg-white brd-gray-light-v1 rounded-5" type="text" id="receiveCode" autocomplete="off" name="code" maxlength="11" placeholder="请输入手机验证码"> <span class="input-group-btn"> <a href="javascript:;" class="btn btn-default btn-code" data-action="receiveCode">获取验证码</a> </span> </div> </div> </div> <div class="row m-t"> <div class="col-md-8 p-t-sm"> </div> <div class="col-md-4 text-center text-right"> <a href="javascript:void(0);" id="btnMobileLogin" class="btn btn-md u-btn-primary rounded-5" style="padding: 13px 25px;">登录</a> </div> </div> </form> </div> </div> </div> </div>   ');/*v:1*/
template('m_browser_tips/m_browser_tips',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="m-browser-tips"> <div class="tips-head"> <img src="';
$out+=$escape(_url('/img/logo_white.png'));
$out+='" style="width:200px"> </div> <div class="tips-content"> <p>由于你当前使用的浏览器版本过低，若继续访问可能会导致部分功能展示不正常，我们推荐你使用以下浏览器进行访问。</p> <p style="margin: 50px 0 30px 0;"><a href="javascript:void(0)" data-action="continue">&gt;&gt;&gt;&nbsp;继续访问</a></p> <ul> <li> <img src="';
$out+=$escape(_url('/img/browser/chrome.png'));
$out+='"> <p>Chrome（推荐）</p> </li> <li> <img src="';
$out+=$escape(_url('/img/browser/firefox.png'));
$out+='"> <p>Firefox</p> </li> <li> <img src="';
$out+=$escape(_url('/img/browser/360.png'));
$out+='"> <p>360极速</p> </li> <li> <img src="';
$out+=$escape(_url('/img/browser/ie.png'));
$out+='"> <p>IE 10+</p> </li> </ul> </div> <div> <span style="font-size: 12px;bottom: 10px;right:15px;position: absolute;"><input id="m-browser-never-tips" type="checkbox" />&nbsp;不再提示</span> </div> </div> ';
return new String($out);
});/*v:1*/
template('m_login/m_forgetPWDStep1',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,title=$data.title,_serverUrl=$helpers._serverUrl,$out='';$out+='<style> .form-group{position: relative;} </style> <div class="passwordBox animated fadeInDown"> <div class="row"> <div class="col-md-12"> <div class="ibox-content"> <h2 class="font-bold">';
$out+=$escape(title);
$out+='</h2> <p> 请填写您的账号 </p> <div class="row"> <div class="col-lg-12"> <form class="m-t forgetStep1OBox"> <div class="form-group"> <input class="input-autofill-selected form-control" type="text" placeholder="请输入手机号" name="cellphone" id="cellphone" maxlength="11"> </div> <div class="form-group "> <div class="input-group"> <input placeholder="请输入验证码" class="input-autofill-selected input form-control" type="text" id="verifcationCode" name="verifcationCode" placeholder="验证码"> <span class="input-group-btn"> <a type="button" class="btn btn-u" id="getCode" data-action="getCode" style="width:96px;">获取验证码</a> </span> </div> </div> <a type="submit" class="btn btn-primary block full-width m-b" href="javascript:void(0)" data-action="nextStep">下一步</a> <p class="text-muted text-left">  <a href="';
$out+=$escape(_serverUrl('/#/login'));
$out+='">返回登录</a> </p> </form> </div> </div> </div> </div> </div> <hr>         </div> ';
return new String($out);
});/*v:1*/
template('m_login/m_forgetPWDStep2',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,title=$data.title,cellphone=$data.cellphone,$out='';$out+='<style> .form-group{position: relative;} </style> <div class="passwordBox animated fadeInDown"> <div class="row"> <div class="col-md-12"> <div class="ibox-content"> <h2 class="font-bold">';
$out+=$escape(title);
$out+='</h2>    <div class="row"> <div class="col-lg-12"> <form class="m-t forgetStep2OBox"> <div class="form-group"> <label class="label">注册手机号： <span class="cellPhone form-control-static">';
$out+=$escape(cellphone);
$out+='</span></label> </div> <div class="form-group"> <input class="form-control" type="text" placeholder="请输入密码" id="password" name="password" autocomplete="off" onfocus="this.type=\'password\'"> </div> <a type="submit" class="btn btn-primary block full-width m-b" href="javascript:void(0)" data-action="completeChange">完成</a> </form> </div> </div> </div> </div> </div> <hr>         </div>';
return new String($out);
});/*v:1*/
template('m_login/m_login','<style> div.ibox-content,div.login-form-qrcode-wrapper{float: left;} div.ibox-content{ width: 60%;border-radius: 4px;} div.login-form-qrcode-wrapper{ width: auto; background-color: transparent;} </style> <div class="ibox-content "> <div class="tabs-container tabs-container-1"> <ul class="nav nav-tabs"> <li class="active"><a data-toggle="tab" href="#tab-1" aria-expanded="true">账号登录</a></li> <li class=""><a data-toggle="tab" href="#tab-2" aria-expanded="false">手机登录</a></li> </ul> <div class="tab-content min-h-50"> <div id="tab-1" class="tab-pane active"> <div class="panel-body no-padding" data-type="accountLogin"> <form class="m-t" id="loginForm"> <div class="form-group"> <input type="account" tabindex="1" id="cellphone" name="cellphone" placeholder="请输入您注册使用的手机号码" class="input-autofill-selected form-control margin-bottom-20 rounded" autocomplete="off" maxlength="11"> </div> <div class="form-group"> <input type="password" tabindex="2" id="password" name="password" placeholder="请输入登录密码" class="input-autofill-selected form-control margin-bottom-20 rounded" autocomplete="new-password" > </div> <div > <label class="i-checks i-checks-label "> <input name="remember" type="checkbox"/> <span class="i-checks-span fc-dark-gray">记住密码</span> </label> </div> <a class="btn btn-primary block full-width m-b" id="btnLogin" tabindex="3" type="submit">登录</a> </form> </div> </div> <div id="tab-2" class="tab-pane"> <div class="panel-body no-padding" data-type="mobileLogin"> <form id="mobileLoginForm" class="p-h-sm"> <div class="row m-b-md"> <div class="col-sm-12"> <input id="cellphone" name="cellphone" class="input-autofill-selected form-control" type="account" autocomplete="off" placeholder="请输入您注册使用的手机号码"> </div> </div> <div class="row"> <div class="col-sm-12"> <div class="input-group"> <input class="input-autofill-selected form-control" type="text" id="receiveCode" autocomplete="off" name="code" maxlength="11" placeholder="请输入手机验证码"> <span class="input-group-btn"> <a href="javascript:;" class="btn btn-default btn-code" data-action="receiveCode">获取验证码</a> </span> </div> </div> </div> <div class="row"> <div class="col-sm-12 p-t-md"> <a class="btn btn-primary block full-width" id="btnMobileLogin" tabindex="3" type="submit">登录</a> </div> </div> </form> </div> </div> </div> </div> <a href="#/forgetLoginPwd"> <small>忘记密码?</small> </a> </div> ');/*v:1*/
template('m_login/m_login_uptPassword',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,type=$data.type,$escape=$utils.$escape,cellphone=$data.cellphone,$out='';$out+='<form class="form-horizontal rounded-bottom changePassWordOBox"> <input type="password" style="display:none;"> <div class="panel-body"> <div class="col-md-12"> ';
if(type==1){
$out+=' <div class="form-group"> <label class="col-sm-12">当前账号';
$out+=$escape(cellphone);
$out+='的密码过于简单，请重新设定8位以上包含大小写字母数字及特殊字符组合的密码! </label> </div> ';
}else{
$out+=' <div class="form-group"> <label class="col-sm-12">当前账号';
$out+=$escape(cellphone);
$out+='已经超过180天没有修改密码了，请重新设定8位以上包含大小写字母数字及特殊字符组合的密码! </label> </div> ';
}
$out+=' <div class="form-group"> <label class="col-sm-3 control-label">旧密码<span class="fc-red">*</span></label> <div class="col-sm-9"> <input type="password" class="form-control changePwdDtoOldPwd" name="oldPassword" > </div> </div> <div class="form-group"> <label class="col-sm-3 control-label">新密码<span class="fc-red">*</span></label> <div class="col-sm-9"> <input type="password" class="form-control changePwdDtoPwd" name="password" id="newPassword"> </div> </div> <div class="form-group"> <label class="col-sm-3 control-label">确认新密码<span class="fc-red">*</span></label> <div class="col-sm-9"> <input type="password" class="form-control changePwdDtoRePwd" name="rePassword"> </div> </div> <div class="form-group row" style="margin-left: 10px;margin-right: 11px"> <div class="row col-24-md-21"> <input placeholder="请输入验证码" class="input-autofill-selected input form-control" autocomplete="false" type="text" id="verifcationCode" name="verifcationCode" placeholder="验证码"> </div> <div class="row col-24-md-3"> <span class="input-group-btn"> <a type="button" class="btn btn-u" id="getCode" data-action="getCode" style="width:96px;">获取验证码</a> </span> </div> </div> </div> </div> </form> ';
return new String($out);
});/*v:1*/
template('m_login/m_popover_login','<form id="loginForm" style="width: 240px;"> <div class="form-group"> <input type="text" tabindex="1" id="cellphone" name="cellphone" placeholder="请输入手机号码" class="form-control margin-bottom-20 rounded" maxlength="11"> </div> <div class="form-group"> <input type="text" tabindex="2" id="password" name="password" placeholder="请输入登录密码" class="form-control margin-bottom-20 rounded" autocomplete="off" onfocus="this.type=\'password\'"> </div> <div class="form-group" style="margin-bottom: 0;overflow: hidden;"> <a class="btn-u btn-u-dark-blue block full-width m-b rounded text-center m-popover-submit" id="btnLogin" tabindex="3">登录</a> <a data-url="#/forgetLoginPwd" href="javascript:void(0)" id="btnForgetPwd" class="pull-right"> <small>忘记密码？</small> </a> </div> </form>');/*v:1*/
template('m_login/m_register',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_serverUrl=$helpers._serverUrl,_url=$helpers._url,cdnUrl=$data.cdnUrl,$out='';$out+='<style> .form-group{position: relative;} </style> <div class="middle-box text-center loginscreen animated fadeInDown"> <div> <div class="text-center" style=" margin-bottom: 36px;"> <a href="';
$out+=$escape(_serverUrl('/'));
$out+='"><object data="';
$out+=$escape(_url('/img/logo_white.png'));
$out+='" style="width: 50px;"></object></a> </div>  <form class="m-t registerOBox" role="form" action="login.html"> <div class="form-group text-left"> <input class="form-control" type="text" placeholder="手机号" name="cellphone" id="cellphone" maxlength="11"> </div> <div class="form-group text-left"> <div class="input-group"> <input placeholder="验证码" class="input form-control" type="text" id="verifcationCode" name="verifcationCode" placeholder="验证码"> <span class="input-group-btn"> <a type="button" class="btn btn-u" id="getCode" data-action="getCode" style="width:96px;">获取验证码</a> </span> </div> </div> <div class="form-group text-left"> <input class="form-control" type="text" placeholder="姓名" id="userName" name="userName"> </div> <div class="form-group text-left"> <input class="form-control" type="text" placeholder="密码，至少包含6位字符" id="password" name="password" autocomplete="off" onfocus="this.type=\'password\'" maxlength="32"> </div> <div class="form-group text-left"> <input type="checkbox" id="serviceTerm" name="serviceTerm"/><span style="display: inline-block;margin-left: 5px;">已阅读并同意 <a href="';
$out+=$escape(cdnUrl);
$out+='/download/SeriveTerm.pdf" target="_blank">《用户服务协议》</a></span> </div> <a type="submit" class="btn btn-primary block full-width m-b" href="javascript:void(0)" data-action="submitRegister">注册</a> <p class="text-muted text-center"> <small>已有账号？</small> <a href="';
$out+=$escape(_serverUrl('/#/login'));
$out+='">立即登录</a> </p> </form> </div> </div>';
return new String($out);
});/*v:1*/
template('m_common/m_attach',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,netFileId=$data.netFileId,fullPath=$data.fullPath,fileName=$data.fileName,type=$data.type,$out='';$out+='<span class="label m-r-xs m-b-xs" style="background: #ecf0f1;padding: 5px 10px;display: inline-block;"> <a href="javascript:void(0)" data-action="preview" data-net-file-id="';
$out+=$escape(netFileId);
$out+='" data-src="';
$out+=$escape(fullPath);
$out+='" data-name="';
$out+=$escape(fileName);
$out+='" data-type="';
$out+=$escape(type);
$out+='">';
$out+=$escape(fileName);
$out+='</a> <a class="curp m-l-xs" href="javascript:void(0)" data-action="deleteAttach" data-net-file-id="';
$out+=$escape(netFileId);
$out+='" data-type="';
$out+=$escape(type);
$out+='"> <i class="fa fa-times fc-red"></i> </a> </span>';
return new String($out);
});/*v:1*/
template('m_common/m_attach_no_delete',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,netFileId=$data.netFileId,fullPath=$data.fullPath,fileName=$data.fileName,type=$data.type,$out='';$out+='<span class="label m-r-xs m-b-xs" style="background: #ecf0f1;padding: 5px 10px;display: inline-block;"> <a href="javascript:void(0)" data-action="preview" data-net-file-id="';
$out+=$escape(netFileId);
$out+='" data-src="';
$out+=$escape(fullPath);
$out+='" data-name="';
$out+=$escape(fileName);
$out+='" data-type="';
$out+=$escape(type);
$out+='">';
$out+=$escape(fileName);
$out+='</a> <a class="curp m-l-xs" href="javascript:void(0)" data-action="deleteAttach" data-net-file-id="';
$out+=$escape(netFileId);
$out+='" data-type="';
$out+=$escape(type);
$out+='"> </a> </span> ';
return new String($out);
});/*v:1*/
template('m_common/m_bottom',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_serverUrl=$helpers._serverUrl,$out='';$out+='<div class="pull-right"> </div> <div> <a href="';
$out+=$escape(_serverUrl('/'));
$out+='" target="_blank" style="color: #676a6c"><strong>Copyright</strong>&nbsp;imaoding.com&nbsp;&copy;&nbsp;2015-2017</a> <span class="pull-right" id="footDiskInfo">已使用：0B&nbsp;&nbsp;总容量：5.0GB</span> </div>';
return new String($out);
});/*v:1*/
template('m_common/m_breadcrumb',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$each=$utils.$each,dataList=$data.dataList,p=$data.p,i=$data.i,$escape=$utils.$escape,$out='';$out+=' <div class="no-margins p-h-sm breadcrumb-box" > <ol class="breadcrumb"> ';
$each(dataList,function(p,i){
$out+=' <li class="';
$out+=$escape(i>0?'fa fa-angle-right':'');
$out+=' ';
$out+=$escape(i+1==dataList.length?'active fw-bold':'');
$out+='"> ';
if(p.url){
$out+=' <a href="';
$out+=$escape(p.url);
$out+='">';
$out+=$escape(p.name);
$out+='</a> ';
}else{
$out+=' ';
$out+=$escape(p.name);
$out+=' ';
}
$out+=' </li> ';
});
$out+=' </ol> </div>';
return new String($out);
});/*v:1*/
template('m_common/m_date_range_picker','<style> .quickDatePicker{ height: 241px; border: solid 1px #ccc; } .quickDatePicker iframe{ height: 225px;box-shadow: none !important;} </style> <div class="m-date-range-picker"> <div class="row"> <div class="col-sm-6"> <span class="dp-inline-block p-xxs f-s-xs">开始时间</span> </div> <div class="col-sm-6 p-l-none"> <span class="dp-inline-block p-xxs f-s-xs">截止时间</span> </div> </div> <div class="row"> <div class="col-sm-6 p-r-none"> <div id=\'quickDatePicker1\' class="quickDatePicker"></div> </div> <div class="col-sm-6 p-l-none"> <div id=\'quickDatePicker2\' class="quickDatePicker"></div> </div> </div> <div class="row m-t-xs"> <div class="col-sm-12 text-right p-r-md"> <button class="btn btn-default btn-sm" data-action="cancel">取消</button> <button class="btn btn-primary btn-sm" data-action="ok">确定</button> </div> </div> </div> ');/*v:1*/
template('m_common/m_display_by_role_value',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,role=$data.role,_isNullOrBlank=$helpers._isNullOrBlank,value=$data.value,type=$data.type,$escape=$utils.$escape,_momentFormat=$helpers._momentFormat,$out='';$out+=' ';
if(role==1){
$out+=' ';
if(_isNullOrBlank(value)){
$out+=' <span class="fc-v1-grey">未设置</span> ';
}else{
$out+=' ';
if(type==1){
$out+=' ';
$out+=$escape(_momentFormat(value,'YYYY/MM/DD'));
$out+=' ';
}else{
$out+=' ';
$out+=$escape(value);
$out+=' ';
}
$out+=' ';
}
$out+=' ';
}else{
$out+=' ';
if(_isNullOrBlank(value)){
$out+=' <span class="fc-v1-grey">--</span> ';
}else{
$out+=' ';
if(type==1){
$out+=' ';
$out+=$escape(_momentFormat(value,'YYYY/MM/DD'));
$out+=' ';
}else{
$out+=' ';
$out+=$escape(value);
$out+=' ';
}
$out+=' ';
}
$out+=' ';
}
return new String($out);
});/*v:1*/
template('m_common/m_error_404','<div class="middle-box text-center animated fadeInDown p-h-sm"> <h1>404</h1> <h3 class="font-bold">页面没找到</h3> <div class="error-desc"> 抱歉，您找到的页面没找到。 尝试检查网址是否有错误，然后点击浏览器上的刷新按钮或尝试在我们的应用中找到其他内容。 </div> </div>');/*v:1*/
template('m_common/m_inputProcessTime',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,appointmentStartTime=$data.appointmentStartTime,timeInfo=$data.timeInfo,appointmentEndTime=$data.appointmentEndTime,isHaveMemo=$data.isHaveMemo,$out='';$out+='<style> .form-horizontal .m-r-xs{margin:5px -5px;} /*label.error{position: absolute;top:30px;left: -5px;}*/ </style> <form class="form-horizontal rounded-bottom inputTimeOBox p-m"> <div class="col-md-4"> <div class="form-group m-r-xs"> <label>开始时间</label> <div class="input-group"> <input type="text" class="form-control timeInput startTime input-sm" id="ipt_startTime" name="startTime" data-appointmentStartTime = "';
$out+=$escape(appointmentStartTime);
$out+='" placeholder="开始日期" readonly onFocus="startTimeFun(this,m_inputProcessTime_onpicked)" value="';
$out+=$escape(timeInfo.startTime);
$out+='" style="width: 110px"> <span class="input-group-addon no-padding" onclick="javascript:$(this).prev().focus();"> <i class="icon-sm icon-append fa fa-calendar" style="height: 28px;line-height: 28px;"></i> </span> </div> </div> </div> <div class="col-md-4"> <div class="form-group m-r-xs"> <label>结束时间</label> <div class="input-group"> <input type="text" class="form-control timeInput endTime input-sm" id="ipt_endTime" name="endTime" data-appointmentEndTime = "';
$out+=$escape(appointmentEndTime);
$out+='" placeholder="结束日期" readonly onFocus="endTimeFun(this,m_inputProcessTime_onpicked)" value="';
$out+=$escape(timeInfo.endTime);
$out+='" style="width: 110px"> <span class="input-group-addon no-padding" onclick="javascript:$(this).prev().focus();"> <i class="icon-sm icon-append fa fa-calendar" style="height: 28px;line-height: 28px;"></i> </span> </div> </div> </div> <div class="col-md-4"> <div class="form-group m-r-xs"> <label>总天数</label> <div class="input-group spinner dayCountSpinner" data-trigger="spinner"> <input type="text" class="form-control text-center input-sm dayCount" value="0" data-rule="quantity"> <div class="input-group-addon"> <a href="javascript:void(0);" class="spin-up" style="height: 8px;width: 8px;" data-spin="up"><i class="fa fa-caret-up"></i></a> <a href="javascript:void(0);" class="spin-down" style="height: 8px;width: 8px;" data-spin="down"><i class="fa fa-caret-down"></i></a> </div> </div> </div> </div> ';
if(isHaveMemo){
$out+=' <div class="col-md-12"> <div class="form-group m-r-xs"> <label>变更原因</label> <textarea name="memo" class="form-control">';
$out+=$escape(timeInfo.memo);
$out+='</textarea> </div> </div> ';
}
$out+=' <div class="clearfix"></div> </form>';
return new String($out);
});/*v:1*/
template('m_common/m_input_save',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,fieldName=$data.fieldName,fieldValue=$data.fieldValue,isDialog=$data.isDialog,$out='';$out+='<form class="form-horizontal m"> <div class="form-group"> <div class="col-md-12"> <input type="text" class="form-control" name="name" autocomplete="off" placeholder="请输入';
$out+=$escape(fieldName?fieldName:'流程名称');
$out+='" value="';
$out+=$escape(fieldValue?fieldValue:'');
$out+='"> </div> ';
if(isDialog==false){
$out+=' <div class="col-md-12 text-right m-t-sm"> <button class="btn btn-default btn-sm" data-action="cancel">取消</button> <button class="btn btn-primary btn-sm" data-action="save">确定</button> </div> ';
}
$out+=' </div> </form>';
return new String($out);
});/*v:1*/
template('m_common/m_metismenu',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,companyVersion=$data.companyVersion,$out='';$out+='<nav class="navbar-default navbar-static-side m-metismenu" role="navigation" > <div class="sidebar-collapse"> <ul class="nav metismenu" id="side-menu" style="display: block;"> <li class="navbar-minimalize"> <a href="javascript:void(0);" class="workbench" style=""> <i class="pull-left icon iconfont icon-pc"></i> <span class="nav-label pull-left">&nbsp;</span> <div class="clearfix"></div> </a>  </li> <li class="roleControl" roleCode="20000101" flag="2"> <a id="addProject" class="svg" href="#/addProject"> <i class="pull-left icon iconfont icon-tianjia1"></i> <span class="nav-label pull-left">立项</span> <div class="clearfix"></div> </a> </li>                   <li class="parentProject" roleCode="" flag="2"> <a class="svg" href="javascript:void(0);"> <i class="pull-left font-style-normal text-bold m-metismenu-icon">P</i> <span class="nav-label pull-left">课题项目</span> <span class="fa arrow"></span> <div class="clearfix"></div> </a> <ul class="nav nav-second-level collapse" >  <li class="liProjectList"> <a href="#/projectOverview" id="projectList" class = "projectList"><span>项目总览</span> <div class="clearfix"></div></a> </li> <li> <a href="#/studyProjectSection?businessType=2" id="studyProjectSection"><span>研究组</span></a> </li> </ul> </li> ';
if(companyVersion!='03'){
$out+=' <li class="roleControl" roleCode="20200101" flag="2" > <a id="myTask" class="svg" href="#/myTask"> <i class="pull-left font-style-normal text-bold m-metismenu-icon">T</i> <span class="nav-label pull-left">我的任务</span> <div class="clearfix"></div> </a> </li> ';
}
$out+=' <li class="roleControl" flag="2" > <a class="svg" href="javascript:void(0);"> <i class="pull-left font-style-normal text-bold m-metismenu-icon">I</i> <span class="nav-label pull-left">信息动态</span> <span class="fa arrow"></span> <div class="clearfix"></div> </a> <ul class="nav nav-second-level collapse" > <li class="roleControl" roleCode="10-10-01" flag="2"> <a href="#/projectDynamics" id="projectDynamics"><span>动态快讯</span></a> </li> <li class="roleControl" roleCode="10-10-02" flag="2"> <a href="#/projectDynamicsAll" id="projectDynamicsAll"><span>动态总览</span></a> </li> <li class="roleControl" roleCode="10-10-03" flag="2"> <a href="#/technologySync" id="technologySync"><span>技术协同</span></a> </li> <li class="roleControl" roleCode="10-10-04" flag="2"> <a href="#/partyBuild" id="partyBuild"><span>党史学习教育</span></a> </li> </ul> </li> <li class="roleControl" roleCode="" flag="2"> <a class="svg" href="javascript:void(0);"> <i class="pull-left font-style-normal text-bold m-metismenu-icon">R</i> <span class="nav-label pull-left">统计管理</span> <span class="fa arrow"></span> <div class="clearfix"></div> </a> <ul class="nav nav-second-level collapse" > <li class="roleControl" roleCode="40001301" flag="2"> <a href="#/proProgressStats" id="proProgressStats"><span>进度总览</span></a> </li> <li class="roleControl" roleCode="47000101,47000105" flag="2"> <a href="#/userOutputStats" id="userOutputStats"><span>个人效能</span></a> </li>  <li class="roleControl" roleCode="450010102" flag="2"> <a href="#/theaterRanking" id="theaterRanking"><span>服务公司</span></a> </li> <li class="roleControl" roleCode="400012" flag="2"> <a href="#/projectCostDetail" id="projectCostDetail"><span>收支汇总</span></a> </li>  <li class="roleControl" roleCode="47000103" flag="2"> <a href="#/deanBillStatistic" id="deanBillStatistic"><span>经营收入</span></a> </li> </ul> </li>                 <li class="roleControl" roleCode="20210101" flag="2"> <a class="svg" a href="#/addressBook" id="addressBook"> <i class="pull-left font-style-normal text-bold m-metismenu-icon">A</i> <span class="nav-label pull-left">通讯录</span> <div class="clearfix"></div> </a> </li> </ul> </div> </nav> <div class="clearfix"></div> ';
return new String($out);
});/*v:1*/
template('m_common/m_popover',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,popoverStyle=$data.popoverStyle,$string=$utils.$string,titleHtml=$data.titleHtml,contentStyle=$data.contentStyle,content=$data.content,$out='';$out+='<div class="popover m-popover box-shadow" role="tooltip" style="';
$out+=$escape(popoverStyle);
$out+='"> <div class="arrow" style="left: 50%;"></div>  ';
$out+=$string(titleHtml);
$out+=' <div class="popover-content" style="';
$out+=$escape(contentStyle);
$out+='"> ';
$out+=$string(content);
$out+=' </div> </div>';
return new String($out);
});/*v:1*/
template('m_common/m_popover_confirm',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$string=$utils.$string,confirmMsg=$data.confirmMsg,$out='';$out+='<div> <p class="f-s-sm">';
$out+=$string(confirmMsg);
$out+='</p> <p class="pull-right" > <button type="button" class="popover-btn-no btn-u btn-u-default btn-u-xs rounded m-popover-close left m-r-4" style="line-height:22px;">取消 </button> <button type="button" class="popover-btn-yes btn-u btn-u-red btn-u-xs rounded m-popover-submit m-l-sm left" style="line-height:22px;">确定</button> </p> </div>';
return new String($out);
});/*v:1*/
template('m_common/m_quickDatePicker',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,isClear=$data.isClear,$out='';$out+='<style> #quickDatePicker iframe{box-shadow: none !important;} </style> <div id=\'quickDatePicker\' class="quickDatePicker" style="width: 245px;height: 240px"> &nbsp; </div> <div class="row"> <div class="col-md-12 text-right m-b-sm"> ';
if(isClear){
$out+=' <button type="button" class="btn btn-primary btn-sm m-popover-clear m-r-xs">清空</button> ';
}
$out+=' </div> </div> ';
return new String($out);
});/*v:1*/
template('m_common/m_select2_for_companybid',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,value=$data.value,$out='';$out+='<div> <span class="new-input"> <input type="text" name="companyBid" class="form-control input-sm p-r-md" placeholder="请输入或选择乙方名称，多个请用“/”隔开" value="';
$out+=$escape(value);
$out+='" name="constructCompany"> </span> <span class="select2-results"> <ul class="select2-results__options" role="tree" id="select2-29ob-results" aria-expanded="true" aria-hidden="false"> <li class="select2-results__option select2-results__option--highlighted" role="treeitem" aria-selected="false">深圳华侨城创新研究院有限公司</li> </ul> </span> </div> ';
return new String($out);
});/*v:1*/
template('m_common/m_select_field_by_check',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,type=$data.type,$each=$utils.$each,dataList=$data.dataList,p=$data.p,$index=$data.$index,$out='';$out+='<div class="m-select-field-by-check m" data-type="';
$out+=$escape(type);
$out+='"> <div class="row no-margin dp-box m-b-sm"> <div class="col-md-6 no-padding"> <div class="">选择项</div> </div> <div class="col-space"></div> <div class="col-md-6 no-padding"> <div class="">已选择项</div> </div> </div> <div class="row no-margin dp-box field-content"> <div class="col-md-6 border border-darker-grey"> <div class="m-b-sm m-t-sm"> <label class="i-checks i-checks-label fw-normal"> <input name="allItemCK" type="checkbox" value="0"/> <span class="i-checks-span">全选</span> </label> </div> <div class="row"> ';
$each(dataList,function(p,$index){
$out+=' <div class="col-md-4 p-r-none"> <label class="i-checks i-checks-label fw-normal"> <input name="itemCk" type="checkbox" value="';
$out+=$escape(p.fieldName);
$out+='" data-id="';
$out+=$escape(p.id);
$out+='" data-relation-id="';
$out+=$escape(p.relationId);
$out+='"/> <span class="i-checks-span text-ellipsis" data-toggle="tooltip" data-container="body" data-original-title="';
$out+=$escape(p.fieldName);
$out+='"> ';
$out+=$escape(p.fieldName);
$out+=' </span> </label> </div> ';
});
$out+=' </div> </div> <div class="col-space"></div> <div class="col-md-6 border border-darker-grey"> <div class="row list-group no-margin p-t-sm" id="selectItemBox"> </div> </div> </div> </div> ';
return new String($out);
});/*v:1*/
template('m_common/m_text_editor','<div class="summernote"></div>');/*v:1*/
template('m_common/m_top',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_serverUrl=$helpers._serverUrl,_url=$helpers._url,companyInfo=$data.companyInfo,userInfo=$data.userInfo,_isNullOrBlank=$helpers._isNullOrBlank,unReadNotice=$data.unReadNotice,unReadMessage=$data.unReadMessage,unReadTodoCount=$data.unReadTodoCount,$out='';$out+='<nav class="navbar navbar-static-top m-top" role="navigation" style="margin-bottom: 0px;">  <div class="navbar-header"> <a href="';
$out+=$escape(_serverUrl('/'));
$out+='" class="navbar-brand svg" target="_blank"> <img class="maoding-logo pt-relative max-h-80" src="';
$out+=$escape(_url('/img/logo_white.png'));
$out+='"></img> </a> </div>  <div id="navbar" class="navbar-collapse collapse"> <ul class="nav navbar-top-links navbar-left" style="padding: 0 25px 0 5px;"> <li class="pull-left roleControl" roleCode="100007,10000301,100001,10000101,100004,10000401,10000601,10000602" flag="2"> <a data-action="backstageMgt" title="后台管理" style="padding: 65px 10px 0px 0px; "> <i class="fa fa-cog" style="margin-right: 9px;margin-left: 2px; color:black"></i> </a> </li> </ul>  <ul class="nav navbar-top-links navbar-right ';
$out+=$escape(companyInfo?'':'m-r-xxl');
$out+='"> <li class="pull-left"> <div class="dropdown l-h-80 no-padding m-t"> ';
if(userInfo){
$out+=' ';
if(!_isNullOrBlank(userInfo.imgUrl)){
$out+=' <img alt="image" class="img-circle" src="';
$out+=$escape(userInfo.imgUrl);
$out+='" onerror=javascript:this.src="';
$out+=$escape(_url('/img/head_default.png'));
$out+='" style="width: 40px;height: 40px;margin-right:5px;"> ';
}else{
$out+=' <img alt="image" class="img-circle" src="';
$out+=$escape(_url('/img/head_default.png'));
$out+='" style="width: 40px;height: 40px;margin-right:5px;"> ';
}
$out+=' <a class="userInfo" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" data-type="textUserName" href="javascript:void(0)"> ';
$out+=$escape(userInfo.userName);
$out+=' <span class="caret"></span> </a> ';
}
$out+=' <ul class="dropdown-menu dropdown-menu-left dropdown-menu-new" style="z-index: 99999"> ';
if(companyInfo){
$out+=' <li><a href="javascript:void(0)" data-action="personalSettings">个人设置</a></li>  <li class="divider"></li> <li><a href="javascript:void(0)" data-action="companyUserSettings">个人信息编辑</a></li>  <li class="divider"></li> ';
}
$out+=' <li><a href="';
$out+=$escape(_serverUrl('/iWork/sys/logout'));
$out+='">退出登录</a></li> </ul> </div> </li> ';
if(companyInfo){
$out+=' <!-- <li class="pull-left"> <a class="messageInfo" href="javascript:void(0);" data-action="announcement"> <i class="fa fa-bell"></i> <span id="unReadNoticeCount" class="label label-warning">';
$out+=$escape(_isNullOrBlank(unReadNotice) || unReadNotice === 0?'':unReadNotice);
$out+='</span> </a> </li>--> <li class="pull-left"> <a class="messageInfo" href="javascript:void(0);" data-action="messageCenter"> <i class="fa fa-envelope"></i> <span id="unReadMessageCount" class="label label-warning">';
$out+=$escape(_isNullOrBlank(unReadMessage) || unReadMessage === 0?'':unReadMessage);
$out+='</span> </a> </li> <li class="pull-left"> <a class="messageInfo" href="javascript:void(0);" data-action="myTodoList" style="padding-left: 0px;"> <button class="btn btn-sm btn-outline no-padding btn-warning" >我的待办 <span id="unReadTodoCount" class=" label-warning " >';
$out+=$escape(_isNullOrBlank(unReadTodoCount) || unReadTodoCount === 0?'':unReadTodoCount);
$out+='</span> </button> </a> </li> ';
}
$out+=' </ul> </div> </nav> ';
return new String($out);
});/*v:1*/
template('m_website/index/m_website_index',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,banner=$data.banner,$out='';$out+='<div class="m-website-index">   <section class="index-banner" > <!--<img class="banner-img" src="';
$out+=$escape(_url('/img/website/index-banner.png'));
$out+='" /> <div class="container fc-white text-right banner-content"> <div class="row"> <div class="col-md-12"> <p class="f-s-xxl title-1">SaaS构架、支持跨组织的协同工作</p> <h2 class="fw-bold f-s-60 title-2">卯丁，设计管理协同工作平台</h2> </div> </div> </div>--> <div id="myCarousel" class="carousel slide">  <ol class="carousel-indicators"> <li data-target="#myCarousel" data-slide-to="0" class="active"></li> <li data-target="#myCarousel" data-slide-to="1"></li> </ol>  <div class="carousel-inner"> <div class="item active"> <img src="';
$out+=$escape(_url('/img/website/index/'+banner[0]));
$out+='" alt="First slide"> <div class="container fc-white text-right banner-content"> <div class="row"> <div class="col-md-12"> <span class="f-s-lg title-1 dp-block fc-black">SaaS构架，远程协同、跨组织协同</span> <h2 class="fw-bold f-s-55 title-2 fc-black">卯丁，设计与管理协同工作平台</h2> </div> </div> </div> </div> <div class="item"> <img src="';
$out+=$escape(_url('/img/website/index/'+banner[1]));
$out+='" alt="Second slide"> <div class="container fc-white text-right banner-content"> <div class="row"> <div class="col-md-12"> <span class="f-s-lg title-1 dp-block fc-black">服务工程建设行业，做值得信任的设计与管理服务平台</span> <h2 class="fw-bold f-s-55 title-2 fc-black">卯丁，设计同行的工作方式</h2> </div> </div> </div> </div> </div>  <a class="left carousel-control" href="#myCarousel" role="button" data-slide="prev"> <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span> <span class="sr-only">Previous</span> </a> <a class="right carousel-control" href="#myCarousel" role="button" data-slide="next"> <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span> <span class="sr-only">Next</span> </a> </div> </section>    <section id="mainIdea" class="container p-h-100"> <div class="text-center m-b-xl"> <h2 class="fc-v1-black fw-bold m-b-xs content-title phone-multi-line"><span>多维度协同，</span><span>实现业务流、资金流、信息流的</span><span>一体化数字映像</span></h2> </div> <div class="row pt-relative" id="oneSpindle"> <div class="col-sm-6 m-b-xl p-b-md img-box"> <img class="img-fluid full-max-width" src="';
$out+=$escape(_url('/img/website/index-one-one.png'));
$out+='" width="540" alt="一条主轴"> </div> <div class="col-sm-6 m-b-xl p-b-md"> <div class="one-spindle-content" data-type="1"> <h2 class="f-s-lg fc-dark-grey fw-bold m-b-md"> 业务流协同</h2> <p class="fc-v3-grey"><span class="fc-v2-grey">核心业务协同：</span>基于项目PDCA闭环而展开的立项管理、任务签发、生产安排，进度管理、设校审、项目文档、交付成果管理等。</p> <p class="fc-v3-grey"><span class="fc-v2-grey">基础业务协同：</span>基于设计企业运营展开的合同管理、资料管理、流程管理、审批管理、工时管理、项目费控、财务管理、知识管理等。</p> </div> <div class="one-spindle-content" data-type="2"> <h2 class="f-s-lg fc-dark-grey fw-bold m-b-md m-t-xxl"> 跨组织协同</h2> <p class="fc-v3-grey"><span class="fc-v2-grey">设计资源协同：</span>跨组织合作，链接规划、建筑、室内、景观、智能等设计组织，建立契约化的多方合作机制，实现项目设计一体化。</p> <p class="fc-v3-grey"><span class="fc-v2-grey">全产业链协同：</span>链接发展商、设计、咨询、监理、施工、供应商等项目建设相关组织，数据共享、信息共享，即时沟通，高效协作。</p> </div> </div> <div class="clearfix"></div> <div class="col-lg-4 m-b-lg one-spindle-content" data-type="3">  <div class="media m-b"> <div class="media-body"> <h3 class="f-s-lg fc-black fw-bold no-margin m-b-md">web端：企业资源管理端</h3> <p class="fc-v3-grey">敏捷实施在线组织管理、项目管理、经营管理等，项目状态、收支明细、任务状态的快速智能查询。</p> </div> </div>  </div> <div class="col-lg-4 m-b-lg one-spindle-content" data-type="4">  <div class="media m-b"> <div class="media-body"> <h3 class="f-s-lg fc-black fw-bold no-margin m-b-md">桌面端：设计人员工作端</h3> <p class="fc-v3-grey">企业云盘客户端自动生成对应于生产安排任务的个人工作文件夹，通过该入口，完成设校审、成果实时归档。</p> </div> </div>  </div> <div class="col-lg-4 m-b-lg one-spindle-content" data-type="5">  <div class="media m-b"> <div class="media-body"> <h3 class="f-s-lg fc-black fw-bold no-margin m-b-md">移动端：企业专属通讯端</h3> <p class="fc-v3-grey">快速创建全员群、项目群，即时通讯、移动OA、在线审批、在线预览、项目信息、客户信息的快速查询。</p> </div> </div>  </div> <div class="text-center m-t-xl" id="oneSpindleContentMenu"> <a href="javascript:void(0);" class="fc-dark-blue" data-action="oneSpindle" data-type="1"><span class="glyphicon glyphicon-minus"></span></a> <a href="javascript:void(0);" class="fc-white" data-action="oneSpindle" data-type="2"><span class="glyphicon glyphicon-minus"></span></a> <a href="javascript:void(0);" class="fc-white" data-action="oneSpindle" data-type="3"><span class="glyphicon glyphicon-minus"></span></a> <a href="javascript:void(0);" class="fc-white" data-action="oneSpindle" data-type="4"><span class="glyphicon glyphicon-minus"></span></a> <a href="javascript:void(0);" class="fc-white" data-action="oneSpindle" data-type="5"><span class="glyphicon glyphicon-minus"></span></a> </div> </div> </section>  <section class="bg-v5-grey p-h-100" id="features"> <div class="container">  <div class="text-center m-b-xl phone-m-b-xl p-b-md"> <h2 class="fc-v1-black fw-bold content-title phone-multi-line"><span>易于理解，</span>实用易用、执着细节、注重体验</h2> </div>   <div class="row"> <div class="col-lg-6 m-b-lg">  <div class="u-shadow-v1 bg-white rounded-5 p-lg"> <div class="media m-b"> <div class="media-body"> <h3 class="f-s-lg fc-dark-grey fw-bold no-margin m-b-md">功能聚焦，整体协同</h3> <div class="width-30 brd-bottom fc-dark-gray m-t m-b"></div> <p class="fc-v3-grey m-b-none"> 以企业核心业务为主轴，实现与本企业基础业务的整体协同；基于同一平台，真正实现契约化的跨组织协同。 </p> </div> </div> </div>  </div> <div class="col-lg-6 m-b-lg">  <div class="u-shadow-v1 bg-white rounded-5 p-lg"> <div class="media m-b"> <div class="media-body"> <h3 class="f-s-lg fc-dark-grey fw-bold no-margin m-b-md">专业定制，实战检验</h3> <div class="width-30 brd-bottom fc-dark-gray m-t m-b"></div> <p class="fc-v3-grey m-b-none"> 界面设计遵循行业规范，流程引擎、表单制作可由用户循企业规定个性化定制，产品从实战中来，效益显著。 </p> </div> </div> </div>  </div> </div>   <div class="row"> <div class="col-lg-6 m-b-lg">  <div class="u-shadow-v1 bg-white rounded-5 p-lg"> <div class="media m-b"> <div class="media-body"> <h3 class="f-s-lg fc-dark-grey fw-bold no-margin m-b-md">关注用户，快速实施</h3> <div class="width-30 brd-bottom fc-dark-gray m-t m-b"></div> <p class="fc-v3-grey m-b-none"> 关注用户体验，产品设计完全符合设计企业的习惯工作方式和思维逻辑，零学习成本，极速部署，快速实施。 </p> </div> </div> </div>  </div> <div class="col-lg-6 m-b-lg">  <div class="u-shadow-v1 bg-white rounded-5 p-lg"> <div class="media m-b"> <div class="media-body"> <h3 class="f-s-lg fc-dark-grey fw-bold no-margin m-b-md">场景在线，敏捷管控</h3> <div class="width-30 brd-bottom fc-dark-gray m-t m-b"></div> <p class="fc-v3-grey m-b-none"> 业务场景在线，企业管控敏捷实施，让你习惯的工作方法，变得更加简单，让你希望的工作方法，轻松实现。 </p> </div> </div> </div>  </div> </div>  </div> </section>   <section id="advantage" class="p-h-100"> <div class="container">  <div class="text-center m-b-xl p-b-md"> <h2 class="fc-v1-black fw-bold content-title phone-multi-line"><span>围绕角色、权限进行创新，</span>围绕执行力、习惯行为进行创新</h2> </div>  <div class="row advantage-content"> <div class="col-sm-6 col-lg-4 m-b-lg">  <div class="row"> <div class="col-xs-5 col-sm-12 no-padding"> <img class="img-fluid full-width" src="';
$out+=$escape(_url('/img/website/index-two-one.png'));
$out+='" alt="专业优势"> </div> <div class="col-xs-7 col-sm-12 p-l-none"> <div class="bg-white pt-relative z-index-1 p-lg m-t-n-xxl m-auto" style="width: 85%;"> <h2 class="f-s-lg fc-dark-grey fw-bold m-b-md"> 运行数据，实时采集 </h2> <p class="fc-v3-grey l-h-25"> 管理数字化工具与专业化数字工具（如 AutoCad、3d Max 等），实时采集企业经营数据、图文档数据、人员行为数据等，数据按规范重新组织，经过滤、分类、传输、自动归档，实现数据采集智能化。 </p> </div> </div> </div>  </div> <div class="col-sm-6 col-lg-4 m-b-lg">  <div class="row"> <div class="col-xs-5 col-sm-12 no-padding"> <img class="img-fluid full-width" src="';
$out+=$escape(_url('/img/website/index-two-two.png'));
$out+='" alt="实战检验"> </div> <div class="col-xs-7 col-sm-12 p-l-none"> <div class="bg-white pt-relative z-index-1 p-lg m-t-n-xxl m-auto" style="width: 85%;"> <h2 class="f-s-lg fc-dark-grey fw-bold m-b-md"> 专业体验，敏捷管控 </h2> <p class="fc-v3-grey l-h-25"> 借鉴互联网产品敏捷迭代的理念，以实现业务管控敏捷化为目标，多终端协同，打造设计企业云端工作环境，它不改变员工习惯的传统工作方式，同时，内置的流程引擎让用户自定义契合自身业务场景的业务流程。 </p> </div> </div> </div>  </div> <div class="col-sm-6 col-lg-4 m-b-lg">  <div class="row"> <div class="col-xs-5 col-sm-12 no-padding"> <img class="img-fluid full-width" src="';
$out+=$escape(_url('/img/website/index-two-three.png'));
$out+='" alt="关注用户"> </div> <div class="col-xs-7 col-sm-12 p-l-none"> <div class="bg-white pt-relative z-index-1 p-lg m-t-n-xxl m-auto" style="width: 85%;"> <h2 class="f-s-lg fc-dark-grey fw-bold m-b-md"> 云端部署，本地同步 </h2> <p class="fc-v3-grey l-h-25"> 项目文档、设计成果，按照任务签发体系，实现公有云、私有云的数据分布存储与备份，公有云提供高级别容灾保护。本地、云端文件实时自动同步，实现内外部的文件安全访问、分享、共享，在线预览与编辑。 </p> </div> </div> </div>  </div> </div> </div> </section>   <section id="worth" class="bg-v2-grey p-h-100"> <div class="container">  <div class="text-center m-b-xl p-b-md"> <h2 class="fc-v1-black fw-bold content-title phone-multi-line"><span>一站式解决方案，</span>助力设计企业数字化转型</h2> </div>  <div class="row"> <div class="col-sm-6 m-b-xl p-b-md"> <img class="img-fluid full-max-width" src="';
$out+=$escape(_url('/img/website/index-three-one.png'));
$out+='" alt="产品价值"> </div> <div class="col-sm-6 m-t-lg worth-content"> <h3 class="f-s-lg fc-dark-grey fw-bold">降低运营成本</h3> <p class="fc-v3-grey"> 云部署，节约硬件投入，运行数据自动采集，各类报表实时准确，节约60%以上的行政管理费用。 </p> <h3 class="f-s-lg fc-dark-grey fw-bold m-t-xl p-t-md">提升团队执行力</h3> <p class="fc-v3-grey">项目信息透明化，消除公司全员信息不对称，员工层简单工作，管理层协同执行，决策层洞悉全局。</p> </div> </div> </div> </section>   <section id="app" class="p-h-100 bg-white pt-relative">  <div class="icon-triangle"></div> <div class="text-center m-b-xl p-b-md"> <h2 class="fc-black fw-bold ">移动端</h2> <p class="lead m-auto">扫码下载</p> </div>  <div class="text-center m-b-xl"> <img class="img-thumbnail" src="';
$out+=$escape(_url('/img/website/code.png'));
$out+='" style="width: 192px;height: 192px;"> </div> </section>  </div> ';
return new String($out);
});/*v:1*/
template('m_website/index/m_website_index_tomaoding',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+=' <section class="p-h-100 bg-white"> <div class="container">  <div class="text-center m-b-xxl"> <img src="';
$out+=$escape(_url('/img/website/toMaoding.png'));
$out+='" /> <a class="u-link-v5" href="https://www.imaoding.com" target="_blank" style="display: block;font-size: 28px;font-weight: 600;">www.imaoding.com</a> </div> </div> </section> ';
return new String($out);
});/*v:1*/
template('m_website/common/m_website_common_forgetpwd','<style> /*兼容手机端footer挡住注册按钮*/ @media only screen and (min-height: 0px) and (max-height: 600px) { .wrapper .footer{ position: relative;display: block; } } html body{ background-color: #f3f5f9 !important; } </style> <div class="bg-v1"> <div class="container content forgetOBox"> <div class="row"> <div class="col-24-md-10 col-24-md-offset-7 col-24-sm-14 col-24-sm-offset-6 " id="forgetStepOBox"> </div> </div> </div> <div class="footer text-center" style="border: none;background: transparent;"> <p class="m-t"> <small>深圳华侨城创新研究院有限公司 <a href="http://beian.miit.gov.cn" target="_blank">粤ICP备2020097205号-3</a></small> </p> </div> </div>');/*v:1*/
template('m_website/common/m_website_common_login',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<style> div.wrapper{ background-color: #fff; padding: 0; } .header-v6 .head-row { height: 73px; max-height: 73px; line-height: 73px; } @media (min-width:700px){ .head-logo{ margin-left: 10%; margin-top: -15px; padding:0px; } } @media (min-width:700px){ .head-reg{ padding-right: 20px; margin-right: 150px; } } .login-bg-wrapper { z-index: 1; overflow: hidden; position: fixed; width:100%; height:100%; background:url(';
$out+=$escape(_url('/img/login_bg_not_logo.png'));
$out+=') no-repeat; background-size:cover; } /*---------- login-form --------- */ .login-form-wrapper { font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif !important; box-sizing: border-box; float:right; margin-right:3%; } @media (min-width:1367px){ .login-form-wrapper{ min-width: 530px; width: 530px; max-width: 530px; } } @media (min-width:992px) and (max-width: 1366px){ .login-form-wrapper{ min-width: 530px; width: 530px; max-width: 530px; } } @media (min-width:768px) and (max-width: 991px){ .login-form-wrapper{ min-width: 350px; width: 350px; max-width: 350px; } } @media (min-width: 350px) and (max-width:767px){ .login-form-wrapper{ min-width: 350px; width: 350px; max-width: 350px; } } @media (min-width: 200px) and (max-width:349px){ .login-form-wrapper{ min-width: 200px; width: 340px; max-width: 340px; } } @media (min-width:992px){ .login-form{ min-width: 350px; width: 350px; max-width: 350px; } } @media (min-width:768px) and (max-width: 991px){ .login-form{ min-width: 350px; width: 350px; max-width: 350px; } } @media (min-width: 350px) and (max-width:767px){ .login-form{ min-width: 350px; width: 350px; max-width: 350px; } } @media (min-width: 200px) and (max-width:349px){ .login-form{ min-width: 200px; width: 320px; max-width: 340px; } } .left-word-wrapper{ margin-left: 10%; margin-top: 5px; display: block; float: left; position: absolute; font-family: "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif !important; } .left-word{ font-size:6rem; color:#585657; margin: 0px; } .login-form p { text-align: left; } .login-form label { line-height: 20px; color: #555; } .login-form-header { color: #555; text-align: center; margin-bottom: 20px; border-bottom: solid 1px #eee; } .login-form-header h3 { font-size: 18px; margin-bottom: 15px; } .login-form hr{ margin: 15px 0; } .login-form-remeberme{ float:left; text-align: left; padding-top: 0px; } .login-form-submit{ float:right; } .login-form-qrcode-wrapper{ float: left; box-sizing: border-box; width: 170px; padding: 0 10px; } .login-form-qrcode { padding: 20px 20px 0 20px; width: 150px; background-color: #fff; text-align: center; border-top-left-radius: 4px; border-top-right-radius: 4px; -moz-border-radius-topleft: 4px; -moz-border-radius-topright: 4px; -webkit-border-top-left-radius: 4px; -webkit-border-top-right-radius: 4px; } .login-form-qrcode-word { color: #999; box-sizing: border-box; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; -moz-border-radius-bottomleft: 4px; -moz-border-radius-bottomright: 4px; -webkit-border-bottom-left-radius: 4px; -webkit-border-bottom-right-radius: 4px; width: 150px; background-color: #fff; text-align: center; padding: 10px; } .login-form-forget-word{ margin: 0 0 5px; } .forget-form .modal-dialog{ margin:0 auto; min-width: 430px; width:430px; max-width: 430px; } .center-vertical { position:relative; top:50%; transform:translateY(-50%); } .vertical-center{ position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); } .modal-header{ padding: 15px 30px !important; } .margin-right-15{ margin-right: 15px; } .foot-copy-rights{ width:100%; padding: 10px; position:absolute; bottom:0px; z-index: 2; } .btn-default{ background: #f0f0f0; } .tooltip.left .tooltip-inner { background-color:red; } .tooltip.left .tooltip-arrow { border-left-color: red; } a.svg{display: inline-block;position: relative;top: 15px;} a.svg:after { content: ""; position: absolute; top: 0; right: 0; bottom: 0; left:0; } .login-bg-wrapper .mt-14p{ margin-top: 14%; } </style> <div class="bg-white "> <div class="login-bg-wrapper"> <div class="head-logo"> <a href="javascript:void(0)" class="svg" style="height:10%;width:10%;"> <object data="';
$out+=$escape(_url('/img/login_lef_logo.png'));
$out+='"></object > </a> </div> <div class="left-word-wrapper"> <h1 class="left-word"> 项目管理平台 </h1> </div> <div class="login-form-wrapper rounded login-content"> </div> </div> <div class="row foot-copy-rights"> <p class="text-center">深圳华侨城创新研究院有限公司 <a href="http://beian.miit.gov.cn" target="_blank">粤ICP备2020097205号-3</a></p> </div> </div> ';
return new String($out);
});/*v:1*/
template('m_website/common/m_website_common_register','<style> /*兼容手机端footer挡住注册按钮*/ @media only screen and (min-height: 0px) and (max-height: 600px) { .wrapper .footer{ position: relative;display: block; } } html body{ background-color: #f3f5f9 !important; } </style> <div> <input type="password" style="display:none;"> <div class="container content registerContent"> <div id="step1" class="row"> <div class="col-md-4 col-md-offset-4 col-sm-6 col-sm-offset-3" id="registerStepBox"> </div> </div> </div> <div class="footer text-center" style="border: none;background: transparent;"> <p class="m-t" > <small>深圳华侨城创新研究院有限公司 <a href="http://beian.miit.gov.cn" target="_blank">粤ICP备2020097205号-3</a></small> </p> </div> </div> ');/*v:1*/
template('m_website/faq/m_website_faq',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,isShowContent=$data.isShowContent,_url=$helpers._url,banner=$data.banner,$out='';$out+='<div class="m-website-faq">  <section class="index-banner" data-type="';
$out+=$escape(isShowContent?'1':'2');
$out+='"> <img class="banner-img" src="';
$out+=$escape(_url('/img/website/faq/'+banner));
$out+='" /> <div class="container fc-white text-center banner-content"> <div class="row"> <div class="col-md-12 banner-title m-t-xl"> <h1 class="f-s-60 m-b-xs">帮助中心</h1> <h2 class="f-s-xl m-b-none">帮助您全面了解卯丁</h2> </div> </div> </div> </section>   <section class="container p-t-100 p-b-xxl m-b-md" id="faqContent"> <div class="row"> <div class="col-md-3" id="leftMenu"> </div> <div class="col-md-9 ';
$out+=$escape(isShowContent?'':'hide');
$out+='" id="rightContent"> </div> </div> </section>  </div> ';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_financial_1',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">财务管理</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;卯丁系统中，财务管理将根据设计行业情形，建立以项目推动的财务管理体系，目前整个体系包括组织的收支明细、利润报表、财务设置、费用录入、发票汇总以及工资薪酬几个板块。 </p> <p> 财务体系中数据及操作需要组织设定相应的财务权限者才能查看及操作。具体可在权限设置中进行配置。 </p> <p> 对于类型三的分支机构/事业合伙人，因其不具有财务管理权限，相关的财务数据将委托其上级具有财务权限的组织进行管理。 </p> <p> 1. 财务设置，组织可根据实际的财务数据进行收支类别、基础财务数据等相关财务数据设置，如图1。 </p> <div class="text-center"> <img class="full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/finance/1/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 收支分类中整体分为 </p> <p> &nbsp;&nbsp;a. 收入部分既项目收支中出生的项目财务数据。 </p> <p> &nbsp;&nbsp;b. 人工输入部分用于财务录入的部分财务数据。 </p> <p> &nbsp;&nbsp;c. 审批管理中关于费用、报销等相关审批财务数据。 </p> <p> 其中收入只能通过项目收支管理产生的数据自动归结，不能变更。人工输入部分将通过费用录入进行设置，审批相关数据将通过审批结果进行自动归结，不能变更。 </p> <p> 2. 财务设置中，对于分支机构的设置只有收入及支出相关部分，其余类型均不可设置，由分支结构自行设置。 </p> <p> 3. 费用录入，系统中每月的财务数据，发生在审批、项目之外数据，可通过费用录入的形式进行财务统计记录，按照每月的数据自行录入即可完成相关数据归结到收支明细的台账以及利润报表的计算中，如图2。 </p> <div class="text-center"> <img class="full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/finance/1/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 4. 收支明细，明细包括台账、应收、应付。三个内容，其中台账包括了财务人员完成审批类型的拨款操作的数据，费用录入中的数据，以及项目收支管理中由财务管理人员进行了到账确认或付款确认的项目收支数据，如图3。应付为项目收支中已经通过审批的付款申请，但是财务人员尚未进行付款确认数据，应收未已经发起的回款，财务人员尚未完成到账确认的数据。 </p> <div class="text-center"> <img class="full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/finance/1/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 5. 利润报表，利润报表的数据为收支明细中相应月份的台账数据的整合归结合并计算之后，形成的报表数据，只能查看，不能变更，如图4。 </p> <div class="text-center"> <img class="full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/finance/1/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 6. 发票汇总，发票汇总数据为在项目收支管理中收款计划如果需要开票，并且财务人员开票完成填写相关的发票号码之后，发票信息将汇总进入发票汇总中，方便查看。 </p> <p> 7. 薪酬管理，卯丁系统中新增了2019年根据新的个税规则的薪酬管理体系，财务人员根据每月的薪酬数据，进行相应的数据录入，需要先导出表格，依据表格规则，填写之后再进行导入，则相应的个税数据，五险一金数据则会自行进行计算，如图5。依据2019年新的个税累计扣除规则，薪酬体系需要从当年的第一个月份开始进行相应的数据导入并生成综合报表，才能进行后续月份的数据生成。否则无法生成综合报表。保存并生成综合报表之后，相应的人员薪酬信息可在个人中心进行查看，如图6。后续，薪酬体系将纳入项目成本核算中进行财务数据统计。 </p> <div class="text-center"> <img class="full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/finance/1/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> <div class="text-center"> <img class="full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/finance/1/6.jpg'));
$out+='" /> <p class="text-center">图6</p> </div> </div> </div> ';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_menu',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,isPhone=$data.isPhone,isShowContent=$data.isShowContent,$each=$utils.$each,menuList=$data.menuList,m=$data.m,i=$data.i,_url=$helpers._url,c=$data.c,ci=$data.ci,activeId=$data.activeId,$out='';$out+='<nav class="navbar-default navbar-content border m-website-faq-menu ';
$out+=$escape(isPhone && isShowContent?'hide':'');
$out+='" role="navigation" > <div class="sidebar-collapse"> <ul class="nav"> ';
$each(menuList,function(m,i){
$out+=' <li class="';
$out+=$escape(i>0?'border-t-dashed':'');
$out+='" data-id="';
$out+=$escape(m.id);
$out+='"> <a class="nav-first-level" href="javascript:void(0);"> ';
if(m.id=='faq/update'){
$out+=' <img class="products-icon pull-left" src="';
$out+=$escape(_url('/img/website/help/versionUpdate.png'));
$out+='" width="28"/> ';
}else if(m.id=='faq/org'){
$out+=' <img class="products-icon pull-left" src="';
$out+=$escape(_url('/img/website/help/organization_small.png'));
$out+='" width="28"/> ';
}else if(m.id=='faq/project'){
$out+=' <img class="products-icon pull-left" src="';
$out+=$escape(_url('/img/website/help/project_small.png'));
$out+='" width="28"/> ';
}else if(m.id=='faq/financial'){
$out+=' <img class="products-icon pull-left" src="';
$out+=$escape(_url('/img/website/help/money_small.png'));
$out+='" width="28"/> ';
}else if(m.id=='faq/version'){
$out+=' <img class="products-icon pull-left" src="';
$out+=$escape(_url('/img/website/help/version.png'));
$out+='" width="28"/> ';
}
$out+=' <span class="nav-label pull-left">';
$out+=$escape(m.name);
$out+='</span> <span class="fa arrow"></span> <div class="clearfix"></div> </a> ';
if(m.children){
$out+=' <ul class="nav nav-second-level collapse" > ';
$each(m.children,function(c,ci){
$out+=' <li class="" data-id="';
$out+=$escape(c.id);
$out+='"> <a href="#/';
$out+=$escape(c.id);
$out+='"> ';
$out+=$escape(c.name);
$out+=' <i class="fa fa-angle-right pull-right"></i> </a> </li> ';
});
$out+=' </ul> ';
}
$out+=' </li> ';
});
$out+=' </ul> </div> </nav> <div class="phone-navbar-default ';
$out+=$escape(isPhone && isShowContent?'':'hide');
$out+='" data-type="';
$out+=$escape(isShowContent);
$out+='"> <a href="#/faq">帮助中心</a> <span class="fa fa-angle-right"></span> <span class="fc-v2-grey"> ';
if(activeId && activeId.indexOf('faq/update')>-1){
$out+=' 版本更新内容V3.0 ';
}else if(activeId && activeId.indexOf('faq/org')>-1){
$out+=' 组织管理 ';
}else if(activeId && activeId.indexOf('faq/project')>-1){
$out+=' 项目管理 ';
}else if(activeId && activeId.indexOf('faq/financial')>-1){
$out+=' 财务管理 ';
}else if(activeId && activeId.indexOf('faq/version')>-1){
$out+=' 版本及空间购买 ';
}
$out+=' </span> </div> <div class="clearfix"></div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_org_1',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">创建组织</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;卯丁系统对于创建组织是开放式的，任何人都可以进行组织创建，对于实际使用的团队，建议由组织管理者进行组织创建，然后通过成员添加或者导入成员等操作配置卯丁系统中对应的组织架构及通讯录，避免组织管理上发生错乱。创建组织步骤： </p> <p> 1. 当首次使用注册卯丁账号并完成登入之后，若还没有加入任何组织，系统自动显示创建组织界面，如果已有组织，想再次创建一个则可以点击个人中心选择创建组织，如图1。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/1/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 点击第一步中创建组织，将进入组织创建界面，其中需要输入组织名称，其中组织名称可以通过关键字进行工商数据检索，通过工商数据选择的组织名称将不能进行更改。 选填完成界面中的相关信息点击创建即可，如图2、3。特别说明：组织创建者将默认赋予该组织的最高权限负责人，可以在权限管理中进行负责人移交。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/1/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/1/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_org_2',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">添加成员及部门</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;当已经完成组织创建或者加入团队之后，需要为组织进行组织架构的配置，组织架构配置需要有相应的组织管理权限才能进行，初始状态许由负责人（默认为组织创建者）进行组织管理的权限配置。当已经有了组织管理查看权限以及操作权限时，可以按照以下步骤配置组织架构。 </p> <p> 1. 当具有组织管理权限时，点击卯丁系统顶部组织名称后的后台管理按钮，进入后台管理面板，然后点击组织架构板块如图1，可以看到有相应组织管理菜单，其中创建分支机构/事业合伙人需要相对应的创建权限。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/2/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 逐个添加组织成员及部门，在组织架构管理板块中，点击添加成员或者添加部门，会弹出相应的添加窗口，只需要按照填写相应从部门信息或者成员信息即可完成添加。如图2。其中人员信息中岗位的设置用于人力成本（直接人工成本、管理人员工资 ）的分类统计。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/2/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 3. 批量导入，当需要添加的成员数量较多时，可以选择批量导入的方式，点击批量导入成员，下载导入的表格模板，按模板格式，输入组织通讯录信息，保存之后在批量导入上传表格模板即可一次性完成您的组织架构设置，如图3、4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/2/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/2/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 4. 当完成组织架构的配置之后。在系统中通讯录板块，将可以查看组织通讯录信息如图5。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/2/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_org_3',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">分支机构/事业合伙人的创建</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;在卯丁专业版及企业版的组织架构设置中，增加了创建分支机构/事业合伙人功能，以满足大中型、平台型设计企业的实际需求，企业总部可以对下属组织的组织架构管理权限进行限制，企业版还可以对下属组织的财务权限进行限制，卯丁把这种限制称为组织权限。卯丁系统把下属组织分为三类： </p> <p> 类型一：独立财务管理，可设置下属分支机构/事业合伙人；财务制度、审批流程、各类财务表单等基础设置由企业总部制定，财务管理的各项收支操作由其独立的财务部门或有权责任人进行操作。 </p> <p> 类型二：独立财务管理，不可设置下属分支机构/事业合伙人；财务制度、审批流程、各类财务表单等基础设置由企业总部制定，财务管理的各项收支操作由其独立的财务部门或有权责任人进行操作。 </p> <p> 类型三：非独立财务管理，不可设置下属分支机构/事业合伙人；财务制度、审批流程、各类财务表单等基础设置由企业总部制定，财务管理的各项操作由其企业总部的财务部门或有权责任人进行操作。包括企业收支的类别科目设置、费用报销的明细设置、基础财务数据设置，由企业总部统一管理与设置。 </p> <p>了解了分支机构/事业合伙人的权限类型之后，就可按照以下步骤进行分支机构/事业合伙人的创建。</p> <p> 1. 当具有创建分支机构/事业合伙人权限时，点击卯丁系统顶部组织名称后的后台管理按钮，进入后台管理面板，然后点击组织架构板块如图1，可以看到有相应组织管理菜单，其中可以看到有创建分支机构/事业合伙人两个菜单。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/3/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 点击创建分支机构或者创建事业合伙人，弹出创建面板如图2，首先选择上面介绍的三种类型进行选择，点击权限预览可以查看三种权限类型体系的相应权限。随后输入组织名称、负责人手机账号及姓名；其中组织名称可以通过关键字进行工商数据检索，如图3，使用工商数据检索的数据之后，组织名称将不能进行更改，负责人手机号账号将拥有该分支机构/事业合伙人的最高权限。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/3/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/3/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 3. 分支机构创建完成之后；相应的在组织架构中将会有相应的出现，不同类型的权限类型有不同的图标进行标识如图4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/3/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_org_4',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">权限配置</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;权限设置是指用户根据企业组织构架及职位体系，定义权限组别、添加对应角色成员，赋予角色相应权限的行为。需要指出的是卯丁系统根据设计企业的共性需求，内置了企业（组织）负责人、项目经营负责人、项目设计负责人三个角色，并于业务流程中直接赋予了相应权限。针对于专业版及企业版，卯丁在权限设置中开放了权限范围选择，企业可以针对某个角色对下属机构的某些查看权限及操作权限进行设定。 </p> <p> 卯丁将权限管理分为两大类： </p> <p> &nbsp;&nbsp;a. 功能操作级权限管理（即向系统提交数据，比如立项、删除订单、修改客户资料等）。 </p> <p> &nbsp;&nbsp;b. 数据查看级权限管理（即从系统获取数据，如资料、订单、统计报表等）。 </p> <P> 权限配置需要相应的配置权限，有了权限之后，按照以下步骤进行权限配置即可 </p> <p> 1. 进入组织后台管理界面，点击权限配置如图1。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/4/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 权限配置从创建分组开始，然后在分组内创建角色，如图2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/4/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 3. 角色创建成功之后，就可以在角色成员中进行添加人员如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/4/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 4. 添加角色成员之后，切换到功能权限中勾选相应的权限即可，在功能权限勾选中，可以勾选一个分组的所有权限，也可单个勾选，特别注意，权限分为查看权限和操作权限，查看权限只能进行相应数据的查看，操作权限则可以对数据编辑，设定操作权限时，需要同步设置相应的查看权限方能看到数据进行操作，如图4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/4/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 5. 在权限勾选面板中，有查看范围和操作范围两个栏目，因卯丁系统的专业版及企业版组织架构设置中有分公司、事业合伙人的概念。为了适应不同的组织机构对下属机构的管理，权限设置开放了自定义范围的选择，比如某个人只能查看哪个分支机构的相应内容，其余的不能进行操作或者查看，那么就可以在这里进行勾选，如图5。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/4/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_org_5',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">审批管理</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;卯丁系统现已开放了组织审批相关的数据配置，组织可根据实际的管理需求，新增或编辑审批表单，自行分组以及设置审批流程。卯丁系统内置了行政审批、财务审批、以及项目审批三个分组，行政审批内置了请假申请、出差申请、补卡申请，其中补卡申请为系统配合考勤打卡功能特设的审批，只能进行审批流程设置、排序及分组，不能进行表单编辑及删除。财务审批内置了费用申请以及报销申请，可自由编辑及删除；项目审批内置了付款审批以及任务验收审批，这两个审批都是配合系统的项目费用管理以及生产任务管理而设置的系统级审批，可进行审批流程设定，不能进行表单编辑或删除。整个审批管理主要包括审批流程设置、审批表单设置，以及其他设置。 </p> <p> 1. 审批流程设置，具有审批管理权限可点击后台管理，进入审批管理界面，如图1，点击审批中的审批人，可进行审批流程设置，如图2。审批流程分为自由流程，固定流程、分条件审批流程。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/5/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/5/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> &nbsp;&nbsp;a. 自由流程，发起审批时，发起人可以自由选择审批人，其中付款申请若设置为自由流程，发起付款时将不进入审批程序。 </p> <p> &nbsp;&nbsp;b. 固定流程可根据需要自由添加审批流程人员，如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/5/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> &nbsp;&nbsp;c. 分条件审批流程需要审批表单中有数字控件才能进行设置分条件审批。首先进行条件设定，如图4，在根据各条件进行审批人员的设定，如图5。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/5/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/5/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> <p> 2. 审批表单编辑，点击新增审批或者现有审批进行编辑时，会进入审批表单的编辑页面，如图6。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/5/6.jpg'));
$out+='" /> <p class="text-center">图6</p> </div> <p> &nbsp;&nbsp;a. 在右侧的表单属性中，可设置审批名称，审批分组，审批类型、以及图标设定，如图7。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/5/7.jpg'));
$out+='" /> <p class="text-center">图7</p> </div> <p> &nbsp;&nbsp;b. 表单编辑页面中，左侧为控件选择拖拽区，中间为表单预览区，右侧为表单属性以及控件属性编辑区域。从左侧控件选择区域将选中的控件拖入预览区，如图8。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/5/8.jpg'));
$out+='" /> <p class="text-center">图8</p> </div> <p> &nbsp;&nbsp;c. 其中预览区域可对控件进行拖拽排序，自由设定审批表单排序及控件。 </p> <p> &nbsp;&nbsp;d. 对控件进行属性的赋值；需要在中间预览区域选中相应的控件，然后在控件属性设定时会根据不同的控件类型设定不同的属性，比如多选框需要设定多选内容，数字控件可设定是否为财务类型的需要财务拨款操作等，如图9。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/5/9.jpg'));
$out+='" /> <p class="text-center">图9</p> </div> <p> &nbsp;&nbsp;e. 当表单变比完成之后，可进行相关预览，然后保存使用即可生效。 </p> <p> 3. 其他设定，审批管理中，可进行抄送人的初始化设定；右侧的审批管理操作区域还可对审批进行排序，分组移动以及开放管坯设定。 </p> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_org_6',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">考勤管理</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;卯丁系统中，开放了考勤管理，考勤功能需要在组织后台进行考勤设置，添加考勤打卡规则之后，则考勤功能将在APP中出现相应的功能模块，没有添加规则，该模块功能将不显示。 </p> <p> 考勤设置需要具有相应的管理权限才能操作，具体可以在权限配置中进行配置。 </p> <p> 1. 进入组织管理后台，选中考勤设置板块，如图1。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 点击上下班打卡的设置，进入考勤规则添加界面，如图2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 3. 点击添加规则或者对已有规则进行编辑，即可进入考勤规则设置，如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 4. 输入规则名称，选择规则类型，在上下班打卡中，有三种打卡规则可选，如图4。 </p> <p> &nbsp;&nbsp;a. 固定时间上下班：员工按照相同时间打卡，适合办公时间固定的上班族。 </p> <p> &nbsp;&nbsp;b. 按班次上下班：员工按照各自排班时间打卡，适合分早/晚班办公的企业或部门。 </p> <p> &nbsp;&nbsp;c. 自由上下班：员工无打卡时间限制，可随时打卡并记录工作时长，只统计旷工。适合上下班时间不固定的企业或部门。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 5. 添加打卡人员，打卡人员是指适用于该条打卡规则的部门和成员。可以根据工作性质和工作内容，对不同部门的成员设置适合他们的打卡规则。如需要“三班倒”的设备运维部门按班次上下班，而办公时间更灵活的销售部使用自由上下班等。领导或者特殊员工可在此通过配置白名单，不参与打卡，如图5。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> <p> 6. 设置打卡地点和范围，如图6。 </p> <p> &nbsp;&nbsp;a. 添加打卡位置，在地图中添加企业办公地点为打卡地点，以该地点为中心，100至300米范围内均可成为打卡有效范围，员工携带安装有卯丁APP的手机进入这个指定区域，即可用手机打卡。 </p> <p> &nbsp;&nbsp;b. WIFI打卡：添加办公地点的WIFI，员工手机连上此WIFI即可打卡。添加WIFI需提交WiFi的MAC地址/bssid，可向你的网络IT管理员询问。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/6.jpg'));
$out+='" /> <p class="text-center">图6</p> </div> <p> 7. 设置打卡时间，添加企业的上下班时间，你还可以在高级设置中设置允许迟到、早退的分钟数等，设计更人性化的打卡方式，如图7。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/7.jpg'));
$out+='" /> <p class="text-center">图7</p> </div> <p> 8. 设置打卡提醒，在新打卡方式的普及期间，有些员工可能会忘记打卡。为避免这种情况，你可以设置打卡提醒，在打卡时间准点或提前提醒员工打卡。设置方法：在【添加打卡规则页面】>【提醒】的下拉列表中，选择提醒时间。届时员工的卯丁APP将在指定时间收到打卡提醒，如图8。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/8.jpg'));
$out+='" /> <p class="text-center">图8</p> </div> <p> 9. 选择立即生效或明天生效之后进行保存，相应的打卡规则即已添加。在APP首页中将出现打卡功能，点击即可进入打卡页面，如图9。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/9.jpg'));
$out+='" /> <p class="text-center">图9</p> </div> <p> 10. 在规则生效之后，若打卡异常状态，比如忘记打卡，或者系统异常等情况，可在APP端进行补卡申请，进行补卡审批，如图10。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/10.jpg'));
$out+='" /> <p class="text-center">图10</p> </div> <p> 11. 具有相应权限的人员还可以在考勤设置界面查看相应的打卡统计数据，如图11。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/org/6/11.jpg'));
$out+='" /> <p class="text-center">图11</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_project_1',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">项目立项</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;卯丁系统现已对项目立项做了限制，只有具有立项权限的组织成员才能进行立项，同时立项时，开放代理立项功能，为方便项目的管理，开放了立项时间的设定。当具有立项权限时，可根据以下步骤进行立项： </p> <p> 1. 点击工作面板项目立项，设定项目归属组织，默认为本组织，同时可以设定下属组织，如图1。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/1/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 填写界面中的所需项目信息，包括项目类型、项目名称，立项时间（默认为当前时间），项目所在地以及项目甲方即可完成项目的立项。其中甲方信息可根据关键字进行公司工商数据检索。 </p> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_project_2',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">项目信息管理</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;当立项完成，便可对项目信息进行补充完善，项目信息的编辑操作需要有相应的权限，可进入权限配置中进行相关的人员的权限设定。项目信息的管理主要包括基本信息、专业信息、设计范围、以及合同信息等相关内容，其中合同信息包括合同附件以及项目/子项信息，该内容为单独的权限控制，浏览或者操作该内容需要另行设置相应的权限。 </p> <p> 1. 项目基本信息以及设计范围的设置： </p> <p> &nbsp;&nbsp;a. 项目基本信息如图1，其中立项组织及立项人为不可变更项。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/2/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> &nbsp;&nbsp;b. 功能分类及设计范围的设置可根据实际的项目情况，自定义添加或删除相应的功能分类信息，如图2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/2/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> &nbsp;&nbsp;c. 设定甲方信息时，在项目收支管理的收款计划中选择合同回款类型时，相应的付款方可以设定甲方的信息，如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/2/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> &nbsp;&nbsp;d. 设定乙方信息时，在项目收支管理的付款计划中选择技术审查费时，相应的收款方可以选择乙方的信息，如图4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/2/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 2. 项目专业信息的设置： </p> <p> &nbsp;&nbsp;a. 卯丁系统对于项目专业信息默认设置为建筑类型的专业属性信息，同时开放了对专业信息的自定义设置，可根据实际项目情况对专业属性以及属性单位进行自定义添加，如图5。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/2/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> <p> &nbsp;&nbsp;b. 专业信息的自定义添加并保存时，相应的属性将添加到组织的专业属性库中，当再次立项时，可从自定义属性库中进行勾选及删除，无需再次添加。特别说明：在下一次创建新的项目时，专业属性将默认设置为组织最近一次对某个项目编辑所勾选包括自定义的专业属性信息。 </p> <p> 3. 合同信息设置： </p> <p> &nbsp;&nbsp;a. 项目的合同信息包括合同附件信息以及项目/子项内容，需要有单独的查看及操作权限才能查看操作该部分内容，具体可在权限设置中进行权限配置如图6。合同附件只能上传pdf格式的文件。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/2/6.jpg'));
$out+='" /> <p class="text-center">图6</p> </div> <p> &nbsp;&nbsp;b. 项目/子项内容在之前的版本称为设计任务，当立项完成，系统将默认设置该项目名称为一个项目/子项。 </p> <p> &nbsp;&nbsp;c. 如果需要拆分项目，可在合同信息中或在任务订单中进行添加拆分或编辑，相应的，在任务订单中会根据项目/子项信息，进行相关项目信息、订单信息的同步。 </p> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_project_3',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">任务订单/生产安排管理</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;卯丁系统对于项目/子项信息进行分派给自己组织、或者分支机构/事业合伙人外部团队任务，将以任务订单的形式进行分发发布。 </p> <p> 1. 任务订单的管理首先需要设定经营负责人，项目初始创建时，系统将从具有项目订单管理权限的人员中自动指派一位经营负责人，当系统中没有设定该权限人员时，将默认为组织负责人。经营负责人可以根据实际项目管理工作进行经营负责人的移交，同时可根据实际的管理需求设定经营助理完成相关的任务订单管理工作，如图1。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/3/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 当经营负责人设定完成之后，即可开始对项目进行订单管理，系统中，任务订单需要创建在项目/子项中，任务订单的拆分可以批量添加也可以逐个添加，添加时可选择系统内置的常见的订单模板，或者选择自定义创建，如图2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/3/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 3. 当订单创建完成时，默认的设计组织为本组织，变更设计组织需要再订单发布前完成，发布完成之后将不能变更设计组织。 </p> <p> 4. 当订单发布给自己组织时，组织内便可对相关订单进行生产安排，当订单发布给合作组织时，合作组织接收到相关项目订单之后，在任务订单管理中，需要经营负责人再次对该订单进行拆分，以指定订单的设计组织并进行发布，才能进行后续的生产管理，如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/3/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 5. 当本组织接受到发布的任务订单时，系统将从具有生产安排管理权限的人员中自动指派一位设计负责人，当系统中没有设定该权限人员时，将默认为组织负责人。设计负责人可以根据实际项目管理工作进行设计负责人的移交，同时可根据实际的管理需求设定设计助理完成相关的生产任务管理工作，可参照经营负责人设定。 </p> <p> 6. 当设计负责人设定完成之后，即可开始对项目进行生产安排的管理，系统中，生产安排的任务需要在创建在任务订单中，生产任务的拆分可以批量添加剂也可逐个添加，添加时，如果订单为选择系统内置的订单模板，系统将将根据订单模板内容可选择常见的任务模板，或者选择自定义创建，如图4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/3/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 7. 任务拆分完成时，需要指定相应的任务负责人，任务负责人对该节点任务具有相应的管理权限，包括人员安排，时间进度安排，以及任务设计文件的校审流转、任务状态的流转以及提交验收等工作。 </p> <p> 8. 生产安排中，相关的人员设定，都将会通过卯丁秘书以及任务系统，对相关人员推送任务消息以及相关的项目任务。方便相关人员及时了解相关工作，具体可以在我的任务以及消息中心、APP端的卯丁秘书中进行查看，如图5 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/3/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> <p> 9. 生产安排及任务订单都可点击具体的任务查看相关任务详情，包括变更历史，审批，评论、以及子任务；生产安排中还可以进行设计文件的查看及上传及流转，如图6。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/3/6.jpg'));
$out+='" /> <p class="text-center">图6</p> </div> <p> 10. 当任务负责人完成任务之后可以对任务发起提交验收，上级任务负责人将对该任务进行审批校验。审批通过，则该任务便已完成；审批未通过时，该任务将重新变成进行中状态，负责人确认完成之后，可以再次发起提交验收。当所有任务都已完成时，设计负责人将接收到相关通知，如图7。 </p> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_project_4',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">项目收支管理</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;项目收支管理是卯丁企业版本才具有的功能，需要在权限设置中完成财务内容的的相关权限配置，未设置相关权限人员，系统将默认为财务相关的处理人为组织负责人。项目收支管理分为收款计划、付款计划，分别有合同回款、技术审查费、合作设计费以及其他收支四种类型。项目的收支管理数据，会汇总计算进入组织的整体财务管理数据中，其中收款计划确认到账之后将在利润报表中作为收入的数据来源，付款计划确认付款之后作为利润报表中的主营业务成本中的项目直接成本的数据来源。每一笔的收付款到账确认或者付款确认之后都将作为一条收支明细保存进入组织财务管理中的收支明细中。 </p> <p> 1. 项目收支管理将从制定项目财务计划开始，分为收款计划、付款计划，组织中具有项目管理的制定收付款计划的操作及浏览权限的成员均可制定项目的收付款计划，如图1。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/4/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 制定收款计划，选择费用类型，其中合同回款的付款组织可选择项目信息中的甲方。在付款计划中，技术审查费可选择项目信息中的乙方作为收款组织，合作设计费可以选择订单外发的合作设计组织作为收款组织，如图2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/4/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 3. 收付款计划制定之后，便可在计划中添加相应的款项节点信息，包括节点描述、金额、比例，如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/4/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 4. 节点信息添加完成，即可进行发起回款或付款申请，发起回款或付款申请都需要有相应的数据权限才能进行操作。收款计划发起回款时，可选择是否需要开票，开票可选择开票类型普票、专票，不同的开票类型，需要填写不同开票信息，如图4。当不需要开票时，财务人员将可直接进行到账的数据确认，需要开票时，财务人员需要先填写发票号码确认开票之后才能进入到账确认流程，如图5。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/4/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/4/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> <p> 5. 付款申请时，如果在审批管理对付款审批进行了审批流程的设置，如图6，则付款申请发起之后将进入审批阶段，如图7。如果审批管理中，付款申请选择自由流程，则付款申请将直接跳过审批阶段，直接进入财务的到付款操作流程。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/4/6.jpg'));
$out+='" /> <p class="text-center">图6</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/4/7.jpg'));
$out+='" /> <p class="text-center">图7</p> </div> <p> 6. 以上步骤都是由具有项目管理中制定收付款计划、发起回款、付款申请相应权限的项目管理人员才能进行操作。 </p> <p> 7. 当发起回款或付款申请通过审批之后，相关财务人员可根据实际的到付款数据，进行到账金额、时间以及付款金额、付款时间的确认操作。当财务人员完成一笔到账付款确认之后，相应的财务数据将流转进入组织财务管理的收支明细台账中，未确认的数据，将进入收支明细的应收、应付中。付款数据作为主营业务成本。到账数据作为业务收入，计入组织的利润报表中。便于组织完成项目成本核算、及经营数据的参考。财务数据的开票确认以及到付款确认都需要在权限设置中进行相应的配置才能完成相关的数据操作及查看。 </p> </div> </div> ';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_project_5',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">项目文档管理</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;项目收支管理是卯丁企业版本才具有的功能，需要在权限设置中完成财务内容的的相关权限配置，未设置相关权限人员，系统将默认为财务相关的处理人为组织负责人。项目收支管理分为收款计划、付款计划，分别有合同回款、技术审查费、合作设计费以及其他收支四种类型。项目的收支管理数据，会汇总计算进入组织的整体财务管理数据中，其中收款计划确认到账之后将在利润报表中作为收入的数据来源，付款计划确认付款之后作为利润报表中的主营业务成本中的项目直接成本的数据来源。每一笔的收付款到账确认或者付款确认之后都将作为一条收支明细保存进入组织财务管理中的收支明细中。 </p> <p> 1. 卯丁系统开放了项目文档的管理，对每一个项目都会创建一个项目文件夹，并在项目文件夹下内置设计依据、设计文件、交付文件三个子目录。这三个目录为系统创建，不可删除、编辑以及在同级目录中新建目录，进入子目录之后可进行文件夹创建以及文件的上传操作。其中设计文件目录中，将根据项目的订单任务结构及生产安排的任务结构创建相应的子目录结构，如图1。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/5/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 当设计文件目录中无法满足实际项目需求，可根据实际情况创建文件夹及上传文件，在项目文档的设计文件夹下，创建目录并不会生成相应的生产任务，但是在生产安排中，创建的子任务将会自动生成相应的设计文件文件夹。与生产同步的目录结构中。当上传文件时，在具体的生产任务详情的设计文件中将一一对应，并可进行文件流转，如图2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/5/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 3. 发起归档通知，当生产过程中，需要相关任务参与人员提交设计文件时，可在相应设计文件的订单任务目录中发起归档通知，通知相关人员上传文件。发送通知时，可选择通知人员、并设定上传文件所存放的文件目录。归档任务的任务名称将自动生成新的文件夹用于存放一次归档通知的文件，如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/project/5/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> </div> </div> ';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_update_1',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">权限配置</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;相比于2.0，卯丁3.0版本对权限设置进行了比较大的升级改版，开放了角色分组及角色的创建，分离查看权限，操作权限，权限属性进行点对点设置，针对专业版、企业版还开放了针对公司总部成员对下属机构的权限匹配。具体表现及对比如下： </p> <p> 1. 在2.0版本的权限体系中，角色名称及角色分组都是由卯丁系统内置，用户只能在相应的角色中添加成员，相应的权限也是由系统内置，如图1，而在新版3.0中对角色分组及角色名称进行开放管理设置，组织管理人员可根据实际的管理需求进行分组管理。创建角色添加相应的成员，并自由配置权限，如图2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/1/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/1/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 2. 在2.0版本的权限体系中，操作权限与查看权限没有区别设置，都是由卯丁系统内置，而在新版3.0中对数据操作权限和查看权限进行区别分隔，用户可以根据实际需要创建相应的角色，定制不同的数据查看权限和操作权限，特别注意:卯丁系统中操作权限及查看权限并不关联。赋予操作权限的同时，需要赋予查看权限才能查看数据并进行操作，如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/1/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 3. 在2.0版本的权限体系中，企业总公司并不能赋予总公司成员对分支机构/事业合伙人进行权限设置，在3.0版本的专业版及企业版中，权限设置放开了企业总部赋予总公司成员对分支机构/事业合伙人的权限设置。具体可以在权限配置中的权限表对查看范围、操作范围进行自定义设置即可，如图4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/1/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 4. 对于2.0版本中已经配置的权限。3.0版本将保留相应的数据同步，特别说明：2.0版本中的任务签发权限，在3.0中将变成经营负责人角色；生产安排权限，变成设计负责人角色，保持了原有权限点可操做的内容，用户可根据实际情况进行调整，仅仅只是变了角色名称，具体在默认的分组中可以查看，如图5。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/1/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_update_2',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">任务签发/生产安排</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;相比于2.0，卯丁3.0版本对任务签发板块进行了较大的升级改版，将设计任务更换为项目/子项，取消设计任务的直接发布，需要一次拆分才能发布；新增任务详情，任务的验收以及流程审批；新增生产任务的设计文件在具体任务中就可进行上传及流转。具体表现及对比如下： </p> <p> 1. 在2.0版本的任务签发中，项目经营负责人能够对设计任务进行直接发布，并进行生产，而在新版3.0中，设计任务将分属在项目/子项中,并且更名为任务订单，项目子项需要进行拆分为任务订单才能进行发布；在与原数据同步时已发布的设计任务将自动新拆分一个层级为原先的设计任务。未发布的设计任务不做自动拆分，如图1、2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/2/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/2/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 2. 3.0版本中还对项目/子项的进行了优化，新增批量拆分子订单便捷方式，同时内置了卯丁系统的几种常见订单模板。如果是内置的订单模板，在生产安排中批量添加时，将同步内置了常见的几种生产安排子任务模板，方便用户快速进行生产安排，同时生产安排的在界面上将按照订单分类展示，如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/2/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 3. 3.0版本中新增了项目子项以及生产任务的详情功能，该功能方便查看相应的变更历史，审批记录，并新增评论功能。生产任务详情中可以直接上传设计文件，并进行流转。文件将同步到项目文档中，如图4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/2/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_update_3',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">立项及项目信息</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;相比于2.0，卯丁3.0版本对立项及项目信息做了相应的调整，立项将新增权限限制，立项时新增代理立项功能，项目信息中功能范围增加自定义，原设计内容信息将于合同附件合并为合同信息，同时设计内容更名为项目/子项。具体对比如下： </p> <p> 1. 在2.0版本的项目立项开放给组织内所有的员工，出于企业管理的严谨性考虑，3.0版本新增了立项权限，只有组织内具有立项权限的人才能进行立项，如图1。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/3/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 2.0版本中立项时，设计任务作为必填信息。而在3.0版本中，立项取消了设计任务项，新增项目类型的必填，同时开放代理功能，企业组织成员将可以为分支机构/事业合伙人进行代理立项，同时开放立项时间的设定，如图2、3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/3/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/3/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 3. 项目信息中，2.0版本的功能分类只能选择卯丁系统内置的种类，3.0新版本开放了功能分类的自定义功能。用户可以根据实际的项目需求，自由设置，如图4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/3/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 4. 项目信息中的设计任务，3.0新版本中取消了设计任务的说法，项目信息相应的板块内容将变成合同信息，同时2.0版本中的设计任务更换为项目/子项，分属与合同信息板块，需要相应权限才能查看到该本快内容，如图5。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/3/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_update_4',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">财务数据</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;相比于2.0，卯丁3.0版本对财务板块进行了部分的优化调整，数据单位由万元变更为元，打断技术审查费，合作设计费的组织关联性，增加项目收支中的收付款计划概念，同时新增了薪酬管理、发票汇总数据具体表现及对比如下： </p> <p> 1. 单位，2.0版本数据单位为“万元”，3.0版本的财务数据单位将配置成“元”。 </p> <p> 2. 财务关联性，2.0版本中，技术审查费、合作设计费，会有相应的组织关联性，财务数据并不独立。在新本的3.0中，财务数据将完全打断关联，各组织的财务数据由各组织负责管理，数据的准确性和及时性将不再受制于其他组织。 </p> <p> 3. 在2.0版本中，项目资金的收支只是简单的制定，3.0版本中将多增加了项目管理的财务计划制定，项目收支管理首先制定收付款的计划，再在计划中进行资金节点添加及收付款的发起。原先的财务数据将统一成一个具体的计划中进行。并不改变数据，如图1、2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/4/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/4/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 4. 财务管理中将多配置了发票汇总板块以及工资薪酬两个管理板块。 </p> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_update_5',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">其他新增功能</h3> </div> <div class="col-sm-12 l-h-24"> <p> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;除了以上给予2.0版本已有功能的调整之外。3.0版本还新增了部分功能，具体有： </p> <p> 1. 审批管理由原先固定的报销、费用、请假、出差。3.0版本将开放审批的配置，可以进行审批的新增，删除。编辑审批表单，设置审批流程，如图1、2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/5/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/5/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 2. 2.0版本的审批功能多数集中APP端发起、并审批。最后又财务在web进行拨款操作；3.0版本中web端开放包括审批发起、审批操作等相关的所有审批数据，如图3、4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/5/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/5/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 3. 新增考勤功能，使用APP打卡功能，由web端在考勤设置设置好打卡规则之后，使用APP进行打卡考情管理，如图5。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/5/5.jpg'));
$out+='" /> <p class="text-center">图5</p> </div> <p> 4. 员工管理中将新增岗位字段设置，分选为管理人员和设计人员，将为后续项目成本管理结合薪酬管理对项目成本进行准确的成本核算打下基础，如图6。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/update/5/6.jpg'));
$out+='" /> <p class="text-center">图6</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_version_1',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">版本升级及空间购买方式</h3> </div> <div class="col-sm-12 l-h-24"> <p> 1. 目前卯丁系统版本升级及空间购买需要具有相应后台管理的控制台权限才能进行，如图1。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/version/1/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> <p> 2. 具有控制台管理权限者，点击组织后台管理，进入控制台管理面板，进行版本升级及空间购买，如图2。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/version/1/2.jpg'));
$out+='" /> <p class="text-center">图2</p> </div> <p> 3. 选择相应的购买类型，输入座位数量或者空间容量，点击提交订单，如图3。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/version/1/3.jpg'));
$out+='" /> <p class="text-center">图3</p> </div> <p> 4. 提交订单之后，在等待付款界面中，将出现相应的付款信息，目前卯丁仅支持对公转账，根据付款信息的账户信息完成支付，便可联系卯丁客服进行相应的版本开通，如图4。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/version/1/4.jpg'));
$out+='" /> <p class="text-center">图4</p> </div> <p> 5. 开通之后，请刷新界面或者退出重新登入，以便浏览器重新缓存您的相关权限。 </p> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_version_2',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">关于发票</h3> </div> <div class="col-sm-12 l-h-24"> <p> 1. 如果需要开具发票，在您完成支付之后，并且系统响应版本已经开通，在相关订单中进行开票申请，并填写相关开票信息，如图5，目前仅支持纸质发票。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/version/2/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_version_3',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">关于人员扩充及空间扩容</h3> </div> <div class="col-sm-12 l-h-24"> <p> 1. 人员扩充及空间扩容，将根据组织最近购买的有效截止时间，计算剩余时间并自动减免相应价格。例如，如图6，扩容10个名额，版本为企业版，单价为999元/年/人，有效截止时间2020/03/01，目前的下单时间为2019/04/08，则实际购买的时间为 327天，每天每人的单价为999/365 则实际支付价格为 10 × 327 ×（999/365） = 8949.94 。 </p> <div class="text-center"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/faq/version/3/1.jpg'));
$out+='" /> <p class="text-center">图1</p> </div> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/faq/m_website_faq_version_4','<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="text-center">版本升级了，板块没有显示</h3> </div> <div class="col-sm-12 l-h-24"> <p> 1. 当成功升级版本之后，相关功能板块有一些需要相关权限才能查看/操作,可在组织的后台设置中心进行相应账号的权限设置，设置完成之后，相关功能板块才能显示，不同的浏览器权限可能滞后，需要手动刷新页面，或者尝试重新登入账号。如依然不能显示，请联系我们。 </p> </div> </div>');/*v:1*/
template('m_website/pricing/m_website_pricing','<div class="m-website-pricing"> <section class="border-top u-shadow-v4"> <div class="container fc-dark-grey text-center p-h-xl m-b-md"> <div class="row p-b-100"> <div class="col-md-12">  <h3 class="f-s-xl-v1 m-t-md m-b-l">产品价格</h3> <p class="f-s-xl p-w-xs">用户根据企业之实际需求，制定相应的实施策略，选择合适的版本</p> </div> </div> </div> </section> <section> <div class="container fc-white text-center m-b-lg"> <div class="row"> <div class="col-md-4 p-w-m"> <div class="pricing-box pricing-hover u-shadow-v3" data-type="1"> <div class="title-box fc-white"> <h2 class="text-center f-s-xl m-t-none m-b">基础版</h2> <p class="f-s-xs p-w-lg">适用于小微设计组织</p> <p class="f-s-xs p-w-lg">组织通讯录、项目文档、轻量OA</p> </div> <div class="content-box"> <h1 class="fc-dark-blue border-bottom m-b-lg p-b-lg fw-bold">免费</h1> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c1" disabled checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">组织后台管理：</span> <span class="fc-v3-grey">考勤设置、权限设置、组织人员及部门管理、审批模板及流程设置。</span> </div> </div> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c2" disabled checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">项目管理：</span> <span class="fc-v3-grey">立项、项目信息编辑、项目文 档，合同信息管理。</span> </div> </div> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c3" disabled checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">财务管理：</span> <span class="fc-v3-grey">审批中的费用类型报表查看。</span> </div> </div> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c4" disabled checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">审批管理：</span> <span class="fc-v3-grey">内置报销、费用、出差、请假，同时可进行自定义审批。</span> </div> </div> </div> </div> </div> <div class="col-md-4 p-w-m"> <div class="pricing-box pricing-hover u-shadow-v3" data-type="2"> <div class="title-box fc-white"> <h2 class="text-center f-s-xl m-t-none m-b">专业版</h2> <p class="f-s-xs p-w-lg">适用于中小型设计组织</p> <p class="f-s-xs p-w-lg">基础版+任务订单管理、生产安排、跨组织合作</p> </div> <div class="content-box"> <h1 class="fc-dark-blue border-bottom m-b-lg p-b-lg fw-bold">¥ 666 <span class="f-s-xs fc-v3-grey">元/用户/年</span></h1> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c11" disabled checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">组织后台管理：</span> <span class="fc-v3-grey">基础版全部功能<span class="fc-dark-blue">，增加创建分支机构、事业合伙人，并分类设置权限</span>。</span> </div> </div> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c12" disabled checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">项目管理：</span> <span class="fc-v3-grey">基础版本的全部功能<span class="fc-dark-blue">，增加任务订单签发管理，生产安排管理，跨组织合作</span>。</span> </div> </div> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c13" disabled checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">财务管理：</span> <span class="fc-v3-grey">同基础版。</span> </div> </div> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c14" disabled checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">审批管理：</span> <span class="fc-v3-grey">基础版本的全部功能，增加项目收支计划审批，以及设计合同/协议审批功能。</span> </div> </div> </div> </div> </div> <div class="col-md-4 p-w-m"> <div class="pricing-box u-shadow-v3 active" data-type="3"> <div class="title-box fc-white"> <h2 class="text-center f-s-xl m-t-none m-b">企业版</h2> <p class="f-s-xs p-w-lg">适用于大中型设计组织</p> <p class="f-s-xs p-w-lg">专业版+企业财务管理、项目成本管控、薪酬管理</p> </div> <div class="content-box"> <h1 class="fc-dark-blue border-bottom m-b-lg p-b-lg fw-bold">¥ 999 <span class="f-s-xs fc-v3-grey">元/用户/年</span></h1> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c21" checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">组织后台管理：</span> <span class="fc-v3-grey">同专业版。</span> </div> </div> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c22" checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">项目管理：</span> <span class="fc-v3-grey">专业版的全部功能<span class="fc-dark-blue">，增加项目收支、工时管理、项目费控模块。</span>。</span> </div> </div> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c23" checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">财务管理：</span> <span class="fc-v3-grey"><span class="fc-dark-blue">增加企业财务管理、薪酬管理及相应的各类财务统计报表。</span></span></span> </div> </div> <div class="row"> <div class="col-xs-2"> <div class="i-checks dp-inline-block text-left m-t-xxs" > <input type="radio" name="c24" checked/> <label></label> </div> </div> <div class="col-xs-10 text-left no-padding"> <span class="fc-v2-grey">审批管理：</span> <span class="fc-v3-grey">同专业版。</span> </div> </div> </div> </div> </div> </div> <div class="row m-t-md"> <div class="col-md-12 fc-v2-grey text-left"> <p class="f-s-m"><i class="fa fa-exclamation-circle fc-dark-blue"></i>&nbsp;1、免费存储空间：5G/用户；外地用户预约时间上门服务，收取成本费。</p> <p class="f-s-m">&nbsp;&nbsp;&nbsp;&nbsp;2、使用过程中超过免费存储空间，超量存储部分按 元/GB的标准另行购买，10GB起购，联系电话0755-83235535。</p> </div> </div> </div> </section> </div> <script> $(\'.i-checks\').iCheck({ checkboxClass: \'icheckbox_square-green\', radioClass: \'iradio_square-green\' }); </script> ');/*v:1*/
template('m_website/products/m_website_products',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,banner=$data.banner,$out='';$out+='<div class="m-website-products"> <section class="index-banner pt-relative" > <img class="banner-img" src="';
$out+=$escape(_url('/img/website/products/'+banner));
$out+='" /> <div class="container fc-white text-center banner-content"> <div class="row"> <div class="col-md-12 banner-title"> <p><span>卯丁，服务建设工程行业，</span>做值得信任的设计管理服务平台。</p> </div> </div> </div> <div class="menu-bar"> <div class="menu-left"></div> <div class="menu-content"> <div class="content" data-type="1"> <h3><i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;&nbsp;基础版</h3> <p class="m-l-md">功能包括基本的组织管理，项目管理、轻量OA。</p> </div> <div class="content" data-type="2" style="display: none;"> <h3><i class="fa fa-circle fc-v5-grey"></i>&nbsp;&nbsp;专业版</h3> <p class="m-l-md">基础版全部功能，增加分支机构、事业合伙人，并分类设置权限；增加项目任务订单签发、生产安排；跨组织合作。</p> </div> <div class="content" data-type="3" style="display: none;"> <h3><i class="fa fa-circle fc-dark-blue"></i>&nbsp;&nbsp;企业版</h3> <p class="m-l-md">专业版全部功能，增加项目收支管理、工时管理，项目成本管控，轻量的薪酬体系管理及相应的各类财务统计报表。</p> </div> </div> <div class="menu-right"></div> <div class="clearfix"></div> <div class="text-center m-t"> <a href="javascript:void(0);" class="curp fc-dark-blue" data-action="menuSwitch" data-type="1"><span class="glyphicon glyphicon-minus"></span></a> <a href="javascript:void(0);" class="curp fc-white" data-action="menuSwitch" data-type="2"><span class="glyphicon glyphicon-minus"></span></a> <a href="javascript:void(0);" class="curp fc-white" data-action="menuSwitch" data-type="3"><span class="glyphicon glyphicon-minus"></span></a> </div> </div> </section> <section> <div class="container fc-white m-b-lg"> <div class="row products-out-box"> <div class="col-sm-3 no-padding"> <div class="row products-box" data-type="1" style="border-radius: 4px 0 0 0;" onclick="javascript:window.location.href=\'#/products/details/1\'"> <div class="col-xs-4 col-sm-12"> <div class="p-t-xl p-b-lg"><img class="products-icon" src="';
$out+=$escape(_url('/img/website/help/organization_small.png'));
$out+='" width="96"/></div> <h2 class="title-h2 m-t-n m-b-md fc-dark-grey fw-bold">组织管理</h2> </div> <div class="col-xs-8 col-sm-12"> <div class="row row-introduction m-t-xs fc-v2-grey f-s-md"> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;组织信息 </div> <div class="col-xs-7 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;组织构架 </div> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;权限设置 </div> <div class="col-xs-7 col-sm-12 p-b-xxl"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;审批管理 </div> </div> </div> </div> </div> <div class="col-sm-3 no-padding"> <div class="row products-box" data-type="1" onclick="javascript:window.location.href=\'#/products/details/2\'"> <div class="col-xs-4 col-sm-12"> <div class="p-t-xl p-b-lg"><img class="products-icon" src="';
$out+=$escape(_url('/img/website/help/project_small.png'));
$out+='" width="96"/></div> <h2 class="title-h2 m-t-n m-b-md fc-dark-grey fw-bold">项目管理</h2> </div> <div class="col-xs-8 col-sm-12"> <div class="row row-introduction m-t-xs fc-v2-grey f-s-md"> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;项目立项 </div> <div class="col-xs-7 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;项目文档 </div> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle fc-v5-grey"></i>&nbsp;任务订单 </div> <div class="col-xs-7 col-sm-12 m-b-md"> <i class="fa fa-circle fc-v5-grey"></i>&nbsp;生产安排 </div> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle fc-v5-grey"></i>&nbsp;外部合作 </div> <div class="col-xs-7 col-sm-12 m-b-md fc-v1-grey"> <i class="fa fa-circle fc-v6-grey"></i>&nbsp;企业网盘（开发中） </div> </div> </div> </div> </div> <div class="col-sm-3 no-padding"> <div class="row products-box" data-type="1" onclick="javascript:window.location.href=\'#/products/details/3\'"> <div class="col-xs-4 col-sm-12"> <div class="p-t-xl p-b-lg"><img class="products-icon" src="';
$out+=$escape(_url('/img/website/help/money_small.png'));
$out+='" width="96"/></div> <h2 class="title-h2 m-t-n m-b-md fc-dark-grey fw-bold">财务管理</h2> </div> <div class="col-xs-8 col-sm-12"> <div class="row row-introduction m-t-xs fc-v2-grey f-s-md"> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle fc-dark-blue"></i>&nbsp;收支明细 </div> <div class="col-xs-7 col-sm-12 m-b-md"> <i class="fa fa-circle fc-dark-blue"></i>&nbsp;分类统计 </div> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle fc-dark-blue"></i>&nbsp;利润报表 </div> <div class="col-xs-7 col-sm-12 m-b-md"> <i class="fa fa-circle fc-dark-blue"></i>&nbsp;人力成本 </div> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle fc-dark-blue"></i>&nbsp;管理费用 </div> <div class="col-xs-7 col-sm-12 m-b-md fc-v1-grey"> <i class="fa fa-circle fc-v6-grey"></i>&nbsp;项目费控（开发中） </div> </div> </div> </div> </div> <div class="col-sm-3 no-padding"> <div class="row products-box" data-type="1" style="border-radius: 0 4px 0 0;" onclick="javascript:window.location.href=\'#/products/details/4\'"> <div class="col-xs-4 col-sm-12"> <div class="p-t-xl p-b-lg"><img class="products-icon" src="';
$out+=$escape(_url('/img/website/help/mobile_small.png'));
$out+='" width="96"/></div> <h2 class="title-h2 m-t-n m-b-md fc-dark-grey fw-bold">移动办公</h2> </div> <div class="col-xs-8 col-sm-12"> <div class="row row-introduction m-t-xs fc-v2-grey f-s-md"> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;即时通讯 </div> <div class="col-xs-7 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;日程安排 </div> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;费用报销 </div> <div class="col-xs-7 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;请假出差 </div> <div class="col-xs-5 col-sm-12 m-b-md"> <i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;轻量任务 </div> <div class="col-xs-7 col-sm-12 m-b-md"> <i class="fa fa-circle fc-dark-blue"></i>&nbsp;工时管理 </div> </div> </div> </div> </div> <div id="moreDetails" class="col-sm-12 m-t-sm m-b-xl" style="padding-left: 35%;"><a href="#/products/details/1" class="btn btn-primary">更多详情&nbsp;&nbsp;<i class="fa fa-chevron-right"></i></a></div> </div> <div class="row fc-v2-grey text-left m-t-lg m-b-lg c-padding-15 f-s-m l-h-18" id="versionSimple"> <div class="col-sm-12 p-l-none"> <p><i class="fa fa-circle-o fc-dark-blue"></i>&nbsp;基础版，功能包括基本的组织管理，项目管理、轻量OA。</p> </div> <div class="col-sm-12 p-l-none"> <p><i class="fa fa-circle fc-v5-grey"></i>&nbsp;专业版，基础版全部功能，组织构架增加部门分类设置，建立部门授权体系；增加项目任务订单签发、生产安排；跨组织合作。 </p> </div> <div class="col-sm-12 p-l-none"> <p><i class="fa fa-circle fc-dark-blue"></i>&nbsp;企业版，专业版全部功能，增加项目收支管理、工时管理，项目成本管控，轻量的薪酬体系管理及相应的各类财务统计报表。</p> </div> </div> </div> </section> </div> ';
return new String($out);
});/*v:1*/
template('m_website/products/m_website_products_1',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row m-t-lg m-b-lg" data-show-type="1"> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_org_backstage.png'));
$out+='" data-action="preview" width="500" alt="组织后台管理"> </div> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-org-mgt"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>组织后台管理</h4> <p>组织架构、人员、部门的管理；权限设置、审批设置。考勤设置一网打尽。</p> </div> </div> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-mult-settings"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>多种设置</h4> <p>权限设置：创建不同角色，分配不同权限。</p> <p>审批设置：自由设置审批表单、审批流程，满足不同的审批需求。</p> <p>考情设置：规则多样，灵活。数据统计，清晰明了。</p> </div> </div> </div> </div> <div class="row m-t-lg m-b-lg" data-show-type="2"> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-project-info"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>项目信息管理</h4> <p>项目数据一目了然，列表字段自定义显示，多维度筛选，导出功能，方便二次处理。</p> </div> </div> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-personalized-customization"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>个性化属性专业字段</h4> <p>专业属性、设计范围，功能分类内置数据，亦可自定义，满足不同项目类型的需求。</p> </div> </div> </div> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_project_info.png'));
$out+='" data-action="preview" width="500" alt="项目信息管理"> </div> </div> <div class="row m-t-lg m-b-lg" data-show-type="1"> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_approval.png'));
$out+='" data-action="preview" width="500" alt="审批管理"> </div> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-approval-mgt"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>审批管理</h4> <p>行政、财务审批；快速完成，记录存储，方便追踪。统计数据多维筛选，数据清晰。</p> </div> </div> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-personalized-customization"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>个性定制</h4> <p>审批流程、审批模板个性化定制，满足不同的审批需求。</p> </div> </div> </div> </div> <div class="row m-t-lg m-b-lg" data-show-type="2"> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-project-doc"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>项目文档管理</h4> <p>不同项目，分类存储；目录固定，方便查找，成果提交，完成交付；多种格式，在线预览，云端存储，安全方便。</p> </div> </div> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-collaborate-production"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>与生产协同</h4> <p>与生产协同同步，化繁为简，高效合一。</p> </div> </div> </div> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_project_doc.png'));
$out+='" data-action="preview" width="500" alt="项目文档管理"> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/products/m_website_products_2',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row m-t-lg m-b-lg" data-show-type="1"> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_task_issue.png'));
$out+='" data-action="preview" width="500" alt="子项目/订单管理"> </div> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-task-issue"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>子项目/订单管理</h4> <p>内置订单模板，亦可自定义创建订单，可发布给合作组织进行生产安排。</p> </div> </div> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-internal-details"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>内部详情</h4> <p>详情信息、变更历史、审批记录、任务子项，多维度记录订单的生命周期、掌控订单进度，追踪状态。</p> </div> </div> </div> </div> <div class="row m-t-lg m-b-lg" data-show-type="2"> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-production"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>生产安排管理</h4> <p>人员安排、进度状态、时间追踪大表显示，全局掌控，批量添加子项，内置子项分类，可个性化添加，便捷操作，提升效率。</p> </div> </div> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-internal-details"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>详情丰富</h4> <p>详情信息、变更历史、审批记录、任务子项，交付文件多维度记录任务的生命周期、掌控任务进度，追踪状态。</p> </div> </div> </div> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_product.png'));
$out+='" data-action="preview" width="500" alt="生产安排管理"> </div> </div> <div class="row m-t-lg m-b-lg" data-show-type="1"> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_my_task.png'));
$out+='" data-action="preview" width="500" alt="我的任务管理"> </div> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-my-task-mgt"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>我的任务管理</h4> <p>个人任务表单，时间、状态筛选数据，把握当下，财务与生产分类，清晰明确。</p> </div> </div> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-history-search"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>历史数据查询</h4> <p>历史数据，自我评价，整理归纳，步步提升。</p> </div> </div> </div> </div> ';
return new String($out);
});/*v:1*/
template('m_website/products/m_website_products_3',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row m-t-lg m-b-lg" data-show-type="1"> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_payment.png'));
$out+='" data-action="preview" width="500" alt="组织后台管理"> </div> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-statistical-analysis"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>财务管理</h4> <p>利润报表：一年度为节点，分析经营状况。</p> <p>收支明细：每一笔收款、付款清晰记录，项目收支、财务审批拨款自动归结。</p> <p>发票汇总：清晰记录每一笔开票数据，多维查找筛选。</p> </div> </div> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-various-forms"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>形式多样</h4> <p>表格数据。柱状图、饼状图、曲线图多种数据形式，方便查看分析。</p> </div> </div> </div> </div> <div class="row m-t-lg m-b-lg" data-show-type="2"> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-income-expenditure-mgt"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>项目收支管理</h4> <p>以项目驱动的收支状况管理，收款计划、付款计划分类处理。数据自动回归公司整体的财务报表。发票数据自动汇总，方便查看。</p> </div> </div> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-collaborate-production"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>数据关联</h4> <p>项目的收支数据，自动关联组织整体财务数据，并形成报表。</p> </div> </div> </div> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_income_expenditure_mgt.png'));
$out+='" data-action="preview" width="500" alt="项目信息管理"> </div> </div> <div class="row m-t-lg m-b-lg" data-show-type="1"> <div class="col-sm-6"> <img class="img-fluid curp full-max-width" src="';
$out+=$escape(_url('/img/website/products/screen_salary.png'));
$out+='" data-action="preview" width="500" alt="组织后台管理"> </div> <div class="col-sm-6"> <div class="row m-t-md"> <div class="col-sm-2"><span class="ic-approval-mgt"></span></div> <div class="col-sm-10 p-t-xs p-r-xl p-l"> <h4>薪酬管理</h4> <p>薪资录入，自动计算。多维查询，数据自动汇总。</p> </div> </div> </div> </div> ';
return new String($out);
});/*v:1*/
template('m_website/products/m_website_products_details','<div class="m-website-products m-website-products-details"> <section class="border-top u-shadow-v4 height-10"></section> <section class="container p-t-xxl p-b-xxl m-b-md" id="productDetailsContent"> <div class="row"> <div class="col-md-2" id="leftMenu"> </div> <div class="col-md-10" id="rightContent"> </div> </div> </section> </div> ');/*v:1*/
template('m_website/products/m_website_products_details_1',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="fc-dark-grey fw-bold">组织管理</h3> <p class="fc-dark-grey fw-bold m-t m-b-none">支持快速创建多元化的企业组织构架，弹性的权限设置系统，适应不同规模的各类企业，支持跨组织项目合作设计。</p> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">01. 组织信息</h4> <p>组织信息包括组织logo ，组织名称，服务类型、联系电话、传真号码、电子邮箱以及组织简介等。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_org.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">02. 组织架构</h4> <p>支持各种组织体系，无论是传统的金字塔组织，还是阿米巴模式的平台型组织，或是混合型的组织模式，都可以在系统中快速建立。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_organization.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">03. 权限设置</h4> <p>权限设置包括个人权限设置和部门权限设置，权限包括数据查看权限、功能操作权限以及相应的数据查看、功能操作范围权限。 </p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_org_role.png'));
$out+='" /> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/products/m_website_products_details_2',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="fc-dark-grey fw-bold">项目管理</h3> <p class="fc-dark-grey fw-bold m-t m-b-none">基于项目PDCA闭环而展开的立项管理、任务签发、生产安排，进度管理、设校审、项目文档、交付成果管理等。</p> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">01. 项目立项</h4> <p>简单录入必要信息即可立项，可根据需要补充和完善项目基本信息，基本信息中，可自定义项目专业信息，以满足不同项目类型的需求。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_project_add.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">02. 任务订单/生产安排</h4> <p>设计负责人根据项目的任务内容、进度目标，签发任务订单，安排执行生产的组织、部门或邀请外部合作组织；根据任务订单的内容，制定具体的生产计划，包括人员安排，进度计划等。 </p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_project_task_issue.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">03. 经营管理</h4> <p>经营负责人根据与本项目相关的合同、协议，制定项目收支计划，根据项目进度，发起收款通知以及付款申请。 </p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_project_production.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">04. 设计、校对、审核</h4> <p>企业云盘客户端自动生成对应于生产安排任务的个人工作文件夹，并赋予不同的操作权限，通过该入口，完成设计，发起校审流程。</p> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">05. 项目文档</h4> <p>生产成果按预设时段模式、交付成果，由系统自动进行版本管理，实时归档各类设计成果，包括设计图纸、校审文件以及相关项目资料。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_project_documentation.png'));
$out+='" /> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/products/m_website_products_details_3',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="fc-dark-grey fw-bold">财务管理</h3> <p class="fc-dark-grey fw-bold m-t m-b-none">自动采集企业各项收支、费用、报销，由系统自动筛选、分类，实现经营管理、财务管理一体化，成本、费用、利润一目了然。 </p> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">01. 收支明细</h4> <p>灵活的筛选功能，快速查看各类收支明细，可以按照时间、按组织、按项目、按收支类别获取详细财务数据。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_finance_income_expenditure.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">02. 分类统计</h4> <p>在分类统计功能中，可以按照时间跨度，查看到收入和支出的汇总情况，不同类别的占比情况以及时间变化曲线。</p> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">03. 利润报表</h4> <p>让您对企业的经营状况一目了然。利润报表包括收入、主营业务税金及附加、主营业务成本（支出、直接人工成本）、主营业务利润、管理费用、财务费用、利润总额、所得税费用、净利润。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_finance_profit_report.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">04. 费用录入</h4> <p>用于录入必须的非系统产生的各类收支，主要是各类分摊费用，如物业费用分摊、资产购置费用分摊、管理费用分摊等。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_finance_cost_entry.png'));
$out+='" /> </div> </div> ';
return new String($out);
});/*v:1*/
template('m_website/products/m_website_products_details_4',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+='<div class="row"> <div class="col-sm-12 m-b-lg"> <h3 class="fc-dark-grey fw-bold">移动办公</h3> <p class="fc-dark-grey fw-bold m-t m-b-none">在线审批、日程管理、工时管理、轻量任务、即时通讯，各类信息的在线预览与快速查询。</p> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">01. 审批管理</h4> <p>包括行政审批和项目审批，行政审批包括费用报销和请假出差，项目审批包括立项审批、合同审批、提交校对、审核、审定等。 费用报销支持自定义报销费用类别，统一规范组织内部报销费用类型。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_mobile_approval.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">02. 日程管理</h4> <p>日历模式的日程安排与提醒， 快速创建会议，即时邀请参会人，参会人可确认是否参加会议，及时了解会议情况并提醒参加。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_mobile_schedule.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">03. 工时管理</h4> <p>项目成员根据参与项目情况，填写工时，实际工时数据用于支持项目成本控制。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_mobile_working_hours.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">04. 轻量任务</h4> <p>轻量任务是对项目管理的有效补充，它主要针对于行政类、临时类任务，采取点对点的方式，帮助您通过移动端轻松下达任务。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_mobile_lightweight_task.png'));
$out+='" /> </div> <div class="col-sm-12 l-h-24"> <h4 class="fc-dark-grey">05. 即时通讯</h4> <p>自动创建全员群、自定义各类群如：部门群、项目群等，即时沟通；项目信息、公司信息、客户信息在线预览与快速查询。</p> </div> <div class="col-sm-10"> <img class="img-preview full-max-width m-t m-b" src="';
$out+=$escape(_url('/img/website/products/screen_mobile_1.png'));
$out+='" /> </div> </div>';
return new String($out);
});/*v:1*/
template('m_website/products/m_website_products_details_menu',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,activeId=$data.activeId,$out='';$out+='<nav class="navbar-default navbar-content border" role="navigation" > <div class="sidebar-collapse"> <ul class="nav"> <li class="" data-id=""> <a class="nav-first-level" href="#/products"> <span class="nav-label"><i class="fa fa-long-arrow-left"></i>返回</span> </a> </li> <li class="active border-t-dashed" data-id="1"> <a class="nav-first-level p-l-35" href="#/products/details/1"> <span class="nav-label">组织管理</span> </a> </li> <li class="border-t-dashed" data-id="2"> <a class="nav-first-level p-l-35" href="#/products/details/2"> <span class="nav-label">项目管理</span> </a> </li> <li class="border-t-dashed" data-id="3"> <a class="nav-first-level p-l-35" href="#/products/details/3"> <span class="nav-label">财务管理</span> </a> </li> <li class="border-t-dashed" data-id="4"> <a class="nav-first-level p-l-35" href="#/products/details/4"> <span class="nav-label">移动办公</span> </a> </li> </ul> </div> </nav> <div class="phone-navbar-default"> <a href="#/products">产品介绍</a> <span class="fa fa-angle-right"></span> <span class="fc-v2-grey"> ';
if(activeId==1){
$out+=' 组织管理 ';
}else if(activeId==2){
$out+=' 项目管理 ';
}else if(activeId==3){
$out+=' 财务管理 ';
}else if(activeId==4){
$out+=' 移动办公 ';
}
$out+=' </span> </div> <div class="clearfix"></div>';
return new String($out);
});/*v:1*/
template('m_website/updateLog/m_website_update_log',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,banner=$data.banner,$out='';$out+='<div class="m-website-update-log bg-v5-grey" xmlns="http://www.w3.org/1999/html"> <section class="index-banner pt-relative"> <img class="banner-img" src="';
$out+=$escape(_url('/img/website/updateLog/'+banner));
$out+='" /> <div class="menu-bar"> <div class="container text-center"> <div class="row"> <div class="col-xs-6 menu-a active" data-type="1"> <a>网页版</a> </div> <div class="col-xs-6 menu-a" data-type="2"> <a>移动端</a> </div> </div> </div> </div> </section> <section class="container p-t-xxl p-b-xxl" data-type="1">                      <div class="row u-shadow-v1 bg-white p-h-xs m-b-sm"> <div class="col-xs-6"> <h3 class="f-s-xl-v1">web v3.3.122701</h3> </div> <div class="col-xs-6 text-right f-s-xl-v1 p-r-lg p-t-xs"> <span class="fc-v1-grey">2019/12/27</span>&nbsp;&nbsp; <a href="javascript:void(0);" class="" data-action="expand"><i class="fa fa-angle-up text-bold fc-v2-grey"></i></a> </div> <div class="col-xs-12 p-t-sm content" style="display: block;"> <span class="label label-info">优化</span> <div class="m-t"> <h4 class="title-line fc-dark-grey">后台管理：</h4> <p class="m-l-sm">审批管理 - 增加审批模版（立项审批/收支计划审批/合同审批/）</p> <p class="item-child">- 优化费用申请 修改为固定模版 且不可由用户进行编辑处理 （适用于“投标保证金、押金等”）</p> <p class="m-l-sm">权限配置 - 对应新增/删除/修改功能 的权限点处理</p> <p class="m-l-sm">项目模版 - 新增项目模版功能模块</p> <p class="item-child">- 新增项目设置</p> <p class="item-child">- 新增任务模版</p> <p class="item-child"> - 优化项目的生产流程、由集团集中配置，且配置深度可到专业级别</p> <h4 class="title-line fc-dark-grey">我的项目：</h4> <p class="m-l-sm">基本信息 - 优化专业信息，可由集团进行模版定义。</p> <p class="item-child">- 优化设计范围 可选数据内容</p> <p class="item-child">- 删除合同信息中的项目/子项</p> <p class="item-child">- 优化合同信息 （合同附件+合同签订时间）</p> <p class="m-l-sm">任务订单 - 优化任务订单 由可二次转包 修改为 不可二次转包</p> <p class="item-child">- 优化任务订单 由独立任务 优化为 阶段+专业</p> <p class="item-child">- 增加订单负责人</p> <p class="item-child">- 增加功能分类 如居住建筑/公寓</p> <p class="item-child">- 增加任务订单模版库功能（可由组织自行配置）</p> <p class="m-l-sm">生产安排 - 优化生产安排界面</p> <p class="item-child">- 优化生产安排中 流程的选择</p> <p class="item-child">- 优化生产安排中对应任务及任务状态的处理方式</p> <p class="item-child">- 修改负责人为处理人</p> <p class="item-child">- 优化任务状态的回朔</p> <p class="item-child">- 增题设计图纸的流转状态（如 设计中、校对中、审核中）</p> <p class="item-child">- 增加校审意见的处理状态（如 新、接受处理、已处理、已验收、关闭）</p> <p class="m-l-sm">收支管理 - 增加收支计划的审批</p> <p class="item-child">- 优化收付款计划对应的删除逻辑</p> <p class="item-child">- 优化组织内部之间的流转对于财务往来的流转</p> <h4 class="title-line fc-dark-grey">轻量任务：</h4> <p class="m-l-sm">轻量任务 - 增加轻量任务功能模块</p> <h4 class="title-line fc-dark-grey">我的任务：</h4> <p class="m-l-sm">我的任务 -优化我的任务已项目为单位</p> <p class="item-child">- 取消费用任务一说</p> <p class="item-child">- 增加我的任务 状态列表（待处理、已处理）</p> <p class="item-child">- 增加轻量任务 任务列表</p> <h4 class="title-line fc-dark-grey">财务管理：</h4> <p class="m-l-sm">财务管理 - 调整财务列表为 财务设置、工资薪酬、收支确认</p> <p class="item-child">- 新增收支类别设置中的【往来】项（投标保证金、押金、个人借款、备用金）</p> <p class="item-child">- 新增收支类别设置中的【协议收付款】项</p> <p class="item-child">- 新增收支类别设置中的展开首收起功能</p> <p class="item-child">- 优化开票汇总和开票确认在一个界面处理的问题</p> <p class="item-child">- 新增项目收款列表</p> <p class="item-child">- 新增项目付款列表</p> <p class="item-child">- 新增审批付款列表</p> <p class="item-child">- 新增费用收付款列表</p> <h4 class="title-line fc-dark-grey">财务报表：</h4> <p class="m-l-sm">财务报表 - 新增收支明细汇总、按账期及分类统计、按账期及部门统计、按分类及部门统计</p> <p class="item-child">- 新增项目收支功能模块</p> <p class="item-child">- 调整项目应收功能模块入口</p> <p class="item-child">- 调整项目应付功能模块入口</p> <p class="item-child">-调整利润报表功能模块入口</p> <p class="item-child">- 调整发票汇总功能入口</p> <h4 class="title-line fc-dark-grey">审批管理：</h4> <p class="m-l-sm">审批管理 - 新增审批类型</p> <p class="item-child">- 调整我的审批</p> <p class="item-child">- 新增审批报表</p> <p class="item-child">- 优化审批报表原有内容</p> <h4 class="title-line fc-dark-grey">项目文档：</h4> <p class="m-l-sm">项目文档 - 取消原有项目文档模块</p> <p class="item-child">- 新增卯丁云盘功能模块</p> <p class="item-child">- 新增卯丁云客户端功能模块</p> <p class="item-child">- 优化原有卯丁中文档文件的交互方式</p> <h4 class="title-line fc-dark-grey">通用功能：</h4> <p class="m-l-sm">通用功能 - 列表筛选条件的优化</p> </div> <span class="label label-danger inline m-t-sm">缺陷</span> <div class="m-t"> <p>修复已知bug</p> </div> </div> </div> <div class="row u-shadow-v1 bg-white p-h-xs m-b-sm"> <div class="col-xs-6"> <h3 class="f-s-xl-v1">web v3.1.090201</h3> </div> <div class="col-xs-6 text-right f-s-xl-v1 p-r-lg p-t-xs"> <span class="fc-v1-grey">2019/09/02</span>&nbsp;&nbsp; <a href="javascript:void(0);" class="" data-action="expand"><i class="fa fa-angle-down text-bold fc-v2-grey"></i></a> </div> <div class="col-xs-12 p-t-sm content" style="display: none;"> <span class="label label-info">优化</span> <div class="m-t"> <p>1.分支机构和事业合伙人转变成部门形态</p> <p>2.新增部门分组，自定义部门分类、部门权限设置</p> <p>3.多级部门负责人设置</p> <p>4.权限配置细分处理</p> <p>5.审批管理审批人/抄送人可设置单级/多级部门负责人</p> <p>6.优化财务管理筛选条件</p> </div> <span class="label label-danger inline m-t-sm">缺陷</span> <div class="m-t"> <p>修复已知bug</p> </div> </div> </div> </section> <section class="container p-t-xxl p-b-xxl" data-type="2" style="display: none;"> <div class="row u-shadow-v1 bg-white p-h-xs m-b-sm"> <div class="col-xs-6"> <h3 class="f-s-xl-v1">移动端 v3.3.122701</h3> </div> <div class="col-xs-6 text-right f-s-xl-v1 p-r-lg p-t-xs"> <span class="fc-v1-grey">2019/12/27</span>&nbsp;&nbsp; <a href="javascript:void(0);" class="" data-action="expand"><i class="fa fa-angle-up text-bold fc-v2-grey"></i></a> </div> <div class="col-xs-12 p-t-sm content" style="display: block;"> <span class="label label-info">优化</span> <div class="m-t"> <p>1.新增协同任务功能。</p> <p>2.费用申请增加核销。</p> <p>3.消息分类型处理。</p> <p>4.我的任务区分各种类型。</p> <p>5.新增财务管理功能，方便财务人员处理相应的任务。</p> <p>6.新增立项草稿功能。</p> <p>7.新增财务统计功能。</p> <p>8.优化审批筛选项。</p> <p>9.优化项目筛选项。</p> <p>10.优化项目中项目收支界面。</p> <p>11.优化项目生产安排界面。</p> <p>12.适配iOS13 。</p> <p>更多功能优化，欢迎使用体验</p> </div> <span class="label label-danger inline m-t-sm">缺陷</span> <div class="m-t"> <p>修复已知bug</p> </div> </div> </div> <div class="row u-shadow-v1 bg-white p-h-xs m-b-sm"> <div class="col-xs-6"> <h3 class="f-s-xl-v1">移动端 v3.2.090401</h3> </div> <div class="col-xs-6 text-right f-s-xl-v1 p-r-lg p-t-xs"> <span class="fc-v1-grey">2019/09/04</span>&nbsp;&nbsp; <a href="javascript:void(0);" class="" data-action="expand"><i class="fa fa-angle-down text-bold fc-v2-grey"></i></a> </div> <div class="col-xs-12 p-t-sm content" style="display: none;"> <span class="label label-info">优化</span> <div class="m-t"> <p>1.取消了APP中组织架构的创建及编辑</p> <p>2.取消首页收支明细、费用录入、发票汇总功能</p> <p>3.优化人员信息的编辑</p> <p>4.优化审批功能实现逻辑</p> <p>5.优化项目收支管理页面逻辑</p> </div> <span class="label label-danger inline m-t-sm">缺陷</span> <div class="m-t"> <p> 1.修复安卓系统7.0以上兼容性BUG</p> </div> </div> </div>                      </section> </div> ';
return new String($out);
});/*v:1*/
template('m_website/security/m_website_security',function($data,$filename
/**/) {
'use strict';var $utils=this,$helpers=$utils.$helpers,$escape=$utils.$escape,_url=$helpers._url,$out='';$out+=' <section class="pt-relative bg-cover bg-bluegray-opacity-0_3--after" style="background: url(';
$out+=$escape(_url('/img/website/security/bg.png'));
$out+=')"></div> <div class="container pt-relative text-center z-index-1 p-h-150"> <div class="row "> <div class="col-lg-12"> <div class="m-b-xs"> <h1 class="fc-white f-s-60 m-b-xs">安全保障</h1> <h2 class="fc-white f-s-xl m-b-none">全天候保障您的数据安全</h2> </div> </div> </div> </div> </section>   <section class="p-t-xxl m-t-xxl"> <div class="container">  <div class="text-center m-b-xxl"> <div class="dp-inline-block width-30 height-1 bg-primary"></div> <h2 class="fc-black fw-bold m-b-sm m-t-xs">基础安全保障</h2> <p class="f-s-lg m-auto">从四个方面打造系统基础安全保障体系，全方位确保运行安全.</p> </div>  <div class="">  <div class="row"> <div class="col-md-6 col-lg-3 m-b-lg">  <div class="text-center"> <span class="u-icon-v1 brd-style brd-7 brd-gray-light-v1 fc-dark-blue rounded-50x m-b-md p-t-lg"> <i class="icon-media-067 u-line-icon-pro"></i> </span> <h3 class="f-s-lg fc-black m-b-l">服务器安全保障</h3> <p class="fc-v2-grey m-b-none">云服务器虚拟技术防护，提供比普通服务器更高的可用性和抗灾能力。充分的灾备措施，保障客户数据不会丢失。</p> </div>  </div> <div class="col-md-6 col-lg-3 m-b-lg">  <div class="text-center"> <span class="u-icon-v1 brd-style brd-7 brd-gray-light-v1 fc-dark-blue rounded-50x m-b-md p-t-lg"> <i class="icon-electronics-020 u-line-icon-pro"></i> </span> <h3 class="f-s-lg fc-black m-b-l">系统安全措施</h3> <p class="fc-v2-grey m-b-none">通过控件升级、协议加密，将安全隐患拒于门外，确保系统7X24小时不间断运作。 为您提供可靠、稳定的服务。</p> </div>  </div> <div class="col-md-6 col-lg-3 m-b-lg">  <div class="text-center"> <span class="u-icon-v1 brd-style brd-7 brd-gray-light-v1 fc-dark-blue rounded-50x m-b-md p-t-lg"> <i class="icon-medical-004 u-line-icon-pro"></i> </span> <h3 class="f-s-lg fc-black m-b-l">业务安全监控</h3> <p class="fc-v2-grey m-b-none">实时发现业务漏洞并及时处置，杜绝高危隐患。严格的访问控制，配合企业独有的安全IP，确保日常使用安全。</p> </div>  </div> <div class="col-md-6 col-lg-3 m-b-lg">  <div class="text-center"> <span class="u-icon-v1 brd-style brd-7 brd-gray-light-v1 fc-dark-blue rounded-50x m-b-md p-t-lg"> <i class="icon-education-085 u-line-icon-pro"></i> </span> <h3 class="f-s-lg fc-black m-b-l">阿里云安全防护</h3> <p class="fc-v2-grey m-b-none">基于阿里云的云盾，为业务安全提供深入保障。底层隔绝高危入侵、DDos攻击，多角度全方位进行业务防护。</p> </div>  </div> </div>  </div> </div> </section>   <section class="p-t-xxl m-t-xxl"> <div class="container">  <div class="text-center m-b-xxl"> <div class="dp-inline-block width-30 height-1 bg-primary"></div> <h2 class="fc-black fw-bold m-b-sm m-t-xs">数据安全</h2> <p class="f-s-lg m-auto">第三方数据加密，彻底解决您的后顾之忧.</p> </div>  <div class="row m-b-xxl p-b-lg"> <div class="col-sm-6 col-md-3">  <article class="u-shadow-v3 pt-relative brd-bottom brd-3 brd-gray-light-v1 brd-primary--hover text-center rounded-5 transition-0_3 transition--linear">  <figure> <img class="full-width" src="';
$out+=$escape(_url('/img/website/security/ownership.png'));
$out+='" alt="数据所有权"> <figcaption class="fc-white bg-gray-opacity-0_7 fw-bold f-s-xs text-uppercase pt-absolute top-10 left-10 rounded-50 p-5-10">数据所有权</figcaption> </figure>   <div class="p-t-lg p-b-lg p-l-lg p-r-lg"> <p class="fc-v2-grey">数据所有权属于用户，卯丁不会将用户数据提供给任何第三方，全力保障客户数据的私密性与完整性。</p> <div class="js-rating fc-dark-blue f-s-xs" data-rating="4.5"></div> </div>  </article>  </div> <div class="col-sm-6 col-md-3">  <article class="u-shadow-v3 pt-relative brd-bottom brd-3 brd-gray-light-v1 brd-primary--hover text-center rounded-5 transition-0_3 transition--linear">  <figure> <img class="full-width" src="';
$out+=$escape(_url('/img/website/security/encrypt.png'));
$out+='" alt="数据加密传输"> <figcaption class="fc-white bg-gray-opacity-0_7 fw-bold f-s-xs text-uppercase pt-absolute top-10 left-10 rounded-50 p-5-10">数据加密传输</figcaption> </figure>   <div class="p-t-lg p-b-lg p-l-lg p-r-lg"> <p class="fc-v2-grey">采用https加密传输，SSL/TLS安全协议，确保数据访问均为加密状态。</p> <div class="js-rating fc-dark-blue f-s-xs" data-rating="4.5"></div> </div>  </article>  </div> <div class="col-sm-6 col-md-3">  <article class="u-shadow-v3 pt-relative brd-bottom brd-3 brd-gray-light-v1 brd-primary--hover text-center rounded-5 transition-0_3 transition--linear">  <figure> <img class="full-width" src="';
$out+=$escape(_url('/img/website/security/recover.png'));
$out+='" alt="数据备份/恢复"> <figcaption class="fc-white bg-gray-opacity-0_7 fw-bold f-s-xs text-uppercase pt-absolute top-10 left-10 rounded-50 p-5-10">数据备份/恢复</figcaption> </figure>   <div class="p-t-lg p-b-lg p-l-lg p-r-lg"> <p class="fc-v2-grey">多级加密，确保业务数据互相隔离。异地备份，分布式存储，支持快速恢复。</p> <div class="js-rating fc-dark-blue f-s-xs" data-rating="4.5"></div> </div>  </article>  </div> <div class="col-sm-6 col-md-3">  <article class="u-shadow-v3 pt-relative brd-bottom brd-3 brd-gray-light-v1 brd-primary--hover text-center rounded-5 transition-0_3 transition--linear">  <figure> <img class="full-width" src="';
$out+=$escape(_url('/img/website/security/data_monitor.png'));
$out+='" alt="数据监控"> <figcaption class="fc-white bg-gray-opacity-0_7 fw-bold f-s-xs text-uppercase pt-absolute top-10 left-10 rounded-50 p-5-10">数据监控</figcaption> </figure>   <div class="p-t-lg p-b-lg p-l-lg p-r-lg"> <p class="fc-v2-grey">对高危操作行为进行监控，实时发现异常并告警，避免数据泄漏、篡改等情况。</p> <div class="js-rating fc-dark-blue f-s-xs" data-rating="4.5"></div> </div>  </article>  </div> </div> </div> </section> ';
return new String($out);
});/*v:1*/
template('m_website/terms/m_website_terms',' <section class="brd-bottom brd-gray-light-v1"> <div class="container p-h-100"> <div class="row"> <div class="col-lg-12 l-h-24"> <div class="dp-inline-block width-60 height-4 bg-black m-b-xs"></div> <h2 class="fc-black fw-bold f-s-40 m-b-xs">卯丁用户服务协议</h2> <p class="m-b-none" style="text-indent: 2em;">“卯丁”平台（以下简称"本平台"）系深圳市卯丁技术有限公司（以下简称"卯丁"） 开发、研制的为企业提供项目管理协同服务的网络技术服务平台。卯丁依据《卯丁用户服 务协议》（以下简称"本协议"）的规定提供服务，本协议具有合同效力。用户注册卯丁 时，请您认真阅读本协议，若您已经注册卯丁成为本平台用户，即表示您已充分阅读、理 解并同意自己与本平台订立本协议，且自愿受本协议的条款约束。</p> <p class="m-b-none" style="text-indent: 2em;"> 卯丁此特别提醒用户：本协议为您使用平台服务时所应遵守的各项规定，在本协议中 明确了您可以和不可以利用平台服务所进行的各项行动，作为企业用户，您应同意本协议 中的各个条款，方可享受服务，并应督促您企业所属员工在接受卯丁提供的服务时遵守本 服务协议之规定。 </p> </div> </div> </div> </section>   <section class="container p-h-xl"> <div class="m-b-xxl l-h-24"> <h4 class="fc-black fw-bold m-b-xs">知识产权</h4> <div class="m-b-xs"> <p><span class="fw-bold">1、</span> 本平台所有产品、技术、软件、程序、数据及其他信息（包括但不限于文字、图像、 图片、照片、音频、视频、图表、色彩、版面设计、电子文档）的所有知识产权（包括但 不限于版权、商标权、专利权、商业秘密等）及相关权利均归属卯丁所有。除非取得卯丁 书面授权，对于上述权利您不得（并不得允许任何第三人）实施包括但不限于出租、出 借、出售、散布、复制、修改、转载、汇编、发表、出版、还原工程、反向汇编、反向编 译，或以其它方式获取原代码等行为。</p> </div> </div> <div class="m-b-xxl l-h-24"> <h4 class="fc-black fw-bold m-b-xs">数据归属权</h4> <p><span class="fw-bold">1、</span>用户在本平台创建的数据归属用户企业所有，在服务期内企业用户有权进行任何形 式的处置，包括从平台中复制，导出和删除。</p> <p><span class="fw-bold">2、</span>根据合同相关约定，当卯丁与企业用户终止服务关系并且超出合同约定的数据导出 期限，卯丁将视同用户对其授权和其数据进行清除。</p> </div> <div class="m-b-xxl l-h-24"> <h4 class="fc-black fw-bold m-b-xs">用户使用约定</h4> <p><span class="fw-bold">1、</span>用户不得利用本平台服务进行任何违法或不当的活动，包括但不限于下列行为:</p> <ul class="m-l-xl"> <li class="m-b-xs"> a) 反对宪法所确定的基本原则的； </li> <li class="m-b-xs"> b) 危害国家安全，泄露国家秘密，颠覆国家政权，破坏国家统一的； </li> <li class="m-b-xs"> c) 损害国家荣誉和利益的； </li> <li class="m-b-xs"> d) 煽动民族仇恨、民族歧视、破坏民族团结的； </li> <li class="m-b-xs"> e) 破坏国家宗教政策，宣扬邪教和封建迷信的； </li> <li class="m-b-xs"> f) 散布谣言，扰乱社会秩序，破坏社会稳定的； </li> <li class="m-b-xs"> g) 散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的； </li> <li class="m-b-xs"> h) 侮辱或者诽谤他人，侵害他人合法权利的； </li> <li class="m-b-xs"> i) 含有虚假、诈骗、有害、胁迫、侵害他人隐私、骚扰、侵害、中伤、粗俗、猥亵、或其它道德上令人反感的内容； </li> <li class="m-b-xs"> j) 含有中国法律、法规、规章、条例以及任何具有法律效力之规范所限制或禁止的其它内容的； </li> </ul> <p><span class="fw-bold">2、</span>用户不得进行任何侵犯本网络服务平台或其要素作品的知识产权的行为，或者进行其他的有损于卯丁或其他用户合法权益的行为，包括但不限于：</p> <ul class="m-l-xl"> <li class="m-b-xs"> a)删除或修改本网络服务平台上的版权信息，或者伪造 ICP/IP 地址或者数据包的名称； </li> <li class="m-b-xs"> b)进行编译、反编译、反向工程或者以其他方式破解本网络服务平台的行为； </li> <li class="m-b-xs"> c)进行任何破坏本网络服务平台使用公平性或者其他影响其正常使用秩序的行为，如利 用 BUG（又叫“漏洞”或者“缺陷”）来获得不正当的非法利益； </li> <li class="m-b-xs"> d)利用技术非法侵入、破坏本网络服务平台之服务器系统，或者修改、增加、删除、窃 取、截留、替换本网络服务平台之客户端和/或服务器系统中的数据，或者非法挤占本网络 服务平台之服务器空间，或者实施其他的使之超负荷运行的行为； </li> <li class="m-b-xs"> e)利用本网络服务平台故意传播恶意程序或计算机病毒，或者利用本网络服务平台发 表、转发、传播侵犯第三方知识产权、肖像权、姓名权、名誉权、隐私或其他合法权益的 文字、图片、照片、程序、视频和/或动画等资料； </li> <li class="m-b-xs"> f)通过本平台进行垃圾信息发送（本协议所指垃圾短信定义为用户使用本平台功能对陌 生客户及不同意接收信息的客户、人员进行短信发送等行为） </li> </ul> </div> <div class="m-b-xxl l-h-24"> <h4 class="fc-black fw-bold m-b-xs">隐私政策</h4> <p><span class="fw-bold">1、</span>您在本平台注册的账户具有密码保护功能，以确保您基本信息资料的安全，请您妥善保管账户及密码信息。</p> <p><span class="fw-bold">2、</span>卯丁努力采取各种合理的物理、电子和管理方面的安全措施来保护您的信息，使您 存储在本平台中的信息和通信内容不会被泄漏、毁损或者丢失，卯丁将在任何时候尽力做 到使您的信息不被泄漏、毁损或丢失， 但同时也请您注意在信息网络上不存在绝对完善的 安全措施，请妥善保管好相关信息。</p> <p><span class="fw-bold">3、</span>卯丁负有保护与用户有关的资料、数据、作品或其他资料的义务，但因下列原因而披露给第三方的除外：</p> <ul class="m-l-xl"> <li class="m-b-xs"> a)基于国家法律法规的规定而对外披露； </li> <li class="m-b-xs"> b)应国家司法机关及其他有关机关基于法定程序的要求而披露； </li> <li class="m-b-xs"> c)为保护卯丁、合作单位或您的合法权益而披露； </li> <li class="m-b-xs"> d)在紧急情况，为保护其他用户及第三人人身安全而披露； </li> <li class="m-b-xs"> e)经用户本人同意或应用户的要求而披露。 </li> </ul> <p><span class="fw-bold">4、</span>卯丁保留使用汇总统计性信息的权利，并且完全通过匿名统计方式，并且不是针对特定用户分析。</p> </div> <div class="m-b-xxl l-h-24"> <h4 class="fc-black fw-bold m-b-xs">使用限制</h4> <p><span class="fw-bold">1、</span>用户如有本协议第 3 条所列行为之一的，卯丁有权采取下列措施当中的一种或几种并无需通知用户：</p> <ul class="m-l-xl"> <li class="m-b-xs"> a)断开用户当前使用的计算机与本网络服务平台服务器之间的网络连接； </li> <li class="m-b-xs"> b)暂时禁止用户凭借当前使用的网络服务平台服务帐号享有服务； </li> <li class="m-b-xs"> c)禁止用户使用本网络服务平台当中某一要求付费的功能，直至清偿所欠费用并为继续使用上述付费功能而预先支付相应的费用之日止； </li> <li class="m-b-xs"> d)采取上列措施之外的其他的措施。 </li> </ul> <p><span class="fw-bold">2、</span>用户给客户发送垃圾短信，经电信运营商或其他监督部门查实的，卯丁将视情况给 予违规用户年服务费 1 倍至 5 倍标准的违约罚款。</p> <p><span class="fw-bold">3、</span>用户发送垃圾短信给卯丁造成的运维损失，如通信平台停用，行政主管部门对平台 的行政处罚或其他正常用户因平台停用申请的损失赔偿等，由违规用户承担。</p> </div> <div class="m-b-xxl l-h-24"> <h4 class="fc-black fw-bold m-b-xs">不可抗力</h4> <p><span class="fw-bold">1、</span>卯丁有权对本合约的条款进行修订并在修订生效日前一个工作日将更新公开公布在 卯丁网站【www.imaoding.com】。</p> <p><span class="fw-bold">2、</span>本《协议》各条款是可分的，所约定的任何条款如果部分或者全部无效，不影响该 条款其他部分及本协议其他条款的法律效力。</p> <p><span class="fw-bold">3、</span>本协议各条款的标题只是为了方便用户阅读而起到提示、醒目的作用，对本协议的 解释及适用没有任何指引作用。</p> <p><span class="fw-bold">4、</span>卯丁基于本协议及其补充协议的有效的弃权必须是书面的，并且该弃权不能产生连 带的相同或者类似的弃权。</p> <p><span class="fw-bold">5、</span>用户与卯丁因本协议或其补充协议所涉及的有关事宜发生争议或者纠纷，双方可以 友好协商解决；协商不成的，任何一方均可以将其提交原告方所在地有管辖权的人民法院 诉讼解决。</p> <p><span class="fw-bold">6、</span>本协议及其补充协议签订地为深圳市，均受中华人民共和国法律、法规管辖。</p> </div> <div class="m-b-xxl l-h-24"> <p>《“卯丁”平台用户服务协议》所述内容已经全部浏览及阅读，本公司承诺按照深圳 市卯丁技术有限公司公开发布的《“卯丁”平台用户服务协议》规定的内容使用“卯丁” 平台提供的服务。</p> </div> </section> ');/*v:1*/
template('m_website/tutorial/m_website_tutorial','<div class="m-website-tutorial"> <section class="border-top u-shadow-v4"> <div class="container p-h-m"> <div class="col-xs-4 text-center"> <a class="version-title active" data-type="1"><i class="ic-base-version"></i><span class="vertical-super fc-v2-grey m-l-sm f-s-m">基础版</span></a> </div> <div class="col-xs-4 text-center"> <a class="version-title" data-type="2"><i class="ic-professional-version"></i><span class="vertical-super fc-v2-grey m-l-sm f-s-m">专业版</span></a> </div> <div class="col-xs-4 text-center"> <a class="version-title" data-type="3"><i class="ic-enterprise-version"></i><span class="vertical-super fc-v2-grey m-l-sm f-s-m">企业版</span></a> </div> <div class="clearfix"></div> </div> </section> <section class="brd-t brd-gray-light-v2"> <div class="container p-t-lg p-b-lg" id="contentInfo"> </div> </section> </div> ');/*v:1*/
template('m_website/tutorial/m_website_tutorial_1','<h4 class="border-bottom p-b-sm f-s-md"><span class="brd-bottom brd-3 brd-dark-blue-v1 p-b-xs">组织后台管理教程</span></h4> <div class="row m-t-lg"> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">部门管理、人员管理</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">信息/架构/人员</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">部门管理、人员管理</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">权限配置教程（基础版）</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">角色/查看权限/操作权限</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">权限配置教程（基础版）</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">审批模板教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">模板/流程</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">审批模板教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">考勤设置教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">打卡设置/统计</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">考勤设置教程</p> </div> </div> </div> </div> <h4 class="border-bottom p-b-sm f-s-md m-t-xxl"><span class="brd-bottom brd-3 brd-dark-blue-v1 p-b-xs">项目管理教程</span></h4> <div class="row m-t-lg"> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg2"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>项目管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">立项及项目信息管理教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">基本信息/自定义</span> </div> <div class="text-center fc-v2-grey"> <P>项目管理教程</P> <p class="fw-bold f-s-xl">立项及项目信息管理教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg2"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>项目管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">项目文档教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">结构/交付/预览</span> </div> <div class="text-center fc-v2-grey"> <P>项目管理教程</P> <p class="fw-bold f-s-xl">项目文档教程</p> </div> </div> </div> </div>');/*v:1*/
template('m_website/tutorial/m_website_tutorial_2','<h4 class="border-bottom p-b-sm f-s-md"><span class="brd-bottom brd-3 brd-dark-blue-v1 p-b-xs">组织后台管理教程</span></h4> <div class="row m-t-lg"> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">部门管理、人员管理</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">信息/架构/人员</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">部门管理、人员管理</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">权限配置教程（专业版）</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">角色/查看权限/操作权限</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">权限配置教程（专业版）</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">审批模板教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">模板/流程</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">审批模板教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">考勤设置教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">打卡设置/统计</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">考勤设置教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">分公司管理（专业版）</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">创建/权限类型</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">分公司管理（专业版）</p> </div> </div> </div> </div> <h4 class="border-bottom p-b-sm f-s-md m-t-xxl"><span class="brd-bottom brd-3 brd-dark-blue-v1 p-b-xs">项目管理教程</span></h4> <div class="row m-t-lg"> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg2"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>项目管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">立项及项目信息管理教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">基本信息/自定义</span> </div> <div class="text-center fc-v2-grey"> <P>项目管理教程</P> <p class="fw-bold f-s-xl">立项及项目信息管理教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg2"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>项目管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">项目文档教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">结构/交付/预览</span> </div> <div class="text-center fc-v2-grey"> <P>项目管理教程</P> <p class="fw-bold f-s-xl">项目文档教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg2"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>项目管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">分派订单及生产安排教程（专业版）</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">任务订单/生产任务</span> </div> <div class="text-center fc-v2-grey"> <P>项目管理教程</P> <p class="fw-bold f-s-xl">分派订单及生产安排教程（专业版）</p> </div> </div> </div> </div> ');/*v:1*/
template('m_website/tutorial/m_website_tutorial_3','<h4 class="border-bottom p-b-sm f-s-md"><span class="brd-bottom brd-3 brd-dark-blue-v1 p-b-xs">组织后台管理教程</span></h4> <div class="row m-t-lg"> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">部门管理、人员管理</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">信息/架构/人员</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">部门管理、人员管理</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">权限配置教程（企业版）</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">角色/查看权限/操作权限</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">权限配置教程（企业版）</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">审批模板教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">模板/流程</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">审批模板教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">考勤设置教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">打卡设置/统计</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">考勤设置教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>组织后台管理</h4> <span class="tutorial-title"><span class="vertical-sub">分公司管理（企业版）</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">创建/权限类型</span> </div> <div class="text-center fc-v2-grey"> <P>组织后台管理</P> <p class="fw-bold f-s-xl">分公司管理（企业版）</p> </div> </div> </div> </div> <h4 class="border-bottom p-b-sm f-s-md m-t-xxl"><span class="brd-bottom brd-3 brd-dark-blue-v1 p-b-xs">项目管理教程</span></h4> <div class="row m-t-lg"> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg3"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>项目管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">立项及项目信息管理教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">基本信息/自定义</span> </div> <div class="text-center fc-v2-grey"> <P>项目管理教程</P> <p class="fw-bold f-s-xl">立项及项目信息管理教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg2"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>项目管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">项目文档教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">结构/交付/预览</span> </div> <div class="text-center fc-v2-grey"> <P>项目管理教程</P> <p class="fw-bold f-s-xl">项目文档教程</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg2"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>项目管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">分派订单及生产安排教程（企业版）</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">任务订单/生产任务</span> </div> <div class="text-center fc-v2-grey"> <P>项目管理教程</P> <p class="fw-bold f-s-xl">分派订单及生产安排教程（企业版）</p> </div> </div> </div> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg2"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>项目管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">项目收支管理教程（企业版）</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">基本信息/自定义</span> </div> <div class="text-center fc-v2-grey"> <P>项目管理教程</P> <p class="fw-bold f-s-xl">项目收支管理教程（企业版）</p> </div> </div> </div> </div> <h4 class="border-bottom p-b-sm f-s-md m-t-xxl"><span class="brd-bottom brd-3 brd-dark-blue-v1 p-b-xs">财务管理教程</span></h4> <div class="row m-t-lg"> <div class="col-sm-4 m-b-xxl"> <div class="tutorial-box border u-shadow-v3 p-sm"> <div class="tutorial-info-box p-w-sm fc-white t-bg1"> <h4 class="p-h-sm"><i class="fa fa-circle m-r-xs"></i>财务管理教程</h4> <span class="tutorial-title"><span class="vertical-sub">完整财务管理教程</span></span> <span class="dp-block m-t-md m-b-md p-h-sm">明细/报表/汇总</span> </div> <div class="text-center fc-v2-grey"> <P>财务管理教程</P> <p class="fw-bold f-s-xl">完整财务管理教程</p> </div> </div> </div> </div>');

}()