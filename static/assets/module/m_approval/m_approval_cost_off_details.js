/**
 * 核销详情
 * Created by wrb on 2019/11/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_cost_off_details",
        defaults = {
            isDialog:true,
            id:null,
            saveCallBack:null,
            renderCallBack:null,
            doType: 1
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._baseData = null;
        this._currentCompanyUserId = window.currentCompanyUserId;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderContent();

        }
        //渲染弹窗
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑
                S_layer.dialog({
                    title: '费用核销',
                    area : '980px',
                    fixed:true,
                    //scrollbar:false,
                    btn : false,
                    content:html

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    S_layer.resize(layero,index,dialogEle);

                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
            }
        }
        //渲染内容
        ,renderContent:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getVerificationReceiptsDetail;
            option.postData = {
                id:that.settings.id
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._baseData = response.data;
                    that._baseData.currentCompanyUserId = that._currentCompanyUserId;
                    var html = template('m_approval/m_approval_cost_off_details', that._baseData);
                    that.renderDialog(html);
                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack();

                } else {
                    S_layer.error(response.info);
                }
            });
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
