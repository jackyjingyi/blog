/**
 * 添加打卡时间
 * Created by wrb on 2018/10/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_attendance_time_add",
        defaults = {
            isDialog:true,
            dataInfo:null,//打卡时间总数据
            itemKey:null,//记录当前编辑的打卡时段
            ruleType:null,//1=固定时间上下班 ,2=按班次上下班
            okCallBack:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        , render: function () {
            var that = this;
            //编辑情况下
            var dataItem = null;
            //获取当前编辑数据对象
            if(that.settings.itemKey!=null)
                dataItem = getObjectInArray(that.settings.dataInfo,that.settings.itemKey,'itemKey');

            var html = template('m_attendance/m_attendance_time_add', {ruleType:that.settings.ruleType,dataInfo:dataItem});
            that.renderPage(html,function () {

                that.initICheck();
                that.initSelect();
                that.initSelectHHMM();
                that.bindActionClick();
                that.ok_validate();

                if(that.settings.dataInfo==null || that.settings.dataInfo.length==0){
                    $(that.element).find('input[name="workDays"]').each(function (i) {
                        if($(this).val()-0<=5)
                            $(this).iCheck('check');
                    })
                }else{

                    $.each(that.settings.dataInfo,function (i,item) {

                        //编辑下，其他设置的打卡时段disable
                        if(that.settings.itemKey!=null && that.settings.itemKey==item.itemKey)
                            return true;

                        $.each(item.workDays,function (si,sitem) {
                            //$(that.element).find('input[name="workDays"][value="'+sitem+'"]').iCheck('check');
                            $(that.element).find('input[name="workDays"][value="'+sitem+'"]').iCheck('disable');
                        })
                    })
                }

                //编辑情况下
                if(that.settings.itemKey!=null){
                    //获取当前编辑数据对象
                    //var dataItem = getObjectInArray(that.settings.dataInfo,that.settings.itemKey,'itemKey');

                    $.each(dataItem.workDays,function (i,item) {
                        $(that.element).find('input[name="workDays"][value="'+item+'"]').iCheck('check');
                    });
                    $(that.element).find('select[name="elasticTime"]').val(dataItem.elasticTime).trigger('change');
                    $(that.element).find('select[name="limitClock"]').val(dataItem.limitClock).trigger('change');
                    if(dataItem.isNotClockOff!=null && dataItem.isNotClockOff == '1')
                        $(that.element).find('input[name="isNotClockOff"]').iCheck('check');

                    $.each(dataItem.timeList,function (i,item) {
                        var startTimeArr = item.startTime.split(':');
                        var endTimeArr = item.endTime.split(':');
                        var $row = $(that.element).find('.row.time-list-row').eq(i);

                        if(i<dataItem.timeList.length-1)
                            $row.find('button[data-action="addTimeField"]').click();

                        $row.find('select[name="selectStaHH"]').val(startTimeArr[0]).trigger('change');
                        $row.find('select[name="selectStaMM"]').val(startTimeArr[1]).trigger('change');
                        $row.find('select[name="selectEndHH"]').val(endTimeArr[0]).trigger('change');
                        $row.find('select[name="selectEndMM"]').val(endTimeArr[1]).trigger('change');
                    })
                }

            });
        }
        //渲染界面
        ,renderPage:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title|| '添加打卡时间',
                    area : '750px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        if($(that.element).find('.attendance-time-box label.error').length>0){
                            S_toastr.error('时间段区间设置不符合');
                            return false;
                        }
                        var flag = $(that.element).find('form').valid();
                        if (!flag) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        var data = $(that.element).find('form').serializeObject();
                        var timeList = [];
                        $(that.element).find('.row.time-list-row').each(function () {
                            timeList.push({
                                startTime:$(this).find('select[name="selectStaHH"]').val()+':'+$(this).find('select[name="selectStaMM"]').val(),
                                endTime:$(this).find('select[name="selectEndHH"]').val()+':'+$(this).find('select[name="selectEndMM"]').val()
                            });
                        });
                        data.timeList = timeList;
                        data.itemKey = that.settings.itemKey || UUID.genV4().hexNoDelim;
                        if(that.settings.okCallBack)
                            that.settings.okCallBack(data);

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //初始化iCheck
        ,initICheck:function () {
            var that = this;
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });
        }
        //初始化select
        ,initSelect:function () {
            var that = this;
            $(that.element).find('select.select-control').select2({
                allowClear: false,
                language: "zh-CN",
                minimumResultsForSearch: Infinity
            });
        }
        //初始化时间select
        ,initSelectHHMM:function ($ele) {
            var that = this;
            if($ele==null)
                $ele = $(that.element);

            var hhList = [],mmList = [];
            for (var i=0;i<24;i++){
                var text = '';
                if((i+'').length==1){
                    text = '0'+i;
                }else{
                    text = ''+i;
                }
                hhList.push({id:text,text:text});
            }

            $ele.find('select[name="selectStaHH"],select[name="selectEndHH"]').select2({
                allowClear: false,
                language: "zh-CN",
                minimumResultsForSearch: Infinity,
                width:'44px',
                data: hhList
            });

            var staHH = '09',endHH = '18';
            //获取上个时段
            var $lastEle = $ele.prev('.time-list-row');
            if($lastEle.length>0){
                var lastEndHH = $lastEle.find('select[name="selectEndHH"]').val();
                staHH = lastEndHH -0 + 1;

                var $hhmm = $(that.element).find('.attendance-time-box .out-hh-mm');
                var firstHH = $hhmm.eq(0).find('select[name="selectStaHH"]').val();
                var lastHH = $hhmm.eq($hhmm.length-3).find('select[name="selectEndHH"]').val();

                var interval = Math.abs(parseInt(firstHH) - parseInt(lastHH));
                if(interval<6 && interval>2){
                    endHH = firstHH -0 - 1;
                }else{
                    endHH = lastEndHH -0 + 5;
                }

                if(staHH>=24)
                    staHH = staHH - 24;

                if(endHH>=24)
                    endHH = endHH - 24;

                if((staHH+'').length==1)
                    staHH = '0' + staHH;

                if((endHH+'').length==1)
                    endHH = '0' + endHH;
            }

            $ele.find('select[name="selectStaHH"]').val(staHH).trigger('change');
            $ele.find('select[name="selectEndHH"]').val(endHH).trigger('change');

            $ele.find('select[name="selectStaHH"]').change(function () {
                that.judgingTimeRationality();
            });
            $ele.find('select[name="selectEndHH"]').change(function () {
                that.judgingTimeRationality();
            });
            $ele.find('select[name="selectStaMM"]').change(function () {
                that.judgingTimeRationality();
            });
            $ele.find('select[name="selectEndMM"]').change(function () {
                that.judgingTimeRationality();
            });

            for (var i=0;i<=59;i++){
                var text = '';
                if((i+'').length==1){
                    text = '0'+i;
                }else{
                    text = ''+i;
                }
                mmList.push({id:text,text:text});
            }
            $ele.find('select[name="selectStaMM"],select[name="selectEndMM"]').select2({
                allowClear: false,
                language: "zh-CN",
                minimumResultsForSearch: Infinity,
                width:'44px',
                data: mmList
            });
            $ele.find('select[name="selectStaMM"],select[name="selectEndMM"]').val('00').trigger('change');

            $ele.find('button[data-action="delTimeField"]').off('click').on('click',function () {

                /*if(!$(this).next('button').hasClass('hide'))
                    $(this).closest('.row').prev().find('button[data-action="addTimeField"]').removeClass('hide');

                if($(this).closest('.row').prevAll('.row').length==1)
                    $(this).closest('.row').prev().find('button[data-action="delTimeField"]').addClass('hide');*/

                $(this).closest('.row').remove();
                var rowLen = $(that.element).find('.row.time-list-row').length;
                $(that.element).find('.row.time-list-row').each(function (i) {

                    if(rowLen==1 && i==0){
                        $(this).find('button[data-action="delTimeField"]').addClass('hide');
                        $(this).find('button[data-action="addTimeField"]').removeClass('hide');
                    }
                    if(rowLen>1 && i==0){
                        $(this).find('button[data-action="delTimeField"]').removeClass('hide');
                        $(this).find('button[data-action="addTimeField"]').addClass('hide');
                    }
                    if(rowLen==i+1){
                        $(this).find('button[data-action="addTimeField"]').removeClass('hide');
                    }
                });
                that.judgingTimeRationality();
                return false;
            });
            $ele.find('button[data-action="addTimeField"]').off('click').on('click',function () {
                that.addTimeField($(this));
                return false;
            });
        }
        //添加时段
        ,addTimeField:function ($add) {
            var that = this;

            var $hhmm = $(that.element).find('.attendance-time-box .out-hh-mm');
            var firstHH = $hhmm.eq(0).find('select[name="selectStaHH"]').val();
            var lastHH = $hhmm.eq($hhmm.length-1).find('select[name="selectEndHH"]').val();

            if($(that.element).find('.attendance-time-box .time-list-row').length>=4){
                S_toastr.error('请设置四段时段或以内');
                return false;
            }
            if($(that.element).find('.attendance-time-box .time-list-row').length>1 && Math.abs(parseInt(firstHH) - parseInt(lastHH)) <= 2){
                S_toastr.error('请设置的总时间段在一天之内');
                return false;
            }

            var $row = $add.closest('.row');
            $row.find('button[data-action="delTimeField"]').removeClass('hide');
            var $cloneRow = $row.clone();
            $cloneRow.find('button[data-action="delTimeField"]').removeClass('hide');
            //$cloneRow.find('select').select2('destroy').empty();
            $cloneRow.find('select').next('span').remove();
            $cloneRow.appendTo($row.parent());
            $row.find('button[data-action="addTimeField"]').addClass('hide');
            that.initSelectHHMM($cloneRow);
            return false;
        }
        //判断时间合理性(一天时间内区间不能冲突)
        ,judgingTimeRationality:function () {
            var that = this;
            $(that.element).find('.attendance-time-box .error').remove();
            //new Date(Date.parse(('2018-10-22 15:24').replace(/-/g, "/"))).getTime();

            var getNextDay = function (d) {

                d = new Date(d);
                d = +d + 1000*60*60*24;
                d = new Date(d);
                //return d;
                //格式化
                return d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
            };
            var nextDay=0;
            var nowDate = getNowDate();
            var nextDate = getNextDay(nowDate);
            var endPointTimestamp = 0;//终点时间戳(距离开始时间一天后)
            $(that.element).find('.attendance-time-box .time-list-row').each(function (i) {
                var staHH = $(this).find('select[name="selectStaHH"]').val();
                var endHH = $(this).find('select[name="selectEndHH"]').val();
                var staMM = $(this).find('select[name="selectStaMM"]').val();
                var endMM = $(this).find('select[name="selectEndMM"]').val();
                var $prevTime = $(this).prev('.time-list-row');

                //转为时间戳
                var startTimestamp = 0,endTimestamp = 0,lastEndTimestamp = 0;

                if(i==0){

                    startTimestamp = nowDate + ' ' + staHH + ':' + staMM;
                    endPointTimestamp = nextDate + ' ' + staHH + ':' + staMM;
                    endPointTimestamp =  new Date(Date.parse(endPointTimestamp.replace(/-/g, "/"))).getTime();
                    if(parseInt(endHH)-parseInt(staHH)<0){
                        endTimestamp = nextDate + ' ' + endHH + ':' + endMM;
                        nextDay++;//用于标识进入第二天
                    }else{
                        endTimestamp = nowDate + ' ' + endHH + ':' + endMM;
                    }

                    startTimestamp = new Date(Date.parse(startTimestamp.replace(/-/g, "/"))).getTime();
                    endTimestamp = new Date(Date.parse(endTimestamp.replace(/-/g, "/"))).getTime();
                    if(endTimestamp-startTimestamp<=0){
                        $(this).find('button:last').after('<label class="error">应晚于上班时间</label>');
                        return true;
                    }
                }else{

                    var lastEndHH = $prevTime.find('select[name="selectEndHH"]').val();
                    var lastEndMM = $prevTime.find('select[name="selectEndMM"]').val();

                    if(nextDay>0){

                        startTimestamp = nextDate + ' ' + staHH + ':' + staMM;
                        endTimestamp = nextDate + ' ' + endHH + ':' + endMM;
                        lastEndTimestamp  = nextDate + ' ' + lastEndHH + ':' + lastEndMM;

                    }else{

                        //与上个下班时间比较
                        if(parseInt(staHH)-parseInt(lastEndHH)<0){
                            startTimestamp = nextDate + ' ' + staHH + ':' + staMM;
                            endTimestamp = nextDate + ' ' + endHH + ':' + endMM;
                            lastEndTimestamp  = nowDate + ' ' + lastEndHH + ':' + lastEndMM;
                            nextDay++;//用于标识进入第二天
                        }else{
                            startTimestamp = nowDate + ' ' + staHH + ':' + staMM;
                            lastEndTimestamp  = nowDate + ' ' + lastEndHH + ':' + lastEndMM;
                            if(parseInt(endHH)-parseInt(staHH)<0){
                                endTimestamp = nextDate + ' ' + endHH + ':' + endMM;
                                nextDay++;//用于标识进入第二天
                            }else{
                                endTimestamp = nowDate + ' ' + endHH + ':' + endMM;
                            }
                        }
                    }
                    startTimestamp = new Date(Date.parse(startTimestamp.replace(/-/g, "/"))).getTime();
                    endTimestamp = new Date(Date.parse(endTimestamp.replace(/-/g, "/"))).getTime();
                    lastEndTimestamp = new Date(Date.parse(lastEndTimestamp.replace(/-/g, "/"))).getTime();

                    if(startTimestamp-lastEndTimestamp<=0 || endPointTimestamp-startTimestamp<=0){
                        $(this).find('button:last').after('<label class="error">应晚于上段下班时间</label>');
                        return true;
                    }
                    if(endTimestamp-startTimestamp<=0){
                        $(this).find('button:last').after('<label class="error">应晚于上班时间</label>');
                        return true;
                    }
                    if(endPointTimestamp-endTimestamp<=0){
                        $(this).find('button:last').after('<label class="error">总时间区间不能大于一天</label>');
                        return true;
                    }

                }
            });
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action="advancedSettings"]').off('click').on('click',function (e) {
                if($(that.element).find('div[data-type="advancedSettings"]').eq(0).hasClass('hide')){
                    $(that.element).find('div[data-type="advancedSettings"]').removeClass('hide');
                }else{
                    $(that.element).find('div[data-type="advancedSettings"]').addClass('hide');
                }
                return false;
                stopPropagation(e);
            });
        }
        //表单验证
        ,ok_validate:function(){
            var that = this;
            $(that.element).find('form.form-horizontal').validate({
                rules: {
                    workDays: {
                        required: true
                    },
                    classesName: {
                        required: true
                    }
                },
                messages: {
                    workDays: {
                        required: '请选择工作日'
                    },
                    classesName: {
                        required: '请输入班次名称'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
            });
        }
    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
