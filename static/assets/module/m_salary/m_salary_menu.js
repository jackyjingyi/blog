/**
 * 薪酬管理－二次菜单
 * Created by wrb on 2019/2/26.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_salary_menu",
        defaults = {
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

            var html = template('m_salary/m_salary_menu',{
                roleCodes:window.currentRoleCodes
            });
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
                case 'employeeSalary'://员工工资
                    that.employeeSalary();
                    that._breadcrumb = [{name:'费用管理'},{name:'薪酬管理',url:'#/salary/employeeSalary'},{name:'职工薪酬'}];
                    break;
                case 'employeeSalary/details'://员工工资详情
                    that.employeeSalaryDetails();
                    that._breadcrumb = [{name:'费用管理'},{name:'薪酬管理',url:'#/salary/employeeSalary'},{name:'职工薪酬详情'}];
                    dataAction = 'employeeSalary';
                    break;
                case 'salaryCalculationTable'://工资计算表
                    that.salaryCalculationTable();
                    that._breadcrumb = [{name:'费用管理'},{name:'薪酬管理',url:'#/salary/employeeSalary'},{name:'工资数据录入表'}];
                    break;
                case 'salaryTaxTable'://个税计算查询表
                    that.salaryTaxTable();
                    that._breadcrumb = [{name:'费用管理'},{name:'薪酬管理',url:'#/salary/employeeSalary'},{name:'个税计算查询表'}];
                    break;
                case 'salaryReport'://工资综合报表
                    that.salaryReport();
                    that._breadcrumb = [{name:'费用管理'},{name:'薪酬管理',url:'#/salary/employeeSalary'},{name:'工资总表'}];
                    break;
            }

            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

        }
        //员工工资
        , employeeSalary: function () {
            $(this.element).find('#content-box').m_salary_mgt({},true);
        }
        //员工工资详情
        , employeeSalaryDetails: function () {
            $(this.element).find('#content-box').m_salary_person_details({companyUserId:this.settings.query.id,companyId:this.settings.query.companyId,year:this.settings.query.year},true);
        }
        //工资计算表
        , salaryCalculationTable: function () {
            $(this.element).find('#content-box').m_salary_calculation_table({},true);
        }
        //个税计算查询表
        , salaryTaxTable: function () {
            $(this.element).find('#content-box').m_salary_tax_calculation_table({},true);
        }
        //工资综合报表
        , salaryReport: function () {
            $(this.element).find('#content-box').m_salary_report({},true);
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
