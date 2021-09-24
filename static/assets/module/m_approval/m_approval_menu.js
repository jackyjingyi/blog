/**
 * 发起审批-菜单
 * Created by wrb on 2019/7/9.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_menu",
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

            var html = template('m_approval/m_approval_menu',{});
            $(that.element).html(html);
            rolesControl();
            var dataAction = that.settings.dataAction;
            if(isNullOrBlank(dataAction))
                dataAction = $(that.element).find('ul.secondary-menu-ul li:first').attr('id');

            that.switchPage(dataAction);

            //待我审批-待处理提示
            var t = setTimeout(function () {
                var auditCount = $('.m-metismenu #approvalAuditCount').text();
                $(that.element).find('#approvalPendingAuditCount').html(auditCount);
                clearTimeout(t);
            },200);
        }
        //切换页面
        , switchPage: function (dataAction) {
            var that = this;
            switch (dataAction) {
                case 'initiate'://发起审批
                    that.initiate();
                    that._breadcrumb = [{name:'审批管理'},{name:'我审批的',url:'#/approval'},{name:'发起审批'}];
                    break;
                case 'applied'://我申请的
                    that.applied();
                    that._breadcrumb = [{name:'审批管理'},{name:'我审批的',url:'#/approval'},{name:'我申请的'}];
                    break;
                case 'pending'://待我审批
                    that.pending();
                    that._breadcrumb = [{name:'审批管理'},{name:'我审批的',url:'#/approval'},{name:'待我审批'}];
                    break;
                case 'approved'://我已审批
                    that.approved();
                    that._breadcrumb = [{name:'审批管理'},{name:'我审批的',url:'#/approval'},{name:'我已审批'}];
                    break;
                case 'ccMy'://抄送我的
                    that.ccMy();
                    that._breadcrumb = [{name:'审批管理'},{name:'我审批的',url:'#/approval'},{name:'抄送我的'}];
                    break;

            }
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
        }
        //发起审批
        , initiate: function () {
            var that = this;
            $(that.element).find('#content-box').m_approval_initiate({}, true);
        }
        //我申请的
        , applied: function () {
            var that = this;
            $(that.element).find('#content-box').m_approval_data({doType:1}, true);
        }
        //待我审批
        , pending: function () {
            var that = this;
            $(that.element).find('#content-box').m_approval_data({doType:2}, true);
        }
        //我已审批
        , approved: function () {
            var that = this;
            $(that.element).find('#content-box').m_approval_data({doType:3}, true);
        }
        //抄送我的
        , ccMy:function () {
            var that = this;
            $(that.element).find('#content-box').m_approval_data({doType:4}, true);
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
