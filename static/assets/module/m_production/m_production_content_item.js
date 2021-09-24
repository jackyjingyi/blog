/**
 * 项目信息－生产安排
 * Created by wrb on 2018/11/2.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_content_item",
        defaults = {
            projectId:null,
            projectName:null,
            dataInfo:null,//生产数据
            managerInfo:null,//负责人数据
            doType:1,//默认生产界面调用，2=详情调用,3=我的任务界面调用(暂未用),4=专业详情-任务列表
            dataCompanyId:null,//视图组织
            issueTaskId:null,//专业任务ID
            reRenderCallBack:null,
            taskStatus:null,//任务状态（0=待处理，1=已处理）
            renderCallBack:null,
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

        this._dataInfo = this.settings.dataInfo;//请求生产数据
        this._managerInfo = this.settings.managerInfo;//项目负责人


        this._designerListByAdd=[];//添加任务－设计人员列表
        this._checkUserListByAdd=[];//添加任务－校对人员列表
        this._examineUserListByAdd=[];//添加任务－审核人员列表
        this._examineApproveUserListByAdd=[];//添加任务－审定人员列表
        this._handlerUserListByAdd=[];//添加任务－处理人员列表
        this._personInChargeListByAdd=[];


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            if(that.settings.doType==4){//4=专业详情-校审意见

                that.getData(function () {
                    that.renderContent();
                    that.renderTodoList();
                });

            }else{
                that.renderContent();
            }

        }
        ,renderContent:function () {
            var that = this;
            var $data = {};

            if(that._dataInfo){
                if(that._dataInfo.childList!=null && that._dataInfo.childList.length>0){
                    var childList = that._dataInfo.childList;
                    $.each(childList,function (si,sitem) {
                        if(!isNullOrBlank(sitem.taskPid)){
                            var dataItem = getObjectInArray(childList,sitem.taskPid);
                            sitem.parentTask = dataItem;
                        }
                    });
                }
            }

            $data.projectId = that.settings.projectId;
            $data.projectNameCode = encodeURI(that.settings.projectName);
            $data.p = that._dataInfo;
            $data.currentCompanyUserId = that._currentCompanyUserId;
            $data.doType = that.settings.doType;
            $data.dataCompanyId = that.settings.dataCompanyId;
            $data.taskStatus =  that.settings.taskStatus;
            var html = template('m_production/m_production_content_item',$data);
            $(that.element).html(html);
            /*$(that.element).find('.tree').treegrid(
                {
                    expanderExpandedClass: 'ic-open',
                    expanderCollapsedClass: 'ic-retract',
                    treeColumn: 2
                }
            );*/
            var width = ($(that.element).find('table.table').width())*0.25-20;
            if(that.settings.doType==2){
                width = ($(that.element).closest('.tabs-container').width()-43)*0.25-20;
            }
            stringCtrl($('a.task-name'),width,true);
            that.initICheck();
            that.editHoverFun();
            that.bindTrActionClick();
            that.bindEditable();

            //控制向下与向上按钮展示与否
            $(that.element).find('a[data-action="moveUp"]').each(function () {
                var id = $(this).closest('tr').attr('data-id');
                var pid = $(this).closest('tr').attr('data-pid');

                if($(that.element).find('tr[data-pid="'+pid+'"]').length>1){

                    $(that.element).find('tr[data-pid="'+pid+'"]:first a[data-action="moveUp"]').parent().remove();
                    $(that.element).find('tr[data-pid="'+pid+'"]:last a[data-action="moveDown"]').parent().remove();

                }else{
                    $(this).closest('tr').find('a[data-action="moveDown"]').remove();
                    $(this).closest('li').remove();
                }
            });

            //下拉按钮，外层浮窗展示，避免原浮窗导致panel出现横向滚动条
            $(that.element).find('.singleOperation button[data-toggle="dropdown"]').on('click',function () {
                var $this = $(this);
                var $html = $this.next().clone(true);
                var content = $html.removeClass('hide').addClass('dp-block').prop('outerHTML');
                $this.m_floating_popover({
                    content: content,
                    placement: 'bottomLeft',
                    popoverStyle:{'border':'0','box-shadow':'none'},
                    renderedCallBack: function ($popover) {
                        $popover.find('a[data-action]').on('click',function () {
                            var dataAction = $(this).attr('data-action');
                            $this.next().find('a[data-action="'+dataAction+'"]').click();
                            $this.m_floating_popover('closePopover');//关闭浮窗
                            return false;
                        });
                        $popover.hover(function () {
                            $this.parents('.singleOperation').show();
                        },function () {
                            $this.parents('.singleOperation').hide();
                            $this.m_floating_popover('closePopover');//关闭浮窗
                        });
                    }
                }, true);
            });

            if(that.settings.renderCallBack)
                that.settings.renderCallBack();
        }
        //渲染列表
        ,getData:function (callBack) {
            var that = this;
            var options={};
            options.url=restApi.url_getDesignTaskList;
            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            options.postData.type=2;

            if(that.settings.doType==4){//4=专业详情-校审意见

                options.postData.companyId = that.settings.dataCompanyId;
                options.postData.issueTaskId = that.settings.issueTaskId;

            }else{
                options.postData.companyId = that.settings.dataCompanyId;
                var issueTaskId = $('.m-product-left-tab .list-group-item.active').attr('data-id');
                if(!isNullOrBlank(issueTaskId))
                    options.postData.issueTaskId = issueTaskId;
            }


            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    var dataItem = getObjectInArray(response.data.projectDesignContentShowList,that._dataInfo.id);
                    that._dataInfo = dataItem;
                    if(callBack)
                        callBack();

                    if(that.settings.dataCallBack){
                        that.settings.dataCallBack(response.data);
                    }

                }else {
                    S_layer.error(response.info);
                }
            })


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

        //重新加载数据
        ,reRenderContent:function () {
            var that = this;


            if(that.settings.reRenderCallBack){
                that.settings.reRenderCallBack();
            }else{
                //获取正在编辑的行
                var rowEditList = [];
                $(that.element).find('.content-row-edit').each(function () {

                    var $tr = $(this).closest('tr');
                    var trPid = $tr.attr('data-pid');
                    rowEditList.push({
                        trPid : trPid,
                        content : $(this).clone(true)
                    })
                });

                that.getData(function () {
                    that.renderContent();

                    if(rowEditList.length>0){
                        $.each(rowEditList,function (i,item) {

                            if(!isNullOrBlank(item.trPid) && $(that.element).find('tr[data-id="'+item.trPid+'"]').length>0){
                                var $lastTr = $(that.element).find('tr[data-pid="'+item.trPid+'"]:last');
                                if($lastTr.length==0){
                                    item.content.insertAfter($(that.element).find('tr[data-id="'+item.trPid+'"]:last'));
                                }else{
                                    item.content.insertAfter($lastTr);
                                }

                            }else{
                                item.content.appendTo($(that.element).find('tbody'));
                            }
                        });
                    }
                });
            }
        }

        ,bindTrActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').on('click', function (e) {
                var $this = $(this);
                var $panel = $this.closest('.panel');
                var dataAction = $this.attr('data-action');
                var dataPid = $this.closest('.panel').attr('data-id');
                var dataId = $this.closest('tr').attr('data-id');
                var dataHandler = $this.closest('tr').attr('data-handler');
                var dataI = $this.closest('tr').attr('data-i')-0;
                //获取节点数据
                var dataPidItem = that._dataInfo;
                var dataItem = getObjectInArray(dataPidItem.childList,dataId);
                if(dataItem==null)
                    dataItem = {};

                switch (dataAction) {
                    case 'addSubTask'://添加子任务
                        var isRoot = $this.attr('data-type');
                        if(dataPidItem.childList==null || dataPidItem.childList.length==0)
                            $panel.find('tr.no-data-tr').hide();

                        var personInChargeInfo = {};
                        if(that.settings.doType==1){
                            personInChargeInfo = {
                                personInCharge:that._managerInfo.projectManager.companyUserName,
                                personInChargeId:that._managerInfo.projectManager.companyUserName
                            };
                        }
                        if(!isNullOrBlank(dataPidItem.personInChargeId) && isRoot=='root'){
                            personInChargeInfo.personInCharge = dataPidItem.personInCharge;
                            personInChargeInfo.personInChargeId = dataPidItem.personInChargeId;
                        }else if(!isNullOrBlank(dataItem.personInChargeId) && isRoot!='root'){
                            personInChargeInfo.personInCharge = dataItem.personInCharge;
                            personInChargeInfo.personInChargeId = dataItem.personInChargeId;
                        }

                        $this.m_production_add({
                            isDialog:false,
                            taskId : isRoot=='root'?dataPid:dataId,
                            personInChargeInfo:personInChargeInfo,
                            timeInfo:{
                                startTime:isRoot=='root'?dataPidItem.startTime:dataItem.startTime,
                                endTime:isRoot=='root'?dataPidItem.endTime:dataItem.endTime
                            },
                            projectId:that.settings.projectId,
                            taskOptionList:isRoot=='root'?dataPidItem.taskOptionList:dataItem.taskOptionList,
                            saveCallBack:function (data,e) {
                                dataPidItem.childList.push(data);
                                $(e.target).closest('tr.content-row-edit').remove();
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

                        var isRoot = $this.attr('data-type');

                        var majorDesignRelationId = $('.m-product-left-tab li.list-group-item.active').attr('data-relation-id');
                        var stageDesignRelationId = $('.m-product-left-tab li.list-group-item.active').parents('.list-group').attr('data-relation-id');
                        var functionTypeRelationId = $('.m-product-left-tab li.list-group-item.active').parents('.task-box').attr('data-relation-id');

                        $('body').m_production_add_mult({
                            title:'批量添加生产任务',
                            type:2,
                            projectId:that.settings.projectId,
                            majorDesignRelationId:majorDesignRelationId,
                            stageDesignRelationId:stageDesignRelationId,
                            functionTypeRelationId:functionTypeRelationId,
                            taskInfo:dataItem,
                            dataPidItem:dataPidItem,
                            saveCallBack:function (data,e) {
                                that.reRenderContent();
                            }
                        });
                        return false;
                    case 'delTask'://删除任务
                        var idList = [];
                        idList.push(dataId);
                        that.batchDelTask(idList);
                        break;
                    case 'setPersonInCharge'://编辑任务负责人

                        that.choseTaskLeader($this,1);
                        return false;
                        break;
                    case 'moveUp'://向上移动

                        var taskArr = [];
                        taskArr.push({
                            id:dataPidItem.childList[dataI].id,
                            seq:dataPidItem.childList[dataI].seq-0
                        });
                        for(var i=dataI-1;i<dataI;i--){
                            if(dataPidItem.childList[i].taskLevel==dataPidItem.childList[dataI].taskLevel){
                                taskArr.push({
                                    id:dataPidItem.childList[i].id,
                                    seq:dataPidItem.childList[i].seq-0
                                });
                                break;
                            }
                        }
                        that.saveTaskMoveInSeq(taskArr);

                        break;

                    case 'moveDown'://向下移动

                        var taskArr = [];
                        taskArr.push({
                            id:dataPidItem.childList[dataI].id,
                            seq:dataPidItem.childList[dataI].seq
                        });
                        for(var i=dataI+1;i<dataPidItem.childList.length;i++){
                            if(dataPidItem.childList[i].taskLevel==dataPidItem.childList[dataI].taskLevel){
                                taskArr.push({
                                    id:dataPidItem.childList[i].id,
                                    seq:dataPidItem.childList[i].seq
                                });
                                break;
                            }
                        }
                        that.saveTaskMoveInSeq(taskArr);
                        break;
                    case 'completeTask'://确认完成

                        var tipStr = $this.attr('data-original-title');
                        var dataStatus = $this.attr('data-status');
                        if(dataStatus=='0'){//激活

                            S_layer.confirm(tipStr+'？',function () {
                                var option = {};
                                option.url = restApi.url_completeTask;
                                option.postData = {
                                    taskId:dataId,
                                    status:dataStatus
                                };
                                m_ajax.postJson(option,function (response) {
                                    if (response.code == '0') {
                                        S_toastr.success('操作成功');
                                        that.reRenderContent();
                                    } else {
                                        S_layer.error(response.info);
                                    }
                                });
                            },function () {
                            });
                        }else{//完成

                            var option = {};
                            option.taskId = dataId;
                            option.status = dataStatus;
                            option.saveCallBack = function () {
                                that.reRenderContent();
                            };
                            $('body').m_confirmCompletion(option);
                        }
                        e.stopPropagation();
                        break;
                    case 'batchDelTask'://批量删除
                        var idList = [];
                        $panel.find('input[name="taskCk"][data-is-can1="1"]:checked').each(function () {
                            var id = $(this).closest('tr').attr('data-id');
                            idList.push(id);
                        });

                        if($panel.find('input[name="taskCk"]:checked').length==0){
                            S_toastr.warning('请选择需要删除的任务！');
                            return false;
                        }
                        if(idList.length==0){
                            S_toastr.warning('当前不存在可删除的任务，请重新选择！');
                            return false;
                        }
                        that.batchDelTask(idList);
                        break;
                    case 'batchCopy'://批量复制
                        if($panel.find('input[name="taskCk"]:checked').length==0){
                            S_toastr.warning('请选择需要删除的任务！');
                            return false;
                        }
                        var sourceTaskList = [];
                        $panel.find('input[name="taskCk"]:checked').each(function () {
                            var id = $(this).closest('tr').attr('data-id');
                            var taskPid = $(this).closest('tr').attr('data-pid');
                            var taskName = $(this).closest('tr').find('.task-name').attr('data-string');
                            sourceTaskList.push({
                                id:id,
                                taskPid:isNullOrBlank(taskPid)?null:taskPid,
                                taskName:taskName
                            })
                        });
                        var sourceId = $('.m-product-left-tab li.list-group-item.active').attr('data-id');
                        $('body').m_production_copy({
                            sourceTaskList:sourceTaskList,
                            designer:that._dataInfo.designer,
                            sourceId:sourceId,
                            saveCallBack:function () {

                            }
                        });
                        break;

                    case 'batchTaskStateFlow'://我的任务-生产列表

                        var taskList = [],isSameState=true,stateStr='';
                        $(that.element).find('input[name="taskCk"]:checked').each(function (i) {
                            taskList.push({id:$(this).val()});

                            var status = $(this).attr('data-end-status');
                            if(i==0){
                                stateStr = status;
                            }
                            if(stateStr!=status){
                                isSameState = false;
                            }
                        });

                        if(taskList.length==0){
                            S_toastr.error('请选择需要批量变更状态的任务！');
                            return false;
                        }
                        if(isSameState==false){
                            S_layer.error('当前选择的内容，状态不一致，请重新选择要批量变更状态的内容！');
                            return false;
                        }

                        var dataItem = getObjectInArray(that._dataInfo.childList,taskList[0].id);


                        $('body').m_production_approval_opinion_state_flow({
                            doType:3,
                            isBatch:true,
                            dataInfo:dataItem,
                            postParam:{taskList:taskList},
                            postUrl:restApi.url_projectTask_batchChangeStatusAndComment,
                            projectId:that.settings.projectId,
                            saveCallBack:function () {
                                that.reRenderContent();
                            }
                        },true);
                        return false;
                        break;
                }

            });

        }
        ,initICheck:function ($ele) {
            var that = this,isInitCheckAll = false;
            if(isNullOrBlank($ele)){
                $ele = $(that.element);
                isInitCheckAll = true
            }

            //判断全选是否该选中并给相关处理
            var checkAll = function ($panel) {

                var checkedLen = $panel.find('input[name="taskCk"]:checked').length;
                var taskLen = $panel.find('input[name="taskCk"]').length;
                if(checkedLen==taskLen){
                    $panel.find('input[name="taskAllCk"]').prop('checked',true);
                    $panel.find('input[name="taskAllCk"]').iCheck('update');
                }else{
                    $panel.find('input[name="taskAllCk"]').prop('checked',false);
                    $panel.find('input[name="taskAllCk"]').iCheck('update');
                }
            };

            var ifChecked = function (e) {

                var $panel = $(this).closest('.panel');
                var ppath =  $(this).closest('tr').attr('data-path');
                $panel.find('tr.tree-box-tr').each(function () {
                    var path = $(this).attr('data-path');
                    if(path.indexOf(ppath)>-1 && path!=ppath){
                        $(this).find('input[name="taskCk"]').prop('checked',true);
                        $(this).find('input[name="taskCk"]').iCheck('update');
                        $(this).find('input[name="taskCk"]').iCheck('disable');
                    }else{
                        return true;
                    }
                });

                checkAll($panel);

            };
            var ifUnchecked = function (e) {

                var $panel = $(this).closest('.panel');
                var ppath =  $(this).closest('tr').attr('data-path');
                $panel.find('tr.tree-box-tr').each(function () {
                    var path = $(this).attr('data-path');
                    if(path.indexOf(ppath)>-1){
                        $(this).find('input[name="taskCk"]').prop('checked',false);
                        $(this).find('input[name="taskCk"]').iCheck('update');
                        $(this).find('input[name="taskCk"]').iCheck('enable');
                    }else{
                        return true;
                    }
                });
                checkAll($panel);
            };
            $ele.find('input[name="taskCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);

            if(!isInitCheckAll)
                return false;

            var ifAllChecked = function (e) {

                $(this).closest('.panel').find('input[name="taskCk"]').prop('checked',true);
                $(this).closest('.panel').find('input[name="taskCk"]').iCheck('update');
                $(this).closest('.panel').find('tr[data-pid!=""] input[name="taskCk"]').iCheck('disable');
                $(this).closest('.panel').find('input[name="taskCk"][data-is-can1="1"]').closest('tr').addClass('chose-operable');

            };
            var ifAllUnchecked = function (e) {
                $(this).closest('.panel').find('input[name="taskCk"]').prop('checked',false);
                $(this).closest('.panel').find('input[name="taskCk"]').iCheck('update');
                $(this).closest('.panel').find('tr[data-pid!=""] input[name="taskCk"]').iCheck('enable');
                $(this).closest('.panel').find('input[name="taskCk"]').closest('tr').removeClass('chose-operable');
            };
            $ele.find('input[name="taskAllCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifAllUnchecked).on('ifChecked.s', ifAllChecked);
        }
        ,initICheckByTask:function () {
            var that = this;

            var　checkAll = function ($this) {

                var checkedLen = $(that.element).find('input[name="taskCk"]:checked').length;
                var taskLen = $(that.element).find('input[name="taskCk"]').length;
                if(checkedLen==taskLen){
                    $(that.element).find('input[name="taskAllCk"]').prop('checked',true);
                    $(that.element).find('input[name="taskAllCk"]').iCheck('update');
                }else{
                    $(that.element).find('input[name="taskAllCk"]').prop('checked',false);
                    $(that.element).find('input[name="taskAllCk"]').iCheck('update');
                }
            };
            var ifChecked = function (e) {

                var $this = $(this);
                checkAll($this);
            };
            var ifUnchecked = function (e) {
                var $this = $(this);
                checkAll($this);
            };
            $(that.element).find('input[name="taskCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);

            var ifChecked = function (e) {

                var $this = $(this);
                $(that.element).find('input[name="taskCk"]').prop('checked',true);
                $(that.element).find('input[name="taskCk"]').iCheck('update');
                checkAll($this);
            };
            var ifUnchecked = function (e) {
                var $this = $(this);
                $(that.element).find('input[name="taskCk"]').prop('checked',false);
                $(that.element).find('input[name="taskCk"]').iCheck('update');
                checkAll($this);
            };
            $(that.element).find('input[name="taskAllCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //hover事件
        ,editHoverFun:function ($ele) {

            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element).find('tr');

            //文本移上去出现编辑图标hover事件
            $ele.find('a[data-action][data-deal-type="edit"],a[data-action="xeditable"],a[data-action="xeditableUser"],a[data-action="xeditableByClick"],a[data-action="addChildTask"]').each(function () {

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
            $(that.element).find('TR').each(function () {

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
        //批量删除任务
        ,batchDelTask:function (idList) {
            var that = this;
            S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                var option = {};
                option.url = restApi.url_deleteProjectTask;
                option.postData = {};
                option.postData.idList = idList;
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
                var noInternalInit = false;
                var popoverClass = null;
                var editType = $this.attr('data-edit-type');
                var targetNotQuickCloseArr = [];

                //dataItem为空,重新赋值
                var dataId = $this.closest('tr').attr('data-id');
                //获取节点数据
                var dataPidItem = that._dataInfo;
                var dataItem = getObjectInArray(dataPidItem.childList,dataId);
                var postParam = {projectId:that.settings.projectId};

                if(key=='handlerUser'){
                    popoverClass = 'full-width';
                    targetNotQuickCloseArr = ['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options'];
                    value = [{text:$this.attr('data-name'),id:$this.attr('data-value')}];
                    var issueTaskId = $('.m-product-left-tab .list-group-item.active').attr('data-id');
                    postParam = {projectId:that.settings.projectId,targetId:issueTaskId};
                }

                $this.m_editable({
                    inline:true,
                    popoverClass : popoverClass,
                    hideElement:true,
                    isNotSet:false,
                    limitStartTime:true,
                    value:value,
                    dataInfo:dataInfo,
                    postParam:postParam,
                    targetNotQuickCloseArr:targetNotQuickCloseArr,
                    closed:function (data,$popover) {

                        if(data!=false){
                            var getUserIdList = function (list) {
                                list = [];
                                $.each(data[key],function (i,item) {
                                    list.push(item.id)
                                });
                                return list;
                            };
                            var getUserList = function (list) {
                                list = [];
                                $.each(data[key],function (i,item) {
                                    list.push({id:item.id,userName:item.text})
                                });
                                return list;
                            };

                            var param = {},cookiesUserList=[];
                            param.id = $this.closest('tr').attr('data-id');
                            if(key=='taskName'){

                                param.companyId = $this.closest('tr').attr('data-company-id');

                            }else if(key=='startTime'){

                                param.isUpdateDate = 1;
                                param.endTime = $this.attr('data-max-date');

                            }else if(key=='endTime') {

                                param.isUpdateDate = 1;
                                param.startTime = $this.attr('data-min-date');

                            }else if(key=='completeDate') {
                                param.completeDate = $this.attr('data-min-date');

                            }

                            if(key=='handlerUser'){
                                var _companyUserList = getUserIdList(data[key]);
                                data.type = 1;
                                data.taskId = dataId;
                                data.companyUserList = _companyUserList;
                                that.editHandlerUser(data);

                            }else{
                                if(data[key]!=null){
                                    param[key] = data[key];
                                    that.saveTaskIssue(param);
                                }
                            }

                            /*if(!isNullOrBlank(cookiesUserList))
                                $popover.find('select').m_select2_by_search('setSelect2CookiesByUsers',{userList:cookiesUserList});*/

                        }
                        $this.parent().find('.show-span').show();
                    },
                    noInternalInit:noInternalInit,
                    completed:function ($popover) {
                        $('.show-span').show();
                        $this.parent().find('.show-span').hide();


                    }
                },true);
            });

            $(that.element).find('a[data-action="xeditableByClick"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $.trim($this.attr('data-value'));
                var id = $this.closest('tr').attr('data-id');
                var dataItem = getObjectInArray(that._dataInfo.childList,id);
                $('body').m_production_approval_opinion_state_flow({
                    doType:3,
                    dataInfo:dataItem,
                    projectId:that.settings.projectId,
                    issueTaskId:$('.m-product-left-tab .list-group-item.active').attr('data-id'),
                    saveCallBack:function () {
                        that.reRenderContent();
                    }
                },true);

            });

        }
        //编辑生产状态
        ,changeStatus:function (param) {
            var options={},that=this;
            options.url=restApi.url_projectTask_changeStatus;
            options.postData = {};
            $.extend(options.postData, param);
            m_ajax.postJson(options,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.reRenderContent();
                }else {
                    S_toastr.error(response.info);

                }
            });
        }
        //编辑签发保存
        ,saveTaskIssue:function (param) {
            var options={},that=this;
            options.url=restApi.url_updateProjectBaseData;
            options.classId = that.element;
            options.postData = {};
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
        //选择任务负责人
        ,choseTaskLeader:function ($this,t) {
            var that = this;
            var personInChargeId = $this.attr('data-id'),userName=$this.attr('data-user-name');
            var options = {};
            options.selectedUserList = [{
                id:personInChargeId,
                userName:userName
            }];
            options.isASingleSelectUser = true;
            options.delSelectedUserCallback = function () {

            };
            options.title = '选择负责人';
            options.selectUserCallback = function (data,event) {

                var targetUser='<strong style="color:red;margin:0px 3px;">'+data.userName+'</strong>';
                var confirmTitle = '确定安排'+targetUser+'为新的负责人？';
                S_layer.confirm(confirmTitle,function(){

                    if(t==0){//添加情况下
                        $this.attr('data-id',data.companyUserId);
                        $this.attr('data-user-name',data.userName);
                        $this.prev().find('span').html(data.userName);
                        S_layer.close($(event));
                    }else{//编辑状态下
                        data.type = 1;
                        data.id = $this.attr('data-id');//旧任务负责人
                        data.taskId = $this.closest('tr').attr('data-id');
                        that.editManagerChange(data,event);
                    }
                },function(){
                    //S_layer.close($(event));
                });
            };
            $('body').m_orgByTree(options);
        }
        //保存处理人
        ,editHandlerUser:function(data,event){
            var that = this;
            var option={};
            option.url=restApi.url_saveProjectHandlerMember;
            option.classId = 'body';
            option.postData={};
            option.postData.targetId = data.taskId;
            option.postData.projectId=that.settings.projectId;
            option.postData.companyId=that._currentCompanyId;
            option.postData.type=data.type;
            option.postData.companyUserList=data.companyUserList;
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
