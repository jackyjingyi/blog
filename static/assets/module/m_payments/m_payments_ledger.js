/**
 * 收支总览－收支明细-台账
 * Created by wrb on 2017/11/30.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_payments_ledger",
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
        this._feeTypeNameList  = [];
        this._feeTypeParentNameList  = [];
        this._feeList = [];
        this._dataInfo = null;
        this._ledgerSumInfo = null;//基础数据

        this._filterData = {
            combineCompanyId:null,
            companyIdList:null,
            classicType:1,
            startDate:null,
            endDate:null,
            feeColList:null,
            feeType:null,
            projectName:null,
            feeTypeList:[],
            feeTypeParentList:[],
            fromCompanyName:null,
            toCompanyName:null
        };
        this._managerCompanyIds = null;//组织树请求返回的数据(extendData)
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        }
        //初始化数据并加载模板
        ,renderPage:function () {
            var that = this;
            var html = template('m_payments/m_payments_ledger',{});
            $(that.element).html(html);
            rolesControl();

            $(that.element).find('#filterBox').m_payments_ledger_filter({
                doType:1,
                filterData:that._filterData,
                treeRenderCallBack:function (extendData) {
                    that._managerCompanyIds = extendData && extendData.managerCompanyIds?extendData.managerCompanyIds:'';
                },
                renderDataCallBack:function (data,postData) {
                    that._filterData = data;
                    that._feeList = postData.feeList;
                    that.getExpensesDetailLedgerSum(function () {
                        that.renderDataList(0);
                    });

                    //扎账与账期权限控制
                    var tree = $('#orgTreeH').jstree(true), sel = tree.get_node(that._filterData.selectOrgId);
                    if(that._managerCompanyIds.indexOf(that._filterData.selectOrgId)>-1 && sel.original.treeEntity.orgType==0){
                        $(that.element).find('button[data-action="balancePoint"]').show();
                    }else{
                        $(that.element).find('button[data-action="balancePoint"]').hide();
                    }
                },
                searchCallBack:function (data) {
                    that._filterData = data;
                    that.getExpensesDetailLedgerSum(function () {
                        that.renderDataList();
                    });

                },
                refreshBtnCallBack:function (data) {
                    that.refreshPage();
                }
            });
        }
        //刷新界面
        ,refreshPage:function () {
            this._filterData = {
                combineCompanyId:null,
                startDate:null,
                endDate:null,
                profitType:null,
                feeType:null,
                projectName:null,
                feeTypeList:[],
                feeTypeParentList:[],
                fromCompanyName:null,
                toCompanyName:null
            };
            this.renderPage(0);
        }
        //渲染台账list(t==0=第一次渲染)
        ,renderDataList:function (t) {
            var that = this;

            var option = {};
            option.param = {};
            option.param = that._ledgerSumInfo.param;//filterParam(that._filterData);

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_getExpensesDetailLedger,
                params: filterParam(option.param)
            }, function (response) {

                if (response.code == '0') {

                    that._dataInfo = response.data;


                    var html = template('m_payments/m_payments_ledger_list',{
                        dataList:response.data.data,
                        changeList:that._ledgerSumInfo.changeList,
                        summary:that._ledgerSumInfo.StatisticDetailSummaryDTO
                    });
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('#totalBySearch').html(response.data.total);

                    //第一次重新渲染默认筛选
                    if(t==0) {
                        $(that.element).find('#timeSelect').m_filter_time_new('setTime',{
                            startTime:that._ledgerSumInfo.startDateStr,
                            endTime:that._ledgerSumInfo.endDateStr,
                            isChange:0
                        });
                        $(that.element).find('#filterBox').m_payments_ledger_filter('renderFilterResult');
                    }

                    that.filterActionClick();
                    that.bindBtnActionClick();
                    that.bindTrActionClick();
                    $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //请求基础数据
        ,getExpensesDetailLedgerSum:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_getExpensesDetailLedgerSum;
            option.postData = filterParam(that._filterData);
            option.postData.isMyData = 0;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._ledgerSumInfo = response.data;
                    if(callBack)
                        callBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //按钮事件绑定
        ,bindBtnActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){

                    case 'exportDetails'://导出

                        var data = $.extend(true, {}, that._filterData);
                        data.combineCompanyId = data.selectOrgId;
                        data.startDateStr = data.startDate;
                        data.endDateStr = data.endDate;
                        data.startDate = null;
                        data.endDate = null;
                        downLoadFile({
                            url:restApi.url_exportBalanceDetail,
                            data:filterParam(data),
                            type:1
                        });
                        return false;
                        break;

                    case 'viewSumBalanceChangeList'://查看余额变更记录
                        $('body').m_finance_basic_settings_change_record({
                            dataList:that._ledgerSumInfo.changeList
                        },true);
                        return false;
                        break;

                    case 'balancePoint':

                        $('body').m_payments_ledger_balance_point({
                            companyId:that._filterData.selectOrgId
                        });
                        return false;
                        break;
                }
            });
        }
        //筛选事件
        ,filterActionClick:function () {
            var that = this;
            $(that.element).find('a.icon-filter').each(function () {

                var $this = $(this);
                var id = $this.attr('id');
                var filterArr = id.split('_');
                switch (id){
                    case 'filter_profitType':

                        var newList = [];
                        if(that._feeList!=null && that._feeList.length>0){
                            $.each(that._feeList,function (i,item) {
                                var childList = [];
                                if(item.childList!=null && item.childList.length>0){
                                    $.each(item.childList,function (subI,subItem) {
                                        childList.push({id:subItem.expTypeKey,name:subItem.expTypeValue});
                                    });
                                }
                                newList.push({id:item.expTypeKey,name:item.expTypeValue,childList:childList});
                            });
                            var option = {};
                            option.selectArr = newList;
                            option.selectedArr = that._filterData.feeColList;
                            option.eleId = id;
                            option.isParentCheck = true;
                            option.colClass = 'new-item';
                            option.selectedCallBack = function (data) {
                                that._filterData.feeColList = data;
                                that.getExpensesDetailLedgerSum(function () {
                                    that.renderDataList();
                                });
                            };
                            $this.m_filter_checkbox_select(option, true);
                        }

                        break;
                    case 'filter_toCompanyName'://收款组织
                    case 'filter_fromCompanyName'://付款组织

                        var newList = [],list=[],selectStr='';

                        if(id=='filter_fromCompanyName'){

                            list = that._ledgerSumInfo.organization.fromCompany;

                        }else if(id=='filter_toCompanyName'){

                            list = that._ledgerSumInfo.organization.toCompany;

                        }
                        selectStr = that._filterData[filterArr[1]];

                        if(list!=null && list.length>0){
                            $.each(list,function (i,item) {
                                newList.push({id:item.companyName,name:item.companyName});
                            })
                        }

                        var option = {};
                        option.selectArr = newList;
                        option.selectedArr = [];
                        if(!isNullOrBlank(selectStr))
                            option.selectedArr.push(selectStr);

                        option.eleId = id;
                        option.selectedCallBack = function (data) {
                            if(data && data.length>0){
                                that._filterData[filterArr[1]] = data[0];
                            }else{
                                that._filterData[filterArr[1]] = null;
                            }
                            that.getExpensesDetailLedgerSum(function () {
                                that.renderDataList();
                            });
                        };
                        $this.m_filter_select(option, true);

                        break;
                    case 'filter_projectName': //项目

                        var option = {};

                        option.inputValue = that._filterData[filterArr[1]];
                        option.eleId = id;
                        option.oKCallBack = function (data) {

                            that._filterData[filterArr[1]] = data;
                            that.getExpensesDetailLedgerSum(function () {
                                that.renderDataList();
                            });
                        };
                        $this.m_filter_input(option, true);

                        break;

                }

            });
        }
        //行事件
        ,bindTrActionClick:function () {
            var that = this;
            $(that.element).find('tr[data-id]').off('click').on('click',function () {
                var id = $(this).attr('data-id'),i = $(this).attr('data-i');

                if(!that._dataInfo || !that._dataInfo.data)
                    return;

                var dataItem = that._dataInfo.data[i];

                if(dataItem.feeType==1 || dataItem.feeType==2 || dataItem.feeType==3 || dataItem.feeType==4 || dataItem.feeType==7 || dataItem.feeType==8){//收付款详情

                    $('body').m_payments_ledger_details({
                        dataInfo:dataItem
                    },true);

                }else if(dataItem.feeType==5 || dataItem.feeType==6){//旧固定表单的报销，和费用详情

                    $('body').m_approval_cost_details({
                        doType:dataItem.feeType==5?1:2,
                        id:dataItem.targetId,
                        saveCallBack:function () {
                            
                        }
                    },true);

                }else if(dataItem.feeType==9){//动态表单的详情
                    
                    $('body').m_form_template_generate_details({
                        dataInfo:{id:dataItem.targetId},
                        saveCallBack:function () {
                            
                        }
                    },true);
                }




            });
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
