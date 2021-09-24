/**
 * 项目信息－任务订单详情
 * Created by wrb on 2018/9/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_details",
        defaults = {
            taskId:null,
            doType:1,//1=订单详情，2=生产详情，3=项目详情,4=任务
            projectId:null,
            projectName:null,
            createCompanyId:null,//立项组织
            dataCompanyId:null,//视图ID
            companyId:null,
            projectEdit:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyId = window.currentCompanyId;
        this._leftBoxHeightResize = null;//左边div高度自适应设定初始对象

        this._breadcrumb = [
            {
                name: this.settings.businessType==1?'我的项目':'我的课题'
            },
            {
                name:this.settings.projectName,
                url:'#/project/basicInfo?id='+this.settings.projectId+'&projectName='+encodeURI(this.settings.projectName)+'&dataCompanyId='+this.settings.dataCompanyId+ '&businessType=' + this.settings.businessType
            },
            {
                name:'工作内容',
                url:'#/project/taskIssue?id='+this.settings.projectId+'&projectName='+encodeURI(this.settings.projectName)+'&dataCompanyId='+this.settings.dataCompanyId+ '&businessType=' + this.settings.businessType
            },
            {
                name:'详情'
            }
        ];

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var tabIndex = null;//tab页标识
            if($(this.element).find('ul.nav-tabs li.active a').length>0)
                tabIndex = $(this.element).find('ul.nav-tabs li.active a').attr('href').replaceAll('#tab-','');

            that.getData(function () {
                that.renderContent(tabIndex);
                that.renderChangeHistory();
                that.renderApprovalOpinion();
                that.editTaskHoverFun();
                that.getTaskOption(function () {
                    that.bindEditable();
                });
                if(that.settings.renderCallBack)
                    that.settings.renderCallBack(that._dataInfo);

            });
        }
        //渲染初始界面
        ,getData:function (callBack) {
            var that = this;
            var options={};
            options.classId = '#content-right';
            options.url=restApi.url_getProductTaskDetail;
            options.postData = {
                id:that.settings.taskId,
                companyId:that.settings.dataCompanyId
            };
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    that._dataInfo = response.data;
                    if(callBack)
                        callBack();
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,renderContent:function (t) {
            var that = this;
            var html = template('m_task_issue/m_task_issue_details',{
                dataInfo:that._dataInfo,
                projectId : that.settings.projectId,
                projectName : that.settings.projectName,
                projectNameCode : encodeURI(that.settings.projectName),
                dataCompanyId:that.settings.dataCompanyId,
                currentCompanyId : that._currentCompanyId,
                currentCompanyUserId:that._currentCompanyUserId,
                createCompanyId:that.settings.createCompanyId
            });

            $(that.element).html(html);

            if($('#breadcrumb').length>0)
                $('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

            that.bindActionClick();
            that.commentHover();
            that.renderDesignFile();

            if(t!=null)
                $(that.element).find('.tabs-container a[href="#tab-'+t+'"]').click();

            that._leftBoxHeightResize = new leftBoxHeightResize($(that.element).find('#leftBox'),$(that.element).find('#leftBox'),$(that.element).find('#rightBox'),52);
            that._leftBoxHeightResize.init();

        }

        //评论hover展示删除
        ,commentHover:function () {
            var that = this;
            $(that.element).find('div.comment-box').hover(function () {
                $(this).find('a[data-action="delComment"]').removeClass('hide');
            },function () {
                $(this).find('a[data-action="delComment"]').addClass('hide');
            });
        }
        ,bindActionClick:function ($ele) {
            var that = this;
            if($ele==null)
                $ele = $(that.element);
            $ele.find('a[data-action],button[data-action]').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');
                var dataI = $this.closest('tr').attr('data-i')-0;
                switch (dataAction){

                    case 'submitComment'://添加评论

                        var option={};
                        option.classId = '#content-right';
                        option.url=restApi.url_commentProjectTask;
                        option.postData = {
                            taskId:that.settings.taskId,
                            comment:$(that.element).find('form#commentForm textarea[name="comment"]').val()
                        };
                        m_ajax.postJson(option,function (response) {

                            if(response.code=='0'){
                                S_toastr.success('操作成功！');
                                that.init();
                            }else {
                                S_layer.error(response.info);
                            }
                        });

                        return false;
                        break;
                    case 'delComment'://删除评论

                        var option={};
                        option.classId = '#content-right';
                        option.url=restApi.url_deleteTaskComment;
                        option.postData = {
                            id:$this.attr('data-id')
                        };
                        m_ajax.postJson(option,function (response) {

                            if(response.code=='0'){
                                S_toastr.success('操作成功！');
                                that.init();
                            }else {
                                S_layer.error(response.info);
                            }
                        });

                        return false;
                        break;

                    case 'taskStateFlow'://状态流转

                        var endStatus = $this.attr('data-end-status');
                        if(endStatus==5){
                            $('body').m_task_issue_approval({
                                projectId:that.settings.projectId,
                                taskId:that._dataInfo.task.id,
                                saveCallBack:function () {
                                    that.init();
                                },
                                closeCallBack:function () {
                                    that.init();
                                }
                            },true);
                        }else{
                            $('body').m_task_issue_status_flow({
                                dataInfo:that._dataInfo.task,
                                isPanel:that._dataInfo.type==1?1:0,
                                saveCallBack:function () {
                                    that.init();
                                }
                            },true);
                        }
                        break;

                    case 'delTaskIssue'://删除任务
                        var idList = [];
                        idList.push(that._dataInfo.task.id);
                        that.batchDelTask(idList,function () {
                            location.hash = '/project/taskIssue?id='+that.settings.projectId+'&projectName='+encodeURI(that.settings.projectName)+'&dataCompanyId='+that.settings.dataCompanyId;
                        });
                        break;
                    case 'publishingTasks'://发布任务
                        var idList = [];
                        idList.push(that._dataInfo.task.id);
                        that.batchPublishTask(idList);
                        break;

                    case 'uploadFile':

                        $('body').m_docmgr_fileUpload({
                            doType:2,
                            param : {folderId:that._dataInfo.filePid},
                            fileList:that._dataInfo.attachList,
                            cancelCallBack:function () {
                                that.init();
                            }
                        });
                        break;
                    case 'returnBack'://返回

                        $('.m-metismenu ul.metismenu li.active a span').click();

                        break;
                }
            });

            $(that.element).find('a[data-toggle="tab"]').on('click',function () {

                if(that.settings.tabClickCallBack)
                    that.settings.tabClickCallBack();
            });
            $(that.element).find('.tab-pane[data-type="approvalRecord"] table tbody tr[data-id]').on('click',function () {
                $('body').m_task_issue_approval({
                    projectId:that.settings.projectId,
                    taskId:that._dataInfo.task.id,
                    id:$(this).closest('tr').attr('data-id'),
                    saveCallBack:function () {
                        that.init(4);
                    },
                    closeCallBack:function () {
                        that.init(4);
                    }
                },true);
            })
        }
        //渲染变更记录
        ,renderChangeHistory:function () {
            var that = this;
            var option = {};
            option.param = {};
            option.param.historyId = that.settings.taskId;
            paginationFun({
                eleId: '.tab-pane[data-type="changeHistory"] #data-pagination-container',
                loadingId: '.tab-pane[data-type="changeHistory"] .data-list-box',
                url: restApi.url_listHistory,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    var html = template('m_task_issue/m_task_issue_details_history',{
                        dataList:response.data.data,
                        pageIndex:$(that.element).find('.tab-pane[data-type="changeHistory"] #data-pagination-container').pagination('getPageIndex')
                    });
                    $(that.element).find('.tab-pane[data-type="changeHistory"] .data-list-container').html(html);

                    //任务订单-查看描述
                    $(that.element).find('.tab-pane[data-type="changeHistory"] a[data-action="viewTaskRemark"]').on('click',function () {
                        //获取节点数据
                        var dataId = $(this).closest('tr').attr('data-id');
                        var historyItem = getObjectInArray(response.data.data,dataId);
                        var detailKey = $(this).attr('data-key');
                        $('body').m_task_issue_view_remark({
                            remark:historyItem[detailKey]
                        },true);
                        return false;
                    })
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染校审意见
        ,renderApprovalOpinion:function (callBack) {
            var that = this;
            var option = {};
            option.param = {};
            option.param.taskId = that.settings.taskId;
            option.param.fileId = that._dataInfo.filePid;
            paginationFun({
                eleId: '.tab-pane[data-type="approvalOpinion"] #data-pagination-container-approvalOpinion',
                loadingId: '.tab-pane[data-type="approvalOpinion"] .data-list-box',
                url: restApi.url_listApprovalOpinion,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._approvalOpinionData = response.data.data;
                    $(that.element).find('.tab-pane[data-type="approvalOpinion"] .data-list-container').m_production_approval_opinion({
                        approvalOpinionData:that._approvalOpinionData,
                        projectName:that.settings.projectName,
                        projectId:that.settings.projectId,
                        dataCompanyId:that.settings.dataCompanyId,
                        taskId:that.settings.taskId,
                        dataInfo:that._dataInfo,
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
        //批量删除任务
        ,batchDelTask:function (idList,callBack) {
            var that = this;
            S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                var option = {};
                option.url = restApi.url_deleteProjectTask;
                option.postData = {};
                option.postData.idList = idList;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        S_toastr.success('删除成功！');
                        if(!callBack)
                            that.init();
                        if(callBack)
                            callBack();
                    } else {
                        S_layer.error(response.info);
                    }
                });

            }, function () {
            });
        }
        //批量发布
        ,batchPublishTask:function (idList) {

            var that = this;
            S_layer.confirm('确定发布任务？', function () {

                var option = {};
                option.classId = '#content-right';
                option.url = restApi.url_publishIssueTask;
                option.postData = {};
                option.postData.projectId = that.settings.projectId;
                option.postData.idList = idList;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        S_toastr.success('发布成功');
                        that.init();
                    } else {
                        S_layer.error(response.info);
                    }
                });
            }, function () {
            });
        }
        //hover事件
        ,editTaskHoverFun:function ($ele) {
            var that = this;
            //文本移上去出现编辑图标hover事件
            $(that.element).find('a[data-action="xeditable"]').each(function () {

                var $this = $(this);
                $this.parent().hover(function () {
                    if(!($(this).find('.m-editable').length>0)){
                        $this.css('visibility','visible');
                    }
                },function () {
                    if(!($(this).find('.m-editable').length>0)) {
                        $this.css('visibility','hidden');
                    }
                })
            });

        }
        //在位编辑内容初始化
        ,bindEditable:function(){
            var that = this;
            $(that.element).find('a[data-action="xeditable"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var dataInfo = null;
                var noInternalInit = false;

                var popoverStyle={};
                if(key=='companyId'){

                    noInternalInit = true;
                    popoverStyle = {'min-width':'195px','top':'-7px'};

                }else if(key=='taskRemark'){

                    popoverStyle = {'width':'100%','max-width':'100%'};
                    value = $this.closest('.form-group').find('.show-span').html();

                }else if(key=='taskRelationId'){

                    dataInfo = [];
                    $.each(that._projectTempData.functionList,function (i,item) {
                        dataInfo.push({id:item.relationId,name:item.fieldName});
                    });

                }else{
                    popoverStyle = {'max-width':'140px','top':'-3px'};
                }


                $this.m_editable({
                    inline:true,
                    popoverStyle:popoverStyle,
                    hideElement:true,
                    isNotSet:false,
                    value:value,
                    dataInfo:dataInfo,
                    targetNotQuickCloseArr : ['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options'],
                    closed:function (data) {
                        if(data!=false){
                            var param = {};
                            if(key=='startTime'){

                                param.changeTime = 1;
                                param.endTime = $this.attr('data-max-date');

                            }else if(key=='endTime'){

                                param.isUpdateDate = 1;
                                param.startTime = $this.attr('data-min-date');
                            }
                            if(data[key]!=null){
                                param[key] = data[key];
                                that.updateProjectBaseData(param);
                            }
                        }
                        $(that.element).find('.show-span').show();
                    },
                    noInternalInit:noInternalInit,
                    completed:function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();
                        if(key=='taskRemark'){
                            $this.closest('.form-group').find('.show-span').hide();
                        }
                        else if(key=='companyId'){
                            $popover.find('.m-editable-control').m_org_select({
                                isBtnSm:true,
                                orgParam:{projectId:that.settings.projectId},
                                dataInfo:{
                                    companyId:value,
                                    departId:$this.attr('data-depart-id'),
                                    orgName:$this.prev().text()
                                },
                                selectCallBack:function (data) {
                                    if(data!=null){

                                        var dataChange = $this.attr('data-change');
                                        var saveFun = function () {
                                            var param = {};
                                            param.companyId = data.companyId;
                                            param.orgId = data.departId;
                                            param.isChangeOrg = 1;
                                            that.updateProjectBaseData(param);

                                        };
                                        if(dataChange==1){
                                            saveFun();
                                        }else{
                                            S_layer.confirm('旧组织所产生的生产数据将不可恢复，您确定要切换吗？', function () {
                                                saveFun();
                                            }, function () {
                                            });
                                        }
                                    }
                                }
                            },true);
                        }
                    }
                },true);
            });


            var $taskStatus=$(that.element).find('a[data-action="xeditable-status"]');
            $taskStatus.m_editable({
                inline:true,
                hideElement:true,
                isNotSet:false,
                value:$taskStatus.attr('data-value'),
                dataInfo:[{id: 1, name: '进行中'},
                    {id: 2, name: '已完成'},
                    {id: 3, name: '已暂停'},
                    {id: 4, name: '已终止'}],
                targetNotQuickCloseArr : ['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options'],
                closed:function (data) {

                    if(data!=false){
                        var param = {};
                        param.endStatus = data.endStatus;
                        param.id = $taskStatus.attr('data-id');
                        that.saveTaskStatus(param);
                    }
                    $taskStatus.show();
                },
                completed:function ($popover) {
                    $taskStatus.hide();
                }
            },true);
        }
        //编辑签发保存
        ,updateProjectBaseData:function (param) {
            var options={},that=this;
            options.url=restApi.url_updateProjectBaseData;
            options.classId = 'body';
            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            options.postData.id = that._dataInfo.task.id;

            $.extend(options.postData, param);
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.init();
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
            });
        }
        //获取设计阶段，专业数据
        ,getTaskOption:function (callBack) {
            var that=this;
            var option={};
            option.classId = that.element;
            option.url=restApi.url_listTaskOption;
            option.postData = {
                projectId:that.settings.projectId
            };
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    that._projectTempData = response.data;
                    if(callBack)
                        callBack(response.data);
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,renderDesignFile:function () {
            var that = this;
            $(that.element).find('.tab-pane[data-type="designFile"] .design-file-list').m_production_design_file({
                doType:2,
                projectName:that.settings.projectName,
                projectId:that.settings.projectId,
                dataCompanyId:that.settings.dataCompanyId,
                taskId:that.settings.taskId,
                dataInfo:that._dataInfo,
                saveCallBack:function () {
                    that.init(3);
                }
            },true);
        }
        //保存子项状态
        ,saveTaskStatus:function (data) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_updateProjectBaseData;
            option.postData = data;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    that.init();
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
