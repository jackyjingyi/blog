/**
 * 项目收支-菜单
 * Created by wrb on 2019/6/30.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_cost_menu",
        defaults = {
            contentEle:null,
            dataAction:null,
            isFirstEnter:false//是否是第一次進來
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

            var html = template('m_project_cost/m_project_cost_menu',{
                isHasChildOrg:window.role.isHasChildOrg,
                viewProjectCostForOrg:window.role.viewProjectCostForOrg
            });
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
                case 'table2'://应收
                    that.table2();
                    that._breadcrumb = [{name:'费用管理'},{name:'项目收支',url:'#/projectCostDetail'},{name:'项目收支计划'}];
                    break;
                case 'table3'://应付
                    that.table3();
                    that._breadcrumb = [{name:'费用管理'},{name:'项目收支',url:'#/projectCostDetail'},{name:'部门收支计划'}];
                    break;
                case 'table4'://应付
                    that.table4();
                    that._breadcrumb = [{name:'费用管理'},{name:'项目收支',url:'#/projectCostDetail'},{name:'项目成本核算'}];
                    break;
                case 'table1'://台账
                default:
                    that.table1();
                    that._breadcrumb = [{name:'统计管理'},{name:'收支汇总'}];
                    break
            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //
        ,table1: function () {
            var that = this;
            $(that.element).find('#content-box').m_project_cost_table1();
        }
        //
        ,table2:function () {
            var that = this;
            $(that.element).find('#content-box').m_project_cost_table2();
        }
        //
        ,table3:function () {
            var that = this;
            $(that.element).find('#content-box').m_project_cost_table3();
        }
        ,table4:function () {
            var that = this;
            $(that.element).find('#content-box').m_project_cost_table4();
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
