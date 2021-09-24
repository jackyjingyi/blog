/**
 * 我的任务－生产任务
 * Created by wrb on 2020/04/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_production",
        defaults = {
            status:null,//0=待办，1=已办
            projectId:null,//项目ID
            saveCallBack:null,
            businessType:null
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
        this._dataInfo = {};

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            if($(that.element).find('.data-list-container').length==0){
                $(that.element).html('<div class="data-list-box task-list-box" id="productionTaskBox"><div class="data-list-container"></div><div class="p-w-sm"><div class="m-pagination pull-right"></div></div></div>');
            }
            that.renderProductionTask();


        }
        //渲染生产安排任务
        ,renderProductionTask:function () {
            var that = this;
            var option = {};
            option.param = {
                status:that.settings.status,
                currentUserId:that.settings.userId,
                currentCompanyUserId:that.settings.companyUserId
            };
            paginationFun({
                eleId: '#productionTaskBox .m-pagination',
                loadingId: '#productionTaskBox .data-list-box',
                url: restApi.url_listMyTaskForProduct,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._dataInfo = {childList:response.data.data};

                    var html = template('m_task/m_task_production',{
                        p:that._dataInfo,
                        taskStatus:that.settings.status,
                        projectId:that.settings.projectId,
                        businessType:that.settings.businessType,
                        projectNameCode:encodeURI(that.settings.projectName),
                        currentCompanyId:that._currentCompanyId,
                        userId:that.settings.userId,
                        companyUserId:that.settings.companyUserId
                    });
                    $(that.element).find('.data-list-container').html(html);

                    that.initICheckByTask();
                    that.editHoverFun();
                    that.bindEditable();
                    that.bindTrActionClick();

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
        ,initICheckByTask:function () {
            var that = this;

            var　checkAll = function ($this) {

                var checkedLen = $(that.element).find('input[name="taskCk"]:checked:not(:disabled)').length;
                var taskLen = $(that.element).find('input[name="taskCk"]:not(:disabled)').length;
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
                $(that.element).find('input[name="taskCk"]:not(:disabled)').prop('checked',true);
                $(that.element).find('input[name="taskCk"]:not(:disabled)').iCheck('update');
                checkAll($this);
            };
            var ifUnchecked = function (e) {
                var $this = $(this);
                $(that.element).find('input[name="taskCk"]:not(:disabled)').prop('checked',false);
                $(that.element).find('input[name="taskCk"]:not(:disabled)').iCheck('update');
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
            $ele.find('a[data-action][data-deal-type="edit"],a[data-action="xeditable"],a[data-action="xeditableUser"],a[data-action="xeditableByClick"]').each(function () {

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
                        that.renderProductionTask();
                        that.renderTodoList();
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
                var popoverClass = 'full-width';
                var editType = $this.attr('data-edit-type');
                var targetNotQuickCloseArr = [];

                //dataItem为空,重新赋值
                var dataId = $this.closest('tr').attr('data-id');
                //获取节点数据
                var dataPidItem = that._dataInfo;
                var dataItem = getObjectInArray(dataPidItem.childList,dataId);

                if(key=='designUser' || key=='checkUser' || key=='examineUser' || key=='examineApproveUser' || key=='handlerUser' || key=='personInCharge'){

                    targetNotQuickCloseArr = ['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options'];

                    var list = dataItem[key]?dataItem[key].userList:null;
                    value = [];

                    if(key=='personInCharge'){
                        value = [{text:$this.attr('data-user-name'),id:$this.attr('data-id')}];
                    }else{
                        $.each(list,function (i,item) {
                            value.push({id:item.companyUserId,text:item.userName})
                        });
                    }
                }

                $this.m_editable({
                    inline:true,
                    popoverClass : popoverClass,
                    hideElement:true,
                    isNotSet:false,
                    value:value,
                    dataInfo:dataInfo,
                    postParam:{projectId:that.settings.projectId},
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

                            }else if(key=='endTime'){

                                param.isUpdateDate = 1;
                                param.startTime = $this.attr('data-min-date');

                            }else if(key=='designUser'){

                                that._designerListByAdd = getUserList(that._designerListByAdd);
                                cookiesUserList = that._designerListByAdd;

                            }else if(key=='checkUser'){

                                that._checkUserListByAdd = getUserList(that._checkUserListByAdd);
                                cookiesUserList = that._checkUserListByAdd;

                            }else if(key=='examineUser'){

                                that._examineUserListByAdd = getUserList(that._examineUserListByAdd);
                                cookiesUserList = that._examineUserListByAdd;

                            }else if(key=='examineApproveUser'){

                                that._examineApproveUserListByAdd = getUserList(that._examineApproveUserListByAdd);
                                cookiesUserList = that._examineApproveUserListByAdd;

                            }else if(key=='handlerUser'){

                                that._handlerUserListByAdd = getUserList(that._handlerUserListByAdd);
                                cookiesUserList = that._handlerUserListByAdd;

                            }else if(key=='personInCharge'){
                                that._personInChargeListByAdd = getUserList(that._personInChargeListByAdd);
                                cookiesUserList = that._personInChargeListByAdd;
                            }

                            if(key=='designUser' || key=='checkUser' || key=='examineUser' || key=='examineApproveUser'){

                                that.saveTaskParticipant($this,editType,dataItem);

                            }else if(key=='personInCharge'){

                                data.type = 1;
                                data.id = $this.attr('data-id');//旧任务负责人
                                data.taskId = dataId;
                                data.companyUserId = data[key][0].id;
                                that.editManagerChange(data);

                            }else if(key=='handlerUser'){
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
                    saveCallBack:function () {
                        that.renderProductionTask();
                        that.renderTodoList();
                    }
                },true);

            });


            $ele.find('a[data-action="xeditableUser"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = [];
                var dataId = $this.closest('tr').attr('data-id');
                //获取节点数据
                var dataPidItem = that._dataInfo;
                var dataItem = getObjectInArray(dataPidItem.childList,dataId);
                var list = dataItem[key]?dataItem[key].userList:null;
                $.each(list,function (i,item) {
                    value.push({id:item.companyUserId,text:item.userName})
                });

                $this.m_editable_select_users({
                    value:value,
                    postParam:{projectId:that.settings.projectId},
                    controlClass:'input-sm',
                    closed:function (data,$popover) {

                        if(data!==false) {
                            if (isNullOrBlank(data))
                                data = [];

                            var getUserIdList = function (list) {
                                list = [];
                                $.each(data, function (i, item) {
                                    list.push(item.id)
                                });
                                return list;
                            };
                            var param = {};
                            param.type = 1;
                            param.taskId = dataId;
                            param.companyUserList = getUserIdList(data);
                            that.editHandlerUser(param);
                            $this.m_editable_select_users('setCookiesByUsers', {userList: data});
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed:function ($popover) {
                        $('.show-span').show();
                        $this.parent().find('.show-span').hide();

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
                    that.renderProductionTask();
                    that.renderTodoList();
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
                    that.renderProductionTask();
                    that.renderTodoList();
                }else {
                    if(response.info.indexOf('已存在')>-1){
                        S_toastr.error(response.info);
                    }else{
                        S_layer.error(response.info);
                    }
                }
            });
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
                    that.renderProductionTask();
                    that.renderTodoList();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //事件绑定
        ,bindTrActionClick:function ($ele) {
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);
            $ele.find('a[data-action],button[data-action]').on('click', function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');
                //获取节点数据
                var dataPidItem = that._dataInfo;
                var dataItem = getObjectInArray(dataPidItem.childList,dataId);
                switch (dataAction) {
                    case 'stateFlow'://状态流转
                        var endStatus = $this.attr('data-end-status');
                        if(endStatus==5){
                            $('body').m_task_issue_approval({
                                projectId:that.settings.projectId,
                                taskId:dataId,
                                saveCallBack:function () {
                                    that.renderProductionTask();
                                    that.renderTodoList();
                                },
                                closeCallBack:function () {
                                    that.renderProductionTask();
                                    that.renderTodoList();
                                }
                            },true);
                        }else{
                            $('body').m_task_issue_status_flow({
                                isPanel:that._dataInfo.type==2?1:0,
                                doType:2,
                                dataInfo:dataItem,
                                isShowStop:true,
                                saveCallBack:function () {
                                    that.renderProductionTask();
                                    that.renderTodoList();
                                }
                            },true);
                        }
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
                            S_toastr.error('请选择需要批量流转的任务！');
                            return false;
                        }
                        if(isSameState==false){
                            S_layer.error('当前选择的内容，状态不一致，请重新选择要批量流转的内容！');
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
                                that.renderProductionTask();
                                that.renderTodoList();
                            }
                        },true);
                        return false;
                        break;

                }
                stopPropagation(e);
                return false;

            });
        }


    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            // if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            // }
        });
    };

})(jQuery, window, document);
