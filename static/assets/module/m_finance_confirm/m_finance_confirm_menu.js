/**
 * 收支确认-菜单
 * Created by wrb on 2019/7/9.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_finance_confirm_menu",
        defaults = {
            contentEle:null,
            dataAction:null,
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

            var html = template('m_finance_confirm/m_finance_confirm_menu',{});
            $(that.element).html(html);
            rolesControl();
            var dataAction = that.settings.dataAction;
            if(isNullOrBlank(dataAction))
                dataAction = $(that.element).find('ul.secondary-menu-ul li:first').attr('id');

            that.switchPage(dataAction);

        }
        //切换页面
        , switchPage: function (dataAction) {
            var that = this;
            switch (dataAction) {
                case 'feeEntry'://费用录入
                    that.feeEntry();
                    that._breadcrumb = [{name:'费用管理'},{name:'收支确认',url:'#/financeConfirm'},{name:'费用录入'}];
                    break;
                case 'billing'://开票确认
                    that.billing();
                    that._breadcrumb = [{name:'费用管理'},{name:'收支确认',url:'#/financeConfirm'},{name:'开票确认'}];
                    break;
                case 'projectReceipt'://项目收款
                    that.projectReceipt();
                    that._breadcrumb = [{name:'统计管理'},{name:'收支确认',url:'#/financeConfirm'},{name:'项目收款'}];
                    break;
                case 'projectPayment'://项目付款
                    that.projectPayment();
                    that._breadcrumb = [{name:'统计管理'},{name:'收支确认',url:'#/financeConfirm'},{name:'项目付款'}];
                    break;
                case 'approvalPayment'://审批付款
                    that.approvalPayment();
                    that._breadcrumb = [{name:'费用管理'},{name:'收支确认',url:'#/financeConfirm'},{name:'审批付款'}];
                    break;
                case 'approvalExp'://费用收付款
                    that.approvalExp();
                    that._breadcrumb = [{name:'费用管理'},{name:'收支确认',url:'#/financeConfirm'},{name:'借款/往来/保证金等收付款'}];
                    break;
                case 'singleFundChange'://资金变动
                    that.singleFundChange();
                    that._breadcrumb = [{name:'费用管理'},{name:'收支确认',url:'#/financeConfirm'},{name:'资金变动'}];
                    break;

            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //费用录入
        , feeEntry: function () {
            var that = this;
            $(that.element).find('#content-box').m_feeEntry({},true);
        }
        //开票确认
        , billing: function () {
            var that = this;
            $(that.element).find('#content-box').m_summary_invoice({status:0,doType:2}, true);
        }
        //项目收款
        , projectReceipt: function () {
            var that = this;
            $(that.element).find('#content-box').m_project_receipt({},true);
        }
        //项目付款
        , projectPayment: function () {
            var that = this;
            $(that.element).find('#content-box').m_project_payment({},true);
        }
        //审批付款
        , approvalPayment:function () {
            var that = this;
            $(that.element).find('#content-box').m_approvalReport_cost({doType:2,allocationStatus:0},true);
        }
        //费用收付款
        , approvalExp:function () {
            var that = this;
            $(that.element).find('#content-box').m_approval_exp({});
        }
        //资金变动
        , singleFundChange:function () {
            var that = this;
            $(that.element).find('#content-box').m_approval_capital_changes({});
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
