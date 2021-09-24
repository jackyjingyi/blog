/**
 * 收支总览-分类统计
 * Created by wrb on 2017/11/30.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_payments_statistics",
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
        this._companyList = [];
        this._companyIdList = [];
        this._selectedOrg = null;//当前组织筛选-选中组织对象
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {

            var that = this;
            var html = template('m_payments/m_payments_statistics',{});
            $(that.element).html(html);
            var option = {};
            option.selectedCallBack = function (data) {
                that._selectedOrg = data;
                that.renderCategoryTypeList();
            };
            option.renderCallBack = function () {
                that.bindSetTime();
                that.bindRefreshBtn();
            };
            option.param = {
                permissionCode:'400013'
            };
            $(that.element).find('#selectOrg').m_org_chose_byTree(option,true);

        }
        //初始ICheck
        , initItemICheck:function () {
            var that = this;
            var ifChecked = function (e) {
                var dataId = $(this).attr('data-id');
                var dataPid = $(this).attr('data-pid');

                if(dataPid==''){//根目录
                    $(that.element).find('input[name="itemCk"][data-pid="'+dataId+'"]').prop('checked',true);
                    $(that.element).find('input[name="itemCk"][data-pid="'+dataId+'"]').iCheck('update');

                }else{
                    var childLen = $(that.element).find('input[name="itemCk"][data-pid="'+dataPid+'"]').length;
                    var childCheckedLen = $(that.element).find('input[name="itemCk"][data-pid="'+dataPid+'"]:checked').length;
                    if(childLen==childCheckedLen){
                        $(that.element).find('input[name="itemCk"][data-id="'+dataPid+'"]').prop('checked',true);
                        $(that.element).find('input[name="itemCk"][data-id="'+dataPid+'"]').iCheck('update');
                    }else{
                        $(that.element).find('input[name="itemCk"][data-id="'+dataPid+'"]').prop('checked',false);
                        $(that.element).find('input[name="itemCk"][data-id="'+dataPid+'"]').iCheck('update');
                    }
                }
                that.renderBarChart();
            };
            var ifUnchecked = function (e) {
                var dataId = $(this).attr('data-id');
                var dataPid = $(this).attr('data-pid');

                if(dataPid==''){//根目录
                    $(that.element).find('input[name="itemCk"][data-pid="'+dataId+'"]').prop('checked',false);
                    $(that.element).find('input[name="itemCk"][data-pid="'+dataId+'"]').iCheck('update');
                }else{

                    $(that.element).find('input[name="itemCk"][data-id="'+dataPid+'"]').prop('checked',false);
                    $(that.element).find('input[name="itemCk"][data-id="'+dataPid+'"]').iCheck('update');
                }
                that.renderBarChart();
            };
            $(that.element).find('input[name="itemCk"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //初始化分类统计范围
        ,renderCategoryTypeList:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getCategoryTypeList;
            option.postData = {};
            option.postData.companyId = that._selectedOrg.id;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    var html = template('m_payments/m_payments_statistics_categoryType',{
                        categoryTypeList:response.data
                    });
                    $(that.element).find('#categoryTypeBox').html(html);
                    that.initItemICheck();
                    that.renderBarChart();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //请求barChart数据
        ,renderBarChart:function () {
            var that = this;

            var option = {};
            option.url = restApi.url_getStatisticClassicData;

            option.postData={};
            if(that._selectedOrg==null){
                option.postData.combineCompanyId=that._companyList.id;
            }else{
                option.postData.combineCompanyId=that._selectedOrg.id;
            }

            if($(that.element).find('a[data-action="setTime"][data-type="month"]').hasClass('btn-primary')){
                option.postData.groupByTime = 1;
            }else{
                option.postData.groupByTime = 2;
            }
            option.postData.startDateStr=$(that.element).find('input[name="timeStart"]').val();
            option.postData.endDateStr=$(that.element).find('input[name="timeEnd"]').val();
            option.postData.feeTypeList  = [];
            $(that.element).find('input[name="itemCk"]:checked').each(function () {
                option.postData.feeTypeList .push($(this).attr('data-value'));
            });
           
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(response.data!=null){

                        var html = template('m_payments/m_payments_statistics_barChart',{});
                        $(that.element).find('#barChartBox').html(html);

                        var startDateStr = response.data.startDateStr;
                        var endDateStr = response.data.endDateStr;
                        if(startDateStr!=null && startDateStr!=''){
                            if(startDateStr.length>7){
                                startDateStr = startDateStr.substring(0,7);
                            }
                            $(that.element).find('input[name="timeStart"]').val(startDateStr);
                        }
                        if(endDateStr!=null && endDateStr!=''){
                            if(endDateStr.length>7){
                                endDateStr = endDateStr.substring(0,7);
                            }
                            $(that.element).find('input[name="timeEnd"]').val(endDateStr);
                        }

                        if(response.data.columnarDataForTimeGroup!=null){
                            that.renderBarChartItem(response.data.columnarDataForTimeGroup,'barChart1');
                        }
                        if(response.data.columnarDataForOrgGroup!=null){
                            that.renderBarChartItem(response.data.columnarDataForOrgGroup,'barChart2');
                        }
                    }
                } else {
                    S_layer.error(response.info);
                }
            });


        }
        //生成barChart
        ,renderBarChartItem:function (barData,id) {
            var that = this;

            var seriesArr = [];
            var legendArr = [];
            var colorArr = [];

            if(barData.datasets && barData.datasets.length>0){
                $.each(barData.datasets,function (i,item) {
                    seriesArr.push({
                        name:item.label,
                        type:'bar',
                        data:item.data
                    });
                    legendArr.push(item.label);
                    colorArr.push(item.backgroundColor);
                })
            }

            var option = {
                tooltip : {
                    trigger: 'axis',
                    axisPointer : {            // 坐标轴指示器，坐标轴触发有效
                        type : 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                    },
                    formatter: function (params) {
                        var tar;
                        if (params[1].value != '-') {
                            tar = params[1].name;
                        }
                        else {
                            tar = params[0].name;
                        }
                        tar += '<br/>';
                        for(var i=0;i<params.length;i++){
                            tar += params[i].seriesName + ' : ' + expNumberFilter(params[i].value)+'<br/>';
                        }
                        return tar;
                    }
                },
                legend: {
                    data:legendArr
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis : [
                    {
                        type : 'category',
                        data : barData.labels
                    }
                ],
                yAxis : [
                    {
                        type : 'value'
                    }
                ],
                color: colorArr,
                series : seriesArr
            };
            echarts.init(document.getElementById(id)).setOption(option);

        }
        //快捷时间
        , bindSetTime: function () {
            var that = this;
            $(that.element).find('a[data-action="setTime"]').off('click').on('click',function () {
                var dataType = $(this).attr('data-type');

                $(this).addClass('btn-primary').removeClass('btn-default').siblings().addClass('btn-default').removeClass('btn-primary');

                $(that.element).find('input[name="timeStart"]').val('');
                $(that.element).find('input[name="timeEnd"]').val('');
                if(dataType=='month'){
                    $(that.element).find('input[name="timeStart"]').attr('placeholder','开始月份');
                    $(that.element).find('input[name="timeEnd"]').attr('placeholder','结束月份');
                }else{
                    $(that.element).find('input[name="timeStart"]').attr('placeholder','开始年份');
                    $(that.element).find('input[name="timeEnd"]').attr('placeholder','结束年份');
                }
            });
            $(that.element).find('input[name="timeStart"]').off('click').on('click',function () {

                var dataType = $(that.element).find('a.btn-primary[data-action="setTime"]').attr('data-type');
                var fomartStr = 'yyyy-MM';
                if(dataType=='month'){
                    fomartStr = 'yyyy-MM';
                }else{
                    fomartStr = 'yyyy';
                }
                var endTime = $(that.element).find('input[name="timeEnd"]').val();
                var onpicked =function(dp){

                    if(endTime==''){//没有结束时间，弹出结束时间弹窗
                        $(that.element).find('input[name="timeEnd"]').click();
                    }else{
                        that.renderBarChart();
                    }
                };
                WdatePicker({el:this,dateFmt:fomartStr,maxDate:endTime,onpicked:onpicked})
            });
            $(that.element).find('input[name="timeEnd"]').off('click').on('click',function () {

                var dataType = $(that.element).find('a.btn-primary[data-action="setTime"]').attr('data-type');
                var fomartStr = 'yyyy-MM';
                if(dataType=='month'){
                    fomartStr = 'yyyy-MM';
                }else{
                    fomartStr = 'yyyy';
                }
                var startTime = $(that.element).find('input[name="timeStart"]').val();
                var onpicked =function(dp){
                    if(startTime==''){//没有开始时间，弹出开始时间弹窗
                        $(that.element).find('input[name="timeStart"]').click();
                    }else{
                        that.renderBarChart();
                    }
                };
                WdatePicker({el:this,dateFmt:fomartStr,minDate:startTime,onpicked:onpicked})
            });
        }
        //金额单位切换
        , bindSwitchAmountUnit:function () {
            var that = this;
            $(that.element).find('a[data-action="amountUnit"]').off('click').on('click',function () {
                $(this).addClass('text-info').siblings('a').removeClass('text-info');
                that.renderBarChart();
            });
        }
        , bindRefreshBtn:function () {
            var that = this;
            $(that.element).find('button[data-action="refreshBtn"]').on("click", function (e) {

                that.init();
                return false;
            })
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
