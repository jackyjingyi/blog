/**
 * 资金变动
 * Created by wrb on 2020/4/26.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_capital_changes",
        defaults = {
            contentEle:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._selectedOrg = null;//当前组织筛选-选中组织对象
        this._dataInfo = null;

        this._filterData = {};//筛选参数

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage(0);
        }
        //初始化数据并加载模板(t==0=第一次渲染)
        ,renderPage:function (t) {
            var that = this;
            var html = template('m_finance_confirm/m_approval_capital_changes',{});
            $(that.element).html(html);
            that.bindActionClick();
            that.renderOrgTree();
            that.renderTimeSelectControl();

        }
        //渲染组织树选择
        ,renderOrgTree:function () {
            var that = this;
            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:1,
                selectedId:window.currentCompanyId,
                param : {
                    permissionCode:'40001905',
                    managerPermissionCode:'30000203'
                },
                selectedCallBack:function (data,childIdList) {
                    //that._filterData.companyId = data.id;
                    that._filterData.companyIdList = childIdList;

                    that.renderContent();
                }
            },true);
        }
        //渲染时间筛选控件
        ,renderTimeSelectControl:function () {
            var that = this;
            var option = {};
            option.selectTimeCallBack = function (data) {

                that._filterData.startDate = data.startTime;
                that._filterData.endDate = data.endTime;
                that.renderContent();
            };
            $(that.element).find('.time-combination').m_filter_timeGroup(option,true);
        }
        //渲染list
        ,renderContent:function () {
            var that = this;
            $(that.element).find('.data-list-box').m_approval_capital_changes_list({
                doType:1,
                filterData:that._filterData,
                renderCallBack:function (filterData) {
                    that._filterData = filterData;
                }
            });
        }

        //按钮事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {
                var $this = $(this),dataId = $this.closest('tr').attr('data-id');
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'refreshBtn':
                        that._filterData = {};//筛选参数
                        that.renderPage();
                        break;
                    case 'addCapitalChanges':
                        $('body').m_approval_capital_changes_add({
                            dataInfo : {
                                formId : 'singleFundChange'
                            },
                            saveCallBack:function () {
                                that.renderContent();
                            }
                        },true);
                        break;
                }
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
