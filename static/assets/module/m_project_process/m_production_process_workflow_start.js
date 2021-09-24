/**
 * 生产安排-流程设置-状态添加
 * Created by wrb on 2019/6/13.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_process_workflow_start",
        defaults = {
            isDialog:true,
            isAllAgree:0,//是否全部同意
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_project_process/m_production_process_workflow_start',{isAllAgree:that.settings.isAllAgree});
            that.renderDialog(html,function () {
                
                $(that.element).find('button[data-action="whetherEnable"]').on('click',function () {
                    var isAllAgree = $(this).attr('data-status');

                    if(isAllAgree=='0'){

                        $(this).find('i').removeClass('icon-kaiguanguan1 fc-v1-grey').addClass('icon-kaiguanguan fc-dark-blue');
                        $(this).attr('data-status',1);

                    }else{
                        $(this).find('i').removeClass('icon-kaiguanguan fc-dark-blue').addClass('icon-kaiguanguan1 fc-v1-grey');
                        $(this).attr('data-status',0);
                    }

                });
            });
        },
        //初始化数据,生成html
        renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title || '配置父子任务流转过程',
                    area : ['750px','530px'],
                    fixed:true,
                    //scrollbar:false,
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var isAllAgree = $(that.element).find('button[data-action="whetherEnable"]').attr('data-status');

                        if(that.settings.saveCallBack)
                            that.settings.saveCallBack(isAllAgree);

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
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
