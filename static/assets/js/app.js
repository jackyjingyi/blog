/**
 * Created by wrb on 2017/1/17.
 */
var app = {
    contentEle:'#content-right',
    init: function () {
        var that = this;
        //that.renderTop();
        //that.renderBottom();
        that.initRoute();
        math.config({
            number: 'BigNumber'
        });
    }

    //渲染顶部
    , renderTop: function () {
        var that = this;
        //渲染顶部
        $('#m_top').m_top();
    }
    //渲染底部
    , renderBottom: function () {
        var html = template('m_common/m_bottom', {});
        $('#m_bottom').html(html);

        var option = {
            ignoreError: true,
            url: restApi.url_getCompanyDiskInfo,
            postData:{
                companyId: window.currentCompanyId
            }
        };
        m_ajax.postJson(option, function (res) {
            if(res.code==='0'){
                var totalSize=parseFloat(res.data.totalSize);
                var freeSize=parseFloat(res.data.freeSize);
                var usedSize=totalSize-freeSize;
                var text=_.sprintf('已使用：%s&nbsp;&nbsp;总容量：%s',formatFileSize(usedSize),formatFileSize(totalSize));
                $('#footDiskInfo').html(text);
            }
        });
    }
    //路由
    , initRoute:function () {
        var that = this;
        Router.route('/', function() {//项目列表首页
            //that.projectList('myProjectList');
            that.projectList('projectOverview');
            // that.projectSection({businessType: "2"},'projectSection');
        });
        Router.route('/myProjectList', function(query) {//业务服务-我的项目
            that.projectList('myProjectList',query);
        });
        Router.route('/studyProjectList', function(query) {//创新研究-课题总览-我的项目
            that.projectList('myProjectList',query);
        });
        Router.route('/projectOverview', function(query) {//业务服务-项目总览
            that.projectList('projectOverview',query);
        });
        Router.route('/studyProjectOverview', function(query) {//创新研究-课题总览-项目总览
            that.projectList('projectOverview',query);
        });
        Router.route('/projectSection', function(query) {//研究版块、项目版块
            that.projectSection(query,'projectSection');
        });
        Router.route('/studyProjectSection', function(query) {//研究版块、项目版块
            that.projectSection(query,'projectSection');
        });
        Router.route('/studyProjectSection/details', function(query) {//研究版块、项目版块
            that.projectSectionDetails(query,'projectSection');
        });
        Router.route('/projectSection/details', function(query) {//研究版块、项目版块
            that.projectSectionDetails(query,'projectSection');
        });

        Router.route('/addProject', function() {//项目立项
            that.addProject();
        });

        Router.route('/projectDynamics', function() {//项目动态 -->动态快讯
            $(that.contentEle).m_project_dynamics({},true);
        });
        Router.route('/projectDynamicsAll', function() {//项目动态 --> 动态总览
            $(that.contentEle).m_project_dynamics_all({},true);
        });

        Router.route('/partyBuild', function(query) {// 党建工作
            $(that.contentEle).m_party_build({},true);
        });
        /**********************************我的任务--开始*****************************/
        Router.route('/myTask', function(query) {//我的任务
            that.myTask(query);
        });
        Router.route('/myTask/details', function(query) {//我的任务
            that.myTaskDetails(query);
        });
        Router.route('/myTask/design', function(query) {//我的任务-设计任务
            that.myTask(query,'design');
        });
        /*Router.route('/myTask/light', function(query) {//我的任务-费控任务
            that.myTask(query,'light');
        });*/
        Router.route('/lightTask', function(query) {//我的任务-协同任务
            that.lightTask(query);
        });

        Router.route('/projectTask', function(query) {//我的任务-项目任务
            $(that.contentEle).m_task_by_project();
        });


        Router.route('/lightProject', function(query) {//我的任务-费控任务
            that.lightProject(query,'lightProject');
        });
        Router.route('/lightProject/detail', function(query) {//我的任务-看板任务
            that.lightProject(query,'lightProject/detail');
        });
        Router.route('/lightProject/addTemp', function(query) {//我的任务-创建模板
            that.lightProject(query,'lightProject/addTemp');
        });

        /**********************************我的任务--结束*****************************/

        /**********************************技术协同--开始*****************************/
        Router.route('/technologySync', function(query) {//技术协同
            that.technologySync(query);
        });
        /**********************************技术协同--结束*****************************/


        /**********************************项目详情--开始*****************************/
        Router.route('/project/basicInfo', function(query) {
            that.project(query,'basicInfo');
        });
        //从非项目的地方跳转进项目基本信息详情
        Router.route('/project/basicInfoFromStats', function(query) {
            that.project(query,'basicInfo');
        });
        Router.route('/project/taskIssue', function(query) {
            that.project(query,'taskIssue');
        });
        Router.route('/project/taskIssue/details', function(query) {
            that.project(query,'taskIssue/details');
        });
        Router.route('/project/taskIssue/projectDetails', function(query) {
            that.project(query,'taskIssue/projectDetails');
        });
        Router.route('/project/production', function(query) {
            that.project(query,'production');
        });
        Router.route('/project/production/details', function(query) {
            that.project(query,'production/details');
        });
        Router.route('/project/production/professionalDetails', function(query) {//专业详情
            that.project(query,'production/professionalDetails');
        });
        Router.route('/project/production/approvalOpinionDetail', function(query) {//校审详情
            that.project(query,'production/approvalOpinionDetail');
        });
        Router.route('/project/production/processSettings', function(query) {//流程设置
            that.project(query,'production/processSettings');
        });
        Router.route('/project/production/processSettings/list', function(query) {//流程设置
            that.project(query,'production/processSettings/list');
        });
        Router.route('/project/production/processSettings/info', function(query) {//流程设置
            that.project(query,'production/processSettings/info');
        });
        Router.route('/project/taskIssue/processSettings', function(query) {//流程设置
            that.project(query,'taskIssue/processSettings');
        });
        Router.route('/project/taskIssue/processSettings/list', function(query) {//流程设置
            that.project(query,'taskIssue/processSettings/list');
        });
        Router.route('/project/taskIssue/processSettings/info', function(query) {//流程设置
            that.project(query,'taskIssue/processSettings/info');
        });
        Router.route('/project/production/processSettings/edit', function(query) {//流程设置
            that.project(query,'production/processSettings/edit');
        });
        Router.route('/project/incomeExpenditure', function(query) {
            that.project(query,'incomeExpenditure');
        });
        Router.route('/project/projectDocumentLib', function(query) {
            that.project(query,'projectDocumentLib');
        });
        Router.route('/project/projectMember', function(query) {
            that.project(query,'projectMember');
        });
        Router.route('/project/externalCooperation', function(query) {
            that.project(query,'externalCooperation');
        });
        Router.route('/project/cost', function(query) {
            that.project(query,'cost');
        });

        /**********************************项目详情--结束*****************************/

        /**********************************财务--开始*****************************/
        Router.route('/paymentsDetail', function() {//收支明细
            that.paymentsDetail();
        });
        Router.route('/paymentsDetail/ledger', function() {//收支明细-台账1
            that.paymentsDetail('ledger');
        });
        Router.route('/paymentsDetail/ledger2', function() {//收支明细-台账2
            that.paymentsDetail('ledger2');
        });
        Router.route('/paymentsDetail/ledger3', function() {//收支明细-台账3
            that.paymentsDetail('ledger3');
        });
        Router.route('/paymentsDetail/ledger4', function() {//收支明细-台账4
            that.paymentsDetail('ledger4');
        });
        Router.route('/receivable', function() {//收支明细-应收
            that.receivable('receivable');
        });
        Router.route('/payable', function() {//收支明细-应付
            that.payable('payable');
        });
        Router.route('/projectCostDetail', function() {//项目收支
            that.projectCostDetail();
        });
        Router.route('/projectCostDetail/table1', function() {//项目收支-表1
            that.projectCostDetail('table1');
        });
        Router.route('/projectCostDetail/table2', function() {//项目收支-表2
            that.projectCostDetail('table2');
        });
        Router.route('/projectCostDetail/table3', function() {//项目收支-表3
            that.projectCostDetail('table3');
        });
        Router.route('/projectCostDetail/table4', function() {//项目收支-表4
            that.projectCostDetail('table4');
        });
        Router.route('/paymentsStatistics', function() {//分类统计
            that.paymentsStatistics();
        });
        Router.route('/profitStatement', function() {//利润报表
            that.profitStatement();
        });
        Router.route('/financeSettings', function() {//财务类别设置
            that.financeSettings();
        });
        Router.route('/financeSettings/costCategory', function(query) {//收支类别设置
            that.financeSettings(query,'costCategory');
        });
        Router.route('/financeSettings/costBasic', function(query) {//基础财务数据设置
            that.financeSettings(query,'costBasic');
        });
        Router.route('/financeConfirm', function() {//收支确认
            that.financeConfirm();
        });
        Router.route('/financeConfirm/feeEntry', function(query) {//费用录入
            that.financeConfirm('feeEntry',query);
        });
        Router.route('/financeConfirm/billing', function(query) {//开票确认
            that.financeConfirm('billing',query);
        });
        Router.route('/financeConfirm/projectReceipt', function(query) {//项目收款
            that.financeConfirm('projectReceipt',query);
        });
        Router.route('/financeConfirm/projectPayment', function(query) {//项目付款
            that.financeConfirm('projectPayment',query);
        });
        Router.route('/financeConfirm/approvalPayment', function(query) {//审批付款
            that.financeConfirm('approvalPayment',query);
        });
        Router.route('/financeConfirm/approvalExp', function(query) {//借款/往来/保证金等收付款
            that.financeConfirm('approvalExp',query);
        });
        Router.route('/financeConfirm/singleFundChange', function(query) {//资金变动
            that.financeConfirm('singleFundChange',query);
        });
        Router.route('/invoiceSummary', function() {//发票汇总
            that.invoiceSummary();
        });
        Router.route('/salary', function() {//职工薪酬
            that.salaryMgt('employeeSalary');
        });
        Router.route('/salary/employeeSalary', function() {//职工薪酬
            that.salaryMgt('employeeSalary');
        });
        Router.route('/salary/employeeSalary/details', function(query) {//职工薪酬详情
            that.salaryMgt('employeeSalary/details',query);
        });
        Router.route('/salary/salaryCalculationTable', function() {//工资计算表
            that.salaryMgt('salaryCalculationTable');
        });
        Router.route('/salary/salaryTaxTable', function() {//工资表
            that.salaryMgt('salaryTaxTable');
        });
        Router.route('/salary/salaryReport', function() {//综合报表
            that.salaryMgt('salaryReport');
        });
        /**********************************财务--结束*****************************/

        Router.route('/orgInfomationShow', function() {//组织信息
            that.orgInfomationShow();
        });
        Router.route('/addressBook', function() {//通讯录
            that.addressBook();
        });
        Router.route('/projectArchiving', function() {//项目文档
            that.projectArchiving();
        });


        /**********************************审批管理--开始*****************************/
        Router.route('/approval', function() {//我审批的
            that.approval('applied');
        });
        Router.route('/approvalInitiate', function(query) {//发起审批
            that.initiateApproval();
        });
        /*Router.route('/approvalApplied', function(query) {//我申请的
            that.appliedApproval();
        });*/
        Router.route('/approval/applied', function(query) {//我申请的
            that.approval('applied',query);
        });
        Router.route('/approval/pending', function(query) {//待我审批
            that.approval('pending',query);
        });
        Router.route('/approval/approved', function(query) {//我已审批
            that.approval('approved',query);
        });
        Router.route('/approval/ccMy', function(query) {//我已审批
            that.approval('ccMy',query);
        });

        Router.route('/approvalReport', function() {//审批报表
            that.approvalReport();
        });
        Router.route('/approvalReport/reimbursement', function() {//报销汇总
            that.approvalReport('reimbursement');
        });
        Router.route('/approvalReport/cost', function() {//费用汇总
            that.approvalReport('cost');
        });
        Router.route('/approvalReport/nonAmount', function() {//非金额统计
            that.approvalReport('nonAmount');
        });
        Router.route('/approvalReport/projects', function() {//项目审批统计
            that.approvalReport('projects');
        });
        Router.route('/approvalReport/leave', function() {//请假汇总
            that.approvalReport('leave');
        });

        Router.route('/approvalReport/business', function() {//出差汇总
            that.approvalReport('business');
        });
        Router.route('/approvalReport/workingHours', function() {//工时汇总
            that.approvalReport('workingHours');
        });
        Router.route('/approvalReport/workingHoursDetail', function(query) {//工时汇总详情
            that.approvalReport('workingHoursDetail',query);
        });

        /**********************************审批管理--结束*****************************/


        /**********************************后台管理--开始*****************************/
        Router.route('/backstageMgt', function() {//组织信息
            that.backstageMgt();
        });
        Router.route('/backstageMgt/index', function() {//控制台
            that.backstageMgt('index');
        });
        Router.route('/backstageMgt/purchase', function(query) {//购买
            that.backstageMgt('purchase',query);
        });
        Router.route('/backstageMgt/purchase/details', function(query) {//购买详情
            that.backstageMgt('purchase/details',query);
        });
        Router.route('/backstageMgt/orgInfo', function() {//组织信息
            that.backstageMgt('orgInfo');
        });
        Router.route('/backstageMgt/organizational', function() {//组织架构
            that.backstageMgt('organizational');
        });
        Router.route('/backstageMgt/permissionSettings', function() {//权限设置
            that.backstageMgt('permissionSettings');
        });
        Router.route('/backstageMgt/enterpriseCertification', function() {//企业认证
            that.backstageMgt('enterpriseCertification');
        });
        Router.route('/backstageMgt/historicalDataImport', function() {//历史数据导入
            that.backstageMgt('historicalDataImport');
        });
        Router.route('/backstageMgt/financeSettingProcess', function(query) {//项目收支流程设置
            that.backstageMgt('financeSettingProcess',query);
        });
        Router.route('/backstageMgt/approvalMgt', function() {//审批管理
            that.backstageMgt('approvalMgt');
        });
        Router.route('/backstageMgt/attendance', function() {//考勤
            that.backstageMgt('attendance');
        });
        Router.route('/backstageMgt/attendance/settings', function() {//考勤
            that.backstageMgt('attendance/settings');
        });
        Router.route('/backstageMgt/attendance/report', function(query) {//考勤
            that.backstageMgt('attendance/report',query);
        });
        /*Router.route('/backstageMgt/projectTemp', function() {//项目模板
            that.backstageMgt('projectTemp');
        });*/
        Router.route('/backstageMgt/projectSettings', function() {//项目配置
            that.backstageMgt('projectSettings');
        });


        /**********************************后台管理--结束*****************************/


        Router.route('/proProgressStats', function(query) {//项目进度统计
            that.proProgressStats();
        });
        Router.route('/proProgressStats/researchType', function(query) {//项目进度统计 研究类型
            that.proProgressStats('researchType',query);
        });
        Router.route('/proProgressStats/businessType', function(query) {//项目进度统计 业务类型
            that.proProgressStats('businessType',query);
        });
        Router.route('/proTypeStats', function(query) {//项目类型统计
            $(that.contentEle).m_stats_pro_type();
        });
        Router.route('/theaterRanking', function(query) {//公司收支排行
            $(that.contentEle).m_stats_theater_ranking();
        });
        Router.route('/userOutputStats', function(query) {//人员产值统计
            $(that.contentEle).m_stats_user_output();
        });
        Router.route('/deanOutputStats', function(query) {//院长产值统计
            $(that.contentEle).m_stats_dean_output();
        });
        Router.route('/deanBillStatistic', function(query) {//院长产值统计
            $(that.contentEle).m_stats_dean_bill();
        });


        /******************************* 头部操作路由-开始 *************************************/

        Router.route('/personalSettings', function() {//个人设置
            that.personalSettings();
        });
        Router.route('/announcement', function() {//公告
            that.announcement();
        });
        Router.route('/announcement/send', function() {//发送公告
            that.announcementSend();
        });
        Router.route('/announcement/detail', function(query) {//发送公告
            that.announcementDetail(query);
        });
        Router.route('/myTodoList', function() {//我的待办
            that.myTodoList();
        });
        Router.route('/createOrg', function() {//创建组织
            that.createOrg();
        });
        Router.route('/createOrg/1', function() {//当前账号无组织,创建组织

            $('#content-right').m_createOrg({
                doType:1,
                saveOrgCallback:function(data){
                    var url = '/iWork/home/workbench';
                    window.location.href = window.serverPath + url;
                }
            });
            $('#page-wrapper').addClass('menu-l-none');

        });
        Router.route('/messageCenter', function() {//消息中心
            that.messageCenter();
        });
        Router.route('/error/404', function() {//消息中心
            that.errorFun('404');
        });

        /******************************* 头部操作路由-结束 *************************************/

        Router.beforeCallback(function (resolve) {

            if(isNullOrBlank(window.companyVersion)){
                $('#m_top').m_top({
                    resolve:resolve,
                    renderCallBack:function (data) {
                        $('#left-menu-box').m_metismenu({contentEle : '#content-right'});
                        //that.renderBottom();

                        //消息推送初始化
                        messageCenter.init();
                        window.onbeforeunload = function (event) {
                            try {
                                messageCenter.disconnect();
                            }
                            catch (e) {
                            }
                        };
                    }
                });
            }else{
                resolve('top-have-render');
            }

        });
        Router.afterCallback(function () {
            $('#left-menu-box').m_metismenu('menuShowOrHide',Router.currentUrl);
            $('#left-menu-box').m_metismenu('menuDealFun',Router.currentUrl);

            //清除切换界面产生的tooltip不消失的情况
            if($('.tooltip[role="tooltip"][id^="tooltip"]').length>0){
                $('.tooltip[role="tooltip"][id^="tooltip"]').remove();
            }

        });
    }
    //错误提示
    , errorFun:function (dataAction) {
        $(this.contentEle).m_error({dataAction:dataAction},true);
    }
    //我的项目
    , projectList:function (dataAction,query) {
        var that = this;
        $(that.contentEle).m_projectList_menu({dataAction:dataAction,query:query});
    }
    //项目进度统计
    ,proProgressStats:function (dataAction,query) {
        var that = this;
        $(that.contentEle).m_stats_pro_process_menu({dataAction:dataAction,query:query});
    }
    //通讯录
    , addressBook:function () {
        var that = this;
        $(that.contentEle).m_addressBook();
    }
    //组织信息(可查看)
    , orgInfomationShow: function () {
        var that = this;
        $(that.contentEle).m_orgInfomation({type:0});
    }
    , addProject:function () {
        var that = this;
        $(that.contentEle).m_projectAdd({}, true);
    }
    //后台管理
    , backstageMgt: function (dataAction,query) {
        var that = this;
        $(that.contentEle).m_backstage_menu({
            dataAction:dataAction,
            query:query
        });
    }
    //项目详情
    , project:function (query,dataAction) {
        var that = this;
        var option = {};

        option.dataAction = dataAction;
        option.query = query;
        if(query.businessType==1){
            $('.m-metismenu .parentProject .projectList').m_projectMenu(option);
        }else{
            $('.m-metismenu .parentProject .projectList').m_projectMenu(option);
            // $('.m-metismenu .parentStudyProject .studyProjectList').m_projectMenu(option);
        }

    }
    //消息中心
    , messageCenter:function () {
        var that = this;
        var option = {};
        $(that.contentEle).m_message(option,true);
    }
    //个人设置
    , personalSettings:function () {
        //获取用户信息数据
        var option = {};
        option.url = restApi.url_userInfo;
        m_ajax.get(option, function (response) {
            if (response.code == '0') {
                $('#content-right').m_userInfo({userDto: response.data});
            } else {
                S_layer.error(response.info);
            }
        });
    }
    //通知公告
    , announcement:function () {
        var that = this;
        var option = {};
        $(that.contentEle).m_notice(option,true)
    }
    //我的待办
    , myTodoList:function () {
        var that = this;
        var option = {};
        $(that.contentEle).m_todo(option,true)
    }
    , announcementSend:function () {
        var that = this;
        //$(that.contentEle).m_publishPublicNotice();
        $(that.contentEle).m_notice_publish();
    }
    , announcementDetail:function (query) {
        var options = {};
        options.noticeId = query.id;
        $('#content-right').m_notice_details(options);
    }
    , myTask:function (query,dataAction) {
        var that = this;

        if(query.status==1){
            $('body').addClass('babieniaovisit');
        }
        var options = {};
        if(query.companyUserId!=null){

            options.companyUserId = query.companyUserId;
            options.userId = query.userId;
        }
        $(that.contentEle).m_task(options, true);
    }
    , technologySync:function (query,dataAction) {
        var that = this;
        if(query.status==1){
            $('body').addClass('babieniaovisit');
        }
        $(that.contentEle).m_technology_sync({}, true);
    }
    , projectSection:function (query,dataAction) {
        var that = this;
        $(that.contentEle).m_project_section({query:query}, true);
    }
    , projectSectionDetails:function (query,dataAction) {
        var that = this;
        $(that.contentEle).m_departIntroductionShow(query, true);
    }
    , myTaskDetails:function (query,dataAction) {
        var that = this;
        $(that.contentEle).m_task_details(query, true);
    }
    , lightTask:function (query,dataAction) {
        var that = this;
        $(that.contentEle).m_task_light({}, true);

    }
    //轻量任务
    ,lightProject:function (query,dataAction) {
        var that = this;
        if(dataAction=='lightProject/detail'){

            $(that.contentEle).m_light_project_detail({query:query},true);

        }else if(dataAction=='lightProject/addTemp'){

            $(that.contentEle).m_light_project_temp_add({});

        }else{
            $(that.contentEle).m_light_project({});
        }

    }
    //财务类别设置
    , financeSettings:function (query,dataAction) {
        var that = this;
        $(that.contentEle).m_finance_settings_menu({
            dataAction:dataAction,
            query:query
        });
    }
    //收支确认
    ,financeConfirm:function (dataAction,query) {
        $(this.contentEle).m_finance_confirm_menu({
            dataAction:dataAction,
            query:query
        });
    }


    //费用录入
    , feeEntry:function () {
        var that = this;
        $(that.contentEle).m_feeEntry();
    }
    //收支总览
    , paymentsDetail:function (dataAction) {
        var that = this;
        $(that.contentEle).m_payments_detail_menu({
            dataAction:dataAction
        });
    }
    //应收
    , receivable:function () {
        var that = this;
        $(that.contentEle).m_payments_receivable();
    }
    //应付
    , payable:function () {
        var that = this;
        $(that.contentEle).m_payments_payable();
    }
    //项目收支明细
    ,projectCostDetail:function (dataAction) {
        var that = this;
        $(that.contentEle).m_project_cost_menu({
            dataAction:dataAction
        });
    }
    //分类统计
    , paymentsStatistics:function () {
        var that = this;
        $(that.contentEle).m_payments_statistics();
    }
    //利润报表
    , profitStatement:function () {
        var that = this;
        $(that.contentEle).m_payments_profitStatement();
    }
    //项目归档
    , projectArchiving:function () {
        var that = this;
        $(that.contentEle).m_projectArchiving({},true);
    }
    //项目总览
    , projectOverview:function () {
        var options = {}, that = this;
        options.isAllProject = true;
        $(that.contentEle).m_projectList(options, true);
    }
    //创建组织
    , createOrg:function () {
        var options = {};
        options.saveOrgCallback = function (data) {
            var url = '/iWork/home/workbench';
            window.location.href = window.serverPath + url;
        };
        $('#content-right').m_createOrg(options);
    }

    //我的任务-收支管理
    , incomeExpenditureByMyTask:function (query) {
        var option = {};
        option.projectId = query.projectId;
        option.projectName = decodeURI(query.projectName);
        option.dataAction = query.dataType;
        option.myTaskId = query.myTaskId;
        $('#content-right').m_cost_menu(option,true);
    }

    //发票汇总
    ,invoiceSummary:function () {
        var that = this;
        $(that.contentEle).m_summary_invoice({status:1,doType:1}, true);
    }
    //发起审批
    ,initiateApproval:function () {
        $(this.contentEle).m_approval_initiate({}, true);
    }
    //我申请的
    ,appliedApproval:function () {
        $(this.contentEle).m_approval_data({doType:1}, true);
    }
    //发起审批
    ,approval:function (dataAction,query) {
        var that = this;
        $(that.contentEle).m_approval_menu({
            dataAction : dataAction,
            query : query
        });
    }
    //审批报表
    ,approvalReport:function (dataAction,query) {
        var options = {}, that = this;
        options.dataAction=dataAction;
        options.query = query;
        $(that.contentEle).m_approvalReport_menu(options,true);
    }
    //1=我申请的,2=待我审批,3=我已审批,4=抄送我的
    ,approveDataList:function (type) {
        var options = {}, that = this;
        options.doType=type;
        $(that.contentEle).m_approval_data(options, true);
    }
    //工资薪酬
    ,salaryMgt:function (dataAction,query) {
        $(this.contentEle).m_salary_menu({
            dataAction:dataAction,
            query:query
        },true);
    }
};

$(document).ready(function () {
    // Add body-small class if window less than 768px
    if ($(this).width() < 769) {
        $('body').addClass('body-small')
    } else {
        $('body').removeClass('body-small')
    }
    // Minimalize menu when screen is less than 768px
    $(window).bind("load resize scroll", function () {
        if ($(this).width() < 769) {
            $('body').addClass('body-small')
        } else {
            $('body').removeClass('body-small')
        }
        fix_height();
    });
    // Full height of sidebar
    function fix_height() {

        var topHeight = $('.navbar.navbar-static-top').height();
        if(topHeight==undefined)
            topHeight = 60;

        var heightWithoutNavbar = $("body > #wrapper").height() - topHeight - 1;
        $(".sidebar-panel").css("min-height", heightWithoutNavbar + "px");

        var navbarheight = $('nav.navbar-default').height();
        var wrapperHeight = $('#page-wrapper').height();
        var windowHeight = $(window).height();

        if (navbarheight > wrapperHeight) {
            $('#page-wrapper').css("min-height", navbarheight + "px");
        }
        if (navbarheight <= wrapperHeight) {
            $('#page-wrapper').css("min-height", windowHeight - topHeight + "px");
        }
        if (navbarheight > windowHeight - topHeight  && navbarheight > wrapperHeight) {
            $('#page-wrapper').css("min-height", navbarheight + "px");
        }
        if (navbarheight < windowHeight - topHeight && wrapperHeight < windowHeight - topHeight) {
            $('#page-wrapper').css("min-height", windowHeight - topHeight + "px");
        }

        if ($('body').hasClass('fixed-nav')) {
            if (navbarheight > wrapperHeight) {
                $('#page-wrapper').css("min-height", navbarheight + "px");
            } else {
                $('#page-wrapper').css("min-height", $(window).height() - topHeight + "px");
            }
        }

    }

    fix_height();

    //hashchange监听浏览器url变化
    /*$(window).bind('hashchange', function() {


    });*/

});
