/**
 * 项目信息－生产安排-左tab内容
 * Created by wrb on 2019/11/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_left_tab",
        defaults = {
            projectId:null,
            projectName:null,
            renderCallBack:null,
            dataCompanyId:null//视图组织ID
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
            that.getData(function (data) {
                var html = template('m_production/m_production_left_tab',{
                    projectId:that.settings.projectId,
                    projectName:encodeURI(that.settings.projectName),
                    dataCompanyId:that.settings.dataCompanyId,
                    dataList:data
                });
                $(that.element).html(html);
                if(that.settings.renderCallBack)
                    that.settings.renderCallBack(data);
            });
        }
        //渲染列表
        ,getData:function (callBack) {
            var that = this;
            var options={};
            options.classId = '#content-right';
            options.url=restApi.url_listTaskOrderForProduct;
            options.postData = {};
            options.postData.projectId = that.settings.projectId;

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    that._dataInfo = response.data;
                    if(callBack)
                        callBack(response.data);

                }else {
                    S_layer.error(response.info);
                }
            })
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
