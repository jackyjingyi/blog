/**
 * Created by Wuwq on 2017/1/5.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_projectList",
        defaults = {
            postData: null,
            renderCallback:null,//渲染页面完成后事件
            renderListCompanyCallBack:null,//渲染项目范围
            query:{},//query.businessType（1：业务类型，2：研发类型）
            dataAction: 'myProjectList'//{myProjectList,projectOverview}
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyId = window.currentCompanyId;
        this._currentCompanyUserId = window.currentCompanyUserId;
        this._headerList = null;
        this._listCompanyInfo = null;//视图组织

        this._type = this.settings.dataAction=='myProjectList'?0:1;

        if(this.settings.query.businessType==2){
            this._type = this.settings.dataAction=='myProjectList'?3:4;
        }
        // this._cookiesMarkAction = 'myProjectList_'+(this.settings.query.businessType?this.settings.query.businessType:1);
        this._cookiesMarkAction = 'myProjectList_';
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this,option = {};

            //筛选条件
            that._filterData = {
                projectCreateDateStart:'',
                projectCreateDateEnd:'',
                status:'',
                // businessType:that.settings.query.businessType?that.settings.query.businessType:1
            };
            //渲染容器
            $(that.element).html(template('m_projectList/m_projectList', {
                type:that._type,
                // businessType:that.settings.query.businessType
            }));
            that.renderDepart();
            that.bindActionClick();
            that.initSelect2();
            that.renderListHeader(0);
            rolesControl();

            $(that.element).find('#timeSelect').m_filter_time_new({label:'立&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;项'},true);
            $(that.element).find('#statusSelect').m_filter_select_new({
                label:'状&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;态',
                dataList:[
                    {id:'',name:'全部'},
                    {id:4,name:'待审批'},
                    {id:0,name:'进行中'},
                    {id:2,name:'已完成'},
                    {id:1,name:'已暂停'},
                    {id:3,name:'已终止'}]
            });

        }
        //渲染列表头部
        ,renderListHeader:function (t) {
            var that = this;
            var option = {};
            option.dataAction = that._cookiesMarkAction;
            option.type = that._type;
            // option.businessType = that.settings.query.businessType;
            option.isSetCookies = false;
            if(t==0)
                option.isFirstLoad = true;

            option.renderCallBack = function (data) {
                that._headerList = data;
                that.renderListContent(t);
            };
            option.filterCallBack = function (data) {

                that._filterData = $.extend({},that._filterData,data);
                that._filterData.pageIndex = 0;
                that.renderListContent();
            };
            $(that.element).find('.data-list-container table thead').m_field_list_header(option,true);
        }
        ,renderListContent:function (t) {
            var that = this;

            if(that.settings.dataAction=='projectOverview'){
                that._filterData.type = 1;
            }else{
                that._filterData.type = null;
            }
            if(that._filterData.pageIndex&&that._filterData.pageIndex==-1){
                that._filterData.pageIndex = 0;
            }
            //that._filterData.keyword = $.trim($(that.element).find('input[name="keyword"]').val());
            var option = {};
            option.url = restApi.url_listProject;
            option.headerList = that._headerList;
            option.isSetCookies = true;
            option.dataAction = that._cookiesMarkAction;
            option.aStr = 'projectName';
            option.trClass = 'curp';
            option.param = filterParam(that._filterData);
            if(that.settings.dataAction=='projectOverview'){
                option.projectType = 1;
            }else{
                option.projectType  = null;
            }
            option.param.orgId = $(that.element).find('select[name="listCompany"]').val();

            option.renderCallBack = function (data,param) {

                that._filterData = param;
                if(that.settings.renderCallback)
                    that.settings.renderCallback(data);

                if(data && data.downProject!=1){
                    $(that.element).find('button[data-action="exportDetails"]').hide();
                }else{
                    $(that.element).find('button[data-action="exportDetails"]').show();
                }

                that.bindGotoProject();
                $(that.element).find('#totalBySearch').html(data.total);

                that.clearOrSetFilter();
                if(t==0){
                    that.renderFilterResult();
                }

            };
            if(t==0){
                option.isFirstLoad = true;
            }

            $(that.element).find('.data-list-container table tbody').m_field_list_row(option,true);
        }
        //跳转详情
        ,bindGotoProject: function () {
            var that = this;
            $(that.element).find('tr[data-id]').off('click').on('click', function (e) {
                var $this = $(this);
                if($this.hasClass('set-gray')){

                    var option = {};
                    var data = {};
                    option.dataInfo = {
                        id : $this.attr('data-form-id')
                    };
                    option.saveCallBack = function () {
                        that.renderListContent();
                    };
                    $('body').m_form_template_generate_details(option,true);

                }else{
                    var pId = $this.attr('data-id');//项目ID
                    var pName = $this.find('a[data-action="projectName"]').text();//项目名称
                    var businessType = $this.attr('businessType');
                    location.hash = '/project/basicInfo?id='+pId+'&projectName='+encodeURI(pName)+'&dataCompanyId='+window.currentCompanyId +'&businessType='+businessType;
                }
                stopPropagation(e);
                return false;
            });
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'search':
                        that._filterData.pageIndex = 0;
                        that.renderFilterResult();
                        that.renderListContent();
                        return false;
                        break;
                    case 'refreshBtn':
                        that.init();
                        return false;
                        break;
                    case 'searchProject':
                        that._filterData.keyword = $(that.element).find('input[name="keyword"]').val();
                        that.renderListContent();
                        break;
                    case 'setField'://设置字段
                        var option = {};
                        option.type = that._type;
                        // option.businessType = that.settings.query.businessType;
                        option.saveCallBack = function () {
                            that.renderListHeader();
                        };
                        $('body').m_field_settings(option,true);
                        return false;
                        break;
                    case 'exportDetails'://导出
                        downLoadFile({
                            url:restApi.url_exportProjectList,
                            data:filterParam(that._filterData),
                            type:1
                        });
                        return false;
                        break;
                }
            });
        }
        //初始化select2
        ,initSelect2:function () {
            var that = this;

            if($(that.element).find('select[name="listCompany"]').length>0){

                var renderSelect = function (data) {
                    var staffArr = [{id:'',text:'全部'}];
                    if(data!=null && data.length>0){
                        $.each(data, function (i, o) {
                            staffArr.push({
                                id: o.id,
                                text: o.orgName
                            });
                        });
                    }

                    var $companySelect2 = $(that.element).find('select[name="listCompany"]').select2({
                        tags: false,
                        allowClear: false,
                        minimumResultsForSearch: -1,
                        width:'300px',
                        language: "zh-CN",
                        containerCssClass:'select-sm',
                        //placeholder: '请选择项目范围',
                        data: staffArr
                    });

                    $companySelect2.on('select2:open select2:opening', function (e) {

                    });

                    if(that.settings.renderListCompanyCallBack)
                        that.settings.renderListCompanyCallBack(data.viewAllProject);
                };


                if(that._listCompanyInfo==null){
                    var option  = {};
                    //option.classId = that.element;
                    //option.url = restApi.url_listCompanyViewProjectAll;
                    option.url = restApi.url_listZone;
                    option.postData = {};
                    m_ajax.postJson(option,function (response) {
                        if(response.code=='0'){

                            that._listCompanyInfo = response.data==null?{}:response.data;
                            renderSelect(that._listCompanyInfo);

                        }else {
                            S_layer.error(response.info);
                        }
                    })
                }else{
                    renderSelect(that._listCompanyInfo);
                }

            }
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //组织
            var $company = $(that.element).find('select[name="listCompany"] option:selected');
            var orgText = $company.text();
            if(!isNullOrBlank($company.val())){
                resultList.push({
                    name:orgText,
                    type:1
                });
            }
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
                    name:statusData.name,
                    type:3
                    //,isDelete:statusData.name=='全部'?0:1
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

            //渲染筛选结果
            $('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $('.filter-result-col').append(html);

            $('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//组织

                    $(that.element).find('button[data-action="refreshBtn"]').click();

                }else if(type==2){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==3){//状态

                    $(that.element).find('#statusSelect').m_filter_select_new('clearSelection');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==4){//项目搜索

                    $(that.element).find('input[name="keyword"]').val('');
                    $(that.element).find('button[data-action="search"]').click();

                }

            });
        }
        //清空或赋上筛选条件
        ,clearOrSetFilter:function () {
            var that = this;

            if(!isNullOrBlank(that._filterData.companyId))
                $(that.element).find('select[name="listCompany"]').val(that._filterData.companyId).trigger('change');

            $(that.element).find('#timeSelect').m_filter_time_new('setTime',{
                startTime:that._filterData.projectCreateDateStart,
                endTime:that._filterData.projectCreateDateEnd
            });
            $(that.element).find('#statusSelect').m_filter_select_new('setSelection',!isNullOrBlank(that._filterData.status)?that._filterData.status:null);
            $(that.element).find('input[name="keyword"]').val(that._filterData.keyword?that._filterData.keyword:'');

        }
        //查询研究类型的部门
        ,renderDepart:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listStudyDepart;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    var html = template('m_projectList/m_projectList_depart', {
                        dataList:response.data
                    });
                    $(that.element).find('#listStudyDepart').html(html);
                    $(that.element).find('#listStudyDepart .section-row[data-action="selectDepart"]').off('click').on('click',function () {
                        that._filterData.createCompany = $(this).attr('data-id');
                        $(this).addClass('active').siblings().removeClass('active');
                        that.renderListContent();
                    });

                }else {
                    S_layer.error(response.info);
                }
            })
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
