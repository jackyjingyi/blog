/**
 * 财务设置－TAB菜单
 * Created by wrb on 2018/5/22.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_finance_settings_menu",
        defaults = {
            contentEle:null,
            dataAction:null,
            query:null
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
            var html = template('m_finance/m_finance_settings_menu',{});
            $(that.element).html(html);
            rolesControl();
            var dataAction = that.settings.dataAction;
            if(isNullOrBlank(dataAction))
                dataAction = $(that.element).find('ul.secondary-menu-ul li:first').attr('id');

            that.switchPage(dataAction);
        }
        //切换页面
        , switchPage: function (dataAction) {
            var that = this;
            switch (dataAction) {
                case 'costBasic'://团队基础财务数据设置
                    that._breadcrumb = [{name:'财务管理'},{name:'财务设置',url:'#/financeSettings'},{name:'基础财务数据设置'}];
                    that.financeBasicSettings();
                    break;
                case 'costSharingSettings'://费用均摊项设置
                    that.costSharingSettings();
                    that._breadcrumb = [{name:'财务管理'},{name:'财务设置',url:'#/financeSettings'},{name:'费用分摊项设置'}];
                    break;
                case 'costCategory'://收支类别设置
                default:
                    that.costCategory();
                    that._breadcrumb = [{name:'费用管理'},{name:'财务设置'}];
                    break;
            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //收支类别设置
        , costCategory:function () {
            var that = this;
            $(that.element).find('#content-box').m_feeEntry_settings();
        }
        //团队基础财务数据设置
        , financeBasicSettings:function () {
            var that = this;
            $(that.element).find('#content-box').m_finance_basic_settings();
        }
        //团队基础财务数据设置
        , costSharingSettings:function () {
            var that = this;
            $(that.element).find('#content-box').m_costSharing_settings();
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
