/**
 * 任务订单-流程设置-列表
 * Created by wrb on 2019/6/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_settings_list",
        defaults = {
            fromType:1,//1=默认任务订单入口，2=后台模板
            saveParam:null,//保存请求多余参数
            postParam:null,//请求多余参数
            query:null//{dataCompanyId,id(projectId),projectName,processType(1：图纸:2：生产任务:3：校审意见)}
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
                url:getUrlParamStr('#/project/basicInfo',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },
            {
                name:'任务订单',
                url:getUrlParamStr('#/project/taskIssue',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },
            /*{
                name:'流程设置',
                url:getUrlParamStr('#/project/taskIssue/processSettings',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },*/
            {
                name:'流程设置'
            }
        ];
        this._processList = [];//流程列表



        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_project_process/m_production_process_settings_list',{
                fromType:that.settings.fromType,
                query:that.settings.query
            } );
            $(that.element).html(html);

            if(that.settings.fromType==1){
                that.renderTable();
                if($(that.element).find('#breadcrumb').length>0)
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

            }else if(that.settings.fromType==2){
                that.renderTable();
            }
        }
        //请求数据
        ,getData:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_getProcessByType;
            option.postData = {};
            option.postData.projectId = that.settings.query.id;

            if(that.settings.query.processType==1 && that.settings.fromType==1){

                option.url = restApi.url_listTaskProcess;
                option.postData.processType = that.settings.query.processType;

            }else if(that.settings.query.processType==2 && that.settings.fromType==1){

                option.url = restApi.url_listProjectProcessForProductTask;
                option.postData.companyId = that.settings.query.dataCompanyId?that.settings.query.dataCompanyId:that._currentCompanyId;

            }else{
                option.postData.processType = that.settings.query.processType;
            }

            if(that.settings.postParam)
                $.extend( option.postData, that.settings.postParam);

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._processList = response.data;
                    if(callBack)
                        callBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染表格
        ,renderTable:function (data) {
            var that = this;
            that.getData(function (data) {
                var html = template('m_project_process/m_production_process_settings_list_table',{
                    fromType:that.settings.fromType,
                    dataList:data,
                    query:that.settings.query,
                    currentRoleCodes:window.currentRoleCodes
                } );
                $(that.element).find('#tableBox').html(html);
                that.bindActionClick();
                that.initICheck();
                rolesControl();
            });
        }

        //初始化iCheck
        ,initICheck:function () {
            var that = this;

            var checkedFun = function ($this) {
                var option = {};
                option.url = restApi.url_startProcess;
                option.postData = {
                    id: $this.closest('tr').attr('data-id')
                };

                if(that.settings.fromType==1 && that.settings.query.processType==1){

                    option.url = restApi.url_startTaskProcess;
                    option.postData.projectId = that.settings.query.id;

                }else if(that.settings.fromType==1 && that.settings.query.processType==2){

                    option.url = restApi.url_startProductTaskProcess;
                    option.postData.projectId = that.settings.query.id;

                }else if(that.settings.fromType==2 && that.settings.query.processType==2){

                    option.url = restApi.url_startProcessForProductProcess;

                }else{
                    option.postData.templateProcessId = $this.closest('tr').attr('data-template-process-id');
                }

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        S_toastr.success('操作成功！');
                    } else {
                        S_layer.error(response.info);
                    }
                });
            };

            var ifChecked = function (e) {
                checkedFun($(this));
            };
            var ifUnchecked = function (e) {
            };
            var ifClicked = function (e) {

            };
            $(that.element).find('input[name="itemCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {

                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'selectWorkflow':

                        $(that.element).find('.ibox-content').m_production_process_workflow_select({
                            processType:that.settings.query.processType,
                            taskId:that.settings.query.taskId,
                            projectId:that.settings.query.id,
                            fromType:that.settings.fromType,
                            saveParam:that.settings.saveParam,
                            saveCallBack:function () {
                                that.renderTable();
                            }
                        },true);

                        break;

                    case 'delWorkflow'://删除流程

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_deleteProcess;
                            option.postData = {
                                id: $this.closest('tr').attr('data-id')
                            };
                            if(that.settings.query.taskId){
                                option.url = restApi.url_deleteTaskProcess;
                                option.postData.taskId = that.settings.query.taskId;
                            }else{
                                option.postData.templateProcessId = $this.closest('tr').attr('data-template-process-id');
                            }
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.renderTable();
                                } else {
                                    S_layer.error(response.msg?response.msg:response.info);
                                }
                            });

                        }, function () {
                        });

                        break;
                    case "editWorkflow"://编辑工作流

                        if(that.settings.fromType==1){
                            location.hash = getUrlParamStr('/project/production/processSettings/edit',{
                                doType:1,
                                id:that.settings.query.id,
                                projectName:that.settings.query.projectName,
                                dataCompanyId:that.settings.query.dataCompanyId,
                                processType:that.settings.query.processType,
                                taskId:that.settings.query.taskId,
                                processId:$this.closest('tr').attr('data-id')
                            });
                        }else{
                            var query = $.extend(true, {}, that.settings.query);
                            query.processId = $this.closest('tr').attr('data-id');
                            $(that.element).m_production_process_settings_add({
                                fromType:that.settings.fromType,
                                saveParam:that.settings.saveParam,
                                postParam:that.settings.postParam,
                                query:query
                            },true);
                        }

                        break;

                    case 'addWorkflow':

                        if(that.settings.fromType==1){

                            //window.location.hash="#/project/production/processSettings/edit?doType=1&id="+that.settings.query.id+"&projectName="+that.settings.query.projectName+"&dataCompanyId="+that.settings.query.dataCompanyId+"&processType="+that.settings.query.processType;

                            location.hash = getUrlParamStr('/project/production/processSettings/edit',{
                                doType:1,
                                fromType:that.settings.fromType,
                                id:that.settings.query.id,
                                projectName:that.settings.query.projectName,
                                dataCompanyId:that.settings.query.dataCompanyId,
                                processType:that.settings.query.processType,
                                taskId:that.settings.query.taskId
                            });

                        }else{
                            that.settings.query.processId = null;
                            $(that.element).m_production_process_settings_add({
                                fromType:that.settings.fromType,
                                saveParam:that.settings.saveParam,
                                postParam:that.settings.postParam,
                                query:that.settings.query
                            },true);
                        }
                        break;

                    case 'viewWorkflow':

                        if(that.settings.fromType==1){

                            location.hash = getUrlParamStr('/project/taskIssue/processSettings/info',{
                                fromType:that.settings.fromType,
                                id:that.settings.query.id,
                                projectName:that.settings.query.projectName,
                                dataCompanyId:that.settings.query.dataCompanyId,
                                processType:that.settings.query.processType,
                                processId:$this.closest('tr').attr('data-id'),
                                taskId:that.settings.query.taskId
                            });

                        }else{
                            var query = $.extend(true, {}, that.settings.query);
                            query.processId = $this.closest('tr').attr('data-id');
                            $(that.element).m_production_process_workflow_route({
                                doType:2,
                                fromType:that.settings.fromType,
                                saveParam:that.settings.saveParam,
                                postParam:that.settings.postParam,
                                query:query
                            },true);
                        }
                        break;

                    case 'setRange'://设置范围

                        $('body').m_production_process_set_range({
                            isHadRole:window.currentRoleCodes.indexOf('10000602')>-1?true:false,
                            dataInfo:{
                                processId:$this.closest('tr').attr('data-id')
                            },
                            saveCallBack:function () {
                                that.renderTable();
                            }
                        },true);
                        break;

                    case 'search':

                        that.renderTable();
                        return false;
                        break;
                    case 'refreshBtn':

                        that.init();
                        return false;
                        break;

                    case 'copyProcess'://复制流程

                        $('body').m_input_save({
                            title:'复制流程',
                            postData:{processId:$this.closest('tr').attr('data-id')},
                            postUrl:restApi.url_copyProcess,
                            fieldKey:'processName',
                            fieldName:'流程名称',
                            saveCallBack:function () {
                                that.renderTable();
                            }
                        });

                        break

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
