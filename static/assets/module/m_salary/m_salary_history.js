/**
 * 任务签发-状态流转
 * Created by wrb on 2018/9/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_salary_history",
        defaults = {
            isDialog:true,
            month:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_salary/m_salary_history',{});
            that.renderDialog(html,function () {

                that.renderDataList();
            });
        }
        //渲染列表内容
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                var month = '';
                if(that.settings.month!=null)
                    month = momentFormat(that.settings.month,'YYYY年MM月')

                S_layer.dialog({
                    title:that.settings.title || month+'工资计算表变更记录',
                    area : '850px',
                    fixed:true,
                    scrollbar:false,
                    content:html,
                    cancelText:'关闭',
                    cancel:function () {
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }

        }
        //渲染list
        , renderDataList:function () {
            var that = this;

            var option = {};
            option.param = {};
            option.param = {
                month:that.settings.month,
                companyId:that._currentCompanyId
            };

            paginationFun({
                $page: $(that.element).find('#data-pagination-container'),
                loadingId: '.m-salary-history .data-list-box',
                url: restApi.url_listHistoryForSalary,
                params: option.param
            }, function (response) {

                if (response.code == '0') {

                    var html = template('m_salary/m_salary_history_list',{
                        dataList:response.data.data,
                        pageIndex:$(that.element).find('#data-pagination-container').pagination('getPageIndex')
                    });
                    $(that.element).find('.data-list-container').html(html);

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
