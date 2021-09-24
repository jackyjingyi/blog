/**
 *  权限配置-tab切换
 * Created by wrb on 2019/7/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_tab",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._companyVersion = window.companyVersion;
        this._selectedRole = null;//选中的角色对象
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        }
        ,renderPage: function () {

            var that = this;
            var html = template('m_role/m_role_tab', {companyVersion:that._companyVersion});
            $(that.element).html(html);
            $(that.element).find('#roleContentBox').m_role({isAddUser:1},true);
            $(that.element).find('.dropdown-menu a').on('click',function () {

                var text = $(this).text(),type = $(this).attr('data-type');

                $(that.element).find('button[data-toggle="dropdown"] span').eq(0).html(text);

                if(type==3){

                    $(that.element).find('#roleContentBox').m_role_manager_settings({},true);

                }else{

                    $(that.element).find('#roleContentBox').m_role({isAddUser:1,doType:type},true);
                }
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
