/**
 * 收支总览－收支明细-台账
 * Created by wrb on 2017/11/30.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_payments_ledger4",
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
        this._fromCompanyList  = [];
        this._toCompanyList  = [];
        this._dataInfo = null;

        this._filterTimeData = {};//时间筛选
        this._filterData = {
            combineCompanyId:null,
            companyIdList:null,
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
            var html = template('m_payments/m_payments_ledger4',{});
            $(that.element).html(html);
            rolesControl();
            $(that.element).find('#filterBox').m_payments_ledger_filter({
                doType:2,
                filterData:that._filterData,
                renderDataCallBack:function (data) {
                    that._filterData = data;
                    that.renderDataList(0);
                },
                searchCallBack:function (data) {
                    that._filterData = data;
                    that.renderDataList();
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
                classicType:1,
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
        //渲染台账list
        , renderDataList:function (t) {
            var that = this;
            var option = {};
            option.url = restApi.url_listClassicCompanyBill4;
            option.postData = {};
            option.postData = filterParam(that._filterData);

            if(!isNullOrBlank(that._filterData.startDate)){
                option.postData.year = that._filterData.startDate.substring(0,4);
            }

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo = response.data;
                    var html = template('m_payments/m_payments_ledger4_list', that._dataInfo);
                    $(that.element).find('.data-list-container').html(html);

                    $(that.element).find('#totalBySearch').html(response.data.list.length-1);
                    that.bindBtnActionClick();

                    if(that._dataInfo!=null){
                        var leftColumns = 1;
                        var isLeftColumnsTwo = (that._dataInfo.all && that._dataInfo.all.list && that._dataInfo.all.list.length>0)?true:false;
                        if(isLeftColumnsTwo){
                            leftColumns = 2;
                        }
                        var formHeight = $(that.element).find('.form-horizontal').height();
                        var windowHeight = $(window).height();
                        var topHeight = $('.navbar.m-top').height();
                        var ledgerHeight = windowHeight-topHeight-formHeight-50-80;
                        if(ledgerHeight<=0)
                            ledgerHeight = 300;

                        $('#ledger4_list').DataTable( {
                            scrollY:        ledgerHeight,
                            scrollX:        true,
                            scrollCollapse: true,
                            paging:         false,
                            /*fixedColumns:   true,*/
                            fixedColumns: {
                                leftColumns: leftColumns
                            },
                            createdRow: function( row, data, dataIndex ) {

                                //console.log(row);
                                if(isLeftColumnsTwo){
                                    if(dataIndex==0){
                                        $(row).children().eq(0).html(data[1]).attr('colspan',2);
                                        $(row).children().eq(1).hide();
                                    }else if(dataIndex==1){
                                        $(row).children().eq(0).attr("rowspan",$(row).children().eq(0).attr('data-rowspan'));
                                    }else{
                                        $(row).children().eq(0).hide();
                                    }
                                }
                            },
                            initComplete: function( settings ) {
                                //console.log(settings);
                                if(isLeftColumnsTwo) {
                                    var t = setTimeout(function () {
                                        $('.DTFC_LeftWrapper table th.sorting_disabled').eq(0).attr('colspan', 2);
                                        $('.DTFC_LeftWrapper table th.sorting_disabled').eq(1).hide();
                                        clearTimeout(t);
                                    }, 500);
                                }

                            },
                            ordering:       false,
                            searching:      false,
                            info:           false
                        });
                    }

                    if(t==0){
                        $(that.element).find('#filterBox').m_payments_ledger_filter('renderFilterResult');
                    }

                } else {
                    S_layer.error(response.info);
                }
            });
        }

        //按钮事件绑定
        ,bindBtnActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'exportDetails'://导出

                        var data = $.extend(true, {}, that._filterData);
                        data.combineCompanyId = that._filterData.selectOrgId;
                        data.startDateStr = data.startDate;
                        data.endDateStr = data.endDate;
                        data.startDate = null;
                        data.endDate = null;
                        if(!isNullOrBlank(data.startDateStr)){
                            data.year = data.startDateStr.substring(0,4);
                        }
                        downLoadFile({
                            url:restApi.url_exportBalanceDetail4,
                            data:filterParam(data),
                            type:1
                        });
                        return false;
                        break;
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
