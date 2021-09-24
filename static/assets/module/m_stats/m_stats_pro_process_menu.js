/**
 * 项目进度统计-菜单
 * Created by wrb on 2018/1/5.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_stats_pro_process_menu",
        defaults = {
            contentEle:null,
            dataAction:null,
            query:{}
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;
        this._breadcrumb = [];
        this._cookiesMark = 'cookiesData_lastComeInProjectList';
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

            var html = template('m_stats/m_stats_pro_process_menu',{
                businessType:that.settings.query.businessType
            });
            $(that.element).html(html);
            var dataAction = that.settings.dataAction;
            if(isNullOrBlank(dataAction))
                dataAction = $(that.element).find('ul.secondary-menu-ul li:first').attr('id');

            that.switchPage(dataAction);
        }
        //切换页面
        , switchPage: function (dataAction) {
            var that = this;

            switch (dataAction) {
                case 'researchType'://研究类型
                    that.researchTypeList();
                    that._breadcrumb = [{name:'统计管理'},{name:'进度总览'},{name:'创新研究'}];
                    break;
                case 'businessType'://业务类型
                    that.businessTypeList();
                    that._breadcrumb = [{name:'统计管理'},{name:'进度总览'},{name:'业务类型'}];
                    break;
            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //研究类型
        , researchTypeList: function () {
            var options = {}, that = this;
            options.dataAction = 'researchType';
            options.businessType = '2',
            options.query = that.settings.query;
            $(that.element).find('#content-box').m_stats_pro_process(options, true);
        }
        //业务类型
        , businessTypeList:function () {
            var options = {}, that = this;
            options.dataAction = 'businessType';
            options.businessType = '1',
            options.query = that.settings.query;
            $(that.element).find('#content-box').m_stats_pro_process(options, true);
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
