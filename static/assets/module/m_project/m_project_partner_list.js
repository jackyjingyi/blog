/**
 * 基本信息－外部协作单位
 * Created by wrb on 2020/6/18.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_partner_list",
        defaults = {
            title:null,
            isDialog:true,
            projectId:null,
            renderCallBack:null
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
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listProjectPartner;
            option.postData = {projectId:that.settings.projectId};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    var html = template('m_project/m_project_partner_list',{dataList:response.data});
                    $(that.element).html(html);
                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack(response.data);

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


