/**
 * 项目信息－生产安排详情
 * Created by wrb on 2018/9/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_details",
        defaults = {
            taskId:null,
            fromType:1,//默认生产界面调用，2=详情调用,3=我的任务界面调用
            projectId:null,
            projectName:null,
            createCompanyId:null,//立项组织
            dataCompanyId:null//视图ID
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
        this._leftBoxHeightResize = null;//左边div高度自适应设定初始对象

        this._dataInfo = {};//请求签发数据
        this._breadcrumb = [
            {
                name: this.settings.businessType==1?'我的项目':'我的课题'
            },
            {
                name:this.settings.projectName,
                url:'#/project/basicInfo?id='+this.settings.projectId+'&projectName='+encodeURI(this.settings.projectName)+'&dataCompanyId='+this.settings.dataCompanyId+ '&businessType=' + this.settings.businessType
            },
            {
                name:'任务分配',
                url:'#/project/production?id='+this.settings.projectId+'&projectName='+encodeURI(this.settings.projectName)+'&dataCompanyId='+this.settings.dataCompanyId+ '&businessType=' + this.settings.businessType
            },
            {
                name:'详情'
            }
        ];


        this._treeSelectedData = null;//树当前选中节点信息
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
                taskPid:"1"
            };
            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){

                    that._dataInfo = response.data;
                    if(that._dataInfo.nodeList){
                        var nodeList = [],newNodeList = [];
                        $.each(that._dataInfo.nodeList,function (i,item) {
                            if(item.nodeValue==that._dataInfo.task.endStatus){
                                nodeList.push(item);
                            }else{
                                newNodeList.push(item);
                            }
                        });
                        that._dataInfo.nodeList = nodeList.concat(newNodeList)
                    }

                    if(callBack)
                        callBack();

                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染内容
        ,renderContent:function (t) {
            var that = this;
            var html = template('m_production/m_production_details',{
                dataInfo:that._dataInfo,
                fromType:that.settings.fromType,
                projectId : that.settings.projectId,
                projectName : that.settings.projectName,
                projectNameCode : encodeURI(that.settings.projectName),
                currentCompanyId : that._currentCompanyId,
                currentCompanyUserId:that._currentCompanyUserId,
                createCompanyId:that.settings.createCompanyId,
                dataCompanyId:that.settings.dataCompanyId
            });
            $(that.element).html(html);

            if($(that.element).find('#breadcrumb').length>0)
                $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

            that.bindActionClick();
            that.renderChangeHistory();
            that.renderSubTask();
            that.bindEditable();
            that.editTaskHoverFun();
            that._leftBoxHeightResize = new leftBoxHeightResize($(that.element).find('#leftBox'),$(that.element).find('#leftBox'),$(that.element).find('#rightBox'),106);
            that._leftBoxHeightResize.init();

            if(t!=null)
                $(that.element).find('.tabs-container a[href="#tab-'+t+'"]').click();

        }

        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').off('click').on('click',function (e) {
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
                    case 'returnBack'://返回

                        $('.m-metismenu ul.metismenu li.active a span').click();

                }
            });

            $(that.element).find('a[data-toggle="tab"]').on('click',function () {
                that._leftBoxHeightResize.setHeight();
            });

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

                    //任务签发-查看描述
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
        //渲染子任务
        ,renderSubTask:function () {
            var that = this;
            var isShow =true;
            var handlerId = '';
            if(that._dataInfo.task.handler!=null&&that._dataInfo.task.handler.companyUserId!=null){
                if(window.currentCompanyUserId==that._dataInfo.task.handler.companyUserId){
                    isShow = false;
                }
                //任务负责人可以看到执行人的子任务情况，所以当任务负责人进来的时候，用执行人的companyuserid来查数据
                if(that._dataInfo.task.designer!=null&&that._dataInfo.task.designer.companyUserId!=null){
                    if(window.currentCompanyUserId==that._dataInfo.task.designer.companyUserId){
                        handlerId = that._dataInfo.task.handler.companyUserId;
                    }
                }

            }


            $(that.element).find('div[data-type="subTask"] .data-list-box').m_child_task_production({
                taskId:that.settings.taskId,
                projectId:that.settings.projectId,
                startTime:that._dataInfo.task.startTime,
                endTime:that._dataInfo.task.endTime,
                isShow:isShow,
                handlerId:handlerId
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
                var dataId = that._dataInfo.task.id;
                var dataItem = that._dataInfo.task;
                var noInternalInit = false;
                var targetNotQuickCloseArr = [];
                var popoverStyle={};
                var editType = $this.attr('data-edit-type');


                if(key=='companyId'){

                    noInternalInit = true;
                    popoverStyle = {'min-width':'195px','top':'-7px'};

                }else if(key=='taskRemark'){

                    popoverStyle = {'width':'100%','max-width':'100%','z-index': 'inherit'};
                    value = $this.closest('.form-group').find('.show-span').html();

                }else if(key=='designUser' || key=='checkUser' || key=='examineUser' || key=='examineApproveUser' || key=='handlerUser' || key=='personInCharge'){

                    popoverStyle = {'min-width':'195px','top':'-3px'};
                    targetNotQuickCloseArr = ['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options'];

                    value = [];
                    if(key=='personInCharge'){
                        value = [{text:$this.attr('data-user-name'),id:$this.attr('data-id')}];
                    }else{
                        var list = dataItem[key].userList;
                        $.each(list,function (i,item) {
                            value.push({id:item.companyUserId,text:item.userName})
                        });
                    }

                }else{

                    popoverStyle = {'max-width':'140px','top':'-3px'};
                }



                $this.m_editable({
                    inline:true,
                    popoverStyle:popoverStyle,
                    hideElement:true,
                    isNotSet:false,
                    targetNotQuickCloseArr:targetNotQuickCloseArr,
                    value:value,
                    dataInfo:dataInfo,
                    postParam:{projectId:that.settings.projectId},
                    closed:function (data,$popover) {
                        if(data!=false){
                            var param = {},cookiesUserList=[];
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
                            if(key=='startTime'){

                                param.isUpdateDate = 1;
                                param.endTime = $this.attr('data-max-date');

                            }else if(key=='endTime'){

                                param.isUpdateDate = 1;
                                param.startTime = $this.attr('data-min-date');

                            }else if(key=='completeDate'){
                                param.completeDate = $this.attr('data-complete-date');
                            }
                            else if(key=='designUser'){

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

                            }else if(key=='handlerUser'){
                                var _companyUserList = getUserIdList(data[key]);
                                data.type = 1;
                                data.taskId = dataId;
                                data.companyUserList = _companyUserList;
                                that.editHandlerUser(data);

                            }else if(key=='personInCharge'){

                                data.type = 1;
                                data.id = $this.attr('data-id');//旧任务负责人
                                data.taskId = dataId;
                                data.companyUserId = data[key][0].id;
                                that.editManagerChange(data);

                            }else if(data[key]!=null){

                                param[key] = data[key];
                                that.updateProjectBaseData(param);
                            }
                            /*if(!isNullOrBlank(cookiesUserList))
                                $popover.find('select').m_select2_by_search('setSelect2CookiesByUsers',{userList:cookiesUserList});*/
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

            $(that.element).find('a[data-action="xeditableUser"]').off('click').on('click',function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = [];
                var dataId = that._dataInfo.task.id;
                var dataItem = that._dataInfo.task;
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

            var userList = [];
            if(that._dataInfo.task && that._dataInfo.task.handlerUser && that._dataInfo.task.handlerUser.userList){
                $.each(that._dataInfo.task.handlerUser.userList,function (i,item) {
                    userList.push({text:item.userName,id:item.companyUserId});
                });
            }
            $(that.element).find('div[data-action="handler"]').m_editable_select_users({
                type:2,
                value:userList,
                postParam:{projectId:that.settings.projectId}
            },true);
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
                        $('#unReadTodoCount').html(response.data.total);
                        if(response.data.total!=null&&response.data.total>0){
                            $('#unReadTodoCount').addClass('unReadTodoCount');
                        }else{
                            $('#unReadTodoCount').removeClass('unReadTodoCount');
                        }
                    }
                }
            });
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
