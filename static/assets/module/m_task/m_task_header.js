/**
 * 任务头部
 * Created by wrb on 2019/6/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_header",
        defaults = {
            doType:1,//1=设计任务，2=轻量任务
            projectId:null,
            status:0,
            projectSelectedCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._status = this.settings.status;
        this._projectName = null;
        this._businessType = null;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        ,render:function () {

            var that = this;



                    var html = template('m_task/m_task_header',{
                        doType:that.settings.doType,
                        status:that._status,
                        projectName:that._projectName,
                        businessType:that._businessType,
                        projectId:that._projectId
                    });
                    $(that.element).html(html);
                    that.bindActionClick();

                    if(that.settings.projectSelectedCallBack)
                        that.settings.projectSelectedCallBack({status:that._status,projectName:that._projectName,businessType:that._businessType});


        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('#taskStatus ul.dropdown-menu li a').on('click',function () {

                var text = $(this).text(),status = $(this).attr('data-status');

                $(that.element).find('#taskStatus button span').eq(0).text(text);
                that._status = status;
                that.render();
            });
            $(that.element).find('#projectList ul.dropdown-menu li a').on('click',function () {

                var text = $(this).text(),projectId = $(this).attr('data-id'),businessType = $(this).attr('data-key');

                $(that.element).find('#projectList button span').eq(0).text(text);
                that._projectId = projectId;
                that._projectName = text;
                that._businessType = businessType;

                if(that.settings.projectSelectedCallBack)
                    that.settings.projectSelectedCallBack({status:that._status,projectName:that._projectName,businessType:that._businessType});

            });

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
