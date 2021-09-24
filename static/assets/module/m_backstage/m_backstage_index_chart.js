/**
 * 控制台-账号、空间报表
 * Created by wrb on 2019/1/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_backstage_index_chart",
        defaults = {
            isDialog:true,
            doType: 1// 1=账号使用情况,2=空间使用情况
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._title = this.settings.doType==1?'账号使用情况':'空间使用情况';
        this._label = this.settings.doType==1?'已使用账号':'已使用空间';
        this._unit = this.settings.doType==1?'人':'M';
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_backstage/m_backstage_index_chart', {});
            that.renderDialog(html,function () {


                that.getData(function (data) {
                    that.renderBarChart(data);
                });
            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that._title||'账号使用情况',
                    area : ['1000px','600px'],
                    maxmin : true,
                    content:html,
                    cancelText:'关闭',
                    cancel:function () {
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
        ,getData:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_queryAccountStatement;

            if(that.settings.doType==2)
                option.url = restApi.url_querySpaceStatement;

            m_ajax.postJson(option,function (response) {
                if(response.code == '0'){

                    if(callBack)
                        callBack(response.data);

                }else{
                    S_layer.error(response.info);
                }
            })
        }
        //生成barChart
        ,renderBarChart:function (barData) {
            var that = this;
            var option = {
                color: ['#3398DB'],
                tooltip : {


                },
                grid: {
                    left: '1%',
                    right: '1%',
                    bottom: '1%',
                    containLabel: true
                },
                legend: {
                    data:[that._label]
                },
                xAxis : [
                    {
                        type : 'category',
                        data : barData.companyNameList,
                        axisTick: {
                            alignWithLabel: true
                        },
                        axisLabel: {
                            interval:0,
                            rotate:60
                        }
                    }
                ],
                yAxis : [
                    {
                        name: '单位('+that._unit+')',
                        type : 'value',
                        minInterval: that.settings.doType==1?1:0
                    }
                ],
                series : [
                    {
                        name:that._label,
                        type:'bar',
                        //barWidth: '60%',
                        barMaxWidth:'50',
                        itemStyle:{
                            normal: {
                                barBorderColor: 'rgba(0,0,0,0)',
                                color: '#3398DB'
                            },
                            emphasis: {
                                barBorderWidth: 1,
                                shadowBlur: 1,
                                shadowOffsetX: 0,
                                shadowOffsetY: 0,
                                shadowColor: 'rgba(0,0,0,0.5)'
                            }
                        },
                        label: {
                            normal: {
                                show: true,
                                position: 'inside'
                            }
                        },
                        data:barData.countList
                    }
                ]
            };
            echarts.init(document.getElementById('barChart')).setOption(option);
        }


    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
