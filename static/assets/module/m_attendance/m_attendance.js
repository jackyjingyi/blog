/**
 * 考勤主页
 * Created by wrb on 2018/10/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_attendance",
        defaults = {};

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyId = window.currentCompanyId;
        this._chart = null;
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        , render: function () {
            var that = this;

            var html = template('m_attendance/m_attendance', {});
            $(that.element).html(html);


            $(that.element).find('#filterTimeBox').m_filter_time_quick({
                isActiveOne:true,
                isShowClear:false,
                selectTimeCallBack:function (data) {
                    //console.log(data);
                    that.getChartData(function (data) {
                        that.renderChart(data);
                    });
                }
            },true);

            that.getAbnormalNum();
            that.getChartData(function (data) {
                that.renderChart(data);
            });
            rolesControl();
        }
        //获取考勤异常数据
        ,getAbnormalNum:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_abnormalNum + '/' + that._currentCompanyId;
            m_ajax.get(option, function (response) {
                if (response.code == '0') {

                    $(that.element).find('#abnormalNum').html(response.data);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //请求chart数据
        ,getChartData:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_listExceptionData;
            option.postData = {};

            var startDate = $(that.element).find('input[name="startTime"]').val();
            var endDate = $(that.element).find('input[name="endTime"]').val();

            if(startDate!='')
                option.postData.startDate = startDate;
            if(endDate!='')
                option.postData.endDate = endDate;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,renderChart:function (data) {
            var that = this;

            if(that._chart!=null)
                echarts.destroy();

            var option = {
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        animation: false
                    }
                },
                legend: {
                    data:['考勤异常']
                },
                grid: {
                    left: '2%',
                    right: '2%',
                    bottom: '1%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: data.monthList,
                    axisLabel: {
                        //interval:0,
                        rotate:0
                    }
                },
                yAxis: {
                    name: '异常次数',
                    type: 'value',
                    minInterval: 1
                },
                series: [{
                    name:'考勤异常',
                    data: data.dataList,
                    type: 'line',
                    areaStyle: {}
                }]
            };

            that._chart = echarts.init(document.getElementById('chart1')).setOption(option);

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