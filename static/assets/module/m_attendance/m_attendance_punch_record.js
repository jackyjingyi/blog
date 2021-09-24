/**
 * 打卡记录
 * Created by wrb on 2019/1/4.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_attendance_punch_record",
        defaults = {
            isDialog:true,
            dataInfo:null,//记录信息
            param:null//参数
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;
        this._currentCompanyId = window.currentCompanyId;
        this._currentUserId = window.currentUserId;
        this._fastdfsUrl = window.fastdfsUrl;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var option = {};
            option.url = restApi.url_attendanceStatementByDayDetail;
            option.postData = that.settings.param;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var html = template('m_attendance/m_attendance_punch_record', {
                        dataList: response.data,
                        dataInfo:that.settings.dataInfo
                    });
                    that.renderDialog(html,function () {

                    });

                } else {
                    S_layer.error(response.info);
                }
            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||momentFormat(that.settings.dataInfo.workDate,'YYYY/MM/DD')+' 打卡记录',
                    area : '750px',
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
