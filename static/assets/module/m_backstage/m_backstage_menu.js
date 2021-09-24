/**
 * 操作－左菜单
 * Created by wrb on 2016/12/16.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_backstage_menu",
        defaults = {
            contentEle:null,
            dataAction:null,
            query:null,//URL参数
            isFirstEnter:false//是否是第一次進來
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._breadcrumb = [];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.initHtmlData();
        }
        //初始化数据并加载模板
        ,initHtmlData:function () {
            var that = this;

            var html = template('m_backstage/m_backstage_menu',{
                roleCodes:window.currentRoleCodes,
                role:window.role
            });
            $(that.element).html(html);
            rolesControl();
            var dataAction = that.settings.dataAction;
            if(isNullOrBlank(dataAction))
                dataAction = $(that.element).find('ul.secondary-menu-ul li:first').attr('id');

            that.switchPage(dataAction);
        }
        //tab页切换
        , switchPage: function (dataAction) {

            var that = this;
            switch (dataAction) {
                case 'index'://控制台
                    that.index();
                    that._breadcrumb = [{name:'后台管理'},{name:'控制台'}];
                    break;
                case 'purchase'://购买
                    that.purchase();
                    that._breadcrumb = [{name:'后台管理'},{name:'控制台',url:'#/backstageMgt/index'},{name:'购买'}];
                    dataAction = 'index';
                    break;
                case 'purchase/details'://购买详情
                    that.purchase();
                    that._breadcrumb = [{name:'后台管理'},{name:'控制台',url:'#/backstageMgt/index'},{name:'购买详情'}];
                    dataAction = 'index';
                    break;
                case 'organizational'://组织架构
                    that.organizational();
                    that._breadcrumb = [{name:'后台管理'},{name:'组织架构'}];
                    break;
                case 'orgInfo'://组织信息编辑
                    that.orgInfomationEdit();
                    that._breadcrumb = [{name:'后台管理'},{name:'组织信息'}];
                    break;
                case 'addressBook'://通讯录
                    that.addressBook();
                    that._breadcrumb = [{name:'后台管理'},{name:'通讯录'}];
                    break;
                case 'orgInfomationShow'://组织信息
                    that.orgInfomationShow();
                    that._breadcrumb = [{name:'后台管理'},{name:'组织信息'}];
                    break;
                case 'permissionSettings'://权限设置
                    that.permissionSettings();
                    that._breadcrumb = [{name:'后台管理'},{name:'权限设置'}];
                    break;
                case 'enterpriseCertification'://企业认证
                    that.enterpriseCertification();
                    that._breadcrumb = [{name:'后台管理'},{name:'企业认证'}];
                    break;
                case 'historicalDataImport'://历史数据导入
                    that.historicalDataImport();
                    that._breadcrumb = [{name:'后台管理'},{name:'历史数据导入'}];
                    break;
                case 'approvalMgt'://审批管理
                    that.approvalMgt();
                    that._breadcrumb = [{name:'后台管理'},{name:'审批设置'}];
                    break;
                case 'attendance'://考勤设置
                    that.attendance();
                    that._breadcrumb = [{name:'后台管理'},{name:'考勤设置'}];
                    break;
                case 'attendance/settings'://考勤设置
                    that.attendanceSettings();
                    that._breadcrumb = [{name:'后台管理'},{name:'考勤设置',url:'#/backstageMgt/attendance'},{name:'规则设置'}];
                    dataAction = 'attendance';
                    break;
                case 'attendance/report'://考勤设置
                    that.attendanceReport();
                    that._breadcrumb = [{name:'后台管理'},{name:'考勤设置',url:'#/backstageMgt/attendance'},{name:'打卡统计'}];
                    dataAction = 'attendance';
                    break;
                case 'projectSettings'://项目模板
                    that.projectTemp();
                    that._breadcrumb = [{name:'后台管理'},{name:'项目模板'}];
                    break;
            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //控制台
        , index: function () {
            var that = this;
            $(that.element).find('#content-box').m_backstage_index({},true);
        }
        ,purchase:function () {
            var that = this;
            var option = {};
            option.type = that.settings.query.type;
            if(that.settings.query && that.settings.query.id)
                option.orderId = that.settings.query.id;

            $(that.element).find('#content-box').m_backstage_purchase(option,true);
        }
        //组织架构
        , organizational: function () {
            var that = this;
            $(that.element).find('#content-box').m_organizational();
        }
        //组织信息(可编辑)
        , orgInfomationEdit: function () {
            var that = this;
            $(that.element).find('#content-box').m_orgInfomation({type:1});
        }
        //组织信息(可查看)
        , orgInfomationShow: function () {
            var that = this;
            $(that.element).find('#content-box').m_orgInfomation({type:0});
        }
        //通讯录
        , addressBook: function () {
            var that = this;
            $(that.element).find('#content-box').m_addressBook();
        }
        //权限设置
        ,permissionSettings:function () {
            var that = this;
            var option = {};
            option.isAddUser = 1;
            //$(that.element).find('#content-box').m_role(option,true);
            $(that.element).find('#content-box').m_role_tab();
        }
        //历史数据导入
        ,historicalDataImport:function () {
            var that = this;
            $(that.element).find('#content-box').m_historyData({}, true);
        }
        //审批管理
        ,approvalMgt:function () {
            var that = this;
            //$(that.element).find('#content-box').m_approval_mgt({}, true);
            $(that.element).find('#content-box').m_approval_mgt_tab({}, true);
        }
        ,attendance:function () {
            var that = this;
            $(that.element).find('#content-box').m_attendance({}, true);
        }
        ,attendanceSettings:function () {
            var that = this;
            $(that.element).find('#content-box').m_attendance_settings({}, true);
        }
        ,attendanceReport:function () {
            var that = this;
            $(that.element).find('#content-box').m_attendance_report({
                type:that.settings.query.type
            }, true);
        }
        ,projectTemp:function () {
            var that = this;
            $(that.element).find('#content-box').m_project_temp_tab({
                query:that.settings.query
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
