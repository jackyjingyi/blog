/**
 * 任务－横向菜单
 * Created by wrb on 2018/11/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_menu",
        defaults = {
            contentEle:null,
            dataAction:null,
            query:null//URL参数
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._breadcrumb = [];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.initHtmlData();
        }
        //初始化数据并加载模板
        ,initHtmlData:function () {
            var that = this;

            var html = template('m_task/m_task_menu',{companyVersion:window.companyVersion});
            $(that.element).html(html);
            rolesControl();
            var dataAction = that.settings.dataAction;
            if(isNullOrBlank(dataAction))
                dataAction = $(that.element).find('ul.secondary-menu-ul li:first').attr('id');

            that.switchPage(dataAction);
        }
        //tab页切换
        , switchPage: function (dataAction) {

            var that = this;
            switch (dataAction) {
                case 'design'://设计任务
                    that.design();
                    that._breadcrumb = [{name:'我的任务'},{name:'设计任务'}];
                    break;
                case 'light'://费控任务
                    that.light();
                    that._breadcrumb = [{name:'我的任务'},{name:'协同工作项'}];
                    break;
            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //设计任务
        , design: function () {
            var that = this;
            $(that.element).find('#content-box').m_task({},true);
        }
        //费控任务
        , light: function () {
            var that = this;
            $(that.element).find('#content-box').m_task_light({},true);
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
