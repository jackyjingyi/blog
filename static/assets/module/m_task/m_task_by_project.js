/**
 * 我的任务
 * Created by wrb on 2020/5/18.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_by_project",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._projectList = [];//项目列表
        this._filterData = {};//筛选条件
        this._dataList = [];//列表
        this._projectId = null;//项目ID
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_task/m_task_by_project',{});
            $(that.element).html(html);
            
            $(that.element).find('#statusSelect').m_filter_select_new({
                label:'任务状态',
                dataList:[
                    {id:'',name:'全部'},
                    {id:'进行中',name:'进行中'},
                    {id:'验收中',name:'验收中'},
                    {id:'已完成',name:'已完成'},
                    {id:'已暂停',name:'已暂停'},
                    {id:'已终止',name:'已终止'}]
            });
            that.initProjectSelect2(function () {
                that.renderDataList();
            });
            
        }
        //渲染项目列表
        ,initProjectSelect2:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_listProjectForMyTask2;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var data = [];
                    $.each(response.data, function (i, o) {
                        data.push({
                            id: o.id,
                            text: o.name
                        });
                    });
                    that._projectList = data;
                    $(that.element).find('select[name="projectList"]').select2({
                        allowClear: false,
                        language: "zh-CN",
                        width: '200px',
                        minimumResultsForSearch: Infinity,
                        placeholder: "请选择项目!",
                        data: data
                    });
                    /*$(that.element).find('select[name="projectList"]').on('change', function (e) {
                        that.renderDataList();
                    });*/
                   if(callBack)
                       callBack();
                   
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染list
        ,renderDataList:function (t) {
            var that = this;

            var projectId = $(that.element).find('select[name="projectList"]').val();


            if(!isNullOrBlank(that._projectId) && projectId==that._projectId){
                that.renderDataListByFilter();
            }else{
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_listMyTask;
                option.postData = {};
                option.postData.projectId = projectId;

                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        that._projectId = projectId;
                        that._dataList = response.data;

                        that.renderDataListByFilter();

                    } else {
                        S_layer.error(response.info);
                    }
                });
            }


        }
        ,renderDataListByFilter:function () {
            var that = this;
            var newDataList = [];
            if(!isNullOrBlank(that._filterData.status)){
                $.each(that._dataList,function (i,item) {
                    if(that._filterData.status==item.statusName){
                        newDataList.push(item);
                    }
                })
            }else{
                newDataList = that._dataList;
            }
            var html = template('m_task/m_task_by_project_list',{
                dataList:newDataList
            });
            $(that.element).find('.data-list-container').html(html);
            $(that.element).find('#totalBySearch').html(newDataList.length);

            that.renderFilterResult();
            that.bindBtnActionClick();
            that.bindTrActionClick();
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
                        break;
                    case 'refreshBtn':
                        that.init();
                        break;
                }
                return false;
            });
        }
        ,bindTrActionClick:function () {
            var that = this;
            $(that.element).find('tr[data-member-type]').off('click').on('click',function () {
                var memberType = $(this).attr('data-member-type');

                var projectId = $(that.element).find('select[name="projectList"]').val();
                var projectName = $(that.element).find('select[name="projectList"] option:selected').text();
                var dataCompanyId = that._currentCompanyId;
                switch (memberType){
                    case '0'://立项--》项目基本信息
                        location.hash = '/project/basicInfo?id='+projectId+'&projectName='+encodeURI(projectName)+'&dataCompanyId='+dataCompanyId;
                        break;
                    case '1'://商务秘书 -》项目收支管理
                        location.hash = '/project/cost?id='+projectId+'&projectName='+encodeURI(projectName)+'&dataCompanyId='+dataCompanyId;
                        break;
                    case '2'://项目负责人 -》 订单管理
                        location.hash = '/project/taskIssue?id='+projectId+'&projectName='+encodeURI(projectName)+'&dataCompanyId='+dataCompanyId;
                        break;
                    case '3'://订单负责人 -》生产安排界面
                        location.hash = '/project/production?id='+projectId+'&projectName='+encodeURI(projectName)+'&dataCompanyId='+dataCompanyId;
                        break;
                    case '7'://经营助理 -》项目收支管理
                        location.hash = '/project/cost?id='+projectId+'&projectName='+encodeURI(projectName)+'&dataCompanyId='+dataCompanyId;
                        break;
                    case '8'://设计助理 -》 订单管理
                        location.hash = '/project/taskIssue?id='+projectId+'&projectName='+encodeURI(projectName)+'&dataCompanyId='+dataCompanyId;
                        break;
                    default://生产任务详情界面
                        location.hash = '/project/production?id='+projectId+'&projectName='+encodeURI(projectName)+'&dataCompanyId='+dataCompanyId;
                        break;
                }
            });
        }
        //渲染筛选结果
        ,renderFilterResult:function () {
            var that = this;
            var resultList = [];
            //项目
            resultList.push({
                name:$(that.element).find('select[name="projectList"] option:selected').text(),
                type:1
            });

            //任务状态
            var statusData = $(that.element).find('#statusSelect').m_filter_select_new('getSelectionData');
            if(!isNullOrBlank(statusData.name)){
                that._filterData.status = statusData.id;
                resultList.push({
                    name:statusData.name,
                    type:2
                });
            }

            $(that.element).find('.filter-result').remove();
            var html = template('m_filter/m_filter_result_show',{dataList:resultList});
            $(that.element).find('.filter-result-col').append(html);

            $(that.element).find('a[data-action="delSelectedFilter"]').on('click',function () {

                var $this = $(this),type = $this.attr('data-type');
                if(type==1){//项目

                    $(that.element).find('select[name="projectList"]').val(that._projectList[0].id).trigger('change');
                    $(that.element).find('button[data-action="search"]').click();

                }else if(type==2){//任务状态

                    $(that.element).find('#statusSelect').m_filter_select_new('clearSelection');
                    that._filterData.status = null;
                    $(that.element).find('button[data-action="search"]').click();

                }

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
