/**
 * Created by wrb on 2020/7/22.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_projectList_index",
        defaults = {
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        /******************* 筛选条件 值预存 *********************/
        this._breadcrumb = [{name:'项目管理'}];

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.getNoticeData(function (data) {
                //渲染容器
                $(that.element).html(template('m_projectList/m_projectList_index', data));
                $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
            });

        }
        //获取动态数据
        ,getNoticeData:function (callBack) {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listLastNotice;
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