/**
 * 收支管理-菜单
 * Created by wrb on 2018/8/8.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_cost_menu",
        defaults = {
            projectId:null,
            projectName:null,
            myTaskId:null,//任务ID
            projectOperator:null,//操作权限
            dataAction:null,//记录页面的key
            dataCompanyId:null//视图组织ID
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID
        this._currentCompanyUserId = window.currentCompanyUserId;//当前员工ID
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

            var html = template('m_cost/m_cost_menu',{
                id:that.settings.projectId,
                projectName:that.settings.projectName,
                projectNameCode:encodeURI(that.settings.projectName),
                projectOperator:that.settings.projectOperator,
                businessType:that.settings.businessType,
                dataCompanyId:that.settings.dataCompanyId
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
                case 'collectionPlan'://收款计划
                    that.collectionPlan();
                    that._breadcrumb = [{name:that.settings.businessType==1?'我的项目':'我的课题'},{name:that.settings.projectName,url:'#/project/basicInfo?id='+that.settings.projectId+'&projectName='+encodeURI(that.settings.projectName)+'&dataCompanyId='+that.settings.dataCompanyId+ '&businessType=' + this.settings.businessType},{name:'费用管理'},{name:'收款计划'}];
                    break;
                case 'paymentPlan'://付款计划
                    that.paymentPlan();
                    that._breadcrumb = [{name:that.settings.businessType==1?'我的项目':'我的课题'},{name:that.settings.projectName,url:'#/project/basicInfo?id='+that.settings.projectId+'&projectName='+encodeURI(that.settings.projectName)+'&dataCompanyId='+that.settings.dataCompanyId+ '&businessType=' + this.settings.businessType},{name:'费用管理'},{name:'付款计划'}];
                    break;
            }

            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

        }
        //收款计划
        ,collectionPlan:function () {
            var that = this;
            var options = {};
            options.projectId = that.settings.projectId;
            options.projectName = that.settings.projectName;
            options.myTaskId = that.settings.myTaskId;
            options.dataCompanyId = that.settings.dataCompanyId;
            options.businessType = that.settings.businessType;
            $(that.element).find('#content-box').m_cost_collectionPlan(options, true);
        }
        //付款计划
        ,paymentPlan:function () {
            var that = this;
            var options = {};
            options.projectId = that.settings.projectId;
            options.projectName = that.settings.projectName;
            options.myTaskId = that.settings.myTaskId;
            options.dataCompanyId = that.settings.dataCompanyId;
            options.businessType = that.settings.businessType;
            $(that.element).find('#content-box').m_cost_paymentPlan(options, true);
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
