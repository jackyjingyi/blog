/**
 * 收支确认－项目收款
 * Created by wrb on 2019/7/9.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_receipt",
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

        this._currentCompanyId = window.currentCompanyId;
        this._selectedOrg = null;//当前组织筛选-选中组织对象
        this._extendDataBySelectOrg = null;//组织树请求返回的数据(extendData)

        this._dataInfo = null;

        this._filterData = {};//筛选参数
        this._feeTypeList = [];//类型列表

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._filterData = {};//清空筛选参数
            var html = template('m_finance_confirm/m_project_receipt',{});
            $(that.element).html(html);
            $(that.element).find('#timeSelect').m_filter_time_new({label:'日&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;期'},true);
            that.renderDataList();
            that.initZoneOrgSelect2();
        }
        //渲染list
        ,renderDataList:function () {
            var that = this;

            var option = {};
            option.param = {};
            that._filterData.payType = 1;
            option.param = filterParam(that._filterData);

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-box',
                url: restApi.url_getFinanceReceivableAndPay,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._dataInfo = response.data;

                    var html = template('m_finance_confirm/m_project_receipt_list',{
                        dataList:response.data.data,
                        pageIndex:$("#data-pagination-container").pagination('getPageIndex')
                    });
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('#totalBySearch').html(response.data.total);

                    that.bindActionClick();
                    that.initXEditable();
                    that.getFeeType(function () {
                        that.filterActionClick();
                    });
                    $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});
                    rolesControl();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,initZoneOrgSelect2:function () {
            var that = this;
            var option  = {};
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

                    $(that.element).find('select[name="zoneOrgId"]').select2({
                        tags: false,
                        allowClear: false,
                        minimumResultsForSearch: -1,
                        width:'250px',
                        language: "zh-CN",
                        containerCssClass:'select-sm',
                        //placeholder: '请选择项目范围',
                        data: staffArr
                    });
                    /*$(that.element).find('select[name="zoneOrgId"]').on("change", function (e) {

                        that._filterData.zoneOrgId = $(this).val();
                        that.renderDataList();
                    });*/

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //按钮事件绑定
        ,bindActionClick:function () {
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
                        that.init();
                        return false;
                        break;
                    case 'viewDetail':
                        var option = {};
                        option.title = '应收详情';
                        option.id = $(this).attr('data-id');
                        option.type = 1;
                        $('body').m_payments_list_detail(option);
                        return false;
                        break;
                }
            });
            $(that.element).find('tr[data-id]').on('click',function (e) {

                if($(e.target).closest('.m-floating-popover').length>0)
                    return false;

                var option = {};
                option.title = '应收详情';
                option.id = $(this).attr('data-id');
                option.type = 1;
                $('body').m_payments_list_detail(option);
            });
        }
        //初始化编辑x-editable
        ,initXEditable:function () {
            var that = this;

            $(that.element).find('button[data-action="editContract"]').each(function () {
                var $this = $(this);
                var dataEditType = $(this).attr('data-edit-type');
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');

                switch (dataEditType){

                    case '5'://到账确认
                        $this.m_editable({
                            title:'到账确认',
                            value:null,
                            dataInfo:{doType:1},
                            btnRight:true,
                            isNotSet:false,
                            ok:function (data) {
                                if(data==false)
                                    return false;
                                var option = {};
                                option.url = restApi.url_handleMyTask;
                                option.postData = {id: $this.attr('data-id'), status: '1', result: data.fee,paidDate:data.paidDate};
                                m_ajax.postJson(option, function (response) {
                                    if (response.code == '0') {
                                        S_toastr.success('操作成功');
                                        that.renderDataList();
                                    } else {
                                        S_layer.error(response.info);
                                    }
                                });
                            },
                            cancel:function () {

                            }
                        },true);
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
                    case 'filter_associatedOrg'://收款方
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
                        /*var newList = [];
                        newList = [
                            {name:'合同回款',id:'1'},
                            {name:'技术审查费',id:'2'},
                            {name:'合作设计费',id:'3'},
                            {name:'其他收支',id:'5'}
                        ];*/
                        option.selectArr = that._feeTypeList;
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
            //项目范围
            var $zoneOrgId = $(that.element).find('select[name="zoneOrgId"] option:selected');
            that._filterData.zoneOrgId = $zoneOrgId.val();
            if(!isNullOrBlank($zoneOrgId.val())){
                resultList.push({
                    name:$zoneOrgId.text(),
                    type:1
                });
            }
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
                if(type==1){//项目范围

                    $(that.element).find('select[name="zoneOrgId"]').val('').trigger('change');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==2){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==4){//项目搜索

                    $(that.element).find('input[name="keyword"]').val('');
                    $(that.element).find('button[data-action="search"]').click();

                }

            });
        }
        //获取类型
        ,getFeeType:function (callBack) {
            var that = this;
            if(that._feeTypeList && that._feeTypeList.length>0){
                if(callBack)
                    callBack();
            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_listProjectCategory+'/1';
                m_ajax.get(option, function (response) {
                    if (response.code == '0') {

                        that._feeTypeList = response.data;
                        if(callBack)
                            callBack();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
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
