/**
 * 审批报表－右菜单
 * Created by wrb on 2018/9/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approvalReport_menu",
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

            var html = template('m_approvalReport/m_approvalReport_menu',{});
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
                case 'cost'://费用汇总
                    that.cost();
                    that._breadcrumb = [{name:'审批管理'},{name:'审批报表',url:'#/approvalReport'},{name:'财务审批统计'}];
                    break;
                case 'nonAmount'://非金额统计
                    that.nonAmount(0);
                    that._breadcrumb = [{name:'审批管理'},{name:'审批报表',url:'#/approvalReport'},{name:'行政审批统计'}];
                    break;
                case 'projects'://项目审批统计
                    that.nonAmount(3);
                    that._breadcrumb = [{name:'审批管理'},{name:'审批报表',url:'#/approvalReport'},{name:'项目审批统计'}];
                    break;
                case 'workingHours'://工时汇总
                    that.workingHours();
                    that._breadcrumb = [{name:'审批管理'},{name:'审批报表',url:'#/approvalReport'},{name:'工时汇总'}];
                    break;
                case 'workingHoursDetail'://工时汇总详情
                    that.workingHoursDetail();
                    dataAction = 'workingHours';
                    that._breadcrumb = [{name:'审批管理'},{name:'审批报表',url:'#/approvalReport'},{name:'工时汇总',url:'#/approvalReport/workingHours'},{name:'工时汇总详情'}];
                    break;
            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //费用汇总
        , cost:function () {
            var that = this;
            $(that.element).find('#content-box').m_approvalReport_cost({},true);
        }
        //工时汇总
        , workingHours:function () {
            var that = this;
            var option = {};
            $(that.element).find('#content-box').m_summary_workingHours(option);
        }
        ,nonAmount:function (financeFlag) {
            var that = this;
            $(that.element).find('#content-box').m_approvalReport_non_amount({financeFlag:financeFlag},true);
        }
        //工时汇总详情
        , workingHoursDetail:function () {
            var that = this;
            var option = {};
            option.projectId = that.settings.query.projectId;
            option.projectName = decodeURI(that.settings.query.projectName);
            $(that.element).find('#content-box').m_summary_workingHours_detail(option);
        }
    });

    /*
     1.一般初始化（缓存单例）： $('#id').pluginName(initOptions);
     2.强制初始化（无视缓存）： $('#id').pluginName(initOptions,true);
     3.调用方法： $('#id').pluginName('methodName',args);
     */
    $.fn[pluginName] = function (options, args) {
        var instance;
        var funcResult;
        var jqObj = this.each(function () {

            //从缓存获取实例
            instance = $.data(this, "plugin_" + pluginName);

            if (options === undefined || options === null || typeof options === "object") {

                var opts = $.extend(true, {}, defaults, options);

                //options作为初始化参数，若args===true则强制重新初始化，否则根据缓存判断是否需要初始化
                if (args === true) {
                    instance = new Plugin(this, opts);
                } else {
                    if (instance === undefined || instance === null)
                        instance = new Plugin(this, opts);
                }

                //写入缓存
                $.data(this, "plugin_" + pluginName, instance);
            }
            else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
