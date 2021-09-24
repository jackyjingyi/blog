/**
 * 资金变动详情
 * Created by wrb on 2020/4/26.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_capital_changes_details",
        defaults = {
            isDialog:true,
            id:null,
            renderCallBack:null,
            closeCallBack:null
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
                var title = that._baseData.exp.submitter + '-' + '费用申请';
                S_layer.dialog({
                    title: title||that._title+'申请',
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
            option.url = restApi.url_getExpApplyDetail;
            option.postData = {
                id:that.settings.id
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    var html = template('m_finance_confirm/m_approval_capital_changes_details', {dataInfo:response.data});
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
