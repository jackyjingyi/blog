/**
 * 人员产值统计-详情
 * Created by wrb on 2020/7/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_stats_user_output_details",
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
            var html = template('m_stats/m_stats_user_output_details',{dataInfo:that.settings.dataInfo,doType:that.settings.doType});
            that.renderDialog(html,function () {

                that.bindClickAction();
            });

        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                var windowWidth = $(window).width();
                var area = ['1200px','700px'];
                if(windowWidth<=1366)
                    area = ['1000px','500px'];



                S_layer.dialog({
                    title: that.settings.title||'个人效能详情',
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
        //事件绑定
        bindClickAction:function(){

            var that = this;
            $(that.element).find('a[data-action]').off('click').bind('click',function(){

                var $this = $(this),
                    dataAction = $this.attr('data-action');

                switch (dataAction) {//切换自己任务订单与总览

                    case 'expander'://折叠与展开

                        if($this.find('span').hasClass('ic-open')){
                            $this.find('span').removeClass('ic-open').addClass('ic-retract');
                        }else{
                            $this.find('span').addClass('ic-open').removeClass('ic-retract');
                        }
                        $this.closest('.panel').find('.panel-body').eq(0).slideToggle();
                        break;
                    case 'projectDetail':

                        var projectId = $this.attr('data-project-id');
                        var projectName = $this.attr('data-project-name');
                        var businessType = $this.attr('businessType');
                        var dataCompanyId = window.currentCompanyId;
                        location.hash = '/project/basicInfoFromStats?id='+projectId+'&projectName='+encodeURI(projectName)+'&dataCompanyId='+dataCompanyId+'&businessType='+businessType;

                        S_layer.close($(that.element));
                        break;

                }
                return false;
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


