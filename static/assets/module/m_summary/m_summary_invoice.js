/**
 * 项目－发票汇总
 * Created by wrb on 2018/8/8.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_summary_invoice",
        defaults = {
            doType:1,//1=发票汇总，2=确认开票
            status:1//status = 0：待开票，status = 1：已开票
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID
        this._currentCompanyUserId = window.currentCompanyUserId;//当前员工ID
        this._dataList = [];//分页数据
        this._extendDataBySelectOrg = null;//组织树请求返回的数据(extendData)
        this._selectedOrg = null;
        this._isDetailView = false;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_summary/m_summary_invoice',{});
            var cHtml = template('m_summary/m_summary_invoice_content',{doType:that.settings.doType});

            if(that.settings.doType==2){

                $(that.element).html(cHtml);

            }else{
                $(that.element).html(html);
                $(that.element).find('.ibox-content').html(cHtml);

            }

            that._filterData = {
                status:that.settings.status
            };
            that.renderOrgTree();
            that.renderTimeSelectControl();
            that.bindActionClick();
        }

        //渲染组织树选择
        ,renderOrgTree:function () {
            var that = this;
            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:1,
                selectedId:that._currentCompanyId,
                param : {
                    permissionCode:'40001902',
                    managerPermissionCode:'40000104'
                },
                selectedCallBack:function (data,childIdList) {

                    that._selectedOrg = data;
                    that._filterData.companyIdList = childIdList;

                    that.renderListHeader();
                },
                renderCallBack : function (extendData) {
                    that._extendDataBySelectOrg = extendData;
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
                that.renderListContent();
            };
            $(that.element).find('.time-combination').m_filter_timeGroup(option,true);
        }
        //渲染列表头部
        ,renderListHeader:function () {
            var that = this;
            var option = {};
            option.type = 2;
            option.renderCallBack = function (data) {
                that._headerList = data;
                that.renderListContent();
            };
            option.filterCallBack = function (data) {
                //that._filterData = data;
                that._filterData = $.extend({},that._filterData,data);
                that.renderListContent();
            };
            $(that.element).find('.data-list-container table thead').m_field_list_header(option,true);
        }
        /**
         * 渲染list
         * @param t t==1刷新当前页
         */
        ,renderListContent:function (t) {
            var that = this;
            var option = {};
            option.url = restApi.url_listInvoice;
            option.headerList = that._headerList;
            option.trClass = 'curp';
            option.param = that._filterData;

            var buttonMap = new Map();
            buttonMap.set('invoiceNo','确认开票_myTaskStatus');
            option.buttonMap = buttonMap;
            if(t==1)
                option.isRefreshCurrentPage = true;

            option.renderCallBack = function (data) {
                that._dataList = data.data;
                that.renderStatisticalAmount();
                that.bindListActionClick();

                //确认发票按钮判断
                if(that.settings.doType==2 && !(that._extendDataBySelectOrg.managerCompanyIds && that._extendDataBySelectOrg.managerCompanyIds.indexOf(that._selectedOrg.id)>-1)){
                    that._isDetailView = true;
                    $(that.element).find('.data-list-container table tbody button').addClass('hide').off('click');
                }
                //已作废的发票，是需要标注为红色的
                if(data && data.data){
                    $.each(data.data,function (i,item) {
                        if(item.invoiceStatus==2){
                            $(that.element).find('table tbody tr[data-id="'+item.id+'"]').addClass('fc-red');
                        }
                    });
                }

                var $td =$(that.element).find('td[data-code="invoiceContent"]');
                if($td.length>0){
                    $td.addClass('max-width-v1');
                    $td.find('span').addClass('text-ellipsis-2 text-wrap');
                }

            };
            $(that.element).find('.data-list-container table tbody').m_field_list_row(option,true);
        }
        //按钮事件绑定
        ,bindListActionClick:function () {
            var that = this;
            $(that.element).find('.data-list-container button[data-action]').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var dataId = $this.closest('tr').attr('data-id');//当前元素赋予的ID
                //获取节点数据
                var dataItem = getObjectInArray(that._dataList,dataId);
                switch (dataAction){

                    case 'invoiceNo_myTaskStatus'://确认开票
                        var option = {};
                        option.invoiceId = dataId;
                        option.taskId = dataItem.myTaskId;
                        option.projectId = dataItem.projectId;
                        option.dialogHeight = '100';
                        option.saveCallBack = function () {
                            that.renderListContent(1);
                        };
                        $('body').m_cost_confirmInvoice(option,true);
                        return false;
                        break;
                }
            });
            //行点击事件
            $(that.element).find('tr[data-id]').off('click').on('click',function () {
                var i = $(this).attr('data-i'),id = $(this).attr('data-id');
                if(that._dataList==null || that._dataList.length==0)
                    return;

                var dataItem = that._dataList[i];
                $('body').m_summary_invoice_details({
                    dataInfo:dataItem,
                    isView: that._isDetailView,
                    saveCallBack:function () {
                        that.renderListContent(1);
                    }
                },true);

            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('form button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){

                    case 'refreshBtn'://刷新
                        that.init();
                        return false;
                        break;
                    case 'setField'://设置字段
                        var option = {};
                        option.type = 2;
                        option.dialogMinHeight = '250';
                        option.saveCallBack = function () {
                            that.renderListHeader();
                        };
                        $('body').m_field_settings(option,true);
                        return false;
                        break;
                }
            });
        }
        //渲染统计金额
        ,renderStatisticalAmount:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getSumInvoice;
            option.postData = that._filterData;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var html = template('m_summary/m_summary_invoice_amount',response.data);

                    if($(that.element).find('#totalAmount').length>0)
                        $(that.element).find('#totalAmount').remove();

                    $(that.element).find('.data-list-container table').after(html);

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
