/**
 * 收支总览-收支明细-菜单
 * Created by wrb on 2017/11/30.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_payments_detail_menu",
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

            var html = template('m_payments/m_payments_detail_menu',{isHasChildOrg:window.role.isHasChildOrg});
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
                case 'ledger'://台账
                    that.ledger();
                    that._breadcrumb = [{name:'费用管理'},{name:'财务报表',url:'#/paymentsDetail'},{name:'收支汇总'}];
                    break;
                case 'ledger2'://台账
                    that.ledger2();
                    that._breadcrumb = [{name:'费用管理'},{name:'财务报表',url:'#/paymentsDetail'},{name:'分类统计'}];
                    break;
                case 'ledger3'://台账
                    that.ledger3();
                    that._breadcrumb = [{name:'费用管理'},{name:'财务报表',url:'#/paymentsDetail'},{name:'部门帐期收支'}];
                    break;
                case 'ledger4'://台账
                    that.ledger4();
                    that._breadcrumb = [{name:'费用管理'},{name:'财务报表',url:'#/paymentsDetail'},{name:'部门分类收支'}];
                    break;
                /*case 'receivable'://应收
                    that.receivable();
                    that._breadcrumb = [{name:'费用管理'},{name:'收支明细',url:'#/paymentsDetail'},{name:'应收'}];
                    break;
                case 'payable'://应付
                    that.payable();
                    that._breadcrumb = [{name:'费用管理'},{name:'收支明细',url:'#/paymentsDetail'},{name:'应付'}];
                    break;*/
            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //台账
        , ledger: function () {
            var that = this;
            $(that.element).find('#content-box').m_payments_ledger();
        }
        //台账
        , ledger2: function () {
            var that = this;
            $(that.element).find('#content-box').m_payments_ledger2();
        }
        //台账
        , ledger3: function () {
            var that = this;
            $(that.element).find('#content-box').m_payments_ledger3();
        }
        //台账
        , ledger4: function () {
            var that = this;
            $(that.element).find('#content-box').m_payments_ledger4();
        }
        /*//应收
        , receivable:function () {
            var that = this;
            $(that.element).find('#content-box').m_payments_receivable();
        }
        //应付
        , payable:function () {
            var that = this;
            $(that.element).find('#content-box').m_payments_payable();
        }*/

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
