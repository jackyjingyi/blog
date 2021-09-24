/**
 * 我的任务
 * Created by wrb on 2019/6/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_light",
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
        this._dataInfo = {};
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_task/m_task_light',{});
            $(that.element).html(html);
            that.renderHeader();
        }
        ,renderHeader:function () {
            var that = this;
            $(that.element).find('#taskHeader').m_task_header({
                doType:2,
                projectSelectedCallBack:function (data) {
                    that._status = data.status;
                    that._projectId = data.projectId;
                    that._projectName = data.projectName;
                    that.renderLightTask();
                }
            },true);

        }
        //渲染轻量任务
        ,renderLightTask:function () {
            var that = this;
            /*var option = {};
            option.param = {
                isComplete:that._status,
                lightProjectId:that._projectId
            };
            paginationFun({
                eleId: '.m-pagination',
                loadingId: '.data-list-box',
                url: restApi.url_lightProject_listLightProjectDetailByUserId,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    var html = template('m_task/m_task_light_list',{dataList:response.data.data});
                    $(that.element).find('.data-list-container').html(html);

                } else {
                    S_layer.error(response.info);
                }
            });*/

            var options={};
            options.classId = 'body';
            options.url=restApi.url_lightProject_listLightProjectDetailByUserId;
            options.postData =  {
                isComplete:that._status,
                lightProjectId:that._projectId
            };
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    var html = template('m_task/m_task_light_list',{
                        dataList:response.data,
                        fromType:$('body').hasClass('babieniaovisit ')?2:null
                    });
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('.data-list-container tr[data-id]').on('click',function () {
                        var dataId = $(this).attr('data-project-id');
                        if($('body').hasClass('babieniaovisit ')){
                            location.hash = '#/lightProject/detail?fromType=2&id='+dataId;
                        }else{
                            location.hash = '#/lightProject/detail?id='+dataId;
                        }
                    });

                }else {
                    S_layer.error(response.info);
                }
            })

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
