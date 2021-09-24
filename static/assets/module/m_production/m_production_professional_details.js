/**
 * 项目信息－生产安排专业详情
 * Created by wrb on 2020/01/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_professional_details",
        defaults = {
            query:null//{taskId,id=projectId,projectName,dataCompanyId}
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;//员工ID
        this._currentCompanyId = window.currentCompanyId;//组织ID
        this._currentUserId = window.currentUserId;//用户ID

        this._dataInfo = {};//请求签发数据
        this._breadcrumb = [
            {
                name:'我的项目'
            },
            {
                name:this.settings.query.projectName,
                url:'#/project/basicInfo?id='+this.settings.query.id+'&projectName='+encodeURI(this.settings.query.projectName)+'&dataCompanyId='+this.settings.query.dataCompanyId
            },
            {
                name:'生产安排',
                url:'#/project/production?id='+this.settings.query.id+'&projectName='+encodeURI(this.settings.query.projectName)+'&dataCompanyId='+this.settings.query.dataCompanyId
            },
            {
                name:'专业详情'
            }
        ];

        this._basicData = {};//请求数据
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.renderContent();
        }

        //渲染内容
        ,renderContent:function () {
            var that = this;
            that.getBasicInfoData(function (data) {

                var html = template('m_production/m_production_professional_details',{
                    dataInfo:data,
                    projectId:that.settings.query.id,
                    projectNameCode:encodeURI(that.settings.query.projectName),
                    dataCompanyId:that.settings.query.dataCompanyId
                });
                $(that.element).html(html);
                that.bindClickAction();
                that.renderProductionTask();
                that.renderApprovalOpinion();
                that.renderDesignFile();
                that.renderMemberTaskTracking();

            });


            if($(that.element).find('#breadcrumb').length>0)
                $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

        }
        //获取基础数据
        ,getBasicInfoData:function (callBack) {
            var that = this;
            var options={};
            options.classId = '#content-right';
            options.url = restApi.url_productTaskDetailForCount;
            options.postData = {};
            options.postData.id = that.settings.query.taskId;
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    that._basicData = response.data;
                    if(callBack)
                        callBack(response.data);

                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,renderApprovalOpinion:function (callBack) {
            var that = this;
            var option = {};
            option.param = {};
            option.param.taskId = that.settings.query.taskId;
            paginationFun({
                eleId: '.tab-pane[data-type="approvalOpinion"] .m-pagination',
                loadingId: '.tab-pane[data-type="approvalOpinion"] .data-list-box',
                url: restApi.url_listAllApprovalOpinion,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._approvalOpinionData = response.data.data;
                    $(that.element).find('.tab-pane[data-type="approvalOpinion"] .data-list-container').m_production_approval_opinion({
                        doType:2,
                        approvalOpinionData:that._approvalOpinionData,
                        projectName:that.settings.query.projectName,
                        projectId:that.settings.query.id,
                        dataCompanyId:that.settings.query.dataCompanyId,
                        taskId:that.settings.query.taskId,
                        dataInfo:{},
                        saveCallBack:function () {
                            that.renderApprovalOpinion();
                        }
                    },true);

                    if(callBack)
                        callBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染设计文件
        ,renderDesignFile:function () {
            var that = this;
            var option = {};
            option.param = {};
            option.param.taskId = that.settings.query.taskId;
            paginationFun({
                eleId: '.tab-pane[data-type="designFile"] .m-pagination',
                loadingId: '.tab-pane[data-type="designFile"] .data-list-box',
                url: restApi.url_projectSkyDriver_getAttachListByPidForRecursive,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._dataInfo = {attachList:response.data.data};
                    $(that.element).find('.tab-pane[data-type="designFile"] .data-list-container').m_production_design_file({
                        projectName:that.settings.query.projectName,
                        projectId:that.settings.query.id,
                        taskId:that.settings.query.taskId,
                        dataInfo:that._dataInfo,
                        doType:4,
                        saveCallBack:function () {
                            that.renderDesignFile();
                        }
                    },true);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染任务列表
        ,renderProductionTask:function () {
            var that = this;
            $(that.element).find('.tab-pane[data-type="productionTask"] .panel-body').m_production_content_item({
                doType:4,
                dataInfo:{id:that.settings.query.taskId},
                projectName:that.settings.query.projectName,
                projectId:that.settings.query.id,
                issueTaskId:that.settings.query.taskId,
                dataCompanyId:that.settings.query.dataCompanyId
            },true);
        }
        ,renderMemberTaskTracking:function () {
            var that = this;
            $(that.element).find('.tab-pane[data-type="memberTaskTracking"] .panel-body').m_production_member_task_tracking({
                taskId:that.settings.query.taskId,
                projectName:that.settings.query.projectName,
                projectId:that.settings.query.id,
                dataCompanyId:that.settings.query.dataCompanyId
            });
        }
        //事件绑定
        ,bindClickAction:function($ele){
            var that = this;

            if($ele==null)
                $ele = $(that.element);

            $ele.find('a[data-action]').off('click').on('click',function(){
                var $this = $(this),
                    $i = $this.attr('data-i'),
                    dataAction = $this.attr('data-action');

                switch (dataAction) {//切换自己生产与总览

                    case 'taskStateFlow'://状态流转
                        var endStatus = $this.attr('data-end-status');
                        var taskId = that.settings.query.taskId;
                        //获取节点数据
                        var dataItem = that._basicData.task;
                        if(endStatus==5){
                            $('body').m_task_issue_approval({
                                projectId:that.settings.query.id,
                                taskId:taskId,
                                saveCallBack:function () {
                                    that.init();
                                },
                                closeCallBack:function () {
                                    that.init();
                                }
                            },true);
                        }else{
                            $('body').m_task_issue_status_flow({
                                dataInfo:dataItem,
                                viewCompanyId:that.settings.query.dataCompanyId,
                                isPanel:1,
                                doType:2,
                                saveCallBack:function () {
                                    that.init();
                                }
                            },true);
                        }
                        break;

                    case 'addProjectMember':

                        var option = {};
                        option.postData = {};
                        option.url = restApi.url_getProjectPartMember;
                        option.postData.projectId=that.settings.query.id;
                        m_ajax.postJson(option,function (response) {
                            if(response.code=='0'){
                                var options = {};
                                options.isASingleSelectUser = false;
                                options.selectedUserList = response.data;
                                options.title = '添加项目人员';
                                options.isOkSave = true;
                                options.saveCallback = function (data, $ele) {
                                    var obj = {};
                                    obj.type = 99;
                                    if(data!=null && data.selectedUserList!=null && data.selectedUserList.length>0){
                                        that.postProjectMemberAdd(data.selectedUserList);
                                    }
                                };
                                $('body').m_orgByTree(options);
                            }else {
                                S_layer.error(response.info);
                            }
                        });

                        break;

                }

            });
        }
        //人员设置保存
        ,postProjectMemberAdd:function(selectedUserList){
            var that = this;
            var option={};
            option.classId = that.element;
            option.url=restApi.url_saveProjectMember;
            option.postData={};
            option.postData.projectId=that.settings.projectId;
            option.postData.companyId=that._currentCompanyId;
            option.postData.type=99;
            option.postData.memberList=selectedUserList;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //处理人编辑
        ,bindEditable:function ($ele) {
            var that = this;
            $ele.find('.p-handler').hover(function () {
                $(this).find('a[data-action]').css('visibility','visible');
            },function () {
                $(this).find('a[data-action]').css('visibility','hidden');
            });
            $ele.find('a[data-action="xeditableByHandlerUser"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var index = $this.closest('.panel').attr('data-i');
                var dataInfo = null;

                var targetNotQuickCloseArr = ['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options'];
                value = [{text:$this.attr('data-user-name'),id:$this.attr('data-id')}];

                $this.m_editable({
                    inline:true,
                    hideElement:true,
                    popoverStyle:{'min-width':'100px'},
                    isNotSet:false,
                    value:value,
                    dataInfo:dataInfo,
                    postParam:{id:$this.attr('data-task-id')},
                    targetNotQuickCloseArr:targetNotQuickCloseArr,
                    closed:function (data,$popover) {

                        if(data!=false){

                            data.type = 1;
                            data.id = $this.attr('data-id');//旧任务负责人
                            data.taskId =  $this.attr('data-task-id');
                            data.companyUserId = data[key][0].id;
                            that.editManagerChange(data);

                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed:function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();


                    }
                },true);
            });
        }
        //移交任务负责人
        ,editManagerChange:function(data,event){
            var that = this;
            var option={};
            option.url=restApi.url_transferTaskResponse;
            option.classId = 'body';
            option.postData={};
            option.postData.id = data.id;
            option.postData.taskId = data.taskId;
            option.postData.projectId=that.settings.projectId;
            option.postData.companyId=that._currentCompanyId;
            option.postData.type=data.type;
            option.postData.targetId=data.companyUserId;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_layer.close($(event));
                    S_toastr.success('保存成功！');
                    that.getData(function () {
                        that.renderContent();
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
