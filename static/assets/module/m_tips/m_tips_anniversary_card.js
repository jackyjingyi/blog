/**
 * 周年贺卡
 * Created by wrb on 2020/3/13.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_tips_anniversary_card",
        defaults = {
            isDialog:true,
            yearNum:1

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
            var html = template('m_tips/m_tips_anniversary_card', {
                userInfo:window.userInfo,
                companyInfo:window.companyInfo,
                companyUserInfo:window.companyUserInfo,
                yearNum:that.settings.yearNum
            });
            that.renderDialog(html,function () {

            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'周年贺卡',
                    area : ['700px','440px'],
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
