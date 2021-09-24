/**
 * 生产安排-流程设置-列表
 * Created by wrb on 2019/6/13.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_settings_add",
        defaults = {
            fromType:1,//1=默认生产安排入口，2=后台模板
            saveParam:null,//保存请求多余参数
            postParam:null,//请求多余参数
            query:null//{dataCompanyId,id(projectId),projectName,processType(1：生产任务:2：图纸:3：校审意见),processId}
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
                name:'生产安排',
                url:getUrlParamStr('#/project/production',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },
            /*{
                name:'流程设置',
                url:getUrlParamStr('#/project/production/processSettings',{
                    id:this.settings.query.id,
                    projectName:this.settings.query.projectName,
                    dataCompanyId:this.settings.query.dataCompanyId
                })
            },*/
            {
                name:'流程设置',
                url:getUrlParamStr('#/project/production/processSettings/list',{
                    id:this.settings.query.id,
                    taskId:this.settings.query.taskId,
                    projectName:this.settings.query.projectName,
                    processType:this.settings.query.processType
                })
            },
            {
                name:this.settings.query.processId?'流程编辑':'流程添加'
            }
        ];

        this._processTemplateData = [];//模板数据
        this._statusList = [];//状态列表
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function (data) {
                var html = template('m_project_process/m_production_process_settings_add',{
                    fromType:that.settings.fromType,
                    processInfo:data?data.process:null,
                    query:that.settings.query
                } );
                $(that.element).html(html);
                that.initICheck();
                that.save_validate();
                that.bindActionClick();
                that.getProcessTemplate();


                $(that.element).find('#processNodeList').m_production_process_workflow_status({
                    fromType:that.settings.fromType,
                    query:that.settings.query,
                    initCallBack:function (data) {
                        that._statusList = data;
                    },
                    sortCallBack:function (data) {
                        that._statusList = data;
                    }
                },true);

                if($(that.element).find('#breadcrumb').length>0)
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
            });
        }
        //请求数据
        ,getData:function (callBack) {
            var that = this;
            if(that.settings.query.processId){//编辑
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_getProcessDetail;
                option.postData = {
                    id:that.settings.query.processId
                };
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        that._processInfo = response.data;
                        if(callBack)
                            callBack(response.data);

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }else{//添加
                if(callBack)
                    callBack(null);
            }

        }
        //请求数据
        ,save:function () {
            var that = this;

            //$(that.element).m_production_process_workflow_status({},true);

            var option = {};
            option.classId = that.element;
            option.url = restApi.url_saveProcess;
            option.postData =$(that.element).find('form').serializeObject();
            option.postData.processType = that.settings.query.processType;
            option.postData.projectId = that.settings.query.id;

            if(that.settings.query && that.settings.query.processId)
                option.postData.id = that.settings.query.processId;

            if($(that.element).find('input[name="addTypeCk"]:checked').val()=='1' && that._processTemplateData && that._processTemplateData.length>0){
                option.postData.processId = that._processTemplateData[0].id;
            }

            if(that.settings.saveParam)
                $.extend( option.postData, that.settings.saveParam);

            if(that.settings.query.taskId){
                option.url = restApi.url_saveProcessForProjectTask;
                option.postData.taskId = that.settings.query.taskId;
            }

            option.postData.nodeList = that._statusList;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');

                    that.settings.query.processId = response.data;

                    if(that.settings.fromType==1){

                        location.hash = getUrlParamStr('/project/production/processSettings/edit',{
                            doType:2,
                            id:that.settings.query.id,
                            taskId:that.settings.query.taskId,
                            projectName:that.settings.query.projectName,
                            dataCompanyId:that.settings.query.dataCompanyId,
                            processType:that.settings.query.processType,
                            processId:response.data
                        });

                    }else{
                        $(that.element).m_production_process_workflow_route({
                            fromType:that.settings.fromType,
                            saveParam:that.settings.saveParam,
                            postParam:that.settings.postParam,
                            query:that.settings.query
                        },true);
                    }


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //初始化iCheck
        ,initICheck:function () {
            var that = this;
            var ifChecked = function (e) {
            };
            var ifUnchecked = function (e) {
            };
            var ifClicked = function (e) {

            };
            $(that.element).find('input[name="addTypeCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {

                var dataAction = $(this).attr('data-action');
                switch (dataAction){
                    case "save"://保存
                        var flag = $(that.element).find('form').valid();
                        if (!flag) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        if (that._statusList==null || that._statusList.length==0) {
                            S_toastr.error('请添加流程状态');
                            return false;
                        }
                        var isStartNode = false;
                        $.each(that._statusList,function (i,item) {
                            if(item.isStartNode==1){
                                isStartNode = true;
                                return false;
                            }
                        });
                        if(!isStartNode){
                            S_toastr.error('请选择起始状态');
                            return false;
                        }
                        that.save();
                        break;
                    case 'cancel'://取消

                        if(that.settings.fromType==1){
                            location.hash = getUrlParamStr('/project/production/processSettings/list',{
                                id:that.settings.query.id,
                                taskId:that.settings.query.taskId,
                                projectName:that.settings.query.projectName,
                                dataCompanyId:that.settings.query.dataCompanyId,
                                processType:that.settings.query.processType
                            });
                        }else{
                            $(that.element).m_production_process_settings_list({
                                fromType:that.settings.fromType,
                                saveParam:that.settings.saveParam,
                                postParam:that.settings.postParam,
                                query:that.settings.query
                            },true);
                        }

                        break;
                    case 'viewProcessTemplate'://预览

                        $('body').m_production_process_template_preview({processType:that.settings.query.processType},true);

                        break;

                }
                return false;
            });
        }
        //保存验证
        , save_validate: function () {
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    processName: {
                        required: true,
                        maxlength:50
                    }
                },
                messages: {
                    processName: {
                        required: '工作流名称不能为空',
                        maxlength: '工作流名称请控制在50字符内'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    error.appendTo(element.closest('div'));
                }
            });
        }
        ,getProcessTemplate:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listDefaultProcessTemplate;
            option.postData = {
                processType:that.settings.query.processType
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._processTemplateData = response.data;

                } else {
                    S_layer.error(response.info);
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
