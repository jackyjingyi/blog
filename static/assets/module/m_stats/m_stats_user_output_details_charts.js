/**
 * 人员产值统计-详情
 * Created by wrb on 2020/7/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_stats_user_output_details_charts",
        defaults = {
            title:null,
            isDialog:true,
            doType:1,//人员产值统计,2=院长产值统计
            dataInfo:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var data =[];
            var colors =[];


            var html = template('m_stats/m_stats_user_output_details_charts',{});
            that.renderDialog(html,function () {
                that.renderChart(data,colors,'chartArea3');
            });

        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                var windowWidth = $(window).width();
                var area = ['500px','350px'];


                S_layer.dialog({
                    title: that.settings.title||'',
                    area : area,
                    content:html,
                    cancel:function () {
                    },
                    cancelText:'关闭'

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    //S_layer.resize(layero,index,dialogEle);
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        },
        renderChart:function (data,colors,id) {
        var that = this;
        var option = {

            tooltip: {
                trigger: 'item'
            },
            legend: {
                show:true,
                orient: 'vertical',
                left: 'right',
            },

            series: [
                {
                    name: '项目类型',
                    type: 'pie',
                    radius: '80%',
                    data: that.settings.typeList,
                    itemStyle: {
                        borderRadius: 0,
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)',
                        }
                    }
                }
            ],
            color: ['#5470c6','#91cc75','#fac858','#ee6666','#73c0de','#3ba272','#fc8452','#9a60b4','#ea7ccc']

        };
        var chart = echarts.init(document.getElementById(id));
        chart.setOption(option);
        //window.onresize = chart.resize;
        window.addEventListener('resize', function () {
            chart.resize();
        });
    }


    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);


