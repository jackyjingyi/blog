/**
 * 项目动态
 * Created by wrb on 2020/7/29.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_dynamics",
        defaults = {
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;


        this._projectTypeList = [];//项目类型列表
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that._filterData = {
                pageIndex : 0,
                pageSize : 10
            };
            var dataAction = that.settings.dataAction;
            if(isNullOrBlank(dataAction))
                dataAction = $(that.element).find('ul.secondary-menu-ul li:first').attr('id');

            that.switchPage(dataAction);

            var html = template('m_project/m_project_dynamics', {});
            $(that.element).html(html);
            that.initSelect2ByProjectType();
            that.initSelect2ByOrgZone();
            $(that.element).find('#timeSelect').m_filter_time_new({label:'日&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;期'},true);
            that.renderContent(1)
        }

        //切换页面
        , switchPage: function (dataAction) {
            var that = this;
            $(that.element).find('ul.secondary-menu-ul li[id="'+dataAction+'"]').addClass('active').siblings().removeClass('active');
        }
        /**
         *
         * @param t=1,第一次渲染
         * @param callBack
         */
        ,renderContent:function (t,callBack) {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_pageProjectNotice;
            option.postData = filterParam(that._filterData);

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    if(response.data.data && response.data.data.length>0){

                        $(that.element).find('.no-data').hide();

                        var html = template('m_project/m_project_dynamics_item',{dataList:response.data.data});
                        $(that.element).find('.project-notice').append(html);

                        var pageTotal = (that._filterData.pageIndex+1)*that._filterData.pageSize;
                        if(pageTotal>=response.data.total){
                            $(that.element).find('button[data-action="btnPageNext"]').hide();
                        }else{
                            $(that.element).find('button[data-action="btnPageNext"]').show();
                        }
                        that._filterData.pageIndex++;
                        that.renderFilterResult();
                        that.bindActionClick();

                    }else if(t==1){

                        $(that.element).find('.no-data').show();
                    }
                    $(that.element).find('#totalBySearch').html(response.data.total);

                    if(callBack)
                        callBack(response.data.data);

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {

                var $this = $(this),dataAction=$this.attr('data-action');

                switch (dataAction){
                    case 'btnPageNext':
                        that.renderContent(0,function (data) {
                            if(data==null || data.length==0){
                                $this.parent().html('<p class="fc-v1-grey">没有更多数据了</p>');
                            }
                        });
                        break;
                    case 'search':
                        that._filterData = {
                            pageIndex : 0,
                            pageSize : 10
                        };
                        $(that.element).find('#vertical-timeline .project-notice').html('');
                        that.renderFilterResult();
                        that.renderContent(1);
                        break;
                    case 'refreshBtn':
                        that.init();
                        break;
                    case 'exportDetails'://导出
                        var data = $.extend(true, {}, that._filterData);
                        downLoadFile({
                            url:restApi.url_exportProjectDynamicFile,
                            data:filterParam(data),
                            type:1
                        });
                        break;
                }
                return false;

            });
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //项目类型
            var $projectTypeId = $(that.element).find('select[name="projectTypeId"]');
            //var $projectTypeId = $(that.element).find('select[name="projectTypeId"] option:selected');
            var projectTypeData = $projectTypeId.select2('data')[0];

            that._filterData.projectTypeId = $projectTypeId.val();
            that._filterData.type = projectTypeData.type;
            if(!isNullOrBlank(projectTypeData.id)){
                resultList.push({
                    name:projectTypeData.text,
                    type:1
                });
                if(isNullOrBlank(projectTypeData.pid)){
                    that._filterData.projectTypeId = null;
                }
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
            that._filterData.projectName = $.trim($(that.element).find('input[name="keyword"]').val());
            if(!isNullOrBlank(that._filterData.projectName)){
                resultList.push({
                    name:that._filterData.projectName,
                    type:4
                });
            }

            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//项目类型

                    $(that.element).find('select[name="projectTypeId"]').val('').trigger('change');
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
        //获取项目类型
        ,getProjectType:function (callBack) {
            var option  = {};
            option.url = restApi.url_listProjectTypeForSetProject;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    if(callBack)
                        callBack(response.data);
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //项目类型
        ,initSelect2ByProjectType:function () {
            var that = this;
            that.getProjectType(function (data) {
                var staffArr = [{id: '',text: '全部'}];
                //数据结构转换
                if(data!=null && data.length>0){
                    $.each(data, function (i, o) {
                        var obj = {
                            id: o.type,
                            text: o.name,
                            type:o.type,
                            _resultId:o.type
                        };
                        staffArr.push(obj);
                        if(o.childList){
                            $.each(o.childList,function (si,s) {
                                staffArr.push({ id: s.id,text: s.name,type:s.type,_resultId:s.id,pid:o.type})
                            });
                        }
                    });
                }
                that._projectTypeList = staffArr;
                var $select = $(that.element).find('select[name="projectTypeId"]');
                $select.select2({
                    tags:true,
                    allowClear: false,
                    //containerCssClass:'select-sm',
                    minimumResultsForSearch: -1,
                    language: "zh-CN",
                    width:'200px',
                    //placeholder: {id: '',text: '请选择项目类型'},
                    dir:'123',
                    data: staffArr
                });
                $select.on('select2:open select2:opening', function (e) {

                    var t = setTimeout(function () {
                        $.each(that._projectTypeList, function (i, item) {
                            if(!isNullOrBlank(item._resultId)){
                                var $li = $('.select2-container .select2-results__options li[id="' + item._resultId + '"]');
                                if (isNullOrBlank(item.pid)) {
                                    $li.css('font-weight', '600');
                                } else {
                                    $li.css('padding-left', '15px');
                                }
                            }
                        });
                        clearTimeout(t);
                    });
                });
            });

        }
        //初始化公司select2
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
                    //$select.val(that._currentCompanyId).trigger('change');

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
