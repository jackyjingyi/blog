/**
 * 费控任务
 * Created by wrb on 2018/11/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_cost",
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

        this._dataList = [];//每页数据
        this._status = 0;
        this._projectId = null;
        this._filterData = {
            projectName:null
        };
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_task/m_task_cost',{});
            $(that.element).html(html);

            that.renderDataList();


        }
        //渲染台账list
        , renderDataList:function (t) {
            var that = this;

            var option = {};
            option.param = {};
          //  option.param = filterParam(that._filterData);
            option.param = {
                status:that.settings.status,
                projectId:that.settings.projectId
            };
            paginationFun({
                //eleId: '#data-pagination-container',
                $page:$(that.element).find('#data-pagination-container'),
                loadingId: '.data-list-box',
                url: restApi.url_listTaskForFeeTask,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    that._dataList = response.data.data;
                    var html = template('m_task/m_task_cost_content',{
                        dataList:response.data.data,
                        pageIndex:$(that.element).find('#data-pagination-container').pagination('getPageIndex')
                    });
                    $(that.element).find('.data-list-container').html(html);
                    that.filterActionClick();
                    that.bindActionClick();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action="toTaskContent"]').off('click').on('click',function () {
                var $this = $(this);
                var dataId = $this.closest('tr').attr('data-id');
                //获取行数据
                var dataItem = getObjectInArray(that._dataList,dataId);

                switch (dataItem.feeType){
                    case '2':
                        location.hash = '/project/cost?type=collectionPlan&id='+dataItem.projectId+'&projectName='+encodeURI(dataItem.projectName)+'&dataCompanyId='+(dataItem.companyId?dataItem.companyId:window.currentCompanyId);
                        return false;
                        break;
                    case '1':
                        location.hash = '/project/cost?type=paymentPlan&id='+dataItem.projectId+'&projectName='+encodeURI(dataItem.projectName)+'&dataCompanyId='+(dataItem.companyId?dataItem.companyId:window.currentCompanyId);
                        return false;
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
                    case 'filter_projectName': //项目

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
