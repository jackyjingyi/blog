/**
 * 我的任务
 * Created by wrb on 2019/6/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._status = 0;
        this._projectId = null;
        this._projectName = null;
        this._businessType = null;
        this._dataInfo = {};
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_task/m_task',{});
            $(that.element).html(html);
            that.renderHeader();
        }
        ,renderHeader:function () {
            var that = this;
            $(that.element).find('#taskHeader').m_task_header({
                projectSelectedCallBack:function (data) {
                    that._status = data.status;
                    that._projectName = data.projectName;
                    that._businessType = data.businessType;
                    that.renderProductionTask();
                    //that.renderApprovalOpinion();
                    //that.renderDesignFile();
                    //that.renderFinancialTask();
                }
            },true);

        }
        //渲染生产安排任务
        ,renderProductionTask:function () {
            var that = this;
            $(that.element).find('div[data-type="productionTask"] .data-list-box').m_task_production({
                status:that._status,
                businessType:that._businessType,
                userId:that.settings.userId,
                companyUserId:that.settings.companyUserId
            });
        }
        //渲染校审意见
        ,renderApprovalOpinion:function () {
            var that = this;
            $(that.element).find('.tab-pane[data-type="approvalOpinion"] .panel-body').m_task_approval_opinion({
                status:that._status,
                projectId:that._projectId
            });
        }
        //渲染设计文件
        ,renderDesignFile:function () {
            var that = this;
            $(that.element).find('.tab-pane[data-type="designFile"] .panel-body').m_task_design_file({
                status:that._status,
                projectId:that._projectId
            });
        }
        //渲染财务任务
        ,renderFinancialTask:function () {
            var that = this;
            $(that.element).find('.tab-pane[data-type="financialTask"] .panel-body').m_task_cost({
                status:that._status,
                projectId:that._projectId
            },true);
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
