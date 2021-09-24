/**
 * 1=我申请的,2=待我审批,3=我已审批,4=抄送我的
 * Created by wrb on 2018/9/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_data",
        defaults = {
            doType: 1//1=我申请的,2=待我审批,3=我已审批,4=抄送我的
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;

        this._title = '';
        if(this.settings.doType==1){
            this._title = '我申请的';
        }else if(this.settings.doType==2){
            this._title = '待我审批';
        }else if(this.settings.doType==3){
            this._title = '我已审批';
        }else if(this.settings.doType==4){
            this._title = '抄送我的';
        }
        this._filterData = {};
        this._expTypeList = [];//筛选-类型
        this._pageIndex = 0;//记录分页
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_approval/m_approval_data', {title:that._title});
            $(that.element).html(html);
            that.getListAuditTypeName(function () {

                $(that.element).find('#timeSelect').m_filter_time_new({label:'申请日期'},true);
                that.initExpTypeSelect2();
                that.renderFilterResult();
                that.renderDataList();
            });
        }
        //初始化父类型（parentExpType）
        ,initExpTypeSelect2:function () {
            var that = this;
            var data = [];
            if(that._expTypeList && that._expTypeList.length>0){

                $.each(that._expTypeList,function (i,item) {
                    data.push({
                        id:item.id,
                        text:item.name
                    })
                });
            }
            var $parentExpType = $(that.element).find('select[name="parentExpType"]');
            $parentExpType.select2({
                width: '150',
                allowClear: false,
                language: 'zh-CN',
                containerCssClass:'select-sm',
                minimumResultsForSearch: Infinity,
                placeholder: "请选择类型",
                data: data
            });
            if(data!=null && data.length>0){
                $parentExpType.on('change',function () {
                    that._filterData.financeFlag = $(this).val();
                    //that.renderDataList();
                    that.initExpTypeItemICheck(that._filterData.financeFlag);
                });
                $parentExpType.val(that._expTypeList[0].id).trigger('change');
            }
        }
        //初始化分类子项 select2
        ,initExpTypeItemSelect2:function (id) {
            var that = this;
            var data = [];
            if(that._expTypeList && that._expTypeList.length>0){
                var dataItem = getObjectInArray(that._expTypeList,id);
                $.each(dataItem.childList,function (i,item) {
                    data.push({
                        id:item.id,
                        text:item.name,
                        total:item.total
                    })
                });
            }
            var $expType = $(that.element).find('select[name="expType"]');

            if($expType.next('.select2-container').length>0){
                $expType.select2('destroy').empty();
                $expType.next('.select2-container').remove();
            }

            $expType.select2({
                width: '150',
                allowClear: false,
                language: 'zh-CN',
                containerCssClass:'select-sm',
                minimumResultsForSearch: Infinity,
                placeholder: "请选择第二类型",
                data: data
            });
            if(that.settings.doType==2){
                $expType.on('select2:open', function (e) {

                    var t = setTimeout(function () {

                        var parentExpType = $(that.element).find('select[name="parentExpType"] option:selected').val();
                        if(!isNullOrBlank(parentExpType)){
                            var expTypeItem = getObjectInArray(that._expTypeList,parentExpType);
                            $.each(expTypeItem.childList, function (i, item) {
                                if(item.total && item.total>0){
                                    var $li = $('.select2-container .select2-results__options .select2-results__option').eq(i);
                                    if($li.find('span.badge').length==0)
                                        $li.append('<span class="badge pull-right">'+item.total+'</span>')
                                }
                            });
                        }
                        clearTimeout(t);
                    });
                });
            }
        }
        //初始化分类子项 icheck
        ,initExpTypeItemICheck:function (id) {
            var that = this;
            var iHtml = '';
            if(that._expTypeList && that._expTypeList.length>0){
                var dataItem = getObjectInArray(that._expTypeList,id);
                var expList = $.extend(true, [], dataItem.childList);
                expList.unshift({id:'',name:'全部'});
                iHtml = template('m_approval/m_approval_data_exp_type', {expTypeList:expList});
            }
            $(that.element).find('#expTypeBox').html(iHtml);
            var isCheckAll = function () {
                var len = $(that.element).find('input[name="expType"][value!=""]').length;
                var checkedLen = $(that.element).find('input[name="expType"][value!=""]:checked').length;
                if(len==checkedLen){
                    $(that.element).find('input[name="expType"][value=""]').prop('checked',true);
                    $(that.element).find('input[name="expType"][value=""]').iCheck('update');
                }else{
                    $(that.element).find('input[name="expType"][value=""]').prop('checked',false);
                    $(that.element).find('input[name="expType"][value=""]').iCheck('update');
                }
            };
            var ifChecked = function (e) {
                if($(this).val()==''){
                    $(that.element).find('input[name="expType"][value!=""]').prop('checked',true);
                    $(that.element).find('input[name="expType"][value!=""]').iCheck('update');
                }
                isCheckAll();
            };
            var ifUnchecked = function (e) {
                if($(this).val()==''){
                    $(that.element).find('input[name="expType"][value!=""]').prop('checked',false);
                    $(that.element).find('input[name="expType"][value!=""]').iCheck('update');
                }
                isCheckAll();
            };
            $(that.element).find('input[name="expType"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);
        }
        //加载数据
        ,renderDataList: function (t) {
            var that = this;

            var parentExpType = $(that.element).find('select[name="parentExpType"] option:selected').val();
            that._filterData.type=that.settings.doType;

            if(that._filterData.expType =='往来'){

                that.renderExpList();

            }else{

                //去掉之前的totalAmount显示
                if($(that.element).find('#totalAmount').length>0){
                    $(that.element).find('#totalAmount').remove();
                }

                var option = {};
                option.param = {};
                if(t==1)
                    that._filterData.pageIndex=that._pageIndex;

                var postUrl = restApi.url_getAuditData;
                var htmlStr = 'm_approval/m_approval_data_list';
                if(parentExpType=='1'){//财务审批
                    postUrl = restApi.url_listExpApplyForFinance;
                    htmlStr = 'm_approval/m_approval_data_list_for_finance';
                    that.renderSumExpApply();
                }

                option.param = filterParam(that._filterData);
                paginationFun({
                    eleId: '#data-pagination-container',
                    loadingId: '.data-list-container',
                    url: postUrl,
                    params: option.param
                }, function (response) {
                    // data为ajax返回数据
                    if (response.code == '0') {

                        var html = template(htmlStr, {dataList:response.data.data,currentCompanyUserId:that._currentCompanyUserId});
                        $(that.element).find('.data-list-container').html(html);
                        that._pageIndex = $("#data-pagination-container").pagination('getPageIndex');
                        $(that.element).find('#totalBySearch').html(response.data.total);
                        that.bindTrClick();
                        that.bindActionClick();
                        that.filterActionClick();

                    } else {
                        S_layer.error(response.info);
                    }
                });

            }
        }
        //渲染费用申请列表
        ,renderExpList:function () {
            var that = this;
            $(that.element).find('.data-list-box').m_approval_exp_list({
                doType:2,
                type:that.settings.doType,//1=我申请的,2=待我审批,3=我已审批,4=抄送我的
                filterData:that._filterData,
                renderCallBack:function (filterData,data) {
                    that._filterData = filterData;
                    $(that.element).find('#totalBySearch').html(data.total);
                }
            });
        }
        ,bindTrClick:function () {
            var that = this;

            $(that.element).find('tbody tr[data-id]').off('click').on('click',function (e) {
                if($(e.target).hasClass('btn')||$(e.target).closest('button').length>0) {return false;}
                var $this = $(this);
                var type = $this.attr('data-type');
                var dataId = $this.attr('data-id');

                if(type==1 || type==2 ){

                    var option = {};
                    option.doType = type;
                    option.id = dataId;
                    option.saveCallBack = function () {
                        that.renderDataList(1);
                        that.renderAuditCount();
                    };
                    $('body').m_approval_cost_details(option,true);

                }else if(type==3 || type==4){

                    var option = {};
                    option.doType = type;
                    option.id = dataId;
                    option.saveCallBack = function () {
                        that.renderDataList(1);
                        that.renderAuditCount();
                    };
                    $('body').m_approval_leave_details(option,true);

                }else if(type=='projectPayApply'){

                    var option = {};
                    option.doType = type;
                    option.id = dataId;
                    option.saveCallBack = function () {
                        that.renderDataList(1);
                        that.renderAuditCount();
                    };
                    $('body').m_approval_payment_details(option,true);

                }else if(type=='taskCheckAudit'){

                    $('body').m_task_issue_approval({
                        id:dataId,
                        saveCallBack:function () {
                            that.renderDataList(1);
                            that.renderAuditCount();
                        },
                        closeCallBack:function () {
                            //that.renderDataList();
                        }
                    },true);

                }else if(type=='financeVerification'){

                    $('body').m_approval_cost_off_return_details({
                        dataInfo :{id : dataId},
                        saveCallBack : function () {
                            if(that.settings.saveCallBack)
                                that.settings.saveCallBack();
                        }
                    },true);

                }
                else{

                    var option = {};
                    var data = {};
                    option.dataInfo = {
                        id : dataId
                    };
                    option.saveCallBack = function () {
                        that.renderDataList(1);
                        that.renderAuditCount();
                    };
                    $('body').m_form_template_generate_details(option,true);
                }

            });
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var dataType = $this.closest('tr').attr('data-type'),dataId = $this.closest('tr').attr('data-id');
                switch (dataAction){
                    case 'search':
                        if(isNullOrBlank(that._filterData.financeFlag)){
                            S_toastr.error('请选择类型！');
                            return false;
                        }
                        that.renderFilterResult();
                        that.renderDataList();
                        return false;
                        break;
                    case 'refreshBtn':
                        that._filterData = {};
                        that.init();
                        break;
                    case 'edit':
                        var option = {};
                        var data = {};
                        option.dataInfo = {
                            id : dataId
                        };
                        option.saveCallBack = function () {
                            that.renderDataList(1);
                            that.renderAuditCount();
                        };
                        $('body').m_form_template_generate_edit(option,true);

                        break;
                }
                return false;
            });
        }
        //获取类型
        ,getListAuditTypeName:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listAuditTypeName;
            option.postData = {
                type:that.settings.doType
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._expTypeList = response.data;
                    if(callBack)
                        callBack();
                } else {
                    S_layer.error(response.info);
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
                    case 'filter_expType'://收款组织
                    case 'filter_approveStatus'://付款组织

                        var selectedArr = [],selectList = [];
                        if(id=='filter_expType'){

                            //1=报销申请，2=费用申请,3请假，4出差,5=项目费用申请
                            selectList = that._expTypeList;
                        }
                        else if(id=='filter_approveStatus'){

                            //审批状态(0:待审核，1:同意，2，退回,3:撤回,4:删除,5.审批中）,6:财务已拨款,7:财务拒绝拨款',

                            if(that.settings.doType==2){
                                selectList = [
                                    // {id:0,name:'待审核'},
                                    {id:5,name:'审批中'}
                                ];
                            }else if(that.settings.doType==3){
                                selectList = [
                                    // {id:0,name:'待审核'},
                                    {id:1,name:'已审批'},
                                    {id:2,name:'已退回'},
                                    {id:5,name:'审批中'},
                                    {id:6,name:'财务已拨款'},
                                    {id:7,name:'财务拒绝拨款'}
                                ];
                            }else{
                                selectList = [
                                    // {id:0,name:'待审核'},
                                    {id:1,name:'已审批'},
                                    {id:2,name:'已退回'},
                                    {id:3,name:'已撤回'},
                                    {id:5,name:'审批中'},
                                    {id:6,name:'财务已拨款'},
                                    {id:7,name:'财务拒绝拨款'}
                                ];
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

                    case 'filter_expNo': //项目编号
                    case 'filter_userNameLike': //
                    case 'filter_submitUserName': //

                        var option = {};
                        option.inputValue = that._filterData[filterArr[1]];
                        option.eleId = id;
                        option.oKCallBack = function (data) {

                            that._filterData[filterArr[1]] = data;
                            that.renderDataList();
                        };
                        $this.m_filter_input(option, true);

                        break;

                }

            });
        }
        //我的审批，待处理内容数量
        ,renderAuditCount:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_finance_getAuditCount;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(response.data && response.data>0){
                        $('#approvalAuditCount').html(response.data);
                        $('#approvalPendingAuditCount').html(response.data);
                    }

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];

            //类型
            var parentExpType = $(that.element).find('select[name="parentExpType"] option:selected').text();
            var expType = '',expText = parentExpType;
            $(that.element).find('input[name="expType"][value!=""]:checked').each(function () {
                expType += $(this).val()+',';
            });
            if(expType.length>0){
                expType = expType.substring(0,expType.length-1);
                expText = expText+'：'+expType;
            }
            that._filterData.expType = expType;
            if(!isNullOrBlank(parentExpType)){
                resultList.push({
                    name:expText,
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



            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//类型,重新选择第一个

                    $(that.element).find('select[name="parentExpType"]').val(that._expTypeList[0].id).trigger('change');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==2){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-action="search"]').click();

                }

            });
        }
        //渲染总金额统计
        ,renderSumExpApply:function () {
            var that = this;
            var render = function (data) {

                if($(that.element).find('#totalAmount').length>0){
                    $(that.element).find('#totalAmount').remove();
                }
                var iHtml = '<div class="pt-absolute m-t-sm" id="totalAmount"><span>合计：</span><span class="fc-v1-green">'+expNumberFilter(data.sumExpAmount)+'</span> 元 </div>';

                $(that.element).find('.m-pagination').before(iHtml);
            };

            var option = {};
            option.url = restApi.url_sumExpForFinance;
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
