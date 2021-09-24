/**
 * 项目进度统计
 * Created by wrb on 2020/6/12.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_stats_pro_process",
        defaults = {
            dataAction: 'researchType',
            businessType:2,//1：业务类型，2：研发类型
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;
        this._filterData = {};
        this._dataList = [];//列表
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._filterData = {//筛选条件
                isMyData : 0,
                businessType:that.settings.businessType
            };
            var html = template('m_stats/m_stats_pro_process',{});
            $(that.element).html(html);

            $(that.element).find('#timeSelect').m_filter_time_new({label:'立&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;项'},true);
            that.initSelect2ByOrgZone();
            that.initSelect2ByDeanName();
            that.renderDataList();
            that.test();
        }
        //渲染list
        ,renderDataList:function (t) {
            var that = this;

            var option = {};
            option.param = {};
            option.param = that._filterData;

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_project_listProjectCost,
                params: filterParam(option.param)
            }, function (response) {

                if (response.code == '0') {
                    that._dataList = response.data.data;
                    var html = template('m_stats/m_stats_pro_process_list',{
                        dataList:response.data.data,
                        businessType:that.settings.businessType
                    });
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('#totalBySearch').html(response.data.total);
                   if( $(that.element).find('.list-container').hasClass('col-sm-4')){
                       $(that.element).find('table.m-stats-pro-process-list').find('th[data-type!="1"],td[data-type!="1"]').hide();
                   }
                    that.bindBtnActionClick();
                    that.sortActionClick();
                    that.renderFilterResult();

                } else {
                    S_layer.error(response.info);
                }
            });
        } //排序
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

                    that.renderDataList();

                    e.stopPropagation();
                    return false;
                });
            });
        }
        //按钮事件绑定
        ,bindBtnActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action],a[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'search':
                        that.renderFilterResult();
                        that.renderDataList();
                        $(that.element).find('a[data-action="closeInfo"]').click();
                        break;
                    case 'refreshBtn':
                        that.init();
                        break;
                    case 'revenueMgt'://收支管理
                        $this.addClass('fc-dark-blue').removeClass('fc-dark-gray').siblings().addClass('fc-dark-gray').removeClass('fc-dark-blue');
                        that.renderRevenueMgt();
                        break;
                    case 'taskAssignment'://任务分配
                        $this.addClass('fc-dark-blue').removeClass('fc-dark-gray').siblings().addClass('fc-dark-gray').removeClass('fc-dark-blue');
                        that.renderTaskAssignment();
                        break;
                    case 'closeInfo'://关闭详情
                        $(that.element).find('table.m-stats-pro-process-list').find('th[data-type!="1"],td[data-type!="1"]').show();
                        $(that.element).find('.list-container').removeClass('col-sm-4').addClass('col-sm-12');
                        $(that.element).find('a[data-action="setTime"]').show();
                        $(that.element).find('.pro-process-info').hide();
                        $(that.element).find('tr').removeClass('tr-active');
                        break;
                    case 'exportDetails'://导出
                        var data = $.extend(true, {}, that._filterData);
                        //data.combineCompanyId = data.selectOrgId;
                        downLoadFile({
                            url:restApi.url_exportProjectSchedule,
                            data:filterParam(data),
                            type:1
                        });
                        return false;
                        break;
                }
                return false;
            });
            $(that.element).find('tr[data-id]').off('click').on('click',function (i) {
                $(this).addClass('tr-active').siblings('tr').removeClass('tr-active');
                $(that.element).find('table.m-stats-pro-process-list').find('th[data-type!="1"],td[data-type!="1"]').hide();
                $(that.element).find('.list-container').addClass('col-sm-4').removeClass('col-sm-12');
                $(that.element).find('a[data-action="setTime"]').hide();
                $(that.element).find('.pro-process-info').fadeIn(500);
                that.renderTaskAssignment();

            });
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //分管院长
            var $deanName = $(that.element).find('select[name="deanName"] option:selected');
            that._filterData.deanName = $deanName.val();
            if(!isNullOrBlank($deanName.val())){
                resultList.push({
                    name:$deanName.text(),
                    type:1
                });
            }
            //所属公司
            var $orgId = $(that.element).find('select[name="orgId"] option:selected');
            that._filterData.orgId = $orgId.val();
            if(!isNullOrBlank($orgId.val())){
                resultList.push({
                    name:$orgId.text(),
                    type:2
                });
            }
            //时间
            var timeData = $(that.element).find('#timeSelect').m_filter_time_new('getTimeData');
            that._filterData.projectCreateDateStart = timeData.startTime;
            that._filterData.projectCreateDateEnd = timeData.endTime;

            if(!isNullOrBlank(timeData.days)){
                resultList.push({
                    name:timeData.days,
                    type:3
                });
            }else if(!isNullOrBlank(that._filterData.projectCreateDateStart) || !isNullOrBlank(that._filterData.projectCreateDateEnd)){
                resultList.push({
                    name:momentFormat(that._filterData.projectCreateDateStart,'YYYY/MM/DD')+'~'+momentFormat(that._filterData.projectCreateDateEnd,'YYYY/MM/DD'),
                    type:3
                });
            }

            //项目搜索
            that._filterData.keyword = $.trim($(that.element).find('input[name="keyword"]').val());
            if(!isNullOrBlank(that._filterData.keyword)){
                resultList.push({
                    name:that._filterData.keyword,
                    type:4
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

                }else if(type==4){//项目搜索

                    $(that.element).find('input[name="keyword"]').val('');
                    $(that.element).find('button[data-action="search"]').click();

                }

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
        ,test:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_calculateSubTaskRatio;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                }else {
                    S_layer.error(response.info);
                }
            })

        }
        //渲染收支管理
        ,renderRevenueMgt:function () {
            var that = this;

            var dataId = $(that.element).find('tr.tr-active').attr('data-id');
            var dataItem = getObjectInArray(that._dataList,dataId);

            var options = {};
            options.projectId = dataItem.id;
            options.projectName = dataItem.projectName;
            options.myTaskId = dataItem.myTaskId;
            options.dataCompanyId = dataItem.dataCompanyId;
            options.isView = true;
            $(that.element).find('.panel-body[data-type="collectionPlan"]').m_cost_collectionPlan(options, true);
            $(that.element).find('.panel-body[data-type="paymentPlan"]').m_cost_paymentPlan(options, true);

            $(that.element).find('.tabs-container').show();
            $(that.element).find('div[data-type="taskAssignment"]').hide();
        }
        //渲染任务分配
        ,renderTaskAssignment:function () {
            var that = this;

            var dataId = $(that.element).find('tr.tr-active').attr('data-id');
            var dataItem = getObjectInArray(that._dataList,dataId);

            var options = {};
            options.projectId = dataItem.id;
            options.projectName = dataItem.projectName;
            options.dataCompanyId = dataItem.dataCompanyId;
            options.isView = true;
            $(that.element).find('div[data-type="taskAssignment"]').m_production(options,true);

            $(that.element).find('.tabs-container').hide();
            $(that.element).find('div[data-type="taskAssignment"]').show();
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
