/**
 * 轻量任务列表
 * Created by wrb on 2019/11/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;
        this._filterData = {};
        this._pageIndex = 0;//记录分页
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_light_project/m_light_project', {title:that._title});
            $(that.element).html(html);

            that.renderGroupList(function () {

                that.renderPage();
            });
        }
        ,reInit:function () {
            var that = this;
            var html = template('m_light_project/m_light_project', {title:that._title});
            $(that.element).html(html);
            that.renderPage();
        }
        ,renderPage:function () {
            var that = this;
            $(that.element).find('#timeSelect').m_filter_time_new({label:'创建时间'},true);

            var groupList = [{id:'',name:'全部'}];
            groupList = groupList.concat(that._groupList);

            $(that.element).find('#groupSelect').m_filter_select_new({
                label:'任务分类',
                dataList:groupList,
                renderCallBack:function () {
                    $(that.element).find('#groupSelect .form-group').append('<button class="btn btn-link no-padding" data-action="addProjectGroup"><i class="fa fa-plus f-s-m"></i></button>');
                }
            });
            $(that.element).find('#statusSelect').m_filter_select_new({
                label:'任务状态',
                dataList:[
                    {id:'',name:'全部'},
                    {id:2,name:'未开始'},
                    {id:0,name:'进行中'},
                    {id:3,name:'已暂停'},
                    {id:4,name:'已终止'},
                    {id:1,name:'已完成'}]
            });
            that.renderFilterResult();
            that.renderDataList();
        }
        ,initGroupSelect2:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_listGroup;
            option.postData = {};
            option.postData.type = 1;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var data = [];
                    $.each(response.data, function (i, o) {
                        if(!isNullOrBlank(o.name)){
                            data.push({
                                id: o.id,
                                text: o.name
                            });
                        }
                    });
                    $(that.element).find('select[name="groupList"]').select2({
                        allowClear: false,
                        language: "zh-CN",
                        containerCssClass:'select-sm',
                        width: '200',
                        minimumResultsForSearch: Infinity,
                        //placeholder: "请选择任务分组!",
                        data: data
                    });
                    $(that.element).find('select[name="groupList"]').on("change", function (e) {
                        that.renderDataList();
                    });
                    if(data && data.length>0 && data[0].id){
                        $(that.element).find('select[name="groupList"]').val(data[0].id).trigger('change');
                    }else{
                        that.renderDataList();
                    }


                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,renderGroupList:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_lightProject_listGroup;
            option.postData = {};
            option.postData.type = 1;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    /*var activeId = $(that.element).find('#groupList .list-group .list-group-item.active').attr('data-id');
                    if(activeId==undefined)
                        activeId = '';

                    var html = template('m_light_project/m_light_project_group', {groupList:response.data,activeId:activeId});
                    $(that.element).find('#groupList').html(html);*/
                    that._groupList = response.data;

                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //加载数据
        ,renderDataList: function (t) {
            var that = this;

            var option = {};
            option.param ={};
            /*var groupId = $(that.element).find('#groupList .list-group .list-group-item.active').attr('data-id');
            if(!isNullOrBlank(groupId))
                option.param.groupId = groupId;*/

            option.param = filterParam($.extend({}, option.param, that._filterData));

            paginationFun({
                eleId: '#data-pagination-container',
                loadingId: '.data-list-container',
                url: restApi.url_lightProject_listLightProject,
                params: option.param
            }, function (response) {
                // data为ajax返回数据
                if (response.code == '0') {

                    var html = template('m_light_project/m_light_project_list', {dataList:response.data.data});
                    $(that.element).find('.data-list-container').html(html);
                    $(that.element).find('#totalBySearch').html(response.data.total);
                    that.bindActionClick();
                    that.sortActionClick();

                } else {
                    S_layer.error(response.info);
                }
            });

        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'addLightProject':

                        $('body').m_light_project_temp_select({
                            saveCallBack:function () {
                                that.renderDataList();
                            }
                        });

                        return false;
                        break;

                    case 'editGroupName'://编辑分组
                    case 'addProjectGroup'://添加分组

                        var postData={type:1},fieldValue = null;
                        if($this.closest('.list-group-item').length>0){
                            fieldValue = $this.closest('.list-group-item').find('.group-name').text();
                            postData.id = $this.closest('.list-group-item').attr('data-id');

                        }

                        $this.m_floating_popover({
                            content: '<div class="add-group"></div>',
                            placement: 'bottomRight',
                            popoverClass:'z-index-layer',
                            renderedCallBack: function ($popover) {
                                $popover.find('.add-group').m_input_save({
                                    isDialog:false,
                                    postData:postData,
                                    postUrl:restApi.url_lightProject_saveGroup,
                                    fieldKey:'groupName',
                                    fieldName:'分组名称',
                                    fieldValue:fieldValue,
                                    saveCallBack:function () {
                                        $this.m_floating_popover('closePopover');//关闭浮窗
                                        /*that.renderGroupList(function () {
                                            that.bindActionClick();
                                        });*/
                                        that.init();
                                    },
                                    cancelCallBack:function () {
                                        $this.m_floating_popover('closePopover');//关闭浮窗
                                    }

                                });
                            }
                        }, true);
                        break;
                    case 'delGroup':
                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var $group = $this.closest('.list-group-item');
                            var option = {};
                            option.url = restApi.url_lightProject_deleteLightProjectGroup;
                            option.postData = {};
                            option.postData.id = $group.attr('data-id');
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    var activeId = $(that.element).find('#groupList .list-group .list-group-item.active').attr('data-id');
                                    if(activeId==$group.attr('data-id')){//删除的是选中的
                                        that.init();
                                    }else{
                                        $group.remove();
                                    }

                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;
                    case 'selectProjectGroup':

                        $this.parents('li').addClass('active').siblings().removeClass('active');
                        that.renderDataList();
                        return false;
                        break;

                    case 'search':

                        that.renderFilterResult();
                        that.renderDataList();
                        return false;
                        break;
                    case 'refreshBtn':
                        that._filterData = {};
                        that.reInit();
                        break;
                }

            });
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //时间
            var timeData = $(that.element).find('#timeSelect').m_filter_time_new('getTimeData');
            that._filterData.startCreateDate = timeData.startTime;
            that._filterData.endCreateDate = timeData.endTime;

            if(!isNullOrBlank(timeData.days)){
                resultList.push({
                    name:timeData.days,
                    type:1
                });
            }else if(!isNullOrBlank(that._filterData.startCreateDate) || !isNullOrBlank(that._filterData.endCreateDate)){
                resultList.push({
                    name:momentFormat(that._filterData.startCreateDate,'YYYY/MM/DD')+'~'+momentFormat(that._filterData.endCreateDate,'YYYY/MM/DD'),
                    type:1
                });
            }
            //任务分类
            var groupData = $(that.element).find('#groupSelect').m_filter_select_new('getSelectionData');
            that._filterData.groupId = groupData.id;
            if(!isNullOrBlank(groupData.name)){
                if(groupData.name=='全部'){
                    groupData.name= '全部分类';
                }
                resultList.push({
                    name:groupData.name,
                    type:2
                });
            }
            //任务状态
            var statusData = $(that.element).find('#statusSelect').m_filter_select_new('getSelectionData');
            that._filterData.status = statusData.id;
            if(!isNullOrBlank(statusData.name)){
                if(statusData.name=='全部'){
                    statusData.name= '全部状态';
                }
                resultList.push({
                    name:statusData.name,
                    type:3
                });
            }

            //渲染筛选结果
            $('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $('.filter-result-col').append(html);

            $('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//时间

                    $(that.element).find('#timeSelect').m_filter_time_new('clearTime');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==2){//任务分类

                    $(that.element).find('#groupSelect').m_filter_select_new('clearSelection');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==3){//状态

                    $(that.element).find('#statusSelect').m_filter_select_new('clearSelection');
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

                    that.renderDataList();

                    e.stopPropagation();
                    return false;
                });
            });
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
