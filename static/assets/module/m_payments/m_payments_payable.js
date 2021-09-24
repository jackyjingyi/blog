/**
 * 收支总览－收支明细-应付
 * Created by wrb on 2017/11/30.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_payments_payable",
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
        this._fromCompanyList  = [];//筛选-付款组织
        this._toCompanyList  = [];//筛选-收款组织
        this._feeTypeNameList  = [];//筛选-收支类型

        this._filterData = {
            startDate:null,
            endDate:null,
            paymentId:null,
            companyIdList:null,
            feeType:null,
            feeTypeList:null,
            associatedOrg:null,
            projectName:null
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
            var html = template('m_payments/m_payments_payable',{});
            $(that.element).html(html);

            that._breadcrumb = [{name:'财务报表'},{name:'应付'}];
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);

            rolesControl();
            $(that.element).find('#timeSelect').m_filter_time_new({label:'日&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;期'},true);
            $(that.element).find('#selectOrg').m_org_chose_byTree({
                param : {
                    permissionCode:'40001802'
                },
                selectedCallBack:function (data,childIdList) {
                    that._selectedOrg = data;
                    that._filterData.companyIdList = childIdList;

                    if(that._firstRenderPage==true){
                        that.renderFilterResult();
                        that.renderDataList();
                        that._firstRenderPage=false;
                    }
                },
                renderCallBack:function () {
                    that.bindBtnActionClick();
                }
            },true);
        }
        //刷新界面
        ,refreshPage:function () {
            this._filterData = {
                startDate:null,
                endDate:null,
                paymentId:null,
                companyIdList:null,
                feeType:null,
                feeTypeList:null,
                associatedOrg:null,
                projectName:null
            };
            this._firstRenderPage = true;//第一次渲染
            this.renderPage();
        }
        //渲染台账list
        ,renderDataList:function () {
            var that = this;

            var option = {};
            option.param = {};
            option.param = filterParam(that._filterData);

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_getPayment,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._fromCompanyList = response.data.fromCompanyList;
                    that._toCompanyList = response.data.toCompanyList;

                    var html = template('m_payments/m_payments_payable_list',{
                        dataList:response.data.data,
                        paymentSum:response.data.paymentSum
                    });
                    $(that.element).find('.data-list-container').html(html);
                    that.bindViewDetail();
                    that.bindGoExpensesPage();
                    that.filterActionClick();
                    $(that.element).find('#totalBySearch').html(response.data.total);
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
                        that.renderDataList();
                        return false;
                        break;
                    case 'refreshBtn':
                        that.refreshPage();
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
                            url:restApi.url_exportPayment,
                            data:filterParam(data),
                            type:1
                        });
                        return false;
                        break;
                }
            });
        }
        //查看详情
        ,bindViewDetail:function () {
            var that = this;
            $(that.element).find('tr[data-id]').on('click',function () {
                var option = {};
                option.title = '应付详情';
                option.id = $(this).attr('data-id');
                option.type = 2;
                $('body').m_payments_list_detail(option);
            });
        }
        //跳转到收支管理
        ,bindGoExpensesPage:function () {
            var that = this;
            $(that.element).find('a[data-action="goExpensesPage"]').off('click').on('click',function () {
                var projectId = $(this).attr('data-project-id');
                var projectName = $(this).text();
                var type = $(this).attr('data-type');
                location.hash = '/project/cost?type=paymentPlan&id='+projectId+'&projectName='+encodeURI(projectName)+'&dataCompanyId='+window.currentCompanyId;
                return false;
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
                    case 'filter_toCompanyId'://收款组织
                    case 'filter_fromCompanyId'://付款组织

                        var selectedArr = [],selectList = [];
                        if(id=='filter_toCompanyId'){
                            
                            if(that._toCompanyList!=null && that._toCompanyList.length>0){
                                selectList = that._toCompanyList;
                            }
                        }
                        else if(id=='filter_fromCompanyId'){

                            if(that._fromCompanyList!=null && that._fromCompanyList.length>0){
                                selectList = that._fromCompanyList;
                            }
                        }

                        if(!isNullOrBlank(that._filterData[filterArr[1]]))
                            selectedArr.push(that._filterData[filterArr[1]]);

                        var option = {};
                        option.selectArr = selectList;
                        option.selectedArr = selectedArr;
                        option.eleId = id;
                        option.selectedCallBack = function (data) {
                            if(data && data.length>0){
                                that._filterData[filterArr[1]] = data[0];
                            }else{
                                that._filterData[filterArr[1]] = null;
                            }
                            that.renderDataList();
                        };
                        $(that.element).find('#'+id).m_filter_select(option, true);

                        break;
                    case 'filter_projectName': //项目

                        var option = {};
                        option.inputValue = that._filterData[filterArr[1]];
                        option.eleId = id;
                        option.oKCallBack = function (data) {

                            that._filterData[filterArr[1]] = data;
                            that.renderDataList();
                        };
                        $(that.element).find('#'+id).m_filter_input(option, true);

                        break;
                    case 'filter_feeType'://收支分类子项

                        var option = {};
                        var newList = [];

                        newList = [
                            {name:'技术审查费',id:'2'},
                            {name:'合作设计费',id:'3'},
                            {name:'其他收支',id:'4'}
                        ];
                        option.selectArr = newList;
                        option.selectedArr = that._filterData.feeTypeList;
                        option.eleId = 'filter_feeType';
                        option.boxStyle = 'min-width:150px;';
                        option.dialogWidth = '150';
                        option.colClass = 'col-md-12';
                        option.selectedCallBack = function (data) {
                            that._filterData.feeTypeList = data;
                            that.renderDataList();

                        };
                        $(that.element).find('#filter_feeType').m_filter_checkbox_select(option, true);
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
            that._filterData.startDate = timeData.startTime;
            that._filterData.endDate = timeData.endTime;

            if(!isNullOrBlank(timeData.days)){
                resultList.push({
                    name:timeData.days,
                    type:2
                });
            }else if(!isNullOrBlank(that._filterData.startDate) || !isNullOrBlank(that._filterData.endDate)){
                resultList.push({
                    name:momentFormat(that._filterData.startDate,'YYYY/MM/DD')+'~'+momentFormat(that._filterData.endDate,'YYYY/MM/DD'),
                    type:2
                });
            }

            //项目搜索
            that._filterData.projectName = $.trim($(that.element).find('input[name="projectName"]').val());
            if(!isNullOrBlank(that._filterData.projectName)){
                resultList.push({
                    name:that._filterData.projectName,
                    type:3
                });
            }

            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//组织

                    that.refreshPage();

                }else if(type==2){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==3){//项目搜索

                    $(that.element).find('input[name="projectName"]').val('');
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
