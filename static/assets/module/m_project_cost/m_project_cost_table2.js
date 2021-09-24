/**
 * 项目收支明细-表二
 * Created by wrb on 2019/7/1.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_cost_table2",
        defaults = {
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
            payType:1,//默认收款，2=付款
            companyId:null,
            projectCreateDateStart:null,
            projectCreateDateEnd:null,
            status:null
        };
        this._firstRenderPage = true;//第一次渲染
        this._isMyDataFlag = 1;//是否与我相关
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getMenuRole(function () {
                that.renderPage();
            });

        }
        //初始化数据并加载模板
        ,renderPage:function () {
            var that = this;
            var html = template('m_project_cost/m_project_cost_table2',{isMyDataFlag:that._isMyDataFlag});
            $(that.element).html(html);
            rolesControl();
            $(that.element).find('#timeSelect').m_filter_time_new({label:'立项时间'},true);
            $(that.element).find('#statusSelect').m_filter_select_new({
                label:'项目状态',
                dataList:[
                    {id:'',name:'全部'},
                    {id:0,name:'进行中'},
                    {id:2,name:'已完成'},
                    {id:1,name:'已暂停'},
                    {id:3,name:'已终止'}]
            });
            $(that.element).find('#signDateStatusSelect').m_filter_select_new({
                label:'合同状态',
                dataList:[
                    {id:'',name:'全部'},
                    {id:0,name:'进行中'},
                    {id:2,name:'已完成'},
                    {id:1,name:'已暂停'},
                    {id:3,name:'已终止'}]
            });

            if($(that.element).find('#selectOrg').length>0){

                $(that.element).find('#selectOrg').m_org_chose_byTree({
                    type:7,
                    param : {
                        permissionCode:'40001301'
                    },
                    //selectedId:window.currentCompanyId,
                    isSelectExtendDataCompany:true,
                    selectedCallBack:function (data,childIdList,extendData) {
                        that._selectedOrg = data;
                        that._filterData.companyId = data.id;

                        if(that._firstRenderPage==true){
                            that.renderFilterResult();
                            that.renderDataList();
                            that._firstRenderPage=false;
                        }
                    }
                },true);

            }else{

                if(that._firstRenderPage==true){
                    that.renderFilterResult();
                    that.renderDataList();
                    that._firstRenderPage=false;
                }
            }

            that.initICheckByIsMyData();


        }
        //渲染台账list
        ,renderDataList:function (t) {
            var that = this;

            var option = {};
            option.param = {};
            option.param = $.extend({},that._filterData);//filterParam(that._filterData);

            var isMyData =　$(that.element).find('input[name="isMyData"]:checked').val();
            if(isMyData==undefined){
                isMyData = that._isMyDataFlag;
            }
            if(isMyData==1){
                option.param.companyIdList=null;
                option.param.selectOrgId=null;
                option.param.selectOrgName=null;
            }
            option.param.isMyData = isMyData;

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_getProjectCost,
                params: filterParam(option.param)
            }, function (response) {

                if (response.code == '0') {

                    that._dataInfo = response.data;

                    var html = template('m_project_cost/m_project_cost_table2_list'+that._filterData.payType,{
                        dataList:response.data.data
                    });
                    $(that.element).find('.data-list-container').html(html);

                    $(that.element).find('#totalBySearch').html(response.data.total);
                    that.bindBtnActionClick();

                    if(that._dataInfo!=null && that._dataInfo.data && that._dataInfo.data.length>0){
                        $('#cost2_list').DataTable( {
                            scrollY:        400,
                            scrollX:        true,
                            scrollCollapse: true,
                            paging:         false,
                            fixedColumns:   true,
                            ordering:       false,
                            searching:      false,
                            info:           false
                        });
                    }

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //按钮事件绑定
        ,bindBtnActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]:not([data-action="selectOrg"])').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){

                    case 'search':
                        that.renderFilterResult();
                        that.renderDataList();
                        break;
                    case 'refreshBtn':
                        that._filterData = {
                            payType:1,
                            companyId:null,
                            projectCreateDateStart:null,
                            projectCreateDateEnd:null,
                            status:null
                        };
                        that._firstRenderPage = true;//第一次渲染
                        that.renderPage();
                        break;
                    case 'exportDetails'://导出

                        var data = $.extend(true, {}, that._filterData);
                        data.combineCompanyId = that._selectedOrg.id;
                        data.startDateStr = data.startDate;
                        data.endDateStr = data.endDate;
                        data.startDate = null;
                        data.endDate = null;
                        downLoadFile({
                            url:restApi.url_exportProjectCostReportList,
                            data:filterParam(data),
                            type:1
                        });
                        break;

                    case 'collectionPlan'://收款
                        that._filterData.payType=1;
                        $(that.element).find('button[data-action="collectionPlan"]').addClass('btn-primary').removeClass('btn-white');
                        $(that.element).find('button[data-action="paymentPlan"]').removeClass('btn-primary').addClass('btn-white');
                        that.renderDataList();
                        break;

                    case 'paymentPlan'://付 款
                        that._filterData.payType=2;
                        $(that.element).find('button[data-action="collectionPlan"]').removeClass('btn-primary').addClass('btn-white');
                        $(that.element).find('button[data-action="paymentPlan"]').addClass('btn-primary').removeClass('btn-white');
                        that.renderDataList();
                        break;
                }
                return false;
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
            if(!isNullOrBlank(statusData.name)){
                resultList.push({
                    name:'项目状态：'+statusData.name,
                    type:3
                });
            }

            //合同状态
            var signDateStatusData = $(that.element).find('#signDateStatusSelect').m_filter_select_new('getSelectionData');
            that._filterData.signDateStatus = signDateStatusData.id;
            if(!isNullOrBlank(signDateStatusData.name)){
                resultList.push({
                    name:'合同状态：'+signDateStatusData.name,
                    type:4
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

                }else if(type==4){//合同状态

                    $(that.element).find('#signDateStatusSelect').m_filter_select_new('clearSelection');
                    $(that.element).find('button[data-action="search"]').click();

                }

            });
        }
        //获取当前组织筛选判断数据
        ,getMenuRole:function (callBack) {
            var that = this;
            var param = {};
            param.url = restApi.url_getMenuRole;
            param.postData = {};
            param.postData.permissionCode = '40001301';
            m_ajax.postJson(param, function (response) {
                if (response.code == '0') {
                    that._isMyDataFlag = response.data.isMyDataFlag;
                    if(callBack)
                        callBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //checkbox渲染
        ,initICheckByIsMyData:function () {
            var that = this;

            var ifClicked = function (e) {

            };
            $(that.element).find('input[name="isMyData"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifClicked',ifClicked);
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
