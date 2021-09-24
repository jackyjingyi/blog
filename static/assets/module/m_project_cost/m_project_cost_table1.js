/**
 * 项目收支明细-表一
 * Created by wrb on 2019/7/1.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_cost_table1",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._ledgerSumInfo = null;//基础数据
        this._dataInfo = null;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._filterData = {//筛选条件
                isMyData : 0
            };
            var html = template('m_project_cost/m_project_cost_table1',{});
            $(that.element).html(html);
            $(that.element).find('#timeSelect').m_filter_time_new({label:'日&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;期'},true);
            that.initSelect2ByOrgZone();
            that.initSelect2ByDeanName();
            that.getExpensesDetailLedgerSum(function () {
                that.renderDataList();
            });
        }
        //初始化select2
        ,initSelect2ByOrgZone:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listZone;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    var staffArr = [{id:'',text:'全部'}];
                    if(response.data!=null && response.data.length>0){
                        $.each(response.data, function (i, o) {
                            staffArr.push({
                                id: o.id,
                                text: o.orgName
                            });
                        });
                    }

                    var $select = $(that.element).find('select[name="orgId"]');
                    $select.select2({
                        //tags: true,
                        language: "zh-CN",
                        width:'200px',
                        minimumResultsForSearch: Infinity,
                        //placeholder: '请选择所属公司',
                        data: staffArr
                    });
                }else {
                    S_layer.error(response.info);
                }
            })

        }
        ,initSelect2ByDeanName:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listProjectDean;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    var staffArr = [{id:'',text:'全部'}];
                    if(response.data!=null && response.data.length>0){
                        $.each(response.data, function (i, o) {
                            staffArr.push({
                                id: o.companyUserId,
                                text: o.userName
                            });
                        });
                    }

                    var $select = $(that.element).find('select[name="deanName"]');
                    $select.select2({
                        //tags: true,
                        language: "zh-CN",
                        width:'200px',
                        minimumResultsForSearch: Infinity,
                        //placeholder: '请选择分管院长',
                        data: staffArr
                    });
                    //$select.val(that._currentCompanyId).trigger('change');

                }else {
                    S_layer.error(response.info);
                }
            })

        }
        //渲染台账list
        ,renderDataList:function (t) {
            var that = this;

            var option = {};
            option.param = {};
            option.param = that._filterData;

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_getProjectBillList,
                params: filterParam(option.param)
            }, function (response) {
                if (response.code == '0') {

                    var pageIndex = $(that.element).find("#data-pagination-container").pagination('getPageIndex');

                    that._dataInfo = response.data;
                    var dataList = response.data.data;
                    for (var i = 0; i <dataList.length ; i++) {
                        var data = dataList[i];

                        var  payList = [];
                        var payListCount = 0;
                        for (var j = 0; j < data.paymentList.length; j++) {

                            var listCount =  data.paymentList[j].list.length > 0 ? data.paymentList[j].list.length : 1;
                            var paymentData =  data.paymentList[j];
                            payList.push(data.paymentList[j].list);
                            paymentData.listCount =  listCount;
                            data.paymentList.splice(j,1,paymentData);
                            payListCount = payListCount +  listCount;
                        }
                        var processCount = data.proceedsList.length > 0 ? data.proceedsList.length : 1;
                        var paymentCount = data.paymentList.length > 0 ? data.paymentList.length : 1;

                        var maxCount = payListCount > processCount ? payListCount : processCount;
                        maxCount = paymentCount > maxCount ? paymentCount : maxCount;
                        data.maxCount = maxCount;
                        data.payListCount =  payListCount;
                        data.processCount =  processCount;
                        data.index = 10 * (pageIndex) + i +1;
                        data.paymentCount = paymentCount;
                        dataList.splice(i,1,data);
                    }

                    var html = template('m_project_cost/m_project_cost_table1_list',{
                        dataList:dataList,
                        summary:that._ledgerSumInfo.StatisticDetailSummaryDTO
                    });
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('#totalBySearch').html(response.data.total);

                    that.bindBtnActionClick();
                    // that.bindTrActionClick();
                    that.filterActionClick();
                    $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

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
                    case 'search':
                        that.renderFilterResult();
                        that.getExpensesDetailLedgerSum(function () {
                            that.renderDataList();
                        });
                        return false;
                        break;
                    case 'refreshBtn':
                        that.init();
                        return false;
                        break;
                    case 'exportDetails'://导出

                        var data = $.extend(true, {}, that._filterData);
                        //data.combineCompanyId = data.selectOrgId;
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
                        break;


                }
            });
        }
        //请求基础数据
        ,getExpensesDetailLedgerSum:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_getExpensesDetailLedgerSum;
            option.postData = filterParam(that._filterData);
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
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //分管院长
            var $deanName = $(that.element).find('select[name="deanName"] option:selected');
            that._filterData.deanId = $deanName.val();
            if(!isNullOrBlank($deanName.val())){
                resultList.push({
                    name:$deanName.text(),
                    type:1
                });
            }
            //所属公司
            var $orgId = $(that.element).find('select[name="orgId"] option:selected');
            that._filterData.zoneOrgId = $orgId.val();
            if(!isNullOrBlank($orgId.val())){
                resultList.push({
                    name:$orgId.text(),
                    type:2
                });
            }
            //时间
            var timeData = $(that.element).find('#timeSelect').m_filter_time_new('getTimeData');
            that._filterData.startDate = timeData.startTime;
            that._filterData.endDate = timeData.endTime;

            if(!isNullOrBlank(timeData.days)){
                resultList.push({
                    name:timeData.days,
                    type:3
                });
            }else if(!isNullOrBlank(that._filterData.startDate) || !isNullOrBlank(that._filterData.endDate)){
                resultList.push({
                    name:momentFormat(that._filterData.startDate,'YYYY/MM/DD')+'~'+momentFormat(that._filterData.endDate,'YYYY/MM/DD'),
                    type:3
                });
            }


            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//分管院长

                    $(that.element).find('select[name="deanName"]').val('').trigger('change');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==2){//所属公司

                    $(that.element).find('select[name="orgId"]').val('').trigger('change');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==3){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-action="search"]').click();

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
