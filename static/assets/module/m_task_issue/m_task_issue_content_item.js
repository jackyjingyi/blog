/**
 * 项目信息－任务订单
 * Created by wrb on 2018/11/2.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_content_item",
        defaults = {
            projectId:null,
            projectName:null,
            dataInfo:null,//签发数据
            doType:1,//默认签发界面调用，2=详情调用
            dataCompanyId:null,//视图组织
            managerInfo:null,//项目负责人数据
            reRenderCallBack:null,
            renderCallBack:null,
            reGetDataCallBack:null,
            saveCallBack:null
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
        this._fastdfsUrl = window.fastdfsUrl;//文件地址

        this._dataInfo = this.settings.dataInfo;//请求签发数据
        this._lastClickCheckBoxEle = null;//最后点击的checkbox all

        this._addSubTaskEvt = [];//存放添加事件event
        this._contentId = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderContent();
        },
        //渲染初始界面
        getData:function (callBack) {

            var that = this;

            var options={};
            options.classId = '#content-right';
            options.url=restApi.url_getIssueInfo;
            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            options.postData.companyId = that.settings.dataCompanyId;

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    var dataItem = getObjectInArray(response.data.contentTaskList,that._dataInfo.id);
                    that._dataInfo = dataItem;
                    if(that.settings.reGetDataCallBack)
                        that.settings.reGetDataCallBack(response.data);

                    if(callBack)
                        callBack();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //渲染签发列表
        ,renderContent:function () {
            var that = this;

            var $data = {};
            $data.projectId = that.settings.projectId;
            $data.projectNameCode = encodeURI(that.settings.projectName);
            $data.p = that._dataInfo;
            $data.dataCompanyId = that.settings.dataCompanyId;
            $data.currentCompanyId = that._currentCompanyId;
            $data.currentCompanyUserId = that._currentCompanyUserId;
            $data.managerInfo = that.settings.managerInfo;
            $data.businessType = that.settings.businessType;

            var html = template('m_task_issue/m_task_issue_content_item', $data);
            $(that.element).html(html);
            var width = ($(that.element).find('table.table').width())*0.26-20;
            if(that.settings.doType==2)
                width = ($(that.element).closest('.tabs-container').width()-43)*0.26-20;

            stringCtrl($('a.task-name'),width,true);
            that.initICheck();
            that.editHoverFun();
            that.bindTrActionClick();
            that.bindEditable();
            $(that.element).find('i[data-toggle="tooltip"]').tooltip();
            that.disableNotOperational();
            if(that.settings.renderCallBack)
                that.settings.renderCallBack(that._contentId);
        }
        //重新加载数据
        ,reRenderContent:function () {
            var that = this;
            //获取正在编辑的行
            var rowEditList = [];
            $(that.element).find('.content-row-edit').each(function () {

                var $prev = $(this).prev('tr');
                var prevId = $prev.attr('data-id');
                var taskName = $(this).find('input[name="taskName"]').val();

                rowEditList.push({
                    prevId : prevId,
                    taskName:taskName,
                    content : $(this).clone(true)
                })
            });

            that.getData(function () {
                that.renderContent();
                that.renderTodoList();
                if(rowEditList.length>0){
                    $.each(rowEditList,function (i,item) {
                        item.content.appendTo($(that.element).find('tbody'));
                    });
                }
            });

        }
        //禁用没有可操作的元素
        ,disableNotOperational:function () {
            var that = this;
            $(that.element).find('input[name="taskCk"]').each(function () {
                var $this = $(this);
                var isPublish = $this.attr('data-is-can1');
                var isDelete = $this.attr('data-is-can2');
                if(isPublish==0 && isDelete==0)
                    $this.iCheck('disable');
            });
            //禁用父级全选、禁用操作按钮
            var disabledLen = $(that.element).find('input[name="taskCk"]:disabled').length;
            var allCkLen = $(that.element).find('input[name="taskCk"]').length;
            if(disabledLen==allCkLen || allCkLen==0){
                $(that.element).find('input[name="taskAllCk"]').iCheck('disable');
                $(that.element).find('#batchAllOperation button').addClass('disabled');
            }
            //禁用操作按钮项
            var deleteDisabledLen = $(that.element).find('input[name="taskCk"][data-is-can2="1"]').length;
            var publishDisabledLen = $(that.element).find('input[name="taskCk"][data-is-can1="1"]').length;
            if(deleteDisabledLen==0)
                $(that.element).find('#batchAllOperation a[data-action="batchDelTask"]').remove();

            if(publishDisabledLen==0)
                $(that.element).find('#batchAllOperation a[data-action="batchPublishTask"]').remove();
        }
        //事件绑定
        ,bindTrActionClick:function ($ele) {
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);
            $ele.find('a[data-action],button[data-action]').on('click', function (e) {
                var $this = $(this);
                var $panel = $this.closest('.panel');
                var dataAction = $this.attr('data-action');
                var dataPid = $this.closest('.panel').attr('data-id');
                var dataId = $this.closest('tr').attr('data-id');
                var dataI = $this.closest('tr').attr('data-i')-0;
                //获取节点数据
                var dataPidItem = that._dataInfo;
                var dataItem = getObjectInArray(dataPidItem.childList,dataId);
                switch (dataAction) {
                    case 'addSubTask'://添加子任务
                        if(dataPidItem.childList==null || dataPidItem.childList.length==0)
                            $panel.find('tr.no-data-tr').hide();
                        $this.m_task_issue_add({
                            isDialog:false,
                            taskId : dataPid,
                            taskType:2,
                            projectId:that.settings.projectId,
                            timeInfo:{
                                startTime:dataPidItem.startTime,
                                endTime:dataPidItem.endTime
                            },
                            saveCallBack:function (data,e) {
                                $(e.target).closest('tr.content-row-edit').remove();
                                that._contentId = data;
                                that.reRenderContent();

                            },
                            cancelCallBack:function () {
                                if((dataPidItem.childList==null || dataPidItem.childList.length==0) && $panel.find('tr.content-row-edit').length==0)
                                    $panel.find('tr.no-data-tr').show();
                            }
                        },true);
                        return false;
                        break;
                    case 'addMultipleSubTask'://批量添加子任务
                        $('body').m_task_issue_add_mult({
                            type:1,
                            projectId:that.settings.projectId,
                            taskInfo:{
                                taskId : dataPid,
                                startTime:dataPidItem.startTime,
                                endTime:dataPidItem.endTime
                            },
                            saveCallBack:function (data,e) {
                                that.reRenderContent();
                            }
                        },true);
                        return false;
                        break;
                    case 'delTask'://删除任务
                        var idList = [];
                        idList.push({id:dataId,designTaskId:dataItem.designTaskId});
                        that.batchDelTask(idList);
                        break;
                    case 'batchDelTask'://批量删除
                        var idList = [];
                        $panel.find('input[name="taskCk"][data-is-can2="1"]:checked').each(function () {
                            var id = $(this).closest('tr').attr('data-id'),designTaskId = $(this).closest('tr').attr('data-design-task-id');
                            idList.push({id:id,designTaskId:designTaskId});
                        });
                        if(idList.length>0){
                            that.batchDelTask(idList);
                        }else{
                            S_toastr.warning('当前不存在可删除的任务，请重新选择！');
                        }
                        break;
                    case 'publishTask'://发布
                        var idList = [];
                        idList.push(dataId);
                        that.batchPublishTask(idList);
                        break;
                    case 'batchPublishTask'://批量发布
                        var idList = [];
                        $panel.find('input[name="taskCk"][data-is-can1="1"]:checked').each(function () {
                            var id = $(this).closest('tr').attr('data-id');
                            idList.push(id);
                        });
                        if(idList.length>0){
                            that.batchPublishTask(idList);
                        }else{
                            S_toastr.warning('当前不存在可发布的任务，请重新选择！');
                        }
                        break;
                    case 'moveUp'://向上移动

                        var taskArr = [];
                        taskArr.push({
                            id:dataPidItem.childList[dataI].id,
                            seq:dataPidItem.childList[dataI].seq-0
                        });

                        taskArr.push({
                            id:dataPidItem.childList[dataI-1].id,
                            seq:dataPidItem.childList[dataI-1].seq-0
                        });
                        that.saveTaskMoveInSeq(taskArr);

                        break;
                    case 'moveDown'://向下移动

                        var taskArr = [];
                        taskArr.push({
                            id:dataPidItem.childList[dataI].id,
                            seq:dataPidItem.childList[dataI].seq
                        });
                        taskArr.push({
                            id:dataPidItem.childList[dataI+1].id,
                            seq:dataPidItem.childList[dataI+1].seq
                        });
                        that.saveTaskMoveInSeq(taskArr);
                        break;
                    case 'stateFlow'://状态流转

                        var endStatus = $this.attr('data-end-status');
                        if(endStatus==5){
                            $('body').m_task_issue_approval({
                                projectId:that.settings.projectId,
                                taskId:dataId,
                                saveCallBack:function () {
                                    that.reRenderContent();
                                },
                                closeCallBack:function () {
                                    that.reRenderContent();
                                }
                            },true);
                        }else{
                            $('body').m_task_issue_status_flow({
                                dataInfo:dataItem,
                                isShowStop:true,
                                saveCallBack:function () {
                                    that.reRenderContent();
                                }
                            },true);
                        }
                        break;

                    case 'pauseTask'://暂停

                        that.updateTaskStatus({
                            id:dataId,
                            endStatus:$this.attr('data-end-status')
                        },$this.text());
                        break;
                    case 'stopTask'://终止

                        that.updateTaskStatus({
                            id:dataId,
                            endStatus:$this.attr('data-end-status')
                        },$this.text());
                        break;
                    case 'startUpTask'://启动

                        that.updateTaskStatus({
                            id:dataId,
                            endStatus:$this.attr('data-end-status')
                        },$this.text());
                        break;

                    case 'toProcessSettings'://流程设置

                        that.getListTaskProcess(dataId,function (data) {

                            var processList = [];
                            $.each(data,function (i,item) {
                                processList.push({id:item.id,name:item.processName});
                            });

                            $this.m_editable({
                                inline:true,
                                popoverClass : 'full-width',
                                hideElement:true,
                                value:$this.attr('data-value'),
                                dataInfo:processList,
                                isInitAndStart:true,
                                isNotSet:false,
                                closed:function (data) {
                                    if(data!=false){
                                        that.startTaskProcess(dataId,data.processId);
                                    }
                                    $this.parent().find('.show-span').show();

                                },
                                completed:function ($popover) {
                                    $(that.element).find('.show-span').show();
                                    $this.parent().find('.show-span').hide();
                                }
                            },true);
                        });
                        break;
                }
                stopPropagation(e);
                return false;

            });
        }
        ,initICheck:function ($ele) {
            var that = this,isInitCheckAll = false;
            if(isNullOrBlank($ele)){
                $ele = $(that.element);
                isInitCheckAll = true
            }

            //判断全选是否该选中并给相关处理
            var dealAllCheck = function ($panel) {
                $panel.find('input[name="taskAllCk"]').each(function () {
                    var taskLen = $(this).closest('.panel').find('input[name="taskCk"]').length;
                    var taskCheckedLen = $(this).closest('.panel').find('input[name="taskCk"]:checked').length;
                    if(taskLen==taskCheckedLen && taskLen==taskCheckedLen!=0){
                        $panel.find('input[name="taskAllCk"]').prop('checked',true);
                        $panel.find('input[name="taskAllCk"]').iCheck('update');
                    }else{
                        $panel.find('input[name="taskAllCk"]').prop('checked',false);
                        $panel.find('input[name="taskAllCk"]').iCheck('update');
                    }
                });
            };
            var ifChecked = function (e) {

                if($(this).attr('data-is-can1')=='1' || $(this).attr('data-is-can2')=='1')
                    $(this).closest('tr').addClass('chose-operable');
                dealAllCheck($(this).closest('.panel'));
            };
            var ifUnchecked = function (e) {

                $(this).closest('tr').removeClass('chose-operable');
                dealAllCheck($(this).closest('.panel'));
            };
            $ele.find('input[name="taskCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);

            if(!isInitCheckAll)
                return false;


            var ifAllChecked = function (e) {

                $(this).closest('.panel').find('input[name="taskCk"][data-is-can1="1"]:not(:disabled),input[name="taskCk"][data-is-can2="1"]:not(:disabled)').closest('tr').addClass('chose-operable');
                $(this).closest('.panel').find('input[name="taskCk"]:not(:disabled)').prop('checked',true);
                $(this).closest('.panel').find('input[name="taskCk"]:not(:disabled)').iCheck('update');
            };
            var ifAllUnchecked = function (e) {

                $(this).closest('.panel').find('input[name="taskCk"][data-is-can1="1"]:not(:disabled),input[name="taskCk"][data-is-can2="1"]:not(:disabled)').closest('tr').removeClass('chose-operable');
                $(this).closest('.panel').find('input[name="taskCk"]:not(:disabled)').prop('checked',false);
                $(this).closest('.panel').find('input[name="taskCk"]:not(:disabled)').iCheck('update');
            };
            var ifAllClicked = function (e) {

            };
            $ele.find('input[name="taskAllCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifAllUnchecked).on('ifChecked.s', ifAllChecked).on('ifClicked',ifAllClicked);
        }
        //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('tr');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action][data-deal-type="edit"],a[data-action="xeditable"],a[data-action="xeditable-child-status"],a.toProcessSettings').each(function () {

                var $this = $(this);

                $this.closest('TD').hover(function () {
                    if(!($(this).find('.m-editable').length>0)){
                        $this.css('visibility','visible');
                    }
                },function () {
                    if(!($(this).find('.m-editable').length>0)) {
                        $this.css('visibility','hidden');
                    }
                })
            });
            //TR hover效果
            $ele.each(function () {

                var $this = $(this);
                var singleOperation = $this.find('.singleOperation');
                var batchOperation = $this.find('.batchOperation');

                $this.hover(function () {
                    if(batchOperation.length==0 || batchOperation.css('display')=='none'){
                        singleOperation.show();
                    }
                    if(!$this.hasClass('chose-operable')){
                        $this.addClass('tr-hover');
                    }

                },function () {
                    singleOperation.hide();
                    if(!$this.hasClass('chose-operable')){
                        $this.removeClass('tr-hover');
                    }
                });
            });
        }

        //在位编辑内容初始化
        ,bindEditable:function($ele){
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);

            $ele.find('a[data-action="xeditable"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var dataInfo = null;
                var targetNotQuickCloseArr = [];

                var dataId = $this.closest('tr').attr('data-id');
                //获取节点数据
                var dataPidItem = that._dataInfo;
                var dataItem = getObjectInArray(dataPidItem.childList,dataId);
                var postParam = {projectId:that.settings.projectId};
                if(key=='orgId'){


                }else if(key=='personInCharge' || key=='orderDeanId'){

                    targetNotQuickCloseArr = ['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options','m-org-tree-select'];
                    value = [{text:$this.attr('data-name'),id:$this.attr('data-value')}];
                    postParam = {id:$this.attr('data-task-id')};
                }
                $this.m_editable({
                    inline:true,
                    popoverClass : 'full-width',
                    hideElement:true,
                    isNotSet:false,
                    limitStartTime:true,
                    value:value,
                    dataInfo:dataInfo,
                    targetNotQuickCloseArr:targetNotQuickCloseArr,
                    postParam:postParam,
                    closed:function (data) {

                        if(data!=false){
                            var param = {};

                            var taskId = $this.closest('tr').attr('data-id');
                            if(key=='startTime'){

                                param.isUpdateDate = 1;
                                param.endTime = $this.attr('data-max-date');

                            }else if(key=='endTime'){

                                param.isUpdateDate = 1;
                                param.startTime = $this.attr('data-min-date');

                            }else if(key=='completeDate'){
                                param.completeDate = $this.attr('data-complete-date');
                            }

                            if(data[key]!=null){

                                if(key=='personInCharge'){

                                    data.type = 1;
                                    data.id = $this.attr('data-id');//旧任务负责人
                                    data.taskId = taskId;
                                    data.companyUserId = data[key][0].id;
                                    that.editManagerChange(data);

                                }else if(key=='orderDeanId'){

                                    data.id = taskId;
                                    data.orderDeanId = data[key][0].id;
                                    that.updateProjectBaseData(data);

                                }else{
                                    param[key] = data[key];
                                    param.id = taskId;
                                    that.updateProjectBaseData(param);
                                }

                            }
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed:function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();
                        if(key=='orgId'){
                            var $input = $popover.find('input[name="orgId"]');
                            $input.attr('readonly','true');
                            $input.m_org_tree_select({
                                //treeData:data,
                                clearOnInit:false,
                                selectedCallBack:function (data) {
                                    console.log(data);
                                    var oldValue = $this.attr('data-id');
                                    if(data.id!=oldValue){
                                        that.updateProjectBaseData({orgId:data.id,id: $this.closest('tr').attr('data-id')});
                                    }
                                }
                            });
                        }
                    }
                },true);
            });

            $(that.element).find('a[data-action="xeditable-child-status"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key'), value = $this.attr('data-value'), dataInfo = null;
               if (key == 'endStatus') {
                    dataInfo = [{id: 1, name: '进行中'},
                        {id: 2, name: '已完成'},
                        {id: 3, name: '已暂停'},
                        {id: 4, name: '已终止'}];
                }
                $this.m_editable({
                    inline: true,
                    popoverStyle: {'width': '100px'},
                    hideElement: true,
                    isNotSet: false,
                    value: value,
                    dataInfo: dataInfo,
                    targetNotQuickCloseArr: ['select2-selection__choice', 'select2-search--dropdown', 'select2-search__field', 'select2-results__options'],
                    closed: function (data) {

                        if (data != false) {
                            var param = {};
                            param[key] = data[key];
                            var text = '';
                            var classStyle = '';
                            var value ='';
                            if(key == 'endStatus') {
                                param.id =  $this.closest('tr').attr('data-id');
                                that.updateTaskStatus(param,text);
                            }
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed: function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();
                    }
                }, true);
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
                    that.reRenderContent();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //批量删除任务
        ,batchDelTask:function (idList) {
            var that = this;
            S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                var option = {};
                option.classId = 'body';
                option.url = restApi.url_deleteOrderTask;
                option.postData = {};
                option.postData.taskList = idList;
                option.postData.projectId=that.settings.projectId,
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        S_toastr.success('删除成功！');
                        that.reRenderContent();
                    } else {
                        S_layer.error(response.info);
                    }
                });

            }, function () {
            });
        }
        //编辑签发保存
        ,saveTaskIssue:function (param) {
            var options={},that=this;
            options.url=restApi.url_saveTaskIssuing;
            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            options.postData.taskType =2;
            $.extend(options.postData, param);
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.reRenderContent();
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
            });
        }
        //编辑签发保存
        ,updateProjectBaseData:function (param,type) {
            var options={},that=this;
            options.url=restApi.url_updateProjectBaseData;
            if(type==1){
                options.url=restApi.url_updateDesignTaskName;
            }else if(type==2){
                options.url=restApi.url_updateMajorTaskName;
            }

            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            //options.postData.taskType =2;
            $.extend(options.postData, param);
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.reRenderContent();
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
            });
        }
        //批量发布
        ,batchPublishTask:function (idList) {

            var that = this;
            S_layer.confirm('确定发布任务？',function () {

                var option = {};
                option.classId = '#content-right';
                option.url = restApi.url_publishIssueTask;
                option.postData = {};
                option.postData.projectId = that.settings.projectId;
                option.postData.idList = idList;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        S_toastr.success('发布成功');

                        if(that.settings.reRenderCallBack){
                            that.settings.reRenderCallBack();
                        }else{
                            that.reRenderContent();
                        }

                    } else {
                        S_layer.error(response.info);
                    }
                });
            },function () {
            });
        }
        //向上、向下移动保存
        ,saveTaskMoveInSeq:function (taskList) {

            var that = this;
            var option = {};
            option.url = restApi.url_exchangeTask;
            option.postData = [];
            option.postData = taskList;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('更新成功');
                    that.reRenderContent();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //状态修改（暂停，终止）
        ,updateTaskStatus:function (data,title) {
            var that = this;
            var option = {};
            option.classId = 'body';
            option.url = restApi.url_updateProjectBaseData;
            option.postData = data;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功！');
                    that.reRenderContent();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染待办任务
        ,renderTodoList:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_listMyTaskUnComing;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    if (response.data != null) {
                        if(response.data.total!=null&&response.data.total>0){
                            $('#unReadTodoCount').addClass('unReadTodoCount');
                            $('#unReadTodoCount').html(response.data.total);
                        }else{
                            $('#unReadTodoCount').removeClass('unReadTodoCount');
                            $('#unReadTodoCount').html('');
                        }
                        }
                    }
            });
        }
        //获取流程数据
        ,getListTaskProcess:function (taskId,callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listTaskProcess;
            option.postData = {};
            option.postData.taskId = taskId;
            option.postData.projectId = that.settings.projectId;
            option.postData.processType = '1';
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(callBack)
                        callBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //选择流程
        ,startTaskProcess:function (taskId,processId) {
            var that = this;
            var option = {};
            option.url = restApi.url_startTaskProcess;
            option.postData = {};
            option.postData.id = processId;
            option.postData.taskId = taskId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功！');
                    that.reRenderContent();
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

                //写入缓存project/taskIssue/details
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
