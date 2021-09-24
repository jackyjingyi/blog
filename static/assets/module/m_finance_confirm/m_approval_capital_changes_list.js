/**
 * 收支确认－费用收付款
 * Created by wrb on 2020/4/26.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_capital_changes_list",
        defaults = {
            doType:1,//doType==1 收支确认, doType==2 审批列表， doType==3 审批报表
            filterData:{},
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._filterData = this.settings.filterData;//筛选参数

        this._amountTotal = null;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            if($(that.element).find('.data-list-container').length==0){
                $(that.element).html('<div class="data-list-box"><div class="data-list-container"></div>' +
                    '<div class="p-w-xs"><div id="data-pagination-container" class="m-pagination pull-right "></div></div></div>');
            }
            that.renderContent();
        }
        //渲染list(t=1，刷新当前页)
        ,renderContent:function (t) {
            var that = this;

            var option = {};
            option.param = {};
            if(t==1)
                that._filterData.pageIndex=that._pageIndex;
            option.param = filterParam(that._filterData);
            //option.param.type = 'singleFundChange';

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_listSingleFundChange,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._dataInfo = response.data;
                    that._pageIndex = $("#data-pagination-container").pagination('getPageIndex');

                    var html = template('m_finance_confirm/m_approval_capital_changes_list',{
                        doType:that.settings.doType,
                        currentCompanyUserId:window.currentCompanyUserId,
                        dataList:response.data.data,
                        pageIndex:that._pageIndex
                    });
                    $(that.element).find('.data-list-container').html(html);
                    that.bindActionClick();
                    that.bindTrClick();
                    that.filterActionClick();
                    that.sortActionClick();


                    if(that.settings.renderCallBack)
                        that.settings.renderCallBack(that._filterData,response.data);

                } else {
                    S_layer.error(response.info);
                }
            });
            that.renderSumExpApply();

        }
        ,bindTrClick:function () {
            var that = this;

            $(that.element).find('tbody tr[data-id]').off('click').on('click',function (e) {
                if($(e.target).hasClass('btn')||$(e.target).closest('button').length>0) {return false;}
                var $this = $(this);
                var dataId = $this.attr('data-id');
                $('body').m_form_template_generate_details({
                    isDialog:true,
                    dataInfo : {id:dataId},
                    saveCallBack : function () {
                        that.renderContent(1);
                    }
                },true);

            });
        }
        //按钮事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').on('click',function (e) {
                var $this = $(this),dataId = $this.closest('tr').attr('data-id');
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'agreeToGrant'://拨款
                        var url = restApi.url_financialAllocationForExpApply;
                        var id = $this.attr('data-id');
                        that.saveFinanceConfirm(url,id,e,that);
                        return false;
                        break;
                    case 'sendBack'://退回
                        S_layer.dialog({
                            title: '退回原因',
                            area : ['300px','200px'],
                            content:'<form class="sendBackForm m"><div class=" m-t-md col-md-12 "><textarea class="form-control" name="sendBackReason"></textarea></div></form>',
                            cancel:function () {
                            },
                            ok:function () {

                                if ($('form.sendBackForm').valid()) {

                                    var sendBackReason = $('form.sendBackForm textarea[name="sendBackReason"]').val();
                                    var option  = {};
                                    option.url = restApi.url_financialRecallExpMain;
                                    option.postData = {
                                        id:$this.attr('data-id'),
                                        reason:sendBackReason
                                    };
                                    m_ajax.postJson(option,function (response) {
                                        if(response.code=='0'){
                                            S_toastr.success('操作成功');
                                            that.renderContent(1);
                                        }else {
                                            S_layer.error(response.info);
                                        }
                                    });

                                } else {
                                    return false;
                                }
                            }

                        },function(layero,index,dialogEle){//加载html后触发
                            that.saveSendBack_validate();
                        });
                        e.stopPropagation();
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
                    case 'filter_expNo': //项目编号
                    case 'filter_submitUserName': //

                        var option = {};
                        option.inputValue = that._filterData[filterArr[1]];
                        option.eleId = id;
                        option.oKCallBack = function (data) {

                            that._filterData[filterArr[1]] = data;
                            that.renderContent();
                        };
                        $this.m_filter_input(option, true);

                        break;

                }

            });
        }
        //排序
        ,sortActionClick:function () {
            var that = this;
            $(that.element).find('th[data-action="sort"]').each(function () {
                var $this = $(this),code = $this.attr('data-code');
                code = code+'Order';
                var sortField = that._filterData[code];
                var sortClass = '';
                if(sortField=='0'){
                    sortClass = 'sorting_asc';
                }else if(sortField=='1'){
                    sortClass = 'sorting_desc';
                }else{
                    sortClass = 'sorting';
                }
                $this.removeClass('sorting_asc sorting_desc sorting').addClass(sortClass);
                $this.off('click').on('click',function (e) {

                    $(that.element).find('th[data-action="sort"]').each(function () {
                        var iCode =  $(this).attr('data-code') + 'Order';
                        if(code!=iCode){
                            that._filterData[iCode] = null;
                            $(this).removeClass().addClass('sorting');
                        }
                    });
                    if($this.hasClass('sorting')||$this.hasClass('sorting_asc')){
                        that._filterData[code] = '1';
                        sortClass = 'sorting_desc';
                    }
                    else if($this.hasClass('sorting_desc')){
                        that._filterData[code] = '0';
                        sortClass = 'sorting_asc';
                    }else{
                        sortClass = 'sorting';
                    }

                    $this.removeClass().addClass(sortClass);

                    that.renderContent();

                    e.stopPropagation();
                    return false;
                });
            });
        }
        //时间验证
        ,saveAgreeToGrant_validate: function () {
            var that = this;
            $('form.agreeToGrantForm').validate({
                rules: {
                    allocationDate: 'required'
                },
                messages: {
                    allocationDate: '请选择时间！'
                }
            });
        }
        //原因不为空验证
        ,saveSendBack_validate: function () {
            var that = this;
            $('form.sendBackForm').validate({
                rules: {
                    sendBackReason: 'required'
                },
                messages: {
                    sendBackReason: '请输入退回原因！'
                }
            });
        }
        ,saveFinanceConfirm:function (url,id,e,that) {
            var currDate = getNowDate();
            S_layer.dialog({
                title: '请选择时间',
                area : ['300px','165px'],
                content:'<form class="agreeToGrantForm m"><div class="form-group text-center col-md-12 "><input class="form-control" type="text" name="allocationDate" onclick="WdatePicker()" value="'+currDate+'" readonly></div></form>',
                cancel:function () {
                },
                ok:function () {
                    if ($('form.agreeToGrantForm').valid()) {
                        var financialDate = $('form.agreeToGrantForm input[name="allocationDate"]').val();
                        var option  = {};
                        option.url = url;
                        option.postData = {
                            id:id,
                            financialDate:financialDate
                        };
                        m_ajax.postJson(option,function (response) {
                            if(response.code=='0'){
                                S_toastr.success('操作成功');
                                that.renderContent(1);
                            }else {
                                S_layer.error(response.info);
                            }
                        });
                    } else {
                        return false;
                    }
                }
            },function(layero,index,dialogEle){//加载html后触发
                that.saveAgreeToGrant_validate();
            });
            e.stopPropagation();
        }
        //渲染总金额统计
        ,renderSumExpApply:function () {
            var that = this;


            var render = function (data) {

                if($(that.element).find('#totalAmount').length>0){
                    $(that.element).find('#totalAmount').remove();
                }
                var iHtml = '<div class="pt-absolute m-t-sm" id="totalAmount"><span>合计：</span><span class="fc-v1-green">'+expNumberFilter(data.sumExpAmount)+'</span> 元 &nbsp;&nbsp;' +
                    '<span>已确认：</span><span class="fc-v1-green">'+expNumberFilter(data.needReceiveAmount)+'</span> 元 &nbsp;&nbsp;' +
                    '<span>待确认：</span><span class="fc-v1-red">'+expNumberFilter(data.needAllocationAmount)+'</span> 元 &nbsp;&nbsp;</div>';

                $(that.element).find('.m-pagination').before(iHtml);
            };

            if(that._amountTotal){
                render(that._amountTotal);
            }else{
                var option = {};
                option.url = restApi.url_sumSingFundChange;
                option.postData = filterParam(that._filterData);
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        that._amountTotal = response.data;
                        render(that._amountTotal);

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }

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
