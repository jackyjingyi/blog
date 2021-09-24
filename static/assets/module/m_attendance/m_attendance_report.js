/**
 * 考勤报表
 * Created by wrb on 2018/10/17.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_attendance_report",
        defaults = {
            type:0// 0上下班打卡, 1外出打卡
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._selectedOrg1 = null;//组织ID
        this._selectedOrg2 = null;//组织ID

        this._dataListByDay = null;//请求的数据
        this._dataListByMonth = null;//请求的数据

        this._pageIndexByMonth = 0;//记录页码
        this._paramByMonth = null;
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        , render: function (t) {
            var that = this;


            var endDate = getNowDate();
            var startDate = getPrevDateByDays(endDate,6);

            var html = template('m_attendance/m_attendance_report', {
                endDate:endDate,
                startDate:startDate,
                endMonth : moment().month(moment().month()).startOf('month').format('YYYY-MM'),
                startMonth : moment().month(moment().month() - 1).startOf('month').format('YYYY-MM')
            });
            $(that.element).html(html);



            //初始化组织选择组件
            $(that.element).find('#selectOrg1').m_org_chose_byTree({
                type : 8,
                selectedCallBack : function (data) {
                    that._selectedOrg1 = data;
                    that.renderDataListByDay();
                },
                renderCallBack:function () {
                }
            },true);

            var option = {};
            option.type = 8;
            option.selectedCallBack = function (data) {
                that._selectedOrg2 = data;
                that.renderDataListByMonth(t);
            };
            if(t==1){//详情返回
                option.selectedId = that._selectedOrg2.id;
                $(that.element).find('#tab-2 input[name="startDate"]').val(that._paramByMonth.startDate.substring(0,7));
                $(that.element).find('#tab-2 input[name="endDate"]').val(that._paramByMonth.endDate.substring(0,7))
                $(that.element).find('a[href="#tab-2"]').click();
            }
            $(that.element).find('#selectOrg2').m_org_chose_byTree(option,true);
            that.bindSelectTime();
            that.bindExportData();
        }
        //渲染打卡记录-按天
        , renderDataListByDay:function () {
            var that = this;

            var option = {};
            option.param = {};

            option.param.companyId = that._selectedOrg1.id;
            option.param.startDate= $(that.element).find('#tab-1 input[name="startDate"]').val();
            option.param.endDate= $(that.element).find('#tab-1 input[name="endDate"]').val();
            option.param.clockTypeFlag = that.settings.type;
            paginationFun({
                eleId: '#data-pagination-container-day',
                loadingId: '.data-list-box',
                url: restApi.url_attendanceStatementByDay,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._dataListByDay = response.data.data;
                    var html = template('m_attendance/m_attendance_report_list_day', {
                        dataList:response.data.data,
                        type:that.settings.type
                    });
                    $(that.element).find('#tab-1 .data-list-container').html(html);
                    that.bindTrClickByDay();
                    that.bindApprovalView();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染打卡记录-按月
        , renderDataListByMonth:function (t) {
            var that = this;

            var option = {};
            option.param = {};

            if(t==1)//详情返回
                option.param.pageIndex = that._pageIndexByMonth;

            option.param.companyId = that._selectedOrg2.id;
            option.param.startDate= $(that.element).find('#tab-2 input[name="startDate"]').val()+'-01';
            option.param.endDate= $(that.element).find('#tab-2 input[name="endDate"]').val()+'-31';
            option.param.clockTypeFlag = that.settings.type;

            paginationFun({
                eleId: '#data-pagination-container-month',
                loadingId: '.data-list-box',
                url: restApi.url_attendanceStatementByMonth,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._dataListByMonth = response.data.data;

                    var html = template('m_attendance/m_attendance_report_list_month', {
                        dataList:response.data.data,
                        type:that.settings.type
                    });
                    $(that.element).find('#tab-2 .data-list-container').html(html);
                    that._pageIndexByMonth = $("#data-pagination-container-month").pagination('getPageIndex');
                    that._paramByMonth = option.param;
                    that.bindTrClickByMonth();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //时间绑定事件
        , bindSelectTime:function () {
            var that = this;
            $(that.element).find('input[name="startDate"]').off('click').on('click',function () {

                var $this = $(this),tabId = $this.closest('.tab-pane').attr('id');
                var endDate = $this.closest('.panel-body').find('input[name="endDate"]').val();
                var onpicked =function(dp){

                    if(tabId=='tab-1'){
                        that.renderDataListByDay();
                    }else{
                        that.renderDataListByMonth();
                    }

                };
                var dateFmt = tabId=='tab-1'?'yyyy-MM-dd':'yyyy-MM';
                WdatePicker({el:this,dateFmt:dateFmt,maxDate:endDate,onpicked:onpicked,isShowClear:false});
            });
            $(that.element).find('input[name="endDate"]').off('click').on('click',function () {

                var $this = $(this),tabId = $this.closest('.tab-pane').attr('id');
                var startDate = $this.closest('.panel-body').find('input[name="startDate"]').val();
                var onpicked =function(dp){

                    if(tabId=='tab-1'){
                        that.renderDataListByDay();
                    }else{
                        that.renderDataListByMonth();
                    }

                };
                var dateFmt = tabId=='tab-1'?'yyyy-MM-dd':'yyyy-MM';
                WdatePicker({el:this,dateFmt:dateFmt,minDate:startDate,onpicked:onpicked,isShowClear:false});
            });
            $(that.element).find('i.fa-calendar').off('click').on('click',function () {
                $(this).closest('.input-group').find('input').click();
            });


        }
        //绑定TR事件-详情
        , bindTrClickByDay:function ($ele,dataList,orgId) {
            var that = this;
            if($ele==null)
                $ele = $(that.element).find('#tab-1 tbody tr');

            if(dataList==null)
                dataList = that._dataListByDay;

            if(orgId==null)
                orgId = $ele.attr('data-company-id');//that._selectedOrg1.id;

            $ele.off('click').on('click',function () {

                var $this = $(this);
                var index = $this.closest('tr').attr('data-i');

                if(index==undefined)
                    return false;

                var dataItem = dataList[index];

                $('body').m_attendance_punch_record({
                    param : {
                        companyId : orgId,
                        companyUserId : dataItem.companyUserId,
                        clockTypeFlag : that.settings.type,
                        workDate : dataItem.workDate
                    },
                    dataInfo : dataItem
                },true);
            });
        }
        //绑定TR事件-详情
        , bindTrClickByMonth:function () {
            var that = this;
            $(that.element).find('#tab-2 tbody tr').off('click').on('click',function () {

                var $this = $(this);
                var index = $this.closest('tr').attr('data-i');
                var dataItem = that._dataListByMonth[index];
                var option = {};
                option.url = restApi.url_attendanceStatementByMonthDetail;
                option.postData = {
                    companyId : that._selectedOrg2.id,
                    workDate : dataItem.workDate,
                    companyUserId : dataItem.companyUserId,
                    clockTypeFlag : that.settings.type
                };
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        var html = template('m_attendance/m_attendance_report_list_day', {
                            dataList:response.data.data,
                            dataInfo:dataItem,
                            type:that.settings.type
                        });
                        $(that.element).html(html);
                        that.bindTrClickByDay($(that.element).find('tbody tr'),response.data.data,dataItem.companyId);
                        that.bindApprovalView();
                        $(that.element).find('a[data-action="backToReportByMonth"]').on('click',function () {
                            that.render(1);
                        });
                        that.bindExportData(option.postData);

                    } else {
                        S_layer.error(response.info);
                    }
                });


            });
        }
        //绑定导出
        , bindExportData:function (filterData) {
            var that = this;
            $(that.element).find('button[data-action]').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'exportDetailsByDay'://导出日报

                        var data ={};
                        data.companyId = that._selectedOrg1.id;
                        data.startDate= $(that.element).find('#tab-1 input[name="startDate"]').val();
                        data.endDate= $(that.element).find('#tab-1 input[name="endDate"]').val();
                        data.clockTypeFlag = that.settings.type;
                        downLoadFile({
                            url:restApi.url_exportAttendanceDailyStatement,
                            data:data,
                            type:1
                        });
                        return false;
                        break;
                    case 'exportDetailsByMonth'://导出月报

                        var data ={};
                        data.companyId = that._selectedOrg2.id;
                        data.startDate= $(that.element).find('#tab-2 input[name="startDate"]').val();
                        data.endDate= $(that.element).find('#tab-2 input[name="endDate"]').val();
                        data.clockTypeFlag = that.settings.type;
                        downLoadFile({
                            url:restApi.url_exportAttendanceMonthlyStatement,
                            data:data,
                            type:1
                        });
                        return false;
                        break;
                    case 'exportDetailsByMonthOfUser'://导出个人月报
                        downLoadFile({
                            url:restApi.url_exportAttendanceMonthlyStatementDetail,
                            data:filterData,
                            type:1
                        });
                        return false;
                        break;
                }
            });
        }
        //审批单查看
        , bindApprovalView:function () {
            var that = this;
            $(that.element).find('a[data-action="viewApproval"]').on('click',function () {

                var $this = $(this);
                var $div = $('<div class="m" style="width:175px;"></div>');
                $div.append('当天有审批记录,查看  ');

                var expIds = $this.attr('data-exp-ids'),expIdsArr = [];
                if(!isNullOrBlank(expIds)){
                    expIdsArr = expIds.split(',');
                    
                    if(expIdsArr.length==1){
                        $div.append('<a href="javascript:void(0);" data-id="'+expIdsArr[0]+'">单据</a>');
                    }else{
                        $.each(expIdsArr,function (i,item) {
                            $div.append('<a href="javascript:void(0);" data-id="'+item+'">单据'+(i+1)+'</a>');
                            if(i<expIdsArr.length-1)
                                $div.append(',');
                        })
                    }
                }


                $this.m_floating_popover({
                    content: $div.prop('outerHTML'),
                    isArrow:true,
                    placement: 'top',
                    renderedCallBack: function ($popover) {
                        $popover.find('a').on('click',function () {
                            var dataId = $(this).attr('data-id');
                            $('body').m_form_template_generate_details({
                                saveCallBack:function () {

                                },
                                dataInfo:{id:dataId}
                            },true);
                            return false;
                        });
                    }
                }, true);
                return false;
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