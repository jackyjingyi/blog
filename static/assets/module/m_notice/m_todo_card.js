/**
 * 周年贺卡
 * Created by wrb on 2020/3/13.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_todo_card",
        defaults = {
            isDialog: true,
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_notice/m_todo_card', {
                p: that.settings.dataInfo,
                currentCompanyId: that._currentCompanyId
            });
            that.renderDialog(html, function () {
                that.bindGotoProject();
            });

        }
        //渲染界面
        , renderDialog: function (html, callBack) {

            var that = this;
            if (that.settings.isDialog === true) {//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title || '我的待办',
                    area: ['860px', '480px'],
                    content: html,
                    cancelText: '关闭',
                    cancel: function () {
                    }

                }, function (layero, index, dialogEle) {//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if (callBack)
                        callBack();
                });

            } else {//不以弹窗编辑
                $(that.element).html(html);
                if (callBack)
                    callBack();
            }
        }


        //跳转详情
        , bindGotoProject: function () {
            var that = this;
            $(that.element).find('tr[data-id]').off('click').on('click', function (e) {
                var $this = $(this);
                var id = $this.attr('data-id');//项目ID
                var pId = $this.attr('data-pid');//
                var projectId = $this.attr('data-project-id');//
                var projectName = $this.attr('data-project-name');//
                var businessType = $this.attr('data-business-type');//
                var taskType = $this.attr('data-task-type');//
                location.hash = '/project/production?id=' + projectId + '&projectName=' + encodeURI(projectName) + '&taskId=' + id + '&dataCompanyId=' + window.currentCompanyId + '&businessType=' + businessType + '&taskType=' + taskType + '&taskPid=' + pId;
                S_layer.close($(that.element));
                stopPropagation(e);
                return false;
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
