/**
 * 时间组合筛选
 * Created by wrb on 2018/10/22.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_filter_time_quick",
        defaults = {
            isActiveOne:false,//是否初始化完选择第一个
            isShowClear:true,//时间选择是否展示清空
            selectTimeCallBack:null//时间选择回调
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._timeData = {
            startTime:'',
            endTime:''
        };//选择的时间
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        ,render:function () {
            var that = this;
            var html = template('m_filter/m_filter_time_quick',{});
            $(that.element).html(html);
            that.bindSetTime();
            that.bindChoseTime();
            if(that.settings.isActiveOne)
                $(that.element).find('a[data-action="setTime"]').eq(0).click();
        }
        //快捷时间
        , bindSetTime: function () {
            var that = this;
            $(that.element).find('a[data-action="setTime"]').click(function () {
                var days = $(this).attr('data-days');

                var getPrevDateByDays = function (date,days) {
                    date = new Date(date);
                    date = + date - 1000*60*60*24*days;
                    date = new Date(date);
                    var mon = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
                    var day = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
                    //格式化
                    return date.getFullYear() + "-" + mon + "-" + day;
                };

                var endTime = getNowDate();
                endTime = getPrevDateByDays(endTime,1);

                var startTime = '';//moment(endTime).subtract(days, 'days').format('YYYY-MM-DD');

                if (endTime != null && endTime.indexOf('-') > -1) {

                    startTime = getPrevDateByDays(endTime,parseInt(days)-1);
                }
                that.getDateTime(startTime,endTime);

                $(this).blur();

                $(this).removeClass('btn-default').addClass('btn-primary').siblings().addClass('btn-default').removeClass('btn-primary');

            });

        }
        //时间绑定事件
        , bindChoseTime:function () {
            var that = this;
            $(that.element).find('input[name="startTime"]').off('click').on('click',function () {

                var endTime = $(that.element).find('input[name="endTime"]').val();
                var onpicked =function(dp){

                    that._timeData.startTime = dp.cal.getNewDateStr();
                    that._timeData.endTime = endTime;
                    if(that.settings.selectTimeCallBack)
                        that.settings.selectTimeCallBack(that._timeData);

                };
                WdatePicker({el:this,maxDate:endTime,onpicked:onpicked,isShowClear:that.settings.isShowClear});
            });
            $(that.element).find('input[name="endTime"]').off('click').on('click',function () {

                var startTime = $(that.element).find('input[name="startTime"]').val();
                var onpicked =function(dp){

                    that._timeData.startTime = startTime;
                    that._timeData.endTime = dp.cal.getNewDateStr();
                    if(that.settings.selectTimeCallBack)
                        that.settings.selectTimeCallBack(that._timeData);

                };
                WdatePicker({el:this,minDate:startTime,onpicked:onpicked,isShowClear:that.settings.isShowClear});
            });
            $(that.element).find('i.fa-calendar').off('click').on('click',function () {
                $(this).closest('.input-group').find('input').click();
            });


        }

        ,getDateTime:function (startTime,endTime) {
            var that = this;

            $(that.element).find('#ipt_startTime').val(startTime);
            $(that.element).find('#ipt_endTime').val(endTime);

            that._timeData.startTime = startTime;
            that._timeData.endTime = endTime;

            if(that.settings.selectTimeCallBack)
                that.settings.selectTimeCallBack(that._timeData);
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
