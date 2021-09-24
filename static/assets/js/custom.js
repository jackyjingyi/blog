/* Write here your custom javascript codes */

/*阻止默认事件*/
var preventDefault = function (event) {
    if (event.preventDefault) {
        event.preventDefault();
    } else {
        event.returnValue = false;
    }
};

/*阻止冒泡*/
var stopPropagation = function (event) {
    if (event.stopPropagation) {
        event.stopPropagation();
    } else {
        event.cancelBubble = true;
    }
};

/*短格式时间
 * 1：00
 * 2：00
 * */
var shortTime = function (datetime) {
    return moment(datetime).format("HH:mm");
};


/*格式化日期
 * 今天 1：00
 * 昨天 2：00
 * 2017-01-01 2：00
 * */
var dateSpecFormat = function (datetime, pattern) {
    var now = moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
    var yesterday = moment(new Date(), 'YYYY-MM-DD HH:mm:ss').subtract(1, 'days');
    var d = moment(moment(datetime).toDate(), 'YYYY-MM-DD HH:mm:ss');

    var nowFormat = now.format('YYYY-MM-DD');
    var yesterdayFormat = yesterday.format('YYYY-MM-DD');
    var dFormat = d.format('YYYY-MM-DD');

    var t1 = '';
    if (nowFormat == dFormat)
        t1 = '今天';
    else if (yesterdayFormat == dFormat)
        t1 = '昨天';
    else
        t1 = dFormat;

    if (pattern && !_.isBlank(pattern))
        return _.sprintf(pattern, t1, d.format('HH:mm'));

    return _.sprintf('%s %s', t1, d.format('HH:mm'));
};

/*格式化日期
 * 今天
 * 昨天
 * 2017-01-01
 * */
var dateSpecShortFormat = function (datetime) {
    var now = moment(new Date(), 'YYYY-MM-DD HH:mm:ss');
    var yesterday = moment(new Date(), 'YYYY-MM-DD HH:mm:ss').subtract(1, 'days');
    var d = moment(moment(datetime).toDate(), 'YYYY-MM-DD HH:mm:ss');

    var nowFormat = now.format('YYYY-MM-DD');
    var yesterdayFormat = yesterday.format('YYYY-MM-DD');
    var dFormat = d.format('YYYY-MM-DD');

    var t1 = '';
    if (nowFormat == dFormat)
        t1 = '今天';
    else if (yesterdayFormat == dFormat)
        t1 = '昨天';
    else
        t1 = dFormat;

    return t1;
};

/*判断字符串是否为undefined、Null或空*/
var isNullOrBlank = function (str) {
    return str === void 0 || str === null || _.isBlank(str);
};
var isNull = function (str) {
    if(typeof str == "undefined" || str == null || str == ""){
        return true;
    }else{
        return false;
    }
};
//判断是否为数组且至少有一个元素;
var isArrayCustom = function (arr){
    if(!$.isArray(arr)){
        return false;
    }else if(arr.length<1){
        return false;
    }else{
        return true;
    }
};
//处理IE的Console.log兼容问题
(function () {
    var method;
    var noop = function () {
    };
    var methods = [
        'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error', 'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'
    ];
    var length = methods.length;
    var console = (window.console = window.console || {});
    while (length--) {
        method = methods[length];
        if (!console[method]) {
            console[method] = noop;
        }
    }
}());
/**
 * form数据提交
 * @param isTrim 是否去掉空格, 默认去掉空格, 0=不去掉空格
 * @returns {{}}
 */
$.fn.serializeObject = function (isTrim) {
    var o = {};
    var a = this.serializeArray();
    $.each(a, function () {
        var value = isTrim==0?this.value:$.trim(this.value);
        if (o[this.name] !== undefined) {
            if (!o[this.name].push) {
                o[this.name] = [o[this.name]];
            }
            o[this.name].push(value || '');
        } else {
            o[this.name] = value || '';
        }
    });
    return o;
};
/**
 * 替换一段话中相匹配的字符串
 * g是全局m是多行
 * @param s1 处理的字符串
 * @param s2 替换的字符串
 * @returns
 */
String.prototype.replaceAll = function (s1, s2) {
    return this.replace(new RegExp(s1, "gm"), s2);
};

/**
 * 两日期对比
 * @param d1 时间一
 * @param d2 时间二
 * @returns {Number}
 */
function dateDiff(d1, d2) {
    if (!d1 || d1 == null || d1 == '' || !d2 || d2 == null || d2 == '') {
        return 0;
    }
    var result = Date.parse(d1.toString().replace(/-/g, "/")) - Date.parse(d2.toString().replace(/-/g, "/"));
    return result;
}
//获取当前日期
function getNowDate() {
    var date = new Date();
    var year = date.getFullYear(),
        mon = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1,
        day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate(),
        nowDate = year + "-" + mon + "-" + day;
    return nowDate;
}
function getLastDay(year,month){

    var new_year = year;    //取当前的年份
    var new_month = month++;//取下一个月的第一天，方便计算（最后一天不固定）
    if(month>12)            //如果当前大于12月，则年份转到下一年
    {
        new_month -=12;        //月份减
        new_year++;            //年份增
    }
    var new_date = new Date(new_year,new_month,1);                //取当年当月中的第一天
    var date_count =   (new Date(new_date.getTime()-1000*60*60*24)).getDate();//获取当月的天数
    var last_date =   new Date(new_date.getTime()-1000*60*60*24);//获得当月最后一天的日期
    return date_count;
}
/**
 * 时间差
 * @param stime
 * @param etime
 */
function diffDays(stime, etime) {
    var d1 = this.dateDiff(etime, stime);
    var day1 = Math.floor(d1 / (24 * 3600 * 1000));
    return day1;
}
/**
 * 获取第N天
 * @param date
 * @param days
 */
var getPrevDateByDays = function (date,days) {
    date = new Date(date);
    date = + date - 1000*60*60*24*days;
    date = new Date(date);
    var mon = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
    var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    //格式化
    return date.getFullYear() + "-" + mon + "-" + day;
};
/**
 * 获取字符串长度，中文按2个字节，英文按1个字节
 */
function getStringLength(str) {
    var len = 0;
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        //单字节加1
        if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
            len++;
        }
        else {
            len += 2;
        }
    }
    return len;
}

/**
 * 获取字符串长度，中文按2个字节，英文按1个字节
 */
var cutString = function (str, length, suffix) {
    if (isNullOrBlank(str))
        return '';

    var len = 0;
    var temp = '';
    for (var i = 0; i < str.length; i++) {
        var c = str.charCodeAt(i);
        //单字节加1
        if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
            len++;
        }
        else {
            len += 2;
        }
        temp += str.charAt(i);
        if (len >= length)
            return temp + suffix;
    }
    return str;
};

/*****************************验证公共方法--结束**********************************/

//数据提交访问错误
function handlePostJsonError(response) {
    if (response.status == 404) {
        //当前请求地址未找到
        S_layer.error('当前请求地址未找到！');

    } else if (response.status == 0) {
        //网络请求超时
        S_layer.error('网络请求超时！');
    } else {
        S_layer.error('网络请求出现错误！status：' + response.status + "，statusText：" + response.statusText);
    }
    //var text = '访问出现异常！<br/>status: ' + response.status + '<br/>statusText: ' + response.statusText;
    //S_layer.alert(text);
}
//数据提交访问错误
function handleResponse(response) {
    var result = false;
    if (response.code == "401") {
        //session超时 !
        S_layer.error('当前用户状态信息已超时!点击“确定”后返回登录界面。', '提示', function () {
            window.location.href = window.serverPath + '/#/login';
        });
        result = true;
    } else if (response.code == "500") {
        //未捕获异常 X
        S_layer.error('出现异常错误 !详细信息：' + response.info);
        result = true;
    }
    return result;
}

/******************************************** 弹窗方法 开始 *****************************************************/
var S_layer = {
    dialog:function (option,initCallback) {

        var btn = [];
        if(option.okText && typeof(option.ok)==='function')
            btn.push(option.okText);

        if(option.cancelText && typeof(option.cancel)==='function')
            btn.push(option.cancelText);

        if(option.btn)
            btn = option.btn;

        if(option.btn===undefined && btn.length==0)
            btn = ['确定', '取消'];

        if(option.btn===false)
            btn = false;

        var options = {
            type: option.type || 1
            ,id: option.id
            ,title: option.title || false
            ,skin:option.skin || 'layer-new'
            ,area:option.area || 'auto'
            ,maxHeight:option.maxHeight
            ,maxWidth:option.maxWidth
            ,offset:option.offset || 'auto'
            ,icon:option.icon || null
            ,closeBtn:option.closeBtn==undefined?  1 :option.closeBtn
            ,shade:option.shade==undefined?  0.4 :option.shade
            ,shadeClose:option.shadeClose || false // 点击空白处快速关闭
            ,time:option.time || 0
            ,anim:option.anim || 5
            ,maxmin:option.maxmin || false
            ,fixed :option.fixed  || false
            ,resize:option.resize  || false
            ,scrollbar:option.scrollbar
            ,btn: btn
            ,btn2: option.btn2 || option.cancel || null//取消函数
            ,yes:function(index,layero){

                var flag = true;
                if(option.ok)
                    flag = option.ok();

                if(!(flag===false))
                    layer.close(index);

                //只存在一个按钮，且是关闭或取消
                if(btn.length==1 && typeof(option.cancel)==='function')
                    option.cancel();

            }
            ,cancel:function () {
                if(option.cancel)
                    option.cancel();
            }
            ,end: option.end || null//层销毁后触发的回调
            ,resizing: option.resizing || null//层销毁后触发的回调
            ,success: function(layero, index){

                if(btn && btn.length>1)
                    layero.find('.layui-layer-btn .layui-layer-btn0').addClass('pull-right');

                //只有一个按钮
                if(btn && btn.length==1 && (btn[0]=='关闭' || btn[0]=='取消'))
                    layero.find('.layui-layer-btn .layui-layer-btn0').addClass('btn-default');

                var dialogEle = 'div.layui-layer'+layero.selector+' .layui-layer-content';

                return initCallback(layero,index,dialogEle);
            }
            ,min: function() { //点击最小化后的回调函数

                if(option.min)
                    option.min();

            }
            ,full: function() { //点击最大化后的回调函数

                if(option.full)
                    option.full();

            }
            ,restore: function() { //点击还原后的回调函数

                if(option.restore)
                    option.restore();

            }};

        if(btn && btn.length>2){//大于两个btn，往里加
            $.each(btn,function (i,item) {
                if(i<2)
                    return true;
                var key = 'btn'+(i+1);
                options[key] = option[key];
            })
        }
        if(option.url){
            $.get(option.url, {cache: true}).success(function (data) {
                options.content = data;
                layer.open(options);

            }).error(function () {
                alert('操作异常\n网络错误');
            });
        }else{
            options.content = option.content || '';
            layer.open(options);
        }

    },
    /**
     * 确定提示对话框
     * @param text 内容
     * @param title 标题
     */
    alert: function (text, title) {
        text = '<div class="text-center">'+text+'</div>'
        layer.alert(text, {title:title||'提示',skin:'layer-new',resize:false});
    },
    /**
     * 确定提示对话框
     * @param text 内容
     * @param title 标题
     */
    //成功提示
    success: function (text, title, okCallback) {
        text = '<div style="min-width: 300px;max-width: 800px;"><div class="text-center"><i class="icon-custom icon-color-light rounded-x fa fa-check"  style="background: cadetblue"></i> <p style="font-size: 16px; padding-top: 12px">' + text + '</p></div> </div>';
        layer.alert(text, {
            title:title||'提示',
            skin:'layer-new',
            resize:false,
            yes:function (index,layero) {
                if(okCallback)
                    okCallback();
                layer.close(index);
            }
        });
    },

    /**
     * 确定提示对话框
     * @param text 内容
     * @param title 标题
     */
    //错误提示
    error: function (text, title, okCallback) {
        text = '<div style="min-width: 300px;max-width: 800px;"><div class="text-center"><i class="icon-custom icon-color-light rounded-x fa fa-times"  style="background: brown"></i> <p style="line-height: 3">' + text + '</p></div> </div>';
        layer.alert(text, {
            title:title||'提示',
            skin:'layer-new',
            resize:false,
            yes:function (index,layero) {
                if(okCallback)
                    okCallback();
                layer.close(index);
            }
        });
    },

    /**
     * 确定提示对话框
     * @param text 内容
     * @param title 标题
     */
    //警告提示
    warning: function (text, title, okCallback) {
        text = '<div style="min-width: 300px;max-width: 800px;"><div class="text-center"><i class="icon-custom icon-color-light rounded-x fa fa-exclamation-triangle" style="background: darkgoldenrod"></i> <p style="line-height: 3">' + text + '</p></div> </div>';
        layer.alert(text, {
            title:title||'提示',
            skin:'layer-new',
            resize:false,
            yes:function (index,layero) {
                if(okCallback)
                    okCallback();
                layer.close(index);
            }
        });
    },

    /**
     * 确定提示对话框
     * @param text 内容
     * @param title 标题
     */
    //
    info: function (text, title) {
        text = '<div style="min-width: 300px;max-width: 800px;"><div class="text-center"><i class="icon-custom icon-color-light rounded-x fa fa-info" style="background: cornflowerblue"></i> <p style="line-height: 3">' + text + '</p></div> </div>';
        layer.alert(text, {
            title:title||'提示',
            skin:'layer-new',
            resize:false
        });
    },
    /**
     * 控制对话框提示
     * @param text 内容
     */
    tips: function (text) {
        layer.msg(text);
    },
    /**
     * 前端确认弹窗提示
     * @param text 内容
     * @param OK function
     * @param cancel function
     */
    confirm: function (text, callback1, callback2) {
        text = '<div class="text-center p-sm">' + (text || '您确定要操作吗?') + '</div>';
        layer.confirm(text, {
            title:'提示',
            skin:'layer-new',
            resize:false,
            success: function(layero, index){
                layero.find('.layui-layer-btn .layui-layer-btn0').addClass('pull-right');
            }}
        , function(index){
            if(callback1)
                callback1();
            layer.close(index);
        },function (index) {
            if(callback2)
                callback2();
            layer.close(index);
        });

    },
    close: function ($ele,callBack) {
        if($ele==null){
            layer.closeAll();
        }else{
            var index = $ele.parents('.layui-layer').attr('times');
            layer.close(index);
        }
        if(callBack)
            callBack();
    }
    /**
     * 重新定位弹窗,m-dialog-resize，只针对fixed的兄弟节点
     * @param layero
     * @param index
     * @param dialogEle
     * @param outDiffHeight 若是m-dialog-resize存在，且不是$(dialogEle).children(),可传此参数
     */
    ,resize:function (layero,index,dialogEle,outDiffHeight) {//重新定位弹窗,m-dialog-resize，只针对fixed的兄弟节点

        var $layer = $(dialogEle).closest('.layui-layer');
        var $layerResizeBox = $(dialogEle).find('.m-dialog-resize').eq(0);

        if($layerResizeBox.length==0)
            $layerResizeBox = $(dialogEle).children().eq(0);

        if(isNullOrBlank(outDiffHeight))
            outDiffHeight=0;

        $layerResizeBox.off('resize.m-dialog-resize');

        var resizeFun = function ($layer,$layerResizeBox) {

            //重新定位弹窗offset top
            var windowHeight = $(window).height();
            //var dialogHeight = $layer.height();
            var contentHeight = $layerResizeBox.outerHeight();
            //console.log($layerResizeBox.innerHeight())

            $layerResizeBox.scrollTop(10);//控制滚动条下移10px
            //有滚动条
            if($layerResizeBox.scrollTop()>0 ){
                //alert("有滚动条");
                contentHeight = $layerResizeBox[0].scrollHeight;
            }
            $layerResizeBox.scrollTop(0);//滚动条返回顶部

            var windowDisplayHeight = windowHeight;
            var contentDisplayHeight = contentHeight;

            if($layer.find('.layui-layer-title').length>0){
                contentDisplayHeight += 42;
                windowDisplayHeight = windowDisplayHeight - 42;
            }

            if($layer.find('.layui-layer-btn').length>0){
                contentDisplayHeight += 53;
                windowDisplayHeight = windowDisplayHeight - 53;
            }

            //contentHeight += 30;
            //console.log('contentHeight='+contentHeight+'//windowHeight='+windowHeight);
            if($layerResizeBox.hasClass('m-dialog-resize')){
                //存在兄弟节点
                var h = 0;
                if($layerResizeBox.siblings().length>0){
                    $layerResizeBox.siblings().each(function () {
                        var position = $(this).css('position');
                        //if(position!='absolute' && position!='fixed'){
                        h += $(this).outerHeight();
                        //}
                    });
                }
                contentDisplayHeight += h;
                windowDisplayHeight = windowDisplayHeight-h;

                if(contentDisplayHeight+outDiffHeight < windowHeight){
                    var t = windowHeight-contentDisplayHeight-outDiffHeight;
                    layer.style(index, {
                        top: t/2 +'px',
                        height:contentDisplayHeight+outDiffHeight +'px'
                    });
                    $layerResizeBox.css('height',contentHeight+'px');
                    if(outDiffHeight>0){//存在外层间隔高度
                        $layerResizeBox.parent().css('height',contentHeight+h+'px');
                    }

                }else if(contentDisplayHeight+outDiffHeight >= windowHeight){
                    layer.style(index, {
                        top: '0px',
                        height:windowHeight +'px'
                    });
                    $layerResizeBox.css('height',windowDisplayHeight-outDiffHeight+'px');
                    if(outDiffHeight>0){//存在外层间隔高度
                        $layerResizeBox.parent().css('height',windowDisplayHeight-outDiffHeight+h+'px');
                    }
                }


            }else{
                if(contentDisplayHeight<windowHeight){
                    var t = windowHeight-contentDisplayHeight;
                    layer.style(index, {
                        top: t/2 +'px',
                        height:contentDisplayHeight +'px'
                    });
                }else if(contentDisplayHeight>=windowHeight){
                    layer.style(index, {
                        top: '0px',
                        height:windowHeight +'px'
                    });
                }
            }
        };
        var t = setTimeout(function () {
            resizeFun($layer,$layerResizeBox);
            $layerResizeBox.on('resize.m-dialog-resize', function(e){
                //console.log('resize.m-form-template-div');
                resizeFun($layer,$layerResizeBox)
            });
            clearTimeout(t);
        },20);

    },
    /**
     * 图片预览
     * @param imgList<alt,pid,src>
     * @param index 当前展示的图片下标
     */
    photos:function (imgList,index,tabCallBack) {
        var photos={
                title: '',
                id: 1,
                start: index,
                data: imgList
            }
        ;
        layer.photos({
            photos: photos,
            //full: true,
            shift: 5,
            tab: function(pic, layero){
                //console.log(pic) //当前图片的一些信息
                if(tabCallBack)
                    tabCallBack(pic, layero);
            }
        });
    }
};
/**
 * 加载中 提示
 * @param id 标签ID或类名
 * @param text 提示内容
 */
var S_loading = {
    show: function (id, text) {
        if(id==undefined)
            id = 'body';
        if (text == undefined || text == '') {
            text = '正在请求中...';
        }
        $(id).eq(0).block({message: text,baseZ:'19891099'});
    },
    close: function (id) {
        $(id).eq(0).unblock();
    }

};
var S_toastr = {
    success: function (text) {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "progressBar": false,
            "preventDuplicates": false,
            "positionClass": "toast-top-center",
            "onclick": null,
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "2000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
        toastr.success(text);
    },
    warning: function (text) {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "progressBar": false,
            "preventDuplicates": false,
            "positionClass": "toast-top-center",
            "onclick": null,
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "2000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
        toastr.warning(text);
    },
    info: function (text) {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "progressBar": false,
            "preventDuplicates": false,
            "positionClass": "toast-top-center",
            "onclick": null,
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "2000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
        toastr.info(text);
    },
    error: function (text) {
        toastr.options = {
            "closeButton": false,
            "debug": false,
            "progressBar": false,
            "preventDuplicates": false,
            "positionClass": "toast-top-center",
            "onclick": null,
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "2000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };
        toastr.error(text);
    }
};

/******************************************** 弹窗方法 结束 *****************************************************/


var m_ajax = {
    get: function (option, onHttpSuccess, onHttpError) {
        $.ajax({
            type: option.type || 'GET',
            url: option.url,
            cache: false,
            beforeSend: function () {
                if (option.classId)
                    S_loading.show(option.classId, '正在请求中...');

                if (option.bindDisabled) {
                    var $el = $(option.bindDisabled);
                    if ($el.length > 0) {
                        try {
                            $el.attr('disabled', true);
                        } catch (e) {
                        }
                        try {
                            $el.prop('disabled', true);
                        } catch (e) {
                        }
                    }
                }
            },
            success: function (response) {

                if (!handleResponse(response)) {
                    dealIsCurrentCompany(response);
                    if (onHttpSuccess)
                        onHttpSuccess(response);
                }

            },
            error: function (response) {
                if (onHttpError)
                    onHttpError();

                handlePostJsonError(response);
                //else
                //tzTips.showOnTopRight("Ajax请求发生错误", "error");
            },
            complete: function () {
                if (option.classId)
                    S_loading.close(option.classId);

                if (option.bindDisabled) {
                    setTimeout(function () {
                        var $el = $(option.bindDisabled);
                        if ($el.length > 0) {
                            try {
                                $el.attr('disabled', false);
                            } catch (e) {
                            }
                            try {
                                $el.prop('disabled', false);
                            } catch (e) {
                            }
                        }
                    }, 1000);

                }
            }
        });
    },
    getNoDialog: function (option, onHttpSuccess, onHttpError) {
        $.ajax({
            type: option.type || 'GET',
            url: option.url,
            cache: false,
            beforeSend: function () {
                if (option.classId)

                if (option.bindDisabled) {
                    var $el = $(option.bindDisabled);
                    if ($el.length > 0) {
                        try {
                            $el.attr('disabled', true);
                        } catch (e) {
                        }
                        try {
                            $el.prop('disabled', true);
                        } catch (e) {
                        }
                    }
                }
            },
            success: function (response) {

                if (!handleResponse(response)) {
                    if (onHttpSuccess)
                        onHttpSuccess(response);
                }

            },
            error: function (response) {
                if (onHttpError)
                    onHttpError();
                //else
                //tzTips.showOnTopRight("Ajax请求发生错误", "error");
            },
            complete: function () {

                if (option.bindDisabled) {
                    setTimeout(function () {
                        var $el = $(option.bindDisabled);
                        if ($el.length > 0) {
                            try {
                                $el.attr('disabled', false);
                            } catch (e) {
                            }
                            try {
                                $el.prop('disabled', false);
                            } catch (e) {
                            }
                        }
                    }, 1000);

                }
            }
        });
    },
    getJson: function (option, onHttpSuccess, onHttpError) {
        $.ajax({
            type: 'GET',
            url: option.url,
            cache: false,
            contentType: "application/json",
            beforeSend: function () {
                if (option.classId)
                    S_loading.show(option.classId, '正在请求中...');

                if (option.bindDisabled) {
                    var $el = $(option.bindDisabled);
                    if ($el.length > 0) {
                        try {
                            $el.attr('disabled', true);
                        } catch (e) {
                        }
                        try {
                            $el.prop('disabled', true);
                        } catch (e) {
                        }
                    }
                }
            },
            success: function (response) {

                if (!handleResponse(response)) {
                    dealIsCurrentCompany(response);
                    if (onHttpSuccess)
                        onHttpSuccess(response);
                }

            },
            error: function (response) {
                if (onHttpError)
                    onHttpError();

                handlePostJsonError(response);
                //else
                //tzTips.showOnTopRight("Ajax请求发生错误", "error");
            },
            complete: function () {
                if (option.classId)
                    S_loading.close(option.classId);

                if (option.bindDisabled) {
                    setTimeout(function () {
                        var $el = $(option.bindDisabled);
                        if ($el.length > 0) {
                            try {
                                $el.attr('disabled', false);
                            } catch (e) {
                            }
                            try {
                                $el.prop('disabled', false);
                            } catch (e) {
                            }
                        }
                    }, 1000);

                }
            }
        });
    },
    post: function (option, onHttpSuccess, onHttpError) {
        //var pNotify;
        $.ajax({
            type: 'POST',
            url: option.url,
            data: option.postData,
            cache: false,
            beforeSend: function () {
                if (option.classId)
                    S_loading.show(option.classId, '正在请求中...');

                if (option.bindDisabled) {
                    var $el = $(option.bindDisabled);
                    if ($el.length > 0) {
                        try {
                            $el.attr('disabled', true);
                        } catch (e) {
                        }
                        try {
                            $el.prop('disabled', true);
                        } catch (e) {
                        }
                    }
                }
            },
            success: function (response) {

                if (!handleResponse(response)) {
                    dealIsCurrentCompany(response);
                    if (onHttpSuccess)
                        onHttpSuccess(response);
                }

            },
            error: function (response) {
                if (onHttpError)
                    onHttpError();

                handlePostJsonError(response);
                //else
                //tzTips.showOnTopRight("Ajax请求发生错误", "error");
            },
            complete: function () {
                if (option.classId)
                    S_loading.close(option.classId);

                if (option.bindDisabled) {
                    setTimeout(function () {
                        var $el = $(option.bindDisabled);
                        if ($el.length > 0) {
                            try {
                                $el.attr('disabled', false);
                            } catch (e) {
                            }
                            try {
                                $el.prop('disabled', false);
                            } catch (e) {
                            }
                        }
                    }, 1000);

                }
            }
        });
    },
    postJson: function (option, onHttpSuccess, onHttpError) {
        $.ajax({
            type: 'POST',
            url: option.url,
            cache: false,
            async: option.async == null ? true : option.async,
            data: JSON.stringify(option.postData),
            contentType: "application/json",
            beforeSend: function () {
                if (option.classId)
                    S_loading.show(option.classId, '正在请求中...');

                if (option.bindDisabled) {
                    var $el = $(option.bindDisabled);
                    if ($el.length > 0) {
                        try {
                            $el.attr('disabled', true);
                        } catch (e) {
                        }
                        try {
                            $el.prop('disabled', true);
                        } catch (e) {
                        }
                    }
                }
            },
            success: function (response) {
                if (!handleResponse(response)) {
                    dealIsCurrentCompany(response);
                    if (onHttpSuccess)
                        onHttpSuccess(response);
                }
            },
            error: function (response) {
                if (onHttpError)
                    onHttpError();

                if (option.ignoreError !== true)
                    handlePostJsonError(response);
            },
            complete: function () {
                if (option.classId)
                    S_loading.close(option.classId);

                if (option.bindDisabled) {
                    setTimeout(function () {
                        var $el = $(option.bindDisabled);
                        if ($el.length > 0) {
                            try {
                                $el.attr('disabled', false);
                            } catch (e) {
                            }
                            try {
                                $el.prop('disabled', false);
                            } catch (e) {
                            }
                        }
                    }, 1000);
                }
            }
        });
    },
    delete: function (option, onHttpSuccess, onHttpError) {
        //var pNotify;
        $.ajax({
            type: 'DELETE',
            url: option.url,
            cache: false,
            data: JSON.stringify(option.postData),
            contentType: "application/json",
            beforeSend: function () {
                if (option.classId)
                    S_loading.show(option.classId, '正在请求中...');

                if (option.bindDisabled) {
                    var $el = $(option.bindDisabled);
                    if ($el.length > 0) {
                        try {
                            $el.attr('disabled', true);
                        } catch (e) {
                        }
                        try {
                            $el.prop('disabled', true);
                        } catch (e) {
                        }
                    }
                }
            },
            success: function (response) {

                if (!handleResponse(response)) {
                    dealIsCurrentCompany(response);
                    if (onHttpSuccess)
                        onHttpSuccess(response);
                }

            },
            error: function (response) {
                if (onHttpError)
                    onHttpError();

                handlePostJsonError(response);
                //else
                //tzTips.showOnTopRight("Ajax请求发生错误", "error");
            },
            complete: function () {
                if (option.classId)
                    S_loading.close(option.classId);

                if (option.bindDisabled) {
                    setTimeout(function () {
                        var $el = $(option.bindDisabled);
                        if ($el.length > 0) {
                            try {
                                $el.attr('disabled', false);
                            } catch (e) {
                            }
                            try {
                                $el.prop('disabled', false);
                            } catch (e) {
                            }
                        }
                    }, 1000);
                }
            }
        });
    }
};

/**
 * 判断是否切换了组织，需要重新加载头部组件
 * @param response
 */
function dealIsCurrentCompany(response) {
    if(response.extendData!=null && response.extendData.currentCompanyId!=null && window.currentCompanyId!=undefined
        && response.extendData.currentCompanyId!=window.currentCompanyId && response.extendData.switchFlag!=1){
        $('#m_top').m_top({});
    }
}
/**
 * 分页
 * @param option
 * @param callback
 */
function paginationFun(option, callback) {

    var $page = option.$page;
    if($page==undefined || $page.length==0)
        $page = $(option.eleId);

    if ($page.pagination())
        $page.pagination('destroy');

    $page.pagination({
        remote: {
            url: option.url,
            totalName: 'data.total',
            params: option.params,
            success: function (response) {
                //data为ajax返回数据
                //console.log('======'+option.pageIndex)
                dealIsCurrentCompany(response);
                callback(response);
            },
            remoteWrongFormat: function (response) {
                handleResponse(response);
            },
            beforeSend: function (xmlHttpRequest) {
                S_loading.show(option.loadingId, '正在加载中...');
            },
            complete: function (xmlHttpRequest, textStatue) {
                S_loading.close(option.loadingId);
                if (xmlHttpRequest.status != 200)
                    S_layer.error('error！status：' + xmlHttpRequest.status);

                if(xmlHttpRequest.responseJSON && xmlHttpRequest.responseJSON.code=='1')
                    S_layer.error(xmlHttpRequest.responseJSON.info);
            }
        },
        pageSize: option.pageSize || 10,
        prevBtnText: '上一页',
        nextBtnText: '下一页',
        pageIndex: option.params.pageIndex || option.pageIndex || 0,
        debug: false
    });
};
function addNodeByTree(data, currOrgTreeObj, currentCompanyId,type) {

    if (currentCompanyId == undefined) {
        currentCompanyId = window.currentCompanyId;
    }
    if (data.departName != null && data.departName != '') {
        data.text = data.departName;
    } else if (data.companyName != null && data.companyName != '') {
        data.text = data.companyName;
    }
    data.realId = data.id;
    var ref = $('#organization_treeH').jstree(true),sel = ref.get_selected();

    if(type==1){//获取需要的节点
        sel = currOrgTreeObj.id.split(',');
    }
    if (!sel.length) {
        return false;
    } else {
        sel = sel[0];

        //pos计算，用于生成树节点顺序的pos位置
        var currNodeId = currOrgTreeObj.id;
        var len = 0;
        if ($('li[id="' + currNodeId + '"]').children('ul').length > 0) {
            len = $('li[id="' + currNodeId + '"]').children('ul').children('li').length;
            if ($('li[id="' + currNodeId + '"]').children('ul').find('li[id="' + currentCompanyId + 'subCompanyId"]').length > 0) {
                len--;
            }
            if ($('li[id="' + currNodeId + '"]').children('ul').find('li[id="' + currentCompanyId + 'partnerId"]').length > 0) {
                len--;
            }
            if (len < 0) {
                len = 'last';
            }
        } else {
            len = 'last';
        }
        data.parent = sel;
        sel = ref.create_node(sel, data, len);
        if (sel) {
            ref.edit();  //带参数 sel 则添加时可以编辑名称
        }
    }
};
//更新节点属性
function editNodeByTree(data,isReClick) {
    var tree = $('#organization_treeH').jstree(true), sel = tree.get_selected(true)[0];
    tree.set_text(sel, data.text);
    tree.set_type(sel, data.type);
    sel.original = data;
    if(isReClick==1)
        $('#organization_treeH li#'+sel.id+' a').click();
};
// 删除节点
function delNodeByTree() {
    var ref = $('#organization_treeH').jstree(true),
        sel = ref.get_selected();
    if (!sel.length) {
        return false;
    }
    ref.delete_node(sel);
};
//添加节点(分支机构或事业合伙人)
function addNodeByTreeOfPartner(type, currentCompanyId) {

    var id = currentCompanyId;

    if (type == 2 && $('a[id="' + id + 'partnerId_anchor"]').length > 0) {//判断是否有事业合伙人根节点
        return;
    }
    if (type == 1 && $('a[id="' + id + 'subCompanyId_anchor"]').length > 0) {//判断是否有分支机构根节点
        return;
    }
    var tree = $('#organization_treeH').jstree(true);
    var root = tree.get_node(id);

    var data = {};
    if (type == 2) {//事业合伙人
        data = {text: '事业合伙人', type: 'partnerContainer', id: id + 'partnerId', realId: id + 'partnerId'};
    } else {//分支机构
        data = {text: '分支机构', type: 'subCompanyContainer', id: id + 'subCompanyId', realId: id + 'subCompanyId'};
    }
    var result = tree.create_node(root, data);
}
//添加节点(根节点下添加节点)
function addNodeByTreeByRoot(data, id) {
    if (data.departName != null && data.departName != '') {
        data.text = data.departName;
    } else if (data.companyName != null && data.companyName != '') {
        data.text = data.companyName;
    }

    data.realId = data.id;
    var tree = $('#organization_treeH').jstree(true);
    //sel = ref.get_node($scope.firstChildOrgObj.original.text)
    var root = tree.get_node(id);
    //var child = root.children[0];
    var result = tree.create_node(root, data);
}

function m_inputProcessTime_onpicked(dp) {
    var $startTime = $('form.inputTimeOBox').find('.startTime:eq(0)');
    var $endTime = $('form.inputTimeOBox').find('.endTime:eq(0)');
    if ($startTime.length > 0 && $endTime.length > 0) {
        var startTime = $startTime.val();
        var endTime = $endTime.val();
        if (startTime !== null && !_.isBlank(startTime) && endTime !== null && !_.isBlank(endTime)) {
            $('form.inputTimeOBox').find('.dayCount:eq(0)').val(moment(endTime).diff(moment(startTime), 'days') + 1);

        } else {
            $('form.inputTimeOBox').find('.dayCount:eq(0)').val(0);
        }
    }
}
function startTimeFun(obj, onpicked) {//开始时间
    var i = $(obj).attr('data-id');
    var startTimeLimit = $(obj).attr('data-appointmentStartTime');
    if (i == undefined) {
        i = '';
    }
    var endTimeLimit = $(obj).closest('form').find('#ipt_endTime' + i).attr('data-appointmentEndTime');
    if ($(obj).closest('form').find('#ipt_endTime' + i).val() == '') {
        var maxTime = endTimeLimit;
    }
    WdatePicker({
        minDate: startTimeLimit,
        maxDate: maxTime || '#F{$dp.$D(\'ipt_endTime' + i + '\')||\'2099-10-01\'}',
        onpicked: function (dp) {
            if (onpicked)
                onpicked(dp);
        }
    })
}
function startTimeLimitFun(obj, onpicked) {//开始时间
    var i = $(obj).attr('data-id');
    var startTimeLimit = ($(obj).attr('data-appointmentStartTime') == undefined ||$(obj).attr('data-appointmentStartTime')=='')? '2021-01-01' :$(obj).attr('data-appointmentStartTime');
    if (i == undefined) {
        i = '';
    }
    var endTimeLimit = $(obj).closest('form').find('#ipt_endTime' + i).attr('data-appointmentEndTime');
    if ($(obj).closest('form').find('#ipt_endTime' + i).val() == '') {
        var maxTime = endTimeLimit;
    }
    WdatePicker({
        minDate: startTimeLimit,
        maxDate: maxTime || '#F{$dp.$D(\'ipt_endTime' + i + '\')||\'2099-10-01\'}',
        onpicked: function (dp) {
            if (onpicked)
                onpicked(dp);
        }
    })
}
function endTimeFun(obj, onpicked) {//结束时间
    var i = $(obj).attr('data-id');
    var endTimeLimit = $(obj).attr('data-appointmentEndTime');
    if (i == undefined) {
        i = '';
    }
    var startTimeLimit = $(obj).closest('form').find('#ipt_startTime' + i).attr('data-appointmentStartTime');
    if ($(obj).closest('form').find('#ipt_startTime' + i).val() == '') {
        var minTime = startTimeLimit;
    }
    WdatePicker({
        minDate: minTime || '#F{$dp.$D(\'ipt_startTime' + i + '\')}',
        maxDate: endTimeLimit || '2099-10-01',
        onpicked: function (dp) {
            if (onpicked)
                onpicked(dp);
        }
    })
}
function endTimeLimitFun(obj, onpicked) {//结束时间
    var i = $(obj).attr('data-id');
    var endTimeLimit = $(obj).attr('data-appointmentEndTime');
    if (i == undefined) {
        i = '';
    }
    var startTimeLimit = $(obj).closest('form').find('#ipt_startTime' + i).attr('data-appointmentStartTime');
    if ($(obj).closest('form').find('#ipt_startTime' + i).val() == '') {
        var minTime =  (startTimeLimit == undefined ||startTimeLimit=='')? '2021-01-01' :startTimeLimit;
    }
    WdatePicker({
        minDate: minTime || '#F{$dp.$D(\'ipt_startTime' + i + '\')}',
        maxDate: endTimeLimit || '2099-10-01',
        onpicked: function (dp) {
            if (onpicked)
                onpicked(dp);
        }
    })
}
function timeDiffTime(startTime, endTime) {//输入两个时间得出时间差（单位：天）
    return moment(endTime).diff(moment(startTime), 'days')+1;
}
/**
 *
 * 作用：权限控制
 * 用法：直接在要做权限控制的标签上加上class‘roleControl’，再添加roleCode与flag属性如：class="roleControl" roleCode="project_task_progress" flag="1"
 */
function rolesControl() {
    var roleCodes = window.currentRoleCodes;
    if (roleCodes == undefined) {
        roleCodes = '';
    }
    roleCodes = roleCodes + ',';//避免roleCode覆盖

    $('.roleControl[roleCode]').each(function () {

        var $this = $(this);
        var roles = $this.attr('roleCode');
        var roleList = roles.split(',');
        var flag = $this.attr('flag');
        var isHaveRole = false;

        $.each(roleList, function (i, item) {
            if (roleCodes.indexOf(item+',') > -1) {
                return isHaveRole = true;
            }
        });
        if (!isHaveRole) {
            if (flag == 1) {//隐藏相关信息，用***显示
                $this.parent().html("***");
            } else if (flag == 2) {//直接remove掉
                $this.remove();
            } else if (flag == 3) {//直接隐藏
                $this.hide();
            } else if (flag == 4) {//不能点击
                $this.attr('data-action', '');
                $this.bind('click', function () {
                    S_toastr.warning('你暂无该操作权限！');
                    return false;
                });

            } else if (flag == 5) {//基于x-editble情况下
                $this.removeClass('editable').removeClass('editable-click').removeClass('editable-empty').addClass('a-v1');
                /*if($.trim($this.text())=='未设置'){
                 $this.text('');
                 }*/
                $this.unbind('click');
            } else if (flag == 6) {//当匹配存删除，不匹配设为***
                if (isHaveRole) {
                    $this.remove();
                } else {
                    $this.parent().html("***");
                }
            } else if (flag == 7) {//用--显示
                $this.parent().html("***");
            } else {
                $this.remove();
            }
        }
    });
}
/**
 * 作用：项目金额格式控制
 * 用法：项目相关的金额数字位数与小数点后面数字的控制，如：23456.130300显示为23,456.1303;且小数位控制在六位内
 */
function proNumberFilter(value) {
    if (value != null && value != undefined && !isNaN(value) && value != '') {
        var val1 = parseFloat(Number(value).toFixed(6));
        if (String(val1.toString()).indexOf(".") > 0) {
            var val2 = val1.toString().substring(String(val1).indexOf("."), val1.toString().length);
            var val3 = val1.toString().substring(0, String(val1).indexOf("."));
            var val4 = val3.replace(/\B(?=(?:\d{3})+$)/g, ',');
            return value = (val4 + '' + val2);
        } else {
            var val3 = val1.toString().substring(0, val1.toString().length);
            var val4 = val3.replace(/\B(?=(?:\d{3})+$)/g, ',');
            return value = val4;
        }

    } else {
        if (value != '***') {
            value = '0';
        }
    }
    return value;
};
/**
 * 作用：财务相关金额的格式控制
 * 显示：项目相关的金额数字位数与小数点后面数字的控制，如：23456.13显示为23,456.13;且小数位控制在两位内
 */
function expNumberFilter(value) {
    if (value != null && value != undefined && !isNaN(value) && value != '') {
        value = value.toString();
        if (value.indexOf('.') > -1) {
            var val1 = value.split('.')[0];//截取整数部分
            var val2 = value.split('.')[1].length < 2 ? value.split('.')[1] + 0 : value.split('.')[1];//截取小数部分
        } else {
            var val1 = value;//截取整数部分
        }
        val1 = val1.replace(/\B(?=(?:\d{3})+$)/g, ',');
        if (val2 && val2 != '') {
            value = (val1 + '.' + val2);
        } else {
            value = val1 + '.00';
        }

    } else {
        if (value != '***') {
            value = '0.00';
        }
    }
    return value;
}
//当任务名称过长时，超出的用‘...’显示,_ele（传入的文字所在的标签的class值）
function stringCtrl($ele,_width,isShowTip) {
    //当任务名称过长时，超出的用‘...’显示
    limitString($ele,_width,isShowTip);
   $(window).resize(function () {
        //当任务名称过长时，超出的用‘...’显示
        limitString($ele,_width,isShowTip);
    });
}

//当任务名称过长时，超出的用‘...’显示,只针对treegrid
function limitString($ele,_width,isShowTip) {//_ele（传入的文字所在的标签的class值）
    $ele.each(function () {
        var $_a = $(this),
            td_w = _width==null?$_a.parent().width():_width,
            a_width = $_a.width(),//获取任务名称所占宽度
            a_left = 0,//获取任务名称的left值
            a_right = 10,//右边是否有其他元素，若有则需减去,默认右边留10px
            str = $_a.attr('data-string');//输入字符

        if (str == undefined || str == '') {
            return true;
        }
        if(isShowTip){
            $_a.attr({'data-toggle': 'tooltip', 'data-placement': 'top', 'data-original-title': str, 'data-container':'body'});
            $_a.tooltip({trigger:'hover'});
        }
        if ($_a.prevAll().length > 0) {
            $_a.prevAll().each(function () {
                a_left += $(this).outerWidth();
            });
        }
        if ($_a.nextAll().length > 0) {
            $_a.nextAll().each(function () {
                if ($(this).outerWidth() > 0) a_right += $(this).outerWidth() + 10;
            });
        }
        if ((a_width + a_left + a_right + 10) >= td_w || ($.trim(str) != $.trim($_a.text()))) {
            var len = 0, temp = '', new_aW = 0;
            for (var i = 0; i < str.length; i++) {
                var c = str.charCodeAt(i);
                //单字节加1
                if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
                    len++;
                }
                else {
                    len += 2;
                }
                temp += str.charAt(i);
                $_a.find('a').length > 0 ? $_a.find('a').text(temp) : $_a.text(temp);
                new_aW = $_a.outerWidth();
                if (new_aW && (new_aW + 20 >= td_w - a_left - a_right) || i >= str.length) {
                    return $_a.find('a').length > 0 ? $_a.find('a').text(temp + '...') : $_a.text(temp + '...');
                }
            }
        }
    });
}
//num表示要四舍五入的数,v表示要保留的小数位数。
function decimal(num, v) {
    var vv = Math.pow(10, v);
    return Math.round(num * vv) / vv;
}
/**
 * list转为树结构
 * @param oldArr
 * @param idKey
 * @param parentKey
 * @returns {*}
 */
/*function arrayToTree(oldArr,idKey,parentKey) {
    oldArr.forEach(element => {
        let parentId = element[parentKey];
    if(parentId !== 0){
        oldArr.forEach(ele => {
            //当内层循环的ID== 外层循环的parendId时，（说明有children），需要往该内层id里建个children并push对应的数组
            if(ele[idKey] == parentId){
            if(!ele.children){
                ele.children = [];
            }
            ele.children.push(element);
        }
    });
    }
});
    //此时的数组是在原基础上补充了children,这一步是过滤，按树展开，将多余的数组剔除
    oldArr = oldArr.filter(ele => ele[parentKey] === 0);
    return oldArr;
}*/


//计算应显示的小数位
var countDigits = function (val, maxDigits) {
    var splits = (val - 0).toString().split(".");
    var digits = 0;
    if (splits.length > 1) {
        if (splits[1].length < maxDigits)
            digits = splits[1].length;
        else
            digits = maxDigits;
    }
    return digits;
};


//正则表达式（验证）
var regularExpressions = {
    //mobile: /^(13[0-9]{9})|(18[0-9]{9})|(14[0-9]{9})|(16[0-9]{9})|(17[0-9]{9})|(15[0-9]{9})$/
    mobile: /^[1-9]\d{10}$/
    ,
    phone: /((\d{11})|^((\d{7,8})|(\d{4}|\d{3})-(\d{7,8})|(\d{4}|\d{3})-(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1})|(\d{7,8})-(\d{4}|\d{3}|\d{2}|\d{1}))$)/
    ,
    number:/^[+-]?(\d|[1-9]\d+)(\.\d+)?$/
    ,
    pnumber: /^\d+(([.]\d{1,6})?)$/ //正实数，小数点6位
    ,
    proportionnumber: /^\d+(([.]\d{1,2})?)$/ //正实数，小数点2位
    ,
    numberWithPoints_2: /^[+-]?\d+(([.]\d{1,2})?)$/  //实数，小数点2位
    ,
    numberWithPoints_3: /^[+-]?\d+(([.]\d{1,3})?)$/  //实数，小数点3位
    ,
    numberWithPoints_4: /^[+-]?\d+(([.]\d{1,4})?)$/  //实数，小数点4位
    ,
    numberWithPoints_6: /^[+-]?\d+(([.]\d{1,6})?)$/  //实数，小数点2位
    ,
    numberWithPercentagePoints_3: /^(\d|[1-9]\d|100)(\.\d{1,3})?%$/ //百分比，小数点3位
    ,
    specialCharacters:/["'<>%;)(&+-,`~!@#$^&*?]/
    ,//过滤一些特殊字符
    cleanSpecialChar:function (t) {
        if(regularExpressions.specialCharacters.test(t.value)){
            $(t).val(t.value.replaceAll(regularExpressions.specialCharacters,""));
        }
    }
};

//精准计算
var doMath = {
    //精确减法
    accSub: function (a1, a2) {
        var r1, r2, m, n;
        try {
            r1 = a1.toString().split(".")[1].length
        } catch (e) {
            r1 = 0
        }
        try {
            r2 = a2.toString().split(".")[1].length
        } catch (e) {
            r2 = 0
        }
        m = Math.pow(10, Math.max(r1, r2));
        //动态控制精度长度
        n = (r1 >= r2) ? r1 : r2;
        return ((a1 * m - a2 * m) / m).toFixed(n);
    },
    //精确加法
    accAdd: function (a1, a2) {
        var r1, r2, m;
        try {
            r1 = a1.toString().split(".")[1].length
        } catch (e) {
            r1 = 0
        }
        try {
            r2 = a2.toString().split(".")[1].length
        } catch (e) {
            r2 = 0
        }
        m = Math.pow(10, Math.max(r1, r2));
        return (a1 * m + a2 * m) / m;
    }
};

//封装成Number类型的子方法，调用方法如: 8-4 写成 8.sub(4)
Number.prototype.sub = function (arg) {//减法
    return parseFloat(doMath.accSub(this, arg));
};
Number.prototype.add = function (arg) {//加法
    return parseFloat(doMath.accAdd(this, arg));
};

//格式化文件大小
var formatFileSize = function (fileSize) {
    var temp;
    if (fileSize === void 0 || fileSize === null)
        return '';
    else if (fileSize < 1024) {
        return fileSize + 'B';
    } else if (fileSize < (1024 * 1024)) {
        temp = parseFloat(fileSize / 1024).toFixed(3);
        return temp.substring(0, temp.length - 1) + 'KB';
    } else if (fileSize < (1024 * 1024 * 1024)) {
        temp = parseFloat(fileSize / (1024 * 1024)).toFixed(3);
        return temp.substring(0, temp.length - 1) + 'MB';
    } else {
        temp = parseFloat(fileSize / (1024 * 1024 * 1024)).toFixed(3);
        return temp.substring(0, temp.length - 1) + 'GB';
    }
};
/**
 * 获取字符串宽度及高度
 * @param style
 * @returns {{width: *, height: *}}
 */
String.prototype.getTextWH = function(style){
    var $span=$("<span>"+this+"</span>");
    $span.css($.extend({},style,{display:'none'}));
    $("body").append($span);
    var result={
        "width":$span.width(),
        "height":$span.height()
    };
    $span.remove();
    return result;
};
/**
 * 全局控制筛选浮动窗宽高
 * @param w
 * @param h
 * @returns {{width: number, height: number}}
 */
var setDialogWH = function (w,h) {
    var result={
        "width":w>600?200:w,
        "height":h>400?200:h
    };
    return result;
};
/**
 *
 */
var momentFormat = function (datetime,pattern) {
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
        if (m.isValid())
            return moment(datetime).locale("zh-cn").format(pattern);
        return '';
    }
};
/**
 * 根据ID获取对象
 * @param arr 数组
 * @param id
 */
var getObjectInArray = function (arr,value,key) {

    if(isNullOrBlank(arr))
        return null;

    if(isNullOrBlank(value))
        return null;

    if(key==null)
        key = 'id';

    /*var obj=arr.find(function (item) {
        return item[key] === value
    });*/
    var obj = null;
    if(arr && arr.length>0){
        $.each(arr,function (i,item) {
            if(item[key] === value){
                obj = item;
                return false;
            }
        })
    }
    return obj;
};
//Array根据属性id的值删除当前对象
var delObjectInArray = function (arr,obj) {
    var index = obj;
    if (typeof obj == 'function') {
        for (var i = 0; i < arr.length; i++) {
            if (obj(arr[i], i)) index = i;
        }
    }
    arr.splice(index, 1)
};

/**
 * 过滤对象中value为空或null的key
 * @param param
 * @returns {{}}
 */
var filterParam = function (param) {
    var newParam = {};
    if(param!=null && Object.getOwnPropertyNames(param).length>0){
        $.each(param, function (key, value) {
            if(!isNullOrBlank(value))
                newParam[key] = value;
        });
    }
    return newParam
};
/**
 * list移除某项
 * @param list
 * @param key list删除标识
 * @param keyValue 标识值
 * @returns {*}
 */
var delItemByList = function (list,key,keyValue) {
    if(list!=null && list.length>0){
        $.each(list,function(index,item){
            if(item[key]==keyValue){//已存在已选项中
                list.splice(index,1);
                return false;//跳出循环
            }
        });
    }
    return list;
};
/**
 * list替换某项(目前仅做name替换)
 * @param list
 * @param key list删除标识
 * @param keyValue 标识值
 * @returns {*}
 */
var replaceItemNameByList = function (list,key,keyValue,newValue) {
    if(list!=null && list.length>0){
        $.each(list,function(index,item){
            if(item[key]==keyValue){//已存在已选项中
                 item.name =newValue;
                return false;//跳出循环
            }
        });
    }
    return list;
};
//选中的属性定段进行排行，重新生成新的下标值
var sortList = function (oldIndex,newIndex,list) {
    var newList = [];
    for(var i=0;i<list.length;i++){
        if(newIndex>oldIndex){//向后拖拽

            if(i<oldIndex){
                newList.push(list[i]);
            }else if(i>=oldIndex && i<newIndex){
                newList.push(list[i+1]);
            }else if(i==newIndex){
                newList.push(list[oldIndex]);
            }else{
                newList.push(list[i]);
            }
        }else{
            if(i<newIndex){
                newList.push(list[i]);
            }else if(i==newIndex){
                newList.push(list[oldIndex]);
            }else if(i>newIndex && i<=oldIndex){
                newList.push(list[i-1]);
            }else{
                newList.push(list[i]);
            }
        }
    }
    return newList;
};
/*===================下载文件
 * options:{
 * url:'',  //下载地址
 * data:{name:value}, //要发送的数据
 * method:'post'
 * }
 */
var downLoadFile = function (options) {
    if(options.type==1){//post请求
        var config = $.extend(true, { method: 'post' }, options);
        var $iframe = $('<iframe id="down-file-iframe" />');
        var $form = $('<form target="down-file-iframe" method="' + config.method + '" accept-charset="UTF-8" enctype="application/x-www-form-urlencoded" />');
        $form.attr('action', config.url);
        for (var key in config.data) {
            $form.append('<input type="hidden" name="' + key + '" value="' + config.data[key] + '" />');
        }
        $iframe.append($form);
        $(document.body).append($iframe);
        $form[0].submit();
        $iframe.remove();
    }else{

        var len = $('iframe.down-file-iframe').length;
        var $iframe = $('iframe#down-file-iframe'+len);
        var $iframe = $('<iframe class="down-file-iframe" id="down-file-iframe'+len+'" style="display: none;"/>');
        $(document.body).append($iframe);

        $iframe.attr('src',options.url);
    }

};
/**
 * 根据 action清除cookies
 * @param dataActionList
 */
var removeParamCookies = function (dataActionList) {

    if(dataActionList!=null && dataActionList.length>0){
        $.each(dataActionList,function (i,item) {
            var key = 'cookiesData_'+item;
            Cookies.remove(key);
        });
    }
};
var removeCookiesOnLoginOut = function () {
    var dataActionList = ['myProjectList','projectOverview','metismenu'];
    removeParamCookies(dataActionList);
};
/**
 * 设置项目列表param cookies
 * @param newData
 * @param key
 */
var setProjectParamCookies=function (cookiesMark,newData,id,num) {
    var that = this;
    var cookiesData = Cookies.get(cookiesMark);
    if(cookiesData==undefined){
        cookiesData = [];
    }else{
        cookiesData = $.parseJSON(cookiesData);
    }
    var dataItem = getObjectInArray(cookiesData,id);
    if(!isNullOrBlank(dataItem)){
        delObjectInArray(cookiesData,function (obj) {
            return obj.id == id;
        });
    }
    cookiesData.push(newData);

    if(isNullOrBlank(num)){
        num = 5;
    }
    if(cookiesData.length>num){
        cookiesData.splice(0,1);
    }
    Cookies.set(cookiesMark, cookiesData);
};
/**
 * 获取项目列表param cookies
 * @param cookiesMark
 * @param id
 * @returns {null}
 */
var getProjectParamCookies = function (cookiesMark,id) {

    var cookiesData = Cookies.get(cookiesMark);
    if(cookiesData!=undefined){
        cookiesData = $.parseJSON(cookiesData);
        var dataItem = getObjectInArray(cookiesData,id);
        return dataItem;
    }else{
        return null;
    }
};
/**
 * 转换为字符串,param暂只支持字符串参数
 * @param param
 */
var getUrlParamStr = function (route,param) {
    var urlParamStr = '';
    $.each(param,function (key,value) {
        if(value!=null && value!=undefined){
            urlParamStr = urlParamStr + '&'+key+'='+value;
        }
    });
    return route + '?' + urlParamStr;
};
/**
 * 实现将项目的图片转化成base64
 */
var convertImgToBase64 = function(url, callback, outputFormat){

    var canvas = document.createElement('CANVAS'),
        ctx = canvas.getContext('2d'),
        img = new Image;
    img.crossOrigin = 'Anonymous';
    img.onload = function(){
        canvas.height = img.height;
        canvas.width = img.width;
        ctx.drawImage(img,0,0);
        var dataURL = canvas.toDataURL(outputFormat || 'image/png');
        callback.call(this, dataURL);
        canvas = null;
    };
    img.src = url;
};
/**
 * 判断浏览器是否支持WebP
 * @returns {boolean}
 */
var checkSupportWebp = function(){
    try{
        return (document.createElement('canvas').toDataURL('image/webp').indexOf('data:image/webp') == 0);
    }catch(err) {
        return  false;
    }
};

//图标
var icon_list_form = [
    {id:'icon-zidingyibankuai',color:'bg-v1-purple'},
    {id:'icon-baoxiao',color:'bg-v1-yellow'},
    {id:'icon-qianbao',color:'bg-v1-yellow'},
    {id:'icon-rili',color:'bg-v2-blue'},
    {id:'icon-gongwenbao',color:'bg-v2-blue'},
    {id:'icon-renyuan',color:'bg-v2-blue'},
    {id:'icon-gengduogongneng',color:'bg-v1-purple'},
    {id:'icon-shuju',color:'bg-v1-yellow'},
    {id:'icon-wenjian',color:'bg-v1-purple'},
    {id:'icon-zhangdan',color:'bg-v1-yellow'},
    {id:'icon-hangzheng',color:'bg-v1-purple'},
    {id:'icon-gongneng',color:'bg-v2-blue'},
    {id:'icon-zhupiaopiaoicon-',color:'bg-v1-yellow'},
    {id:'icon-hangzhenghuafen',color:'bg-v1-purple'},
    {id:'icon-caiwu',color:'bg-v1-yellow'},
    {id:'icon-caiwu1',color:'bg-v2-blue'},
    {id:'icon-caiwu2',color:'bg-v1-yellow'},
    {id:'icon-caiwu3',color:'bg-v1-yellow'},
    {id:'icon-caiwu4',color:'bg-v1-yellow'},
    {id:'icon-caiwu5',color:'bg-v2-blue'},
    {id:'icon-tongji',color:'bg-v1-yellow'},
    {id:'icon-diannao',color:'bg-v2-blue'},
    {id:'icon-qiyeyunicon-',color:'bg-v1-purple'},
    {id:'icon-hangzhengguanli1',color:'bg-v1-purple'},
    {id:'icon-teshudanwei',color:'bg-v2-blue'},
    {id:'icon-hangzhengchufa',color:'bg-v2-blue'},
    {id:'icon-qushi',color:'bg-v1-yellow'},
    {id:'icon-hangzhengquhua',color:'bg-v1-purple'},
    {id:'icon-hetong',color:'bg-v2-blue'},
    {id:'icon-hangzhengguanli',color:'bg-v1-purple'},
    {id:'icon-hangzheng1',color:'bg-v2-blue'},
    {id:'icon-icon-power-shield',color:'bg-v1-purple'},
    {id:'icon-tongji1',color:'bg-v1-yellow'},
    {id:'icon-xiangmu1',color:'bg-v2-blue'}
];

/**
 * 针对左边div高度自适应设定
 * @param $target 左边div
 * @param $left 左边内容div
 * @param $right 右边内容div
 * @param intervalH 内容离导航（navbar-static-top）间隔高度
 * @param isLeftScroll 左边是否滚动
 */
var leftBoxHeightResize = function ($target,$left,$right,intervalH,isLeftScroll) {
    this.$target = $target;
    this.$left = $left;
    this.$right = $right;
    this.intervalH = intervalH;
    this.isLeftScroll = isLeftScroll;
    this.setHeight = function () {
        var _this = this;
        //console.log('setHeight');
        var t = setTimeout(function () {
            _this.$target.removeAttr('style');
            var topHeight = $('.navbar.navbar-static-top').height();
            var navbarHeight = $('nav.navbar-default').height();
            var rightBoxHeight = _this.$right.height();
            var leftBoxHeight = _this.$left.height();
            var windowHeight = $(window).height()-topHeight-_this.intervalH;
            //console.log('/rightBoxHeight='+rightBoxHeight+'/leftBoxHeight='+leftBoxHeight+'/windowHeight='+windowHeight+'/navbarHeight='+navbarHeight)
            if (leftBoxHeight > rightBoxHeight)
                _this.$target.css('height',leftBoxHeight + 'px');

            if (leftBoxHeight <= rightBoxHeight)
                _this.$target.css('height',(rightBoxHeight+10) + 'px');

            if (leftBoxHeight <= windowHeight && rightBoxHeight <= windowHeight)
                _this.$target.css('height',windowHeight + 'px');

            if (leftBoxHeight <= navbarHeight - _this.intervalH && rightBoxHeight <= navbarHeight - _this.intervalH && navbarHeight >= $(window).height()-topHeight)//减去面包屑、内容头部筛选高度
                _this.$target.css('height',(navbarHeight - _this.intervalH) + 'px');

            if ((_this.isLeftScroll==null || _this.isLeftScroll==true) && leftBoxHeight > rightBoxHeight && leftBoxHeight > navbarHeight - _this.intervalH  && leftBoxHeight > windowHeight)
                _this.$target.css('height',(rightBoxHeight>windowHeight?rightBoxHeight:windowHeight) + 'px');

            clearTimeout(t);
        },400);
    };
    this.resize = function () {
        var $this = this;
        $(window).resize(function () {
            $this.setHeight();
        });
    };
    this.init = function () {
        this.setHeight();
        this.resize();
    }
};



//解密方法
function Decrypt(word) {
    var key = CryptoJS.enc.Utf8.parse("1234123412ABCDEF");
    var iv = CryptoJS.enc.Utf8.parse('ABCDEF1234123412');
    var encryptedHexStr = CryptoJS.enc.Hex.parse(word);
    var srcs = CryptoJS.enc.Base64.stringify(encryptedHexStr);
    var decrypt = CryptoJS.AES.decrypt(srcs, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    var decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
    return decryptedStr.toString();
}

//加密方法
function Encrypt(word) {
    var key = CryptoJS.enc.Utf8.parse("1234123412ABCDEF");
    var iv = CryptoJS.enc.Utf8.parse('ABCDEF1234123412');
    var srcs = CryptoJS.enc.Utf8.parse(word);
    var encrypted = CryptoJS.AES.encrypt(srcs, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    return encrypted.ciphertext.toString().toUpperCase();
}


function dragBar(bar,line,callBack){
    var bar = "."+bar;  //进度条背景
    var line = "."+line;  //进度条前景
    var statu = false;  //设置一个监控变量,监控鼠标是否按下

    $(bar).mousedown(function (e) {
        ev(e);  //当鼠标按下时可监听此时的点击横坐标
    });

    $(bar).mouseup(function () {

        var barWidth = $(bar).width();
        var lineWidth = $(line).width();
        var rate = (lineWidth*100/barWidth).toFixed(2);
        if(callBack && statu==true)
            callBack(rate);

        statu = false;  //当鼠标松开时 将监控变量设置为false,表示不可执行鼠标移动事件 mousemove

        return false;
    });

    //执行鼠标移动事件
    $(bar).mousemove(function (e) {
        if (statu === true) {
            //当鼠标移动时可监听此时的移动横坐标,由于这里需要先监控statu的值,所以mousedown和mousemove使用同一个函数里给 statu 赋值为 true对全局的操作不影响
            ev(e);
        }
    });

    //执行事件,mousedown鼠标按下 和 mousemove鼠标移动都执行此函数,所以将其抽出
    function ev(e){
        var eleLeft = $(line).offset().left; //元素距离左侧的距离
        var eventLeft = e.pageX ;//点击事件距离左侧的距离
        var barWidth = $(bar).width();
        var newWidth = eventLeft -eleLeft;
        //当移动的宽度大于进度条背景本身的宽度时,就把前景的宽度设置为最大,防止前景宽度超出背景宽度
        if(eventLeft -eleLeft > $(bar).width()){
            newWidth = barWidth;
        }
        $(line).width(newWidth);
        statu = true;   //当鼠标按时 将监控变量设置为true,表示可执行鼠标移动事件 mousemove

    }
}

/**
 * div增加resize事件
 */
(function($, h, c) {
    var a = $([]),
        e = $.resize = $.extend($.resize, {}),
        i,
        k = "setTimeout",
        j = "resize",
        d = j + "-special-event",
        b = "delay",
        f = "throttleWindow";
    e[b] = 250;
    e[f] = true;
    $.event.special[j] = {
        setup: function() {
            if (!e[f] && this[k]) {
                return false;
            }
            var l = $(this);
            a = a.add(l);
            $.data(this, d, {
                w: l.width(),
                h: l.height()
            });
            if (a.length === 1) {
                g();
            }
        },
        teardown: function() {
            if (!e[f] && this[k]) {
                return false;
            }
            var l = $(this);
            a = a.not(l);
            l.removeData(d);
            if (!a.length) {
                clearTimeout(i);
            }
        },
        add: function(l) {
            if (!e[f] && this[k]) {
                return false;
            }
            var n;
            function m(s, o, p) {
                var q = $(this),
                    r = $.data(this, d);
                r.w = o !== c ? o: q.width();
                r.h = p !== c ? p: q.height();
                n.apply(this, arguments);
            }
            if ($.isFunction(l)) {
                n = l;
                return m;
            } else {
                n = l.handler;
                l.handler = m;
            }
        }
    };
    function g() {
        i = h[k](function() {
                a.each(function() {
                    var n = $(this),
                        m = n.width(),
                        l = n.height(),
                        o = $.data(this, d);
                    if (m !== o.w || l !== o.h) {
                        n.trigger(j, [o.w = m, o.h = l]);
                    }
                });
                g();
            },
            e[b]);
    }
})(jQuery, this);

(function($) {
    $.fn.extend({
        getCurPos: function() {
            var curCurPos = '';
            var all_range = '';
            if (navigator.userAgent.indexOf("MSIE") > -1) {
                if ($(this).get(0).tagName == "TEXTAREA") {
                    all_range = document.body.createTextRange();
                    all_range.moveToElementText($(this).get(0));
                } else {
                    all_range = $(this).get(0).createTextRange();
                }
                $(this).focus();
                var cur_range = document.selection.createRange();
                cur_range.moveEnd('character', -cur_range.text.length);
                cur_range.setEndPoint("StartToStart", all_range);
                curCurPos = cur_range.text.length;
            } else {
                $(this).focus();
                curCurPos = $(this).get(0).selectionStart;
            }
            return curCurPos;
        },
        setCurPos: function(start, end) {
            if (navigator.userAgent.indexOf("MSIE") > -1) {
                var all_range = '';
                if ($(this).get(0).tagName == "TEXTAREA") {
                    all_range = document.body.createTextRange();
                    all_range.moveToElementText($(this).get(0));
                } else {
                    all_range = $(this).get(0).createTextRange();
                }
                $(this).focus();
                all_range.moveStart('character', start);
                all_range.moveEnd('character', -(all_range.text.length - (end - start)));
                all_range.select();
            } else {
                $(this).focus();
                $(this).get(0).setSelectionRange(start, end);
            }
        }
    });
})(jQuery);
