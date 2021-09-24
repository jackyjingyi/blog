/**
 * 发布工作内容提示
 * Created by wrb on 2019/12/19.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_task_issue_add_tips",
        defaults = {
            offset:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            //每次重新置顶，避免layer offset加上滚动高度
            $('html').scrollTop(0);

            var html = template('m_task_issue/m_task_issue_add_tips',{});
            that.renderDialog(html,function () {


                $(that.element).find('button[data-action="knowIt"]').on('click',function () {

                    var isCheck = $(that.element).find('input[name="itemCk"]').is(':checked');
                    if(isCheck){
                        Cookies.set('cookiesData_taskIssueAddTips', 1);
                    }
                    S_layer.close($(that.element));

                });

            });

        }
        ,renderDialog:function (html,callBack) {
            var that = this;
            S_layer.dialog({
                title: false,
                closeBtn:false,
                area : '300px',
                content:html,
                offset:that.settings.offset,
                btn:false

            },function(layero,index,dialogEle){//加载html后触发
                that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                that.element = dialogEle;
                $(dialogEle).css('overflow','inherit');
                if(callBack)
                    callBack();
            });
        }




    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);
