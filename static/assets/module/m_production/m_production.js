/**
 * 项目信息－生产安排
 * Created by wrb on 2018/9/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production",
        defaults = {
            projectId:null,
            projectName:null,
            dataCompanyId:null,//视图组织ID
            businessType:1,//1：业务类型，2：研发类型
            isView:false//是否只展示
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

        this._dataInfo = {};//请求生产数据
        this._managerInfo = null;//项目负责人

        if(isNullOrBlank(this.settings.dataCompanyId))
            this.settings.dataCompanyId = this._currentCompanyId;

        this._breadcrumb = [
            {
                name: this.settings.businessType==1?'我的项目':'我的课题'
            },
            {
                name:this.settings.projectName,
                url:'#/project/basicInfo?id='+this.settings.projectId+'&projectName='+encodeURI(this.settings.projectName)+'&dataCompanyId='+this.settings.dataCompanyId+ '&businessType=' + this.settings.businessType
            },
            {
                name:'任务分配'
            }
        ];
        this._designerListByAdd=[];//添加任务－设计人员列表
        this._checkUserListByAdd=[];//添加任务－校对人员列表
        this._examineUserListByAdd=[];//添加任务－审核人员列表
        this._managerInfo = {};
        this._tabindex = 0;//当前选中TAB页
        this._selectindex = 0;//当前选中任务
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        }

        //渲染初始界面
        ,renderPage:function () {
            var that = this;
            var html = template('m_production/m_production',{
                projectId:that.settings.projectId,
                projectName:encodeURI(that.settings.projectName),
                dataCompanyId:that.settings.dataCompanyId,
                isView:that.settings.isView
            });
            $(that.element).html(html);

            if(that.settings.isView==false){
                $(that.element).find('#designManagerBox').m_production_design_manager({
                    doType:2,
                    businessType:that.settings.businessType,
                    projectId:that.settings.projectId,
                    dataCompanyId:that.settings.dataCompanyId,
                    renderCallBack:function (data) {
                        that._managerInfo = data;
                        that.renderTab();

                    },
                    saveCallBack:function () {
                        that.renderPage();
                    }

                },true);

                if($(that.element).find('#breadcrumb').length>0)
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

            }else{//详情查看

                that.renderTab();
            }
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
        ,renderTab:function (type) {
            var that = this;
            $(that.element).find('.product-left-tab').m_production_left_tab({
                projectId:that.settings.projectId,
                projectName:that.settings.projectName,
                dataCompanyId:that.settings.dataCompanyId,
                renderCallBack:function (data) {

                    if(data==null || data.length==0){
                        $(that.element).find('#tabList').parent().removeClass('col-sm-9').addClass('col-sm-12');
                        $(that.element).find('.product-left-tab').remove();
                    }
                    if(that.settings.taskType&&that.settings.taskType==0){
                        $(that.element).find('.product-left-tab .list-group-item[data-id]').each(function () {
                            var $this = $(this);
                            if( $this.attr('data-id')==that.settings.taskPid){
                                that._selectindex = $this.attr('data-index');
                                $this.addClass('active');
                            }

                        });
                    }else  if(that.settings.taskType&&that.settings.taskType==2){
                        $(that.element).find('.product-left-tab .list-group-item[data-id]').each(function () {
                            var $this = $(this);
                                if( $this.attr('data-id')==that.settings.taskId){
                                    that._selectindex = $this.attr('data-index');
                                    $this.addClass('active');
                                }
                        });
                    }else{
                        $(that.element).find('.product-left-tab .list-group-item[data-id]').eq(that._selectindex).addClass('active');
                    }

                    if(!type){
                        that.getData(function () {
                            that.renderContent();
                            that.renderTodoList();
                        });
                    }

                }
            });

        }
        ,renderContent:function (callBack) {
            var that = this;
            var $data = {};
            var issueTaskId = $(that.element).find('.m-product-left-tab .list-group-item.active').attr('data-id');
            $data.productionList = that._dataInfo.projectDesignContentShowList;
            $data.projectId = that.settings.projectId;
            $data.projectNameCode = encodeURI(that.settings.projectName);
            $data.dataCompanyId = that.settings.dataCompanyId;
            $data.currentCompanyUserId = that._currentCompanyUserId;

            $data.majorDesignRelationId = $('.m-product-left-tab li.list-group-item.active').attr('data-relation-id');
            $data.stageDesignRelationId = $('.m-product-left-tab li.list-group-item.active').parents('.list-group').attr('data-relation-id');
            $data.functionTypeRelationId = $('.m-product-left-tab li.list-group-item.active').parents('.task-box').attr('data-relation-id');

            $data.managerInfo = that._managerInfo;
            $data.currentCompanyUserId = that._currentCompanyUserId;

            var html = template('m_production/m_production_content',$data);

            var $tabPane = $(that.element).find('#tabList');

            $tabPane.html(html);
            that.bindClickAction($tabPane);
            $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

            $tabPane.find('.task-list-box .panel .panel-body').each(function (i) {
                var $this = $(this);
                var index = $this.closest('.panel').attr('data-i');
                $(this).m_production_content_item({
                    dataInfo:that._dataInfo.projectDesignContentShowList[index],
                    projectId:that.settings.projectId,
                    issueTaskId:issueTaskId,
                    projectName:that.settings.projectName,
                    managerInfo:that._managerInfo,
                    dataCompanyId:that.settings.dataCompanyId,
                    renderCallBack:function () {

                        //禁用编辑
                        if(that.settings.isView==true){
                            $(that.element).find('.list-check-box,.list-action-box').parent().remove();
                            $(that.element).find('tr').find('th:first,td:first').removeClass('b-l-none');
                            $(that.element).find('.panel-heading .col-sm-7').addClass('col-sm-9').removeClass('col-sm-7').next('.col-sm-2').remove();
                            $(that.element).find('a[data-action],button[data-action]').not('a[data-action="expander"]').remove();
                        }
                        if(callBack)
                            callBack();
                    },
                    dataCallBack:function (data) {
                        that._dataInfo = data;
                        that.renderTab();
                    }
                },true);
                that.bindEditable($(this).parent());
            });
        }
        //渲染列表
        ,getData:function (callBack) {
            var that = this;
            var options={};
            options.classId = '.ibox-content';
            options.url=restApi.url_getDesignTaskList;
            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            options.postData.type=2;
            options.postData.companyId = that.settings.dataCompanyId;

            options.postData.issueTaskId = $(that.element).find('.m-product-left-tab .list-group-item.active').attr('data-id');

            m_ajax.postJson(options,function (response) {

                if(response.code=='0'){
                    that._dataInfo = response.data;
                    if(callBack)
                        callBack();

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //保存处理人
        ,editHandlerUser:function(data,userList,ele){
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
                    that.renderPage();
                }else {
                    S_layer.error(response.info);
                }
            })
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
                        var dataId = $this.closest('.panel').attr('data-id');
                        //获取节点数据
                        var dataItem = getObjectInArray(that._dataInfo.projectDesignContentShowList,dataId);
                        if(endStatus==5){
                            $('body').m_task_issue_approval({
                                projectId:that.settings.projectId,
                                taskId:$this.closest('.panel').attr('data-id'),
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
                                viewCompanyId:that._dataInfo.dataCompanyId,
                                isPanel:1,
                                doType:2,
                                saveCallBack:function () {
                                    that.init();
                                }
                            },true);
                        }
                        break;

                    case 'expander'://折叠与展开

                        if($this.find('span').hasClass('ic-open')){
                            $this.find('span').removeClass('ic-open').addClass('ic-retract');
                        }else{
                            $this.find('span').addClass('ic-open').removeClass('ic-retract');
                        }
                        $this.closest('.panel').find('.panel-body').eq(0).slideToggle();
                        break;

                    case 'addProjectMember':
                        var taskId = $(this).closest('.panel').attr('data-id');
                        var companyId = $(this).closest('.panel').attr('data-company-id');
                        var option = {};
                        option.postData = {};
                        option.url = restApi.url_getProjectPartMember;
                        option.postData.projectId=that.settings.projectId;
                        option.postData.targetId=taskId;
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
                                        that.postProjectMemberAdd(data.selectedUserList,taskId);
                                    }
                                };
                                $('body').m_orgByTree(options);

                            }else {
                                S_layer.error(response.info);
                            }
                        });

                        break;

                    case 'downloadFile'://导出
                        var data = {};// $.extend(true, {}, that._filterData);
                        data.taskId = $this.attr('data-id');
                        downLoadFile({
                            url:restApi.url_exportProductFile,
                            data:filterParam(data),
                            type:1
                        });
                        return false;
                        break;
                    case 'distributionRatio'://分配任务占比
                        $('body').m_task_issue_distribution_ratio({
                            doType:2,
                            contentTaskList:that._dataInfo.projectDesignContentShowList,
                            saveCallBack:function () {
                                that.init();
                            }
                        });
                        break;

                }

            });

            $(that.element).find('.product-left-tab .list-group-item[data-id]').off('click').on('click',function () {

                var $this = $(this);
                that._selectindex = $this.attr('data-index');
                $(that.element).find('.list-group-item[data-id]').removeClass('active');
                $this.addClass('active');
                that.getData(function () {
                    that.renderContent();
                });

            });

        }
        ,bindTabClick:function () {
            var that = this;
            $(that.element).find('a[data-toggle="tab"]').on('click',function () {
                that._tabindex = $(this).attr('data-i');
                $(this).parent().addClass('active').siblings().removeClass('active');
                that.getData(function () {
                    that.renderContent();
                });
            });
        }
        //人员设置保存
        ,postProjectMemberAdd:function(selectedUserList,taskId){
            var that = this;
            var option={};
            option.classId = that.element;
            option.url=restApi.url_saveProjectMember;
            option.postData={};
            option.postData.projectId=that.settings.projectId;
            option.postData.companyId=that._currentCompanyId;
            option.postData.targetId= taskId;
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
                    postParam:{projectId:that.settings.projectId},//{id:$this.attr('data-task-id')},
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
                        that.renderTodoList();
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
