/**
 * 财务审批统计
 * Created by wrb on 2017/12/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approvalReport_cost",
        defaults = {
            doType:1,//1=财务审批统计,2=审批付款
            allocationStatus:1,// 1=已拨款,0=未拨款
            expSumFilterData: {}//盛装报销汇总查询条件
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._companyList = null;//筛选组织
        this._departList = null;//筛选部门
        this._expTypeList = null;//筛选类型
        this._myDataList = [];

        this._currentCompanyId = window.currentCompanyId;
        this._selectedOrg = null;//当前组织筛选-选中组织对象
        this._extendDataBySelectOrg = null;//组织树请求返回的数据(extendData)

        /******************** 筛选字段 ********************/
        this._filterData = {
            companyIdList : [this._currentCompanyId]
        };
        this._pageIndex = 0;//记录分页
        this._firstRenderPage = true;//第一次渲染
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that._firstRenderPage = true;//第一次渲染
            that._filterData.allocationStatus = that.settings.allocationStatus;

            var html = template('m_approvalReport/m_approvalReport_cost', {doType:that.settings.doType});
            $(that.element).html(html);

            that.getListAuditParam(function (data) {

                that._companyList = data.companyList;
                that._departList = data.departList;
                that._expTypeList = data.typeList;

                if(that.settings.doType==2) {
                    that.renderTimeSelectControl();
                    that.initExpTypeSelect2();
                }else{
                    that.initExpTypeItemICheck();
                    $(that.element).find('#timeSelect').m_filter_time_new({label:'申请时间'},true);
                }
                that.renderOrgTree();
                that.bindActionClick();

            });


        }
        //渲染组织树选择
        ,renderOrgTree:function () {
            var that = this;
            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:that.settings.doType==1?5:1,
                selectedId:that._currentCompanyId,
                param : {
                    permissionCode:that.settings.doType==1?'30000201':'40001905',
                    managerPermissionCode:'30000203'
                },
                selectedCallBack : function (data,childIdList) {
                    that._selectedOrg = data;
                    that._filterData.companyIdList = childIdList;
                    that.renderFilterResult();

                    if(that._firstRenderPage){
                        that.renderContent();
                        that._firstRenderPage = false;

                    }else{
                        that.getListAuditParam(function (data) {
                            that._departList = data.departList;
                            that._filterData.applyDepartName = null;//切换组织重新设置null
                            that.renderContent();
                        });
                    }

                },
                renderCallBack : function (extendData) {
                    that._extendDataBySelectOrg = extendData;
                }
            },true);
        }
        //渲染时间筛选控件
        ,renderTimeSelectControl:function () {
            var that = this;
            var option = {};
            option.selectTimeCallBack = function (data) {

                that._filterData.startDate = data.startTime;
                that._filterData.endDate = data.endTime;

                that.renderContent();
            };
            $(that.element).find('.time-combination').m_filter_timeGroup(option,true);
        }
        //获取筛选数据
        ,getListAuditParam:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listAuditParam;
            option.postData = {};
            //option.postData = filterParam(that._filterData);
            option.postData.allocationStatus = that._filterData.allocationStatus;
            option.postData.financeFlag = 1;
            option.postData.companyIdList = that._filterData.companyIdList;
            option.postData = filterParam(option.postData);
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(callBack)
                        callBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
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

            $(that.element).find('select[name="expType"]').select2({
                width: '120',
                allowClear: false,
                language: 'zh-CN',
                containerCssClass:'select-sm',
                minimumResultsForSearch: Infinity,
                placeholder: "请选择",
                data: data
            });
            if(that.settings.doType==2){
                $(that.element).find('select[name="expType"]').on('change',function () {
                    that._filterData.expType = $(this).val();
                    that.renderContent();
                });
            }
        }
        //初始化分类子项 icheck
        ,initExpTypeItemICheck:function () {
            var that = this;
            var expList = $.extend(true, [], that._expTypeList);
            expList.unshift({id:'',name:'全部'});
            var iHtml = template('m_approval/m_approval_data_exp_type', {expTypeList:expList});
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
        //加载基本数据(t=1，刷新当前页，t=2,刷新统计金额)
        ,renderContent: function (t) {
            var that = this;

            if(that._filterData.expType =='往来'){

                that.renderExpList();

            }else{

                //去掉之前的totalAmount显示
                if($(that.element).find('#totalAmount').length>0){
                    $(that.element).find('#totalAmount').remove();
                }
                var option = {};
                option.param = {};
                that._filterData.financeFlag=1;
                //that._filterData.allocationStatus =1; //增加该字段，过滤未拨款的
                that._filterData.allocationStatus = that.settings.allocationStatus;
                if(t==1)
                    that._filterData.pageIndex=that._pageIndex;

                option.param = $.extend({}, that._filterData);

                if(option.param.toCompanyName=='本部'){
                    option.param.toCompanyName = that._currentCompanyId;
                }
                if(option.param.fromCompanyName=='本部'){
                    option.param.fromCompanyName = that._currentCompanyId;
                }

                paginationFun({
                    eleId: '#data-pagination-container',
                    loadingId: '.data-list-container',
                    url: restApi.url_listAuditStatic,
                    params: filterParam(option.param)
                }, function (response) {
                    // data为ajax返回数据
                    if (response.code == '0') {

                        if(t==2){

                            $(that.element).find('#totalAmount span').eq(0).html(expNumberFilter(response.data.expSumAmount));
                            $(that.element).find('#totalAmount span').eq(1).html(expNumberFilter(response.data.financialAllocationSumAmount));
                            $(that.element).find('#totalAmount span').eq(2).html(expNumberFilter(response.data.waitingAllocationSumAmount));
                            $(that.element).find('#totalAmount span').eq(3).html(expNumberFilter(response.data.repulseAllocationSumAmount));

                        }else{

                            that._myDataList = response.data.data;

                            var html = template('m_approvalReport/m_approvalReport_cost_list', {
                                doType:that.settings.doType,
                                dataList : response.data.data,
                                expSumAmount : response.data.expSumAmount,
                                financialAllocationSumAmount : response.data.financialAllocationSumAmount,
                                waitingAllocationSumAmount : response.data.waitingAllocationSumAmount,
                                repulseAllocationSumAmount : response.data.repulseAllocationSumAmount,
                                managerCompanyIds:that._extendDataBySelectOrg && that._extendDataBySelectOrg.managerCompanyIds?that._extendDataBySelectOrg.managerCompanyIds:'',
                                selectedOrg:that._selectedOrg,
                                pageIndex : $("#data-pagination-container").pagination('getPageIndex'),
                                isFinance : window.currentRoleCodes.indexOf('30000203')>-1?1:0
                            });
                            $(that.element).find('.data-list-container').html(html);
                            that._pageIndex = $("#data-pagination-container").pagination('getPageIndex');
                            $(that.element).find('#totalBySearch').html(response.data.total);

                            rolesControl();
                            that.bindTrClick();
                            that.bindActionClick();
                            that.sortActionClick();
                            $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});
                        }
                        return false;
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
                doType:3,
                filterData:that._filterData,
                renderCallBack:function (filterData,data) {
                    that._filterData = filterData;
                    //that.bindTrClick();
                    $(that.element).find('#totalBySearch').html(data.total);
                }
            });
        }
        ,bindTrClick:function () {
            var that = this;
            $(that.element).find('tbody tr[class!="no-data"]').off('click').on('click',function () {
                var $this = $(this);
                var type = $this.attr('data-type');
                var dataId = $this.attr('data-id');
                //获取节点数据
                var dataItem = getObjectInArray(that._myDataList,dataId);

                if(type==1 || type==2 ){

                    var option = {};
                    option.doType = type;
                    option.id = dataId;
                    option.saveCallBack = function () {
                        that.renderContent(1);
                    };
                    $('body').m_approval_cost_details(option,true);

                }else if(type==3 || type==4){

                    var option = {};
                    option.doType = type;
                    option.id = dataId;
                    option.saveCallBack = function () {
                        that.renderContent(1);
                    };
                    $('body').m_approval_leave_details(option,true);

                }else if(type=='projectPayApply'){

                    var option = {};
                    option.doType = type;
                    option.id = dataId;
                    option.saveCallBack = function () {
                        that.renderContent(1);
                    };
                    $('body').m_approval_payment_details(option,true);

                }else if(type=='taskCheckAudit'){

                    $('body').m_task_issue_approval({
                        id:dataId,
                        saveCallBack:function () {
                            that.renderContent(1);
                        },
                        closeCallBack:function () {
                            //that.init();
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

                }else{

                    var option = {};
                    var data = {};
                    option.dataInfo = {
                        id : dataId
                    };
                    option.saveCallBack = function () {
                        that.renderContent(1);
                    };
                    $('body').m_form_template_generate_details(option,true);
                }

            });
        }
        //绑定拨款事件
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]:not([data-action="selectOrg"])').off('click').on('click',function (e) {

                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'search':
                        /*if(isNullOrBlank(that._filterData.expType)){
                            S_toastr.error('请选择类型！');
                            return false;
                        }*/
                        that.renderFilterResult();
                        that.renderContent();
                        break;
                    case 'refreshBtn':
                        that._filterData = {
                            companyIdList : [that._currentCompanyId]
                        };
                        that.init();
                        break;
                    case 'agreeToGrant'://拨款
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
                                    //financialDate = moment(financialDate).format('YYYY/MM/DD');
                                    var option  = {};
                                    option.url = restApi.url_financialAllocation;
                                    option.postData = {
                                        id:$this.attr('data-id'),
                                        financialDate:financialDate
                                    };
                                    m_ajax.postJson(option,function (response) {
                                        if(response.code=='0'){
                                            S_toastr.success('操作成功');
                                            //that.init();
                                            //$this.parents('td').html(moment(financialDate).format('YYYY/MM/DD'));
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
                                            //that.init();
                                            //$this.parents('TR').remove();
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
                        break;
                }
                e.stopPropagation();
                return false;


            });
            //筛选事件
            $(that.element).find('a.icon-filter').each(function () {

                var $this = $(this);
                var id = $this.attr('id');

                var filterArr = id.split('_');

                switch (id){
                    case 'filter_submitUserName'://经办人
                    case 'filter_userNameLike'://申请人
                    case 'filter_expNo': //项目编号
                    case 'filter_auditPerson'://审批人
                    case 'filter_toCompanyName'://收款方
                    case 'filter_fromCompanyName'://付款方

                        var option = {};
                        option.inputValue = that._filterData[filterArr[1]];
                        option.eleId = id;
                        option.oKCallBack = function (data) {

                            that._filterData[filterArr[1]] = data;
                            that.renderContent();
                        };
                        $(that.element).find('#'+id).m_filter_input(option, true);

                        break;
                    case 'filter_allocationStartDate_allocationEndDate'://拨款时间
                    case 'filter_startDate_endDate': //申请时间

                        var timeData = {};
                        timeData.startTime = that._filterData[filterArr[1]];
                        timeData.endTime = that._filterData[filterArr[2]];

                        var option = {};
                        option.timeData = timeData;
                        option.eleId = id;
                        option.okCallBack = function (data) {

                            that._filterData[filterArr[1]] = data.startTime;
                            that._filterData[filterArr[2]] = data.endTime;
                            that.renderContent();
                        };
                        $(that.element).find('#'+id).m_filter_time(option, true);

                        break;
                    case 'filter_applyCompanyName'://所在组织
                    case 'filter_applyDepartName'://所在部门
                    case 'filter_expType'://类型

                        var selectList = [],selectedArr = [];

                        var list = that._companyList;
                        if(id=='filter_applyDepartName'){
                            list = that._departList;
                        }else if(id=='filter_expType'){
                            list = that._expTypeList;
                        }

                        if(list!=null && list.length>0){
                            $.each(list,function (i,item) {
                                if(item!=null){
                                    selectList.push({id:item.name,name:item.name});
                                }
                            })
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
                            that.renderContent();
                        };
                        $(that.element).find('#'+id).m_filter_select(option, true);

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

            //类型
            if(that.settings.doType==1){
                var expType = '';
                $(that.element).find('input[name="expType"][value!=""]:checked').each(function () {
                    expType += $(this).val()+',';
                });
                if(expType.length>0){
                    expType = expType.substring(0,expType.length-1);
                }
                that._filterData.expType = expType;
                if(!isNullOrBlank(expType)){
                    resultList.push({
                        name:expType,
                        type:2
                    });
                }
            }else{
                var $expType = $(that.element).find('select[name="expType"] option:selected');
                that._filterData.expType = $expType.val();
                if(!isNullOrBlank($expType.val())){
                    resultList.push({
                        name:$expType.text(),
                        type:2
                    });
                }
            }


            //时间
            var timeData = $(that.element).find('#timeSelect').m_filter_time_new('getTimeData');
            that._filterData.startDate = timeData.startTime;
            that._filterData.endDate = timeData.endTime;

            if(!isNullOrBlank(timeData.days)){
                resultList.push({
                    name:timeData.days,
                    type:3
                });
            }else if(!isNullOrBlank(that._filterData.startDate) || !isNullOrBlank(that._filterData.endDate)){
                resultList.push({
                    name:momentFormat(that._filterData.startDate,'YYYY/MM/DD')+'~'+momentFormat(that._filterData.endDate,'YYYY/MM/DD'),
                    type:3
                });
            }

            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//组织
                    that.init();

                }else if(type==2){//类型,重新选择第一个

                    if(that.settings.doType==1){

                        $(that.element).find('input[name="expType"]').iCheck('uncheck');
                        $(that.element).find('button[data-action="search"]').click();

                    }else{
                        $(that.element).find('select[name="expType"]').val(that._expTypeList&&that._expTypeList.length>0?that._expTypeList[0].id:'').trigger('change');
                        $(that.element).find('button[data-action="search"]').click();
                    }

                }else if(type==3){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-action="search"]').click();

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
