/**
 * 项目收支明细-表四
 * Created by wrb on 2019/7/1.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_cost_table4",
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
        this._filterData = {
            companyId:null,
            projectCreateDateStart:null,
            projectCreateDateEnd:null,
            status:null
        };
        this._firstRenderPage = true;//第一次渲染

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
            var html = template('m_project_cost/m_project_cost_table4',{});
            $(that.element).html(html);
            rolesControl();
            $(that.element).find('#timeSelect').m_filter_time_new({label:'立项时间'},true);
            $(that.element).find('#statusSelect').m_filter_select_new({
                label:'项目状态',
                dataList:[
                    {id:0,name:'进行中'},
                    {id:2,name:'已完成'},
                    {id:1,name:'已暂停'},
                    {id:3,name:'已终止'}]
            });
            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:7,
                param : {
                    permissionCode:'40001301'},
                //selectedId:window.currentCompanyId,
                selectedCallBack:function (data,childIdList) {
                    that._selectedOrg = data;
                    that._filterData.companyId = data.id;

                    if(that._firstRenderPage==true){
                        that.renderFilterResult();
                        that.renderDataList();
                        that._firstRenderPage=false;
                    }
                }
            },true);
        }
        //渲染台账list
        , renderDataList:function (t) {
            var that = this;

            var option = {};
            option.param = {};
            option.param = filterParam(that._filterData);

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_listProjectCost4,
                params: option.param
            }, function (response) {

                if (response.code == '0') {
                    that._dataInfo = response.data;
                    var html = template('m_project_cost/m_project_cost_table4_list',{
                        dataList:response.data.data
                    });
                    $(that.element).find('.data-list-container').html(html);

                    $(that.element).find('#totalBySearch').html(response.data.total);
                    that.bindBtnActionClick();

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
                        that.renderDataList();
                        return false;
                        break;
                    case 'refreshBtn':
                        that._filterData = {
                            companyId:null,
                            projectCreateDateStart:null,
                            projectCreateDateEnd:null,
                            status:null
                        };
                        that._firstRenderPage = true;//第一次渲染
                        that.renderPage();
                        return false;
                        break;
                    case 'exportDetails'://导出

                        var data = $.extend(true, {}, that._filterData);
                        data.combineCompanyId = that._selectedOrg.id;
                        data.startDateStr = data.startDate;
                        data.endDateStr = data.endDate;
                        data.startDate = null;
                        data.endDate = null;
                        downLoadFile({
                            url:restApi.url_exportProjectCostReportList4,
                            data:filterParam(data),
                            type:1
                        });
                        return false;
                        break;
                }
            });
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //组织
            resultList.push({
                name:$(that.element).find('#selectOrg .company-name').text(),
                type:1
            });
            //时间
            var timeData = $(that.element).find('#timeSelect').m_filter_time_new('getTimeData');
            that._filterData.projectCreateDateStart = timeData.startTime;
            that._filterData.projectCreateDateEnd = timeData.endTime;

            if(!isNullOrBlank(timeData.days)){
                resultList.push({
                    name:timeData.days,
                    type:2
                });
            }else if(!isNullOrBlank(that._filterData.projectCreateDateStart) || !isNullOrBlank(that._filterData.projectCreateDateEnd)){
                resultList.push({
                    name:momentFormat(that._filterData.projectCreateDateStart,'YYYY/MM/DD')+'~'+momentFormat(that._filterData.projectCreateDateEnd,'YYYY/MM/DD'),
                    type:2
                });
            }

            //状态
            var statusData = $(that.element).find('#statusSelect').m_filter_select_new('getSelectionData');
            that._filterData.status = statusData.id;
            if(!isNullOrBlank(statusData.id)){
                resultList.push({
                    name:statusData.name,
                    type:3
                });
            }

            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//组织
                    that._firstRenderPage=true;
                    that.renderPage();

                }else if(type==2){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==3){//状态

                    $(that.element).find('#statusSelect').m_filter_select_new('clearSelection');
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
