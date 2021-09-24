/**
 * 项目左边菜单导航
 * Created by wrb on 2016/12/22.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_projectMenu",
        defaults = {
            isFirstEnter: null,//是否是第一次进来
            dataAction: null,
            query: null,//参数
            neetReload:false
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._projectOperator = null;//权限标识
        this._businessType = window.businessType;
        this.settings.query.projectName = decodeURI(this.settings.query.projectName);
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.getRoleFun(function () {
                var html = template('m_project/m_projectMenu', {
                    id: that.settings.query.id,
                    businessType: that.settings.query.businessType,
                    projectName: encodeURI(that.settings.query.projectName),
                    projectOperator: that._projectOperator,
                    dataCompanyId: that.settings.query.dataCompanyId,
                    fileId: that._projectOperator.fileId
                });

                $(that.element).find('.nav-third-level').remove();
                $(that.element).append(html);
                $(that.element).addClass('selected');//添加选中标识

                if (that.settings.dataAction != null) {
                    that.switchPage(that.settings.dataAction);
                    var newDataAction = that.settings.dataAction;
                    if (newDataAction.indexOf('/'))
                        newDataAction = newDataAction.split('/')[0];

                    var currentEle = $('.m-metismenu li a[id="' + newDataAction + '"]');
                    if (currentEle.length > 0) {
                        $('.m-metismenu li').removeClass('active');
                        if (that.settings.query.businessType == 1) {
                            $('.m-metismenu .parentProject').removeClass('selected').addClass("in");
                            $('.m-metismenu .parentProject .nav-second-level').removeClass("in");

                            if (!$('.m-metismenu .parentProject').hasClass('selected')) {
                                $('.m-metismenu .parentProject').addClass('selected')
                            }
                            if (!$('.m-metismenu .parentProject').hasClass('in')) {
                                $('.m-metismenu .parentProject').addClass('in')
                            }
                            if (!$('.m-metismenu .parentProject .nav-second-level').hasClass('in')) {
                                $('.m-metismenu .parentProject .nav-second-level').addClass('in')
                            }
                        } else {
                            $('.m-metismenu .parentProject').removeClass('selected').removeClass("in");
                            $('.m-metismenu .parentProject .nav-second-level').removeClass("in");

                            if (!$('.m-metismenu .parentProject').hasClass('selected')) {
                                $('.m-metismenu .parentProject').addClass('selected')
                            }
                            if (!$('.m-metismenu .parentProject').hasClass('in')) {
                                $('.m-metismenu .parentProject').addClass('in')
                            }
                            if (!$('.m-metismenu .parentProject .nav-second-level').hasClass('in')) {
                                $('.m-metismenu .parentProject .nav-second-level').addClass('in')
                            }


                        }
                        currentEle.parent().addClass('active');
                    }
                } else {
                    $(that.element).find('.m-metismenu li:first a').click();
                }

                rolesControl();

            })
        }
        , getRoleFun: function (callBack) {
            var that = this;
            var option = {};
            if (isNullOrBlank(that.settings.query.dataCompanyId)) {
                option.url = restApi.url_getProjectNavigationRole + '/' + that.settings.query.id;
            } else {
                option.url = restApi.url_getProjectNavigationRole + '/' + that.settings.query.id + '/' + that.settings.query.dataCompanyId;//项目范围;
            }
                m_ajax.get(option, function (response) {
                    if (response.code == '0') {
                        that._projectOperator = response.data;

                        if (response.data.projectName != null && response.data.projectName != '')
                            that.settings.query.projectName = response.data.projectName;

                        if (callBack != null)
                            callBack();

                    } else {
                        S_layer.error(response.info);
                    }
                })

        }
        //切换页面
        , switchPage: function (dataAction) {
            var that = this;
            switch (dataAction) {
                case 'basicInfo':
                    that.projectBasicInfo();
                    break;
                case 'taskIssue/projectDetails'://项目详情
                    that.projectDetails();
                    dataAction = 'taskIssue';
                    break;
                case 'taskIssue':
                    that.taskIssue();
                    break;
                case 'taskIssue/details':
                    that.taskDetails();
                    break;
                case 'production':
                    that.production();
                    break;
                case 'production/details':
                    that.productionDetails();
                    break;
                case 'production/professionalDetails'://专业详情
                    that.professionalDetails();
                    break;
                case 'production/processSettings'://流程设置
                case 'taskIssue/processSettings'://流程设置
                    that.processSettings();
                    break;
                case 'production/processSettings/list'://流程列表
                case 'taskIssue/processSettings/list'://流程列表
                    that.processSettingsList();
                    break;
                case 'production/processSettings/info'://流程详情
                case 'taskIssue/processSettings/info'://流程详情
                    that.processSettingsInfo();
                    break;
                case 'production/processSettings/edit'://编辑
                    that.processSettingsEdit();
                    break;
                case 'production/approvalOpinionDetail'://校审详情
                    that.approvalOpinionDetail();
                    break;
                case 'projectDocumentLib':
                    that.projectDocumentLib();
                    break;
                case 'projectMember':
                    that.projectMember();
                    break;
                case 'externalCooperation':
                    that.externalCooperation();
                    break;
                case 'cost':
                    that.cost();
                    break;
                default:
                    dataAction = 'basicInfo';
                    that.projectBasicInfo();
                    break;
            }
        }
        //项目基本信息
        , projectBasicInfo: function () {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.projectOperator = that._projectOperator;
            option.businessType = that.settings.query.businessType;
            option.type = that.settings.query.type;
            option.renderCallBack = function () {

            };
            option.menuReRenderCallBack = function () {
                that.init();
            };
            $('#content-right').m_projectBasicInfo(option, true);
        }
        , projectDetails: function () {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.companyId = that.settings.query.companyId;
            option.createCompanyId = that._projectOperator.createCompanyId;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.editFlag = that._projectOperator.projectEdit;
            option.businessType = that.settings.query.businessType;
            $('#content-right').m_project_details(option, true);
        }
        //任务签发
        , taskIssue: function () {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.businessType = that.settings.query.businessType;
            $('#content-right').m_task_issue(option, true);
        }
        , taskDetails: function (doType) {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.taskId = that.settings.query.taskId;
            option.fromType = that.settings.query.fromType;
            option.companyId = that.settings.query.companyId;
            option.createCompanyId = that._projectOperator.createCompanyId;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.projectEdit = that._projectOperator.projectEdit;
            option.businessType = that.settings.query.businessType;
            $('#content-right').m_task_issue_details(option, true);

        }
        //生产安排
        , production: function () {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.businessType = that.settings.query.businessType;
            if(that.settings.query.taskType){
                option.taskType = that.settings.query.taskType;
            }
            if(that.settings.query.taskId){
                option.taskId = that.settings.query.taskId;
            }
            if(that.settings.query.taskPid){
                option.taskPid = that.settings.query.taskPid;
            }

            $('#content-right').m_production(option, true);
        }
        , productionDetails: function () {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.taskId = that.settings.query.taskId;
            option.fromType = that.settings.query.fromType;
            option.companyId = that.settings.query.companyId;
            option.createCompanyId = that._projectOperator.createCompanyId;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.businessType = that.settings.query.businessType;
            $('#content-right').m_production_details(option, true);
        }
        , professionalDetails: function () {
            var that = this;
            $('#content-right').m_production_professional_details({
                query: that.settings.query
            }, true);
        }
        //项目文档
        , projectDocumentLib: function () {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.companyId = that.settings.query.companyId;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.businessType = that.settings.query.businessType;
            $('#content-right').m_docmgr(option, true);
        }
        //项目成员
        , projectMember: function () {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.businessType = that.settings.query.businessType;
            $('#content-right').m_projectMember(option, true);
        }
        //外部合作
        , externalCooperation: function () {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.isManager = that._projectOperator.isOperatorManager;
            option.inviteOuterCooperation = that._projectOperator.inviteOuterCooperation;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.businessType = that.settings.query.businessType;
            $('#content-right').m_projectExternalCooperation(option, true);
        }
        //收支管理
        , cost: function () {
            var option = {}, that = this;
            option.projectId = that.settings.query.id;
            option.projectName = that.settings.query.projectName;
            option.dataAction = that.settings.query.type;
            option.projectOperator = that._projectOperator;
            option.dataCompanyId = that.settings.query.dataCompanyId;
            option.businessType = that.settings.query.businessType;
            $('#content-right').m_cost_menu(option, true);
        }
        //流程设置
        , processSettings: function () {
            var that = this;
            $('#content-right').m_production_process_settings({
                query: that.settings.query
            }, true);
        }
        //流程设置列表
        , processSettingsList: function () {
            var that = this;
            $('#content-right').m_production_process_settings_list({
                query: that.settings.query
            }, true);
        }
        //流程设置详情
        , processSettingsInfo: function () {
            var that = this;
            /*$('#content-right').m_production_process_info({
                query:that.settings.query
            },true);*/
            $('#content-right').m_production_process_workflow_route({
                doType: 2,
                query: that.settings.query
            }, true);
        }
        //流程设置详情
        , processSettingsEdit: function () {
            var that = this;
            if (that.settings.query.doType == 1) {
                $('#content-right').m_production_process_settings_add({
                    query: that.settings.query
                }, true);
            } else if (that.settings.query.doType == 2) {
                /*$('#content-right').m_production_process_workflow_status({
                    query:that.settings.query
                },true);*/
                $('#content-right').m_production_process_workflow_route({
                    query: that.settings.query
                }, true);
            }
            /*else if(that.settings.query.doType==3){
                $('#content-right').m_production_process_workflow_route({
                    query:that.settings.query
                },true);
            }*/

        }
        //校审详情
        , approvalOpinionDetail: function () {
            var that = this;
            $('#content-right').m_production_approval_opinion_details({
                query: that.settings.query
            }, true);
        }

    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);


