/**
 * 快速选择时间，以在位编辑的方式打开
 * Created by veata on 2016/12/21.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_quickDatePicker",
        defaults = {
            title:null,
            placement:'right',//浮窗展开的位置，共四个值‘top’,‘bottom’,‘left’,‘right’,
            okCallBack:null,
            maxDate:'',//限制最大时间
            minDate:'',//限制最小时间
            dateFmt: null,
            isClear:true,//展示清空按钮
            eleId:null//当前元素浮动窗ID
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
            that.renderDialog(function ($popover) {

                var t = setTimeout(function () {
                    WdatePicker({
                        eCont:'quickDatePicker',
                        dateFmt:that.settings.dateFmt||'yyyy-MM-dd',
                        //dateFmt:'yyyy年',
                        maxDate:that.settings.maxDate,
                        minDate:that.settings.minDate,
                        onpicked:function(dp){
                            that.saveDate(dp);
                            $(that.settings.eleId).m_floating_popover('closePopover');
                        }
                    });
                    clearTimeout(t);
                    $('#quickDatePicker iframe').css('height','232px');//firefox有时不出来修改
                    $('#quickDatePicker iframe').contents().find('html').addClass('noBorder');

                },100);



            });
        },
        //初始化数据
        renderDialog:function (callBack) {
            var that = this;

            var height = that.settings.isClear?'280px':'250px';
            $(that.settings.eleId).m_floating_popover({
                type:2,
                width:'245px',
                height:height,
                content:template('m_common/m_quickDatePicker', {isClear:that.settings.isClear}),
                placement:that.settings.placement||'right',
                isArrow:true,
                renderedCallBack:function ($popover) {
                    that.bindClearDate($popover);
                    if(callBack)
                        callBack($popover);
                }

            },true);
        }
        //保存编辑
        ,saveDate:function (dp) {
            var that = this;
            var $data = dp.cal.getDateStr();

            if(that.settings.okCallBack!=null)
                return that.settings.okCallBack($data);
        }
        ,bindClearDate:function ($popover) {
            var that = this;
            $popover.find('button.m-popover-clear').on('click',function () {
                $(that.settings.eleId).m_floating_popover('closePopover');
                if(that.settings.okCallBack!=null)
                    return that.settings.okCallBack(null);
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


