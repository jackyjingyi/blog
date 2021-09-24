/**
 * 生产安排-流程设置
 * Created by wrb on 2019/6/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_settings",
        defaults = {
            query:null//{dataCompanyId,id(projectId),projectName}
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        this.settings.query.projectName = encodeURI(this.settings.query.projectName);
        this._breadcrumb = [
            {
                name:'我的项目'
            },
            {
                name:decodeURI(this.settings.query.projectName),
                url:'#/project/basicInfo?id='+this.settings.query.id+'&projectName='+this.settings.query.projectName+'&dataCompanyId='+this.settings.query.dataCompanyId
            },
            {
                name:'生产安排',
                url:'#/project/production?id='+this.settings.query.id+'&projectName='+this.settings.query.projectName+'&dataCompanyId='+this.settings.query.dataCompanyId
            },
            {
                name:'流程设置'
            }
        ];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            //请求项目数据
            var option = {};
            option.url = restApi.url_loadProjectDetails + '/' + that.settings.query.id;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var html = template('m_project_process/m_production_process_settings', {dataInfo:response.data,query:that.settings.query});
                    $(that.element).html(html);
                    if($(that.element).find('#breadcrumb').length>0)
                        $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

                    that.bindActionClick();

                } else {
                    S_layer.error(response.info);
                }
            });

        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click',function (e) {

                var dataAction = $(this).attr('data-action');
                switch (dataAction){
                    case "setTaskLeader"://
                        break;

                }
                e.stopPropagation();
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
