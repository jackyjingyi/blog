/**
 * 项目模板管理
 * Created by wrb on 2019/9/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_task_temp",
        defaults = {
            projectTypeId:null,
            projectTypeList:null,//设计分类
            projectTempData:null,//模板数据(功能分类=functionList,设计范围=designRangeList,专业信息=majorMsgList,阶段设置=stageDesignList,专业设置=majorDesignList)
            postParam:null
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._taskTempData = [];

        this._postParam = null;
        this._saveParam = null;

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project_temp/m_project_task_temp', {
                projectTypeId:that.settings.projectTypeId,
                projectTypeList:that.settings.projectTypeList,
                projectTempData:that.settings.projectTempData
            });
            $(that.element).html(html);

            $(that.element).find('#processNav').m_project_process_nav({
                type:1,
                selectedCallBack:function (data) {
                    that.settings.postParam = data;
                    that.renderTaskTempList();
                },
                renderCallBack:function (data) {
                    that.settings.postParam = data;
                    that.renderTaskTempList();
                }
            },true);

        }
        //渲染任务模版列表
        ,renderTaskTempList:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_listTaskTemplate;
            option.postData = {};

            if(that.settings.postParam)
                $.extend( option.postData, that.settings.postParam);

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._taskTempData = response.data;
                    var html = template('m_project_temp/m_project_task_temp_list', {dataList:that._taskTempData});
                    $(that.element).find('#tableBox').html(html);
                    that.bindActionClick();
                    rolesControl();
                } else {
                    S_layer.error(response.info);
                }
            });

        }
        //获取数据
        ,renderTaskTemp:function () {
            var that = this;

            var option = {};
            option.url = restApi.url_listProjectTemplateListForTask;
            option.postData = that._postParam;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._taskTempData = response.data;
                    var html = template('m_project_temp/m_project_temp_item', {dataList:response.data});
                    //$this.before(html);
                    $(that.element).find('.panel[data-key="taskTempList"]').find('.panel-body').html(html);
                    rolesControl();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action'),dataId = $this.closest('tr').attr('data-id');
                var dataItem = getObjectInArray(that._taskTempData,dataId);

                switch (dataAction){
                    case 'editTaskTemp':
                    case 'addTaskTemp'://添加任务模板

                        $(that.element).m_project_task_temp_add({
                            taskTempData:that._taskTempData,
                            dataInfo:dataItem
                        },true);

                        break;

                    case 'viewTaskTemp':

                        $(that.element).m_project_task_temp_add({
                            doType:2,
                            taskTempData:that._taskTempData,
                            dataInfo:dataItem
                        },true);

                        break;

                    case 'delTaskTemp'://删除任务模板

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_deleteTaskTemplate;
                            option.postData = {
                                id: $this.closest('tr').attr('data-id')
                            };
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.renderTaskTempList();
                                } else {
                                    S_layer.error(response.msg?response.msg:response.info);
                                }
                            });

                        }, function () {
                        });

                        break;
                    case 'setRange'://设置范围

                        $('body').m_production_process_set_range({
                            doType:2,
                            isHadRole:window.currentRoleCodes.indexOf('10000602')>-1?true:false,
                            dataInfo:{
                                id:$this.closest('tr').attr('data-id')
                            },
                            saveCallBack:function () {
                                that.renderTaskTempList();
                            }
                        },true);
                        break;


                }
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