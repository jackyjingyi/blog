/**
 * 工商信息
 * Created by wrb on 2019/3/1.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_partyA_info",
        defaults = {
            busInformation:null,//工商信息
            companyName:null,//组织名称
            clearOnInit:false,
            popoverClass:null
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

            if($('.m-floating-popover .viewPartyACompany-box').length>0)
                return false;

            if(that.settings.busInformation==null){
                var option = {};
                option.url = restApi.url_enterpriseQueryFull;
                option.classId = that.element;
                option.postData = {
                    name:that.settings.companyName
                };
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        if(response.data && response.data.enterpriseDO)
                            that.popverFun(response.data.enterpriseDO);

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }else{
                that.popverFun(that.settings.busInformation);
            }


        }
        ,popverFun:function ($data) {
            var that = this;
            if(!$data){
                $data = {};
                $data.corpname = that.settings.companyName;
            }
            var html = template('m_projectAdd/m_partyA_info',$data);
            $(that.element).m_floating_popover({
                content: html,
                placement: 'bottom',
                clearOnInit:that.settings.clearOnInit,
                popoverClass:that.settings.popoverClass,
                renderedCallBack: function ($popover)   {

                }
            }, true);
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


