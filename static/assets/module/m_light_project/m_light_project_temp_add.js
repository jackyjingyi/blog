/**
 * 轻量任务列表
 * Created by wrb on 2019/11/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_light_project_temp_add",
        defaults = {
            isDialog:true
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._breadcrumb = [
            {
                name:'轻量任务',
                url:'#/lightProject'
            },
            {
                name:'创建企业模板'
            }
        ];

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_light_project/m_light_project_temp_add', {});
            $(that.element).html(html);
            $(that.element).find('#breadcrumb').m_breadcrumb({dataList:that._breadcrumb},true);
            that.bindActionClick();

        }
        //渲染弹窗
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'创建企业模板',
                    area : ['100%','100%'],
                    content:html,
                    scrollbar:false,
                    btn:false

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
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('.temp-card[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'tempSimple':
                        //$('body').m_light_project_temp_add_simple();
                        $('body').m_light_project_temp_edit({})
                        break;
                    case 'tempCopy':
                        $('body').m_light_project_temp_add_copy({
                            saveCallBack:function (data) {
                                console.log(data);

                                $('body').m_light_project_temp_edit(data);
                            }
                        });
                        break;
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
