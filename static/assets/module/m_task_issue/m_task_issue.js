/**
 * 项目信息－任务订单
 * Created by wrb on 2018/9/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue",
        defaults = {
            projectId: null,
            projectName: null,
            businessType: 1,//1：业务类型，2：研发类型
            dataCompanyId: null//视图组织ID
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

        this._dataInfo = {};//请求签发数据
        this._managerInfo = null;//项目负责人

        if (isNullOrBlank(this.settings.dataCompanyId))
            this.settings.dataCompanyId = this._currentCompanyId;

        this._breadcrumb = [
            {
                name: this.settings.businessType==1?'我的项目':'我的课题'
            },
            {
                name: this.settings.projectName,
                url: '#/project/basicInfo?id=' + this.settings.projectId + '&projectName=' + encodeURI(this.settings.projectName) + '&dataCompanyId=' + this.settings.dataCompanyId+ '&businessType=' + this.settings.businessType
            },
            {
                name: '工作内容'
            }
        ];

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.getData(function () {
                that.renderContent();
                that.renderTodoList();
            });
        },
        //渲染初始界面
        getData: function (callBack) {

            var that = this;

            var options = {};
            options.classId = '#content-right';
            options.url = restApi.url_getIssueInfo;
            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            options.postData.companyId = that.settings.dataCompanyId;

            m_ajax.postJson(options, function (response) {

                if (response.code == '0') {

                    that._dataInfo = response.data;
                    if (callBack)
                        callBack();
                } else {
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
        //渲染签发列表
        , renderContent: function () {
            var that = this;
            var html = template('m_task_issue/m_task_issue', {
                projectName: that.settings.projectName,
                businessType: that.settings.businessType,
                projectNameCode: encodeURI(that.settings.projectName),
                projectId: that.settings.projectId,
                projectStatus: that._dataInfo.projectStatus,
                updateProjectStatus: that._dataInfo.updateProjectStatus,
                orgList: that._dataInfo.orgList,
                dataCompanyId: that._dataInfo.dataCompanyId,
                addRootTask: that._dataInfo.addRootTask,
                isCreator: that._dataInfo.isCreator,
                process: that._dataInfo.process
            });
            $(that.element).html(html);

            if ($(that.element).find('#breadcrumb').length > 0)
                $(that.element).find('#breadcrumb').m_breadcrumb({dataList: that._breadcrumb}, true);

            that.renderDesignManager(function () {

                that.renderTaskContent();

            });


        }
        //渲染任务界面
        , renderTaskContent: function () {
            var that = this;

            var $data = {};
            $data.taskIssueList = that._dataInfo.contentTaskList;
            $data.projectId = that.settings.projectId;
            $data.projectNameCode = encodeURI(that.settings.projectName);
            $data.dataCompanyId = that.settings.dataCompanyId;
            $data.delTitle = that.settings.businessType==1?'删除项目/子项':'删除课题';
            $data.updateProjectStatus = that._dataInfo.updateProjectStatus;
            var html = template('m_task_issue/m_task_issue_content', $data);
            $(that.element).find('#dataList').html(html);
            $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger: 'hover'});

            that.bindClickAction();
            that.taskEditBind();
            $(that.element).find('#dataList .panel .panel-body').each(function (i) {
                var $this = $(this);
                var index = $this.closest('.panel').attr('data-i');
                $(this).m_task_issue_content_item({
                    dataInfo: that._dataInfo.contentTaskList[index],
                    projectId: that.settings.projectId,
                    projectName: that.settings.projectName,
                    dataCompanyId: that.settings.dataCompanyId,
                    businessType: that.settings.businessType,
                    managerInfo: that._managerInfo,
                    renderCallBack: function (contentId) {
                        //  that.reRenderTaskContent();
                        var $panel = $(that.element).find('.list-action-box[data-id="' + contentId + '"]');
                        if (contentId != null) {
                            that.addTaskIssuetips($panel, this.dataInfo.childList[this.dataInfo.childList.length-1])
                        }

                    },
                    reGetDataCallBack: function (data) {
                        that._dataInfo = data;
                        that.renderTaskContent();
                    }
                }, true);
            });
        }
        //添加工作内容后后提示
        , addTaskIssuetips: function ($panel, childDataInfo) {
            var that = this;
            if ($panel.length == 0)
                return false;
            //只有当前数据有发布权限的人 才会提示发布。
            if (childDataInfo&&childDataInfo.role && childDataInfo.role.publishTask == 1 && !(Cookies.get('cookiesData_taskIssueAddTips') == 1)) {
                var top = $panel.offset().top;
                var left = $panel.offset().left + 85;
                $('body').m_task_issue_add_tips({
                    offset: [top + 'px', left + 'px']
                });
            }
        }
        //重新加载任务数据
        , reRenderTaskContent: function () {
            var that = this;

            //获取正在编辑的行
            var rowEditList = [];
            $(that.element).find('.content-row-edit').each(function () {

                var $prev = $(this).prev('tr');
                var prevId = $prev.attr('data-id');
                rowEditList.push({
                    prevId: prevId,
                    panel: $(this).closest('.panel'),
                    content: $(this).clone(true)
                })
            });
            that.getData(function () {
                that.renderTaskContent();
                if (rowEditList.length > 0) {
                    $.each(rowEditList, function (i, item) {
                        item.content.appendTo(item.panel.find('tbody'));
                    });
                }
            });
        }
        //事件绑定
        , bindClickAction: function () {

            var that = this;
            $(that.element).find('a[data-action]:not([data-action="changeOperatorPerson"],[data-action="changeManagerPerson"])')
                .off('click').bind('click', function () {

                var $this = $(this),
                    dataAction = $this.attr('data-action');

                switch (dataAction) {//切换自己任务订单与总览

                    case 'viewProjectInfo'://浏览项目基本信息

                        var option = {};
                        option.isDialog = true;
                        option.isView = true;
                        option.projectId = that.settings.projectId;
                        option.projectName = that.settings.projectName;
                        $('body').m_projectBasicInfo(option, true);
                        break;

                    case 'addTaskIssue'://添加任务订单

                        $('body').m_task_issue_add({
                            projectId: that.settings.projectId,
                            businessType: that.settings.businessType,
                            taskType: 1,
                            isSelectOrg: false,
                            projectTempData: that._projectTempData,
                            saveCallBack: function () {
                                that.init();
                            }
                        }, true);
                        break;

                    case 'taskStateFlow'://状态流转

                        var endStatus = $this.attr('data-end-status');
                        var dataId = $this.closest('.panel').attr('data-id');
                        //获取节点数据
                        var dataItem = getObjectInArray(that._dataInfo.contentTaskList, dataId);
                        if (endStatus == 5) {
                            $('body').m_task_issue_approval({
                                projectId: that.settings.projectId,
                                taskId: $this.closest('.panel').attr('data-id'),
                                saveCallBack: function () {
                                    that.init();
                                },
                                closeCallBack: function () {
                                    that.init();
                                }
                            }, true);
                        } else {
                            $('body').m_task_issue_status_flow({
                                dataInfo: dataItem,
                                viewCompanyId: that._dataInfo.dataCompanyId,
                                isPanel: 1,
                                saveCallBack: function () {
                                    that.init();
                                }
                            }, true);
                        }
                        break;

                    case 'expander'://折叠与展开

                        if ($this.find('span').hasClass('ic-open')) {
                            $this.find('span').removeClass('ic-open').addClass('ic-retract');
                        } else {
                            $this.find('span').addClass('ic-open').removeClass('ic-retract');
                        }
                        $this.closest('.panel').find('.panel-body').eq(0).slideToggle();
                        break;

                    case 'toProjectDetails':

                        location.hash = '/project/taskIssue/projectDetails?id=' + that.settings.projectId + '&projectName=' + encodeURI(that.settings.projectName) + '&dataCompanyId=' + that.settings.dataCompanyId+ '&businessType=' + that.settings.businessType;

                        break;


                    case 'distributionRatio':

                        $('body').m_task_issue_distribution_ratio({
                            contentTaskList: that._dataInfo.contentTaskList,
                            saveCallBack: function () {
                                that.init();
                            }
                        });
                        break;
                    case 'delChildItem'://删除子项
                        var dataId = $this.closest('.panel').attr('data-id');
                        var designTaskId = $this.closest('.panel').attr('data-designtaskid');
                        var idList = [];
                        idList.push({id: dataId, designTaskId: designTaskId});
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                            var option = {};
                            option.classId = 'body';
                            option.url = restApi.url_deleteOrderTask;
                            option.postData = {};
                            option.postData.taskList = idList;
                            option.postData.projectId = that.settings.projectId;
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.init();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;

                }
                return false;
            });
        }
        , taskEditBind: function () {
            var that = this;
            $(that.element).find('.p-time-show,.p-task-name,.xeditable-hover').hover(function () {
                $(this).find('a[data-action]').css('visibility', 'visible');
            }, function () {
                $(this).find('a[data-action]').css('visibility', 'hidden');
            });
            $(that.element).find('a[data-action="xeditableTime"]').off('click').on('click', function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var maxDate = $this.attr('data-max-date') == undefined ? '' : $this.attr('data-max-date');
                var minDate = ($this.attr('data-min-date') == undefined ||$this.attr('data-min-date')=='')? '2021-01-01' : $this.attr('data-min-date');
                var dateFmt = null;
                if (key == 'year')
                    dateFmt = 'yyyy';

                $(that.element).find('.show-span').show();
                $this.m_quickDatePicker({
                    eleId: this,
                    placement: key == 'endTime' ? 'bottomRight' : 'bottom',
                    dateFmt: dateFmt,
                    maxDate: maxDate,
                    minDate: minDate,
                    okCallBack: function (data) {
                        var param = {};
                        param.id = $this.closest('.panel').attr('data-id');
                        param.isUpdateDate = 1;

                        if (key == 'startTime') {

                            param.endTime = maxDate;
                            param.startTime = data;

                        } else if (key == 'endTime') {

                            param.startTime = minDate;
                            param.endTime = data;

                        } else if (key == 'year') {
                            param.year = data;
                        }
                        that.updateProjectBaseData(param);
                    }
                });
                return false;
            });

            $(that.element).find('a[data-action="xeditableTaskName"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var dataInfo = null;
                var value = $.trim($this.attr('data-value'));

                var colWidth = $(that.element).find('.task-list-box').width() - 0;
                colWidth = math.format(math.multiply(math.bignumber(colWidth), math.bignumber(0.17)));
                colWidth = math.format(math.subtract(math.bignumber(colWidth), math.bignumber(100)));

                if (isNullOrBlank(colWidth))
                    colWidth = 150;

                if (key == 'taskRelationId') {
                    dataInfo = [];
                    $.each(that._projectTempData.functionList, function (i, item) {
                        dataInfo.push({id: item.relationId, name: item.fieldName});
                    });
                } else if (key == 'taskName') {
                    colWidth = colWidth - 0 + 30;
                }


                $this.m_editable({
                    inline: true,
                    hideElement: true,
                    isNotSet: false,
                    popoverStyle: {'width': '80%'},
                    value: value,
                    dataInfo: dataInfo,
                    targetNotQuickCloseArr: ['select2-selection__choice', 'select2-search--dropdown', 'select2-search__field', 'select2-results__options'],
                    closed: function (data) {

                        if (data != false) {
                            var param = {};
                            param.id = $this.closest('.panel').attr('data-id');
                            var companyId = $this.closest('.panel').attr('data-company-id');
                            if (!isNullOrBlank(companyId))
                                param.companyId = companyId;

                            if (!isNullOrBlank(data[key])) {
                                param[key] = data[key];
                                that.updateProjectBaseData(param);
                            }
                        }
                        $this.parent().find('.show-span').show();
                    },
                    completed: function ($popover) {
                        $(that.element).find('.show-span').show();
                        $this.parent().find('.show-span').hide();

                        if (key == 'taskRelationId') {
                            $popover.find('select').on('select2:open select2:opening', function (e) {

                                var t = setTimeout(function () {

                                    $.each(that._projectTempData.functionList, function (i, item) {
                                        var $li = $('.select2-container .select2-results__options li[id$="' + item.relationId + '"]');
                                        if (isNullOrBlank(item.pid)) {
                                            $li.css('font-weight', '600');
                                        } else {
                                            $li.css('padding-left', '15px');
                                        }
                                    });
                                    clearTimeout(t);
                                });
                            });
                        }
                    }
                }, true);
            });
            $(that.element).find('a[data-action="xeditable-status"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key'), value = $this.attr('data-value'), dataInfo = null;
                if (key == 'status') {
                    dataInfo = [{id: 0, name: '进行中'},
                        {id: 2, name: '已完成'},
                        {id: 1, name: '已暂停'},
                        {id: 3, name: '已终止'}];

                    value = that._dataInfo.projectStatus;

                } else if (key == 'endStatus') {
                    dataInfo = [{id: 1, name: '进行中'},
                        {id: 2, name: '已完成'},
                        {id: 3, name: '已暂停'},
                        {id: 4, name: '已终止'}];

                    if (value == '0') {//未发布改为进行中
                        value == '1';
                    }
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
                            if (key == 'status') {
                                that.updateProjectStatus(data);
                            } else if (key == 'endStatus') {
                                param.id = $this.attr('data-id');
                                that.saveTaskStatus(param);
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
        //编辑签发保存
        , updateProjectBaseData: function (param) {
            var options = {}, that = this;
            options.url = restApi.url_updateProjectBaseData;
            options.postData = {};
            options.postData.projectId = that.settings.projectId;
            options.postData.taskType = 1;
            $.extend(options.postData, param);
            m_ajax.postJson(options, function (response) {
                if (response.code == '0') {
                    S_toastr.success('保存成功！');
                    that.init();
                } else {
                    if (response.info.indexOf('已存在') > -1) {
                        S_toastr.error(response.info);
                    } else {
                        S_layer.error(response.info);
                    }
                }
            });
        }
        //渲染项目负责人
        , renderDesignManager: function (callBack) {
            var that = this;

            $(that.element).find('#designManagerBox').m_production_design_manager({
                doType: 2,
                businessType: that.settings.businessType,
                projectId: that.settings.projectId,
                dataCompanyId: that.settings.dataCompanyId,
                renderCallBack: function (data) {
                    that._managerInfo = data;
                    if (callBack)
                        callBack();

                },
                saveCallBack: function () {
                    that.init();
                }
            }, true);
        }
        //保存基本信息
        , saveProjectData: function (data) {
            var that = this;
            var options = {};
            options.url = restApi.url_project;
            options.classId = '#content-right';
            options.postData = data;
            options.postData.id = that.settings.projectId;
            m_ajax.postJson(options, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');
                    that.init();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //更改项目状态
        , updateProjectStatus: function (param) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_updateProjectStatus;
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
            option.postData.companyId = that._currentCompanyId;
            if (!isNullOrBlank(that.settings.dataCompanyId))
                option.postData.companyId = that.settings.dataCompanyId;

            option.postData = $.extend({}, option.postData, param);

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    that.init();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //保存子项状态
        , saveTaskStatus: function (data) {
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
        //获取流程数据
        , getListTaskProcess: function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listTaskProcess;
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
            option.postData.processType = '1';
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if (callBack)
                        callBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //选择流程
        , startTaskProcess: function (processId) {
            var that = this;
            var option = {};
            option.url = restApi.url_startTaskProcess;
            option.postData = {};
            option.postData.id = processId;
            option.postData.projectId = that.settings.projectId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功！');
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
            } else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
