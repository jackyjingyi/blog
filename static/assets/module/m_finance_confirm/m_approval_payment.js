/**
 * 收支确认－审批付款
 * Created by wrb on 2019/7/9.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_payment",
        defaults = {
            contentEle:null,
            isFirstEnter:false//是否是第一次進來
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
            var html = template('m_finance_confirm/m_approval_payment',{});
            $(that.element).html(html);
            that.renderOrgTree();
            that.renderTimeSelectControl();
            that.bindActionClick();


        }
        //渲染组织树选择
        ,renderOrgTree:function () {
            var that = this;
            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:3,
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

                that._filterData.startTime = data.startTime;
                that._filterData.endTime = data.endTime;
            };
            $(that.element).find('.time-combination').m_filter_timeGroup(option,true);
        }
        //渲染list
        ,renderContent:function () {
            var that = this;

            var option = {};
            option.param = {};
            option.param = filterParam(that._filterData);

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_getExpensesDetailLedger,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._dataInfo = response.data;

                    var html = template('m_finance_confirm/m_approval_payment_list',{
                        dataList:response.data.data,
                        pageIndex:$("#data-pagination-container").pagination('getPageIndex')
                    });
                    $(that.element).find('.data-list-container').html(html);

                    that.bindActionClick();


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //按钮事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){


                    case 'refreshBtn':
                        that.refreshPage();
                        return false;
                        break;



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
