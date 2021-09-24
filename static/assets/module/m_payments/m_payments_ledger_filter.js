/**
 * 收支总览－收支明细-台账-筛选
 * Created by wrb on 2019/7/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_payments_ledger_filter",
        defaults = {
            doType:1,//1=台账，2=台账表2、表3、表4，3=项目收支表一
            filterData:null,
            firstRenderCallBack:null,
            searchCallBack:null,
            treeRenderCallBack:null,
            refreshBtnCallBack:null,
            renderDataCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._selectedOrg = null;//当前组织筛选-选中组织对象
        this._feeTypeNameList  = [];
        this._feeTypeParentNameList  = [];
        this._feeList = [];
        this._fromCompanyList  = [];
        this._toCompanyList  = [];
        this._dataInfo = null;

        this._filterData = this.settings.filterData;
        this._postData = null;//请求数据
        this._extendDataBySelectOrg = null;//组织树请求返回的数据(extendData)
        this._isMyDataFlag = 1;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            //请求是否有 我的相关的  和  请求组织架构的
            if(that.settings.doType==3){
                var param = {};
                param.url = restApi.url_getMenuRole;
                param.postData = {};
                param.postData.permissionCode = '40001301';
                m_ajax.postJson(param, function (response) {
                    if (response.code == '0') {
                        that._isMyDataFlag = response.data.isMyDataFlag;
                        that.renderPage(0);
                    } else {
                        S_layer.error(response.info);
                    }
                });
            }else {
                that.renderPage(0);
            }

        }
        //初始化数据并加载模板(t==0=第一次渲染)
        ,renderPage:function (t) {
            var that = this;
            var html = template('m_payments/m_payments_ledger_filter',{
                doType:that.settings.doType,
                isMyDataFlag:that._isMyDataFlag
            });
            $(that.element).html(html);

            $(that.element).find('#timeSelect').m_filter_time_new({
                label:'日&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;期',
                type: that.settings.doType==1||that.settings.doType==3?1:3,
                changedCallBack:function () {
                    var timeData = $(that.element).find('#timeSelect').m_filter_time_new('getTimeData');
                    that._filterData.startDate = timeData.startTime;
                    that._filterData.endDate = timeData.endTime;
                    that.getFeeType(function () {
                        that.renderFeeTypeParent();
                        that.renderFeeType();
                    });
                }
            },true);

            $(that.element).find('#projectStatusSelect').m_filter_select_new({
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

            var param = {permissionCode:'400012'};
            if(that.settings.doType==1)
                param.managerPermissionCode = '40001303';
            if(that.settings.doType==3)
                param.permissionCode = '40001301';
            if($(that.element).find('#selectOrg').length>0){
                $(that.element).find('#selectOrg').m_org_chose_byTree({
                    type:that.settings.doType==1?5:null,
                    param : param,
                    //selectedId:window.currentCompanyId,
                    renderCallBack:function (extendData) {
                        that._extendDataBySelectOrg = extendData;
                        if(that.settings.treeRenderCallBack)
                            that.settings.treeRenderCallBack(that._extendDataBySelectOrg);
                    },
                    selectedCallBack:function (data,childIdList,extendData) {
                        that._selectedOrg = data;
                        that._filterData.selectOrgId = data.id;
                        that._filterData.selectOrgName = data.text;
                        that._filterData.companyIdList = childIdList;
                        that._extendDataBySelectOrg = extendData;
                        var isMyData = $(that.element).find('input[name="isMyData"]:checked').val();

                        if(isMyData==1)
                            return;

                        that.getFeeType(function () {
                            that.renderFeeTypeParent();
                            that.renderFeeType();

                            if(t==0){
                                if(that.settings.renderDataCallBack)
                                    that.settings.renderDataCallBack(that._filterData,that._postData,isMyData);
                            }
                        });
                    }
                },true);
            }else{
                that.getFeeType(function () {
                    that.renderFeeTypeParent();
                    that.renderFeeType();

                    if(t==0){
                        if(that.settings.renderDataCallBack)
                            that.settings.renderDataCallBack(that._filterData,that._postData,that._isMyDataFlag);
                    }
                });
            }


            that.initICheck();
            that.bindBtnActionClick();
            that.initICheckByIsMyData();
        }
        //获取收支分类 feeTypeParentList feeTypeParentList==null0为一级，feeTypeParentList!=null则查询此子类
        ,getFeeType:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_getTitleFilter;
            option.postData = {};
            /*option.postData.feeTypeParentList  = that._filterData.feeTypeParentList;
            if(that._selectedOrg==null){
                option.postData.combineCompanyId=window.currentCompanyId;
            }else{
                option.postData.combineCompanyId=that._selectedOrg.id;
            }*/

            var filterData = $.extend(true, {}, that._filterData);
            filterData.feeTypeParentList = null;
            filterData.combineCompanyId = null;
            option.postData = filterParam(filterData);

            if(that.settings.doType==3){
                var isMyData =　$(that.element).find('input[name="isMyData"]:checked').val();
                if(isMyData==undefined){
                    isMyData = that._isMyDataFlag==1?1:0;
                }
                option.postData.isMyData = isMyData;
                option.postData.feeColList= [3,5];
            }

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._postData = response.data;
                    that._feeList  = response.data.feeList;
                    that._feeTypeNameList  = response.data.feeTypeNameList;
                    that._feeTypeParentNameList  = response.data.feeTypeParentNameList;
                    if(callBack!=null)
                        callBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //checkbox渲染
        ,initICheck:function () {
            var that = this;

            var ifClicked = function (e) {
                //$(this).iCheck('check');
                var selectType = $(this).val();
                if(selectType=='1'){

                    $(that.element).find('.fee-type-parent-box').removeClass('hide');
                    $(that.element).find('.fee-type-box').addClass('hide');

                }else{

                    $(that.element).find('.fee-type-parent-box').addClass('hide');
                    $(that.element).find('.fee-type-box').removeClass('hide');

                    /*that.getFeeType(function () {
                        that.renderFeeType();
                    });*/
                }
            };
            $(that.element).find('input[name="feeSelectType"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifClicked',ifClicked);
        }
        //渲染分类子项
        ,renderFeeType:function () {
            var that = this;
            var feeTypeHtml = template('m_project_cost/m_project_cost_table1_fee_type_filter',{
                feeTypeNameList:that._feeTypeNameList
            });
            $(that.element).find('.fee-type-box').html(feeTypeHtml);

            //初始化checkbox
            var checkFun = function ($this,isPCheck) {
                //that._filterData.feeTypeParentList = [];
                var $col = $this.parents('.col-sm-12');
                if($this.val()=='0'){//父checkbox

                    $col.find('input[name="feeType"]').prop('checked',isPCheck);
                    $col.find('input[name="feeType"]').iCheck('update');

                }else{

                    if($col.find('input[name="feeType"][value!="0"]:checked').length==$col.find('input[name="feeType"][value!="0"]').length){
                        $col.find('input[name="feeType"][value="0"]').prop('checked',true);
                        $col.find('input[name="feeType"][value="0"]').iCheck('update');
                    }else{
                        $col.find('input[name="feeType"][value="0"]').prop('checked',false);
                        $col.find('input[name="feeType"][value="0"]').iCheck('update');
                    }
                }

            };
            var ifChecked = function (e) {


                checkFun($(this),true);

            };
            var ifUnchecked = function (e) {

                checkFun($(this),false);

            };
            $(that.element).find('input[name="feeType"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked);

            //展示更多分类子项
            $(that.element).find('button[data-click-action="moreFeeType"]').on('click',function (e) {
                var $this = $(this);
                if($this.find('i').hasClass('fa-angle-down')){
                    $this.closest('.fee-type-box').find('.fee-type-panel div[data-index]:gt(3)').removeClass('hide');
                    $this.find('i').removeClass('fa-angle-down').addClass('fa-angle-up');
                    $this.find('span').text('收起');
                }else{
                    $this.closest('.fee-type-box').find('.fee-type-panel div[data-index]:gt(3)').addClass('hide');
                    $this.find('i').addClass('fa-angle-down').removeClass('fa-angle-up');
                    $this.find('span').text('更多');
                }
                return false;
                stopPropagation(e);
            });
        }
        //渲染收支分类
        ,renderFeeTypeParent:function () {
            var that = this;

            var feeTypeHtml = template('m_project_cost/m_project_cost_table1_fee_type_parent_filter',{
                feeTypeParentNameList:that._feeTypeParentNameList
            });
            $(that.element).find('.fee-type-parent-box').html(feeTypeHtml);

            //初始化checkbox
            var feeParentCheck = function ($this,isPCheck) {

                var $col = $this.parents('.fee-type-parent-box');
                if($this.val()=='0'){//父checkbox

                    $col.find('input[name="feeTypeParent"]').prop('checked',isPCheck);
                    $col.find('input[name="feeTypeParent"]').iCheck('update');

                }else{

                    if($col.find('input[name="feeTypeParent"][value!="0"]:checked').length==$col.find('input[name="feeTypeParent"][value!="0"]').length){
                        $col.find('input[name="feeTypeParent"][value="0"]').prop('checked',true);
                        $col.find('input[name="feeTypeParent"][value="0"]').iCheck('update');
                    }else{
                        $col.find('input[name="feeTypeParent"][value="0"]').prop('checked',false);
                        $col.find('input[name="feeTypeParent"][value="0"]').iCheck('update');
                    }
                }
            };

            var ifCheckedByFeeParent = function (e) {

                feeParentCheck($(this),true);
            };
            var ifUncheckedByFeeParent = function (e) {

                feeParentCheck($(this),false);

            };
            $(that.element).find('input[name="feeTypeParent"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifChecked.s', ifCheckedByFeeParent).on('ifUnchecked.s', ifUncheckedByFeeParent);

        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];

            var isMyData = $(that.element).find('input[name="isMyData"]:checked').val();
            if($(that.element).find('#selectOrg .company-name').length>0 && (isMyData==0 || isMyData==undefined)){

                //组织
                resultList.push({
                    name:$(that.element).find('#selectOrg .company-name').text(),
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


                var timeFormat = 'YYYY-MM-DD';
                if(that.settings.doType==2){
                    timeFormat =  'YYYY-MM';
                }

                resultList.push({
                    name:momentFormat(that._filterData.startDate,timeFormat)+'~'+momentFormat(that._filterData.endDate,timeFormat),
                    type:2
                });
            }

            if(that.settings.doType==3){
                //项目状态
                var statusData = $(that.element).find('#projectStatusSelect').m_filter_select_new('getSelectionData');
                that._filterData.status = statusData.id;
                if(!isNullOrBlank(statusData.name)){
                    resultList.push({
                        name:'项目状态：'+statusData.name,
                        type:5
                    });
                }
                //合同状态
                var signDateStatusData = $(that.element).find('#signDateStatusSelect').m_filter_select_new('getSelectionData');
                that._filterData.signDateStatus = signDateStatusData.id;
                if(!isNullOrBlank(signDateStatusData.name)){
                    resultList.push({
                        name:'合同状态：'+signDateStatusData.name,
                        type:6
                    });
                }
            }

            that._filterData.classicType = $(that.element).find('input[name="feeSelectType"]:checked').val();

            if(that._filterData.classicType=='2'){//分类子项

                //收支分类子项
                that._filterData.feeTypeList = [];
                that._filterData.feeTypeParentList = [];//置空
                var feeType = [];

                $(that.element).find('.fee-type-panel .col-sm-12').each(function (i) {
                    var $this = $(this);
                    var flag = $this.find('input[name="feeType"][value="0"]').is(':checked');
                    if(flag){
                        feeType.push($this.find('input[name="feeType"][value="0"]').parents('.i-checks').find('.i-checks-span').text());
                    }
                    $this.find('input[name="feeType"][value!="0"]:checked').each(function (i) {
                        var feeTypeName = $(this).val(),feeParentTypeName = $(this).attr('data-parent-name');
                        that._filterData.feeTypeList.push(feeParentTypeName+'_'+feeTypeName);
                        if(!flag){
                            feeType.push(feeTypeName);
                        }
                    });
                });

                if(!isNullOrBlank(feeType)){
                    feeType= feeType.join(',');
                }
                if(!isNullOrBlank(feeType)){
                    resultList.push({
                        name:feeType,
                        type:4
                    });
                }

            }else{//收支分类

                //收支分类
                that._filterData.feeTypeList = [];//置空
                that._filterData.feeTypeParentList = [];
                var feeTypeParent = [];
                $(that.element).find('input[name="feeTypeParent"][value!="0"]:checked').each(function (i) {
                    feeTypeParent.push($(this).val());
                    that._filterData.feeTypeParentList.push($(this).val());
                });
                if($(that.element).find('input[name="feeTypeParent"][value="0"]').is(':checked')){//父选中
                    resultList.push({
                        name: '全部',
                        type: 3
                    });
                }else{
                    if(!isNullOrBlank(feeTypeParent)){
                        feeTypeParent= feeTypeParent.join(',');
                    }
                    if(!isNullOrBlank(feeTypeParent)) {
                        resultList.push({
                            name: feeTypeParent,
                            type: 3
                        });
                    }
                }

            }



            //渲染筛选结果
            $('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $('.filter-result-col').append(html);

            $('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//组织

                    $(that.element).find('button[data-click-action="refreshBtn"]').click();

                }else if(type==2){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-click-action="search"]').click();

                }else if(type==3){//收支分类

                    $(that.element).find('input[name="feeType"],input[name="feeTypeParent"]').prop('checked',false);
                    $(that.element).find('input[name="feeType"],input[name="feeTypeParent"]').iCheck('update');
                    $(that.element).find('button[data-click-action="search"]').click();

                }else if(type==4){//收支分类子项

                    $(that.element).find('input[name="feeType"]').prop('checked',false);
                    $(that.element).find('input[name="feeType"]').iCheck('update');
                    $(that.element).find('button[data-click-action="search"]').click();

                }else if(type==5&&that.settings.doType==3){//项目状态

                    $(that.element).find('#projectStatusSelect').m_filter_select_new('clearSelection');
                    $(that.element).find('button[data-click-action="search"]').click();

                }else if(type==6&&that.settings.doType==3){//合同状态

                    $(that.element).find('#signDateStatusSelect').m_filter_select_new('clearSelection');
                    $(that.element).find('button[data-click-action="search"]').click();

                }

            });
        }
        //按钮事件绑定
        ,bindBtnActionClick:function () {
            var that = this;
            $(that.element).find('button[data-click-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-click-action');
                switch (dataAction){
                    case 'search':
                        that.renderFilterResult();
                        if(that.settings.searchCallBack)
                            that.settings.searchCallBack(that._filterData);
                        break;
                    case 'refreshBtn':
                        if(that.settings.refreshBtnCallBack)
                            that.settings.refreshBtnCallBack(that._filterData);
                        break;
                }
                return false;
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
        ,getMyDataFlag:function(){

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
