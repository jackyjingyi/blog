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
