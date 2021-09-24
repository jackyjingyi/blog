/**
 * 项目模板管理
 * Created by wrb on 2019/9/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_temp_tab",
        defaults = {
              isEditIntroductionBack :false,//从编辑项目类型介绍返回的，需要定位到第二位
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project_temp/m_project_temp_tab', {companyVersion:window.companyVersion});
            $(that.element).html(html);


            $(that.element).find('a[data-toggle="tab"]').off('click').on('click',function () {
                var type = $(this).attr('data-type');
                switch (type){
                    case 'projectSettings':
                        $(that.element).find('div[data-type="projectSettings"]>.panel-body').m_project_temp({query:that.settings.query},true);
                        break;
                    case 'taskTemplate':
                        $(that.element).find('div[data-type="taskTemplate"]>.panel-body').m_project_task_temp({},true);
                        break;
                    case 'drawingProcess':
                        $(that.element).find('div[data-type="drawingProcess"]>.panel-body').m_production_process_settings_list({
                            fromType:2,
                            query:{processType:1}
                        },true);
                        break;
                    case 'productionProcess':
                        $(that.element).find('div[data-type="productionProcess"]>.panel-body').m_production_process_settings_list({
                            fromType:2,
                            query:{processType:2}
                        },true);
                        break;
                    case 'drawingNumbers':
                        $(that.element).find('div[data-type="drawingNumbers"]>.panel-body').m_project_temp_drawing_num();
                        break;
                    case 'orgZone':
                        $(that.element).find('div[data-type="orgZone"]>.panel-body').m_project_temp_zone();
                        break;
                }
                //return false;
            });
            if(that.settings.isEditIntroductionBack){
                $(that.element).find('a[data-toggle="tab"]').eq(1).click();
            }else{
                $(that.element).find('a[data-toggle="tab"]').eq(0).click();
            }


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
