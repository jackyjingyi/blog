/**
 * 时间筛选
 * Created by wrb on 2019/6/29.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_filter_time_new",
        defaults = {
            label:null,
            type:1,//1=时间，2=年，3=月份
            defaultData:null,//默认值
            okCallBack:null,//选择回调
            changedCallBack:null//时间变化回调
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._timeData = {};

        this._timePeriodList = [];//时间段列表
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        ,render: function () {
            var that = this;

            var currentYear = new Date().getFullYear();
            var yearList = [];
            yearList.push(currentYear);
            for(var i=1;i<4;i++){
                yearList.push(currentYear-i);
            }
            var html = template('m_filter/m_filter_time_new',{
                yearList:yearList,
                label:that.settings.label,
                type:that.settings.type
            });
            $(that.element).html(html);
            that.bindSetTime();
            that.timeMatchByYear();
        }
        ,bindSetTime:function () {
            var that = this;
            $(that.element).find('a[data-click-action="setTime"]').click(function () {
                var days = $(this).attr('data-days');

                var timeFormat = 'YYYY-MM-DD';
                if(that.settings.type==3){
                    timeFormat =  'YYYY-MM';
                }

                var startTime = '';
                var endTime = '';
                if(days=='30'){
                    startTime =  moment(new Date()).subtract(1,'months').format('YYYY-MM-DD');
                    endTime = moment(new Date()).format(timeFormat);
                }else if(days=='90'){
                    startTime =  moment(new Date()).subtract(3,'months').format('YYYY-MM-DD');
                    endTime = moment(new Date()).format(timeFormat);
                }else if(days=='180'){
                    startTime =  moment(new Date()).subtract(6,'months').format('YYYY-MM-DD');
                    endTime = moment(new Date()).format(timeFormat);
                }else{
                    var timePeriod = that.getTimePeriod(days);
                    startTime = timePeriod.startTime;
                    endTime = timePeriod.endTime;
                }

                $(this).addClass('fc-v1-blue').siblings().removeClass('fc-v1-blue');

                if(that.settings.type==2){

                    $(that.element).find('#ipt_year').val(days+'年');
                }

                var flag1 = that.setTimeValChange($(that.element).find('#ipt_startTime'),startTime,0);
                var flag2 = that.setTimeValChange($(that.element).find('#ipt_endTime'),endTime,0);
                if(flag1 || flag2){//执行一次change事件
                    $(that.element).find('#ipt_endTime').change();
                }
            });

            $(that.element).find('#ipt_startTime').on('click',function () {

                var endTime = $(that.element).find('input#ipt_endTime').val();
                var onpicked =function(dp){

                    that.timeMatchChange();
                    //console.log(dp.cal.oldValue)
                    //console.log(dp.cal.getNewDateStr())
                    if(dp.cal.oldValue!=dp.cal.getNewDateStr())
                        $(that.element).find('#ipt_startTime').change();


                };
                if(that.settings.type==3){
                    WdatePicker({el:this,dateFmt:'yyyy-MM',maxDate:endTime,onpicked:onpicked});
                }else{
                    WdatePicker({el:this,dateFmt:'yyyy-MM-dd',maxDate:endTime,onpicked:onpicked});
                }

            });
            $(that.element).find('#ipt_endTime').on('click',function () {

                var startTime = $(that.element).find('input#ipt_startTime').val();
                var onpicked =function(dp){
                    that.timeMatchChange();
                    if(dp.cal.oldValue!=dp.cal.getNewDateStr())
                        $(that.element).find('#ipt_endTime').change();
                };

                if(that.settings.type==3){
                    WdatePicker({el:this,dateFmt:'yyyy-MM',minDate:startTime,onpicked:onpicked});
                }else{
                    WdatePicker({el:this,dateFmt:'yyyy-MM-dd',minDate:startTime,onpicked:onpicked});
                }
            });
            $(that.element).find('#ipt_year').on('click',function () {

                var onpicked =function(dp){

                    var startTime = '',endTime = '';
                    var year = dp.cal.getNewDateStr().substring(0,4)-0;
                    var currentYear = new Date().getFullYear();
                    startTime = year+'-01-01';
                    if(year==currentYear){//当前年
                        endTime = getNowDate();
                    }else{
                        endTime = year+'-12-'+getLastDay(year,12)
                    }
                    //$(that.element).find('#ipt_startTime').val(startTime).change();
                    //$(that.element).find('#ipt_endTime').val(endTime).change();

                    var flag1 = that.setTimeValChange($(that.element).find('#ipt_startTime'),startTime,0);
                    var flag2 = that.setTimeValChange($(that.element).find('#ipt_endTime'),endTime,0);
                    if(flag1 || flag2){//执行一次change事件
                        $(that.element).find('#ipt_endTime').change();
                    }
                };
                WdatePicker({el:this,dateFmt:'yyyy年',onpicked:onpicked})
            });

        }
        //时间匹配年份
        ,timeMatchByYear:function () {
            var that = this;

            $(that.element).find('a[data-click-action="setTime"]').each(function () {

                var $this = $(this),days = $this.attr('data-days');
                /*var timePeriod = that.getTimePeriod(days);
                timePeriod.days = days;
                that._timePeriodList.push(timePeriod);*/

                var startTime = '';
                var endTime = '';
                if(days=='30'){
                    startTime =  moment(new Date()).subtract(1,'months').format('YYYY-MM-DD');
                    endTime = moment(new Date()).format('YYYY-MM-DD');
                }else if(days=='90'){
                    startTime =  moment(new Date()).subtract(3,'months').format('YYYY-MM-DD');
                    endTime = moment(new Date()).format('YYYY-MM-DD');
                }else if(days=='180'){
                    startTime =  moment(new Date()).subtract(6,'months').format('YYYY-MM-DD');
                    endTime = moment(new Date()).format('YYYY-MM-DD');
                }else{
                    var timePeriod = that.getTimePeriod(days);
                    startTime = timePeriod.startTime;
                    endTime = timePeriod.endTime;
                }
                that._timePeriodList.push({
                    startTime:startTime,
                    endTime:endTime,
                    days:days
                });
            });
            $(that.element).find('input#ipt_startTime,input#ipt_endTime').bind("input propertychange change",function(event){

                that.timeMatchChange();
                if(that.settings.changedCallBack)
                    that.settings.changedCallBack();

            });
        }
        ,timeMatchChange:function () {
            var that = this;
            //console.log('time input propertychange change2');
            var startTime = $(that.element).find('input#ipt_startTime').val();
            var endTime = $(that.element).find('input#ipt_endTime').val();
            var days = '';
            $.each(that._timePeriodList,function (i,item) {

                if(item.startTime==startTime && item.endTime==endTime){
                    days = item.days;
                    return false;
                }
            });
            $(that.element).find('a[data-click-action="setTime"]').removeClass('fc-v1-blue');
            if(!isNullOrBlank(days))
                $(that.element).find('a[data-click-action="setTime"][data-days="'+days+'"]').addClass('fc-v1-blue');
        }
        //根据类型获取开始时间，结束时间
        ,getTimePeriod:function (days) {
            var that = this;
            var startTime = '',endTime = getNowDate();
            var month = endTime.substring(5, 7) - 0;//当前月份

            if (days == 30) {//一个月

                startTime = endTime.substring(0, 8) + '01';

            } else if (days == 90) {//一季度

                if (month >= 1 && month <= 3) {//第一季度
                    startTime = endTime.substring(0, 5) + '01-01';
                } else if (month >= 4 && month <= 6) {//第二季度
                    startTime = endTime.substring(0, 5) + '04-01';
                } else if (month >= 7 && month <= 9) {//第三季度
                    startTime = endTime.substring(0, 5) + '07-01';
                } else if (month >= 10 && month <= 12) {//第四季度
                    startTime = endTime.substring(0, 5) + '10-01';
                }

            } else if (days == 180) {//半年

                if (month >= 1 && month <= 6) {//前半年
                    startTime = endTime.substring(0, 5) + '01-01';
                } else if (month >= 7 && month <= 12) {//后半年
                    startTime = endTime.substring(0, 5) + '07-01';
                }

            } else{

                var currentYear = new Date().getFullYear();
                startTime = days+'-01-01';

                if(currentYear==days){//当前年
                    endTime = getNowDate();
                }else{
                    endTime = days+'-12-'+getLastDay(days,12)
                }
            }

            if(that.settings.type==3){
                startTime = startTime.substring(0,7);
                endTime = endTime.substring(0,7);
            }

            var data = {
                startTime:startTime,
                endTime:endTime
            };
            return data;
        }
        //清空时间
        ,clearTime:function () {
            var that = this;
            $(that.element).find('a[data-click-action="setTime"]').removeClass('fc-v1-blue');
            $(that.element).find('#ipt_startTime,#ipt_endTime,#ipt_year').val('');
            $(that.element).find('#ipt_endTime').change();
        }
        //获取时间
        ,getTimeData:function () {
            var that = this;
            var result = {};

            var $selectedTime = $(that.element).find('a.fc-v1-blue[data-click-action="setTime"]');
            var days = $selectedTime.attr('data-days');

            if(isNullOrBlank(days)){//在匹配一次
                that.timeMatchChange();
                result.days = $(that.element).find('a.fc-v1-blue[data-click-action="setTime"]').text();
            }
            if(!isNullOrBlank(days) && days!='30' && days!='90' && days!='180'){
                result.days = $selectedTime.text();
            }

            if(that.settings.type==2)
                result.days = $(that.element).find('#ipt_year').val();

            result.startTime = $(that.element).find('#ipt_startTime').val();
            result.endTime = $(that.element).find('#ipt_endTime').val();

            if(!isNullOrBlank(result.startTime) && result.startTime.length==7){//月份开始时间
                result.startTime = moment(result.startTime).startOf('month').format("YYYY-MM-DD");
            }
            if(!isNullOrBlank(result.endTime) && result.endTime.length==7){//月份结束时间
                result.endTime = moment(result.endTime).endOf('month').format("YYYY-MM-DD");
            }

            return result;
        }
        //设置时间
        ,setTime:function (data) {
            var that = this;

            if(!isNullOrBlank(data.startTime)){
                that.setTimeValChange($(that.element).find('#ipt_startTime'),data.startTime,data.isChange);
            }
            if(!isNullOrBlank(data.endTime)){
                that.setTimeValChange($(that.element).find('#ipt_endTime'),data.endTime,data.isChange);
            }
            if(!isNullOrBlank(data.year)){
                that.setTimeValChange($(that.element).find('#ipt_year'),data.year,data.isChange);
            }
        }
        //设置时间(type不为0触发change事件)
        ,setTimeValChange:function ($time,newVal,type) {
            var isChange = true;
            if($time.val()!=newVal){
                $time.val(newVal);
            }else{
                isChange = false;
            }
            if(isChange && type!=0){
                $time.change();
            }
            return isChange;
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
