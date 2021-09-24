/**
 * 时间范围选择
 * Created by veata on 2019/12/9.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_date_range_picker",
        defaults = {
            title:null,
            isPopover:true,//是否浮窗显示
            ok:null,
            cancel:null,
            minDate:'',
            maxDate:'',
            placement:'bottom',
            startDate:'',
            endDate:'',
            eleId:null//当前元素浮动窗ID
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._startDate = this.settings.startDate;//moment().format('YYYY-MM-DD')
        this._endDate = this.settings.endDate;

        if(isNullOrBlank(this._startDate))
            this._startDate = moment().format('YYYY-MM-DD');

        if(isNullOrBlank(this._endDate))
            this._endDate = moment().format('YYYY-MM-DD');

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage(function (data) {

                that.renderPicker1();
                that.renderPicker2();
            });
        },
        //初始化数据
        renderPage:function (callBack) {
            var that = this;
            var eleId = that.settings.eleId;
            if(isNullOrBlank(eleId))
                eleId = that.element;

            var html = template('m_common/m_date_range_picker', {isClear:that.settings.isClear});
            if(that.settings.isPopover === true){

                $(eleId).m_floating_popover({
                    type:2,
                    width:'500px',
                    height:'300px',
                    content:html,
                    placement:that.settings.placement,
                    isArrow:true,
                    renderedCallBack:function ($popover) {
                        that.bindActionClick($popover);
                        if(callBack)
                            callBack();
                    }
                },true);
            }else{

                $(that.element).html(html);
                that.bindActionClick();
                if(callBack)
                    callBack();
            }
        }
        ,renderPicker1:function (option) {
            var that = this;
            var startDate = that._startDate;
            var minDate = that.settings.minDate;
            var maxDate = that.settings.maxDate;

            WdatePicker({eCont:'quickDatePicker1',startDate:startDate,alwaysUseStartDate:true,maxDate:maxDate,minDate:minDate,onpicked:function(dp){

                that._startDate = dp.cal.getDateStr();
                that.renderPicker2();
            }});
        }
        ,renderPicker2:function () {
            var that = this;
            var minDate = that._startDate;
            var maxDate = that.settings.maxDate;

            var startDate = that._startDate;
            if(moment(that._startDate).isBefore(that._endDate)){
                startDate = that._endDate;
            }

            WdatePicker({eCont:'quickDatePicker2',startDate:startDate,alwaysUseStartDate:true,maxDate:maxDate,minDate:minDate,onpicked:function(dp){
                that._endDate = dp.cal.getDateStr();
            }});

        }
        ,bindActionClick:function ($popover) {
            var that = this;
            if($popover==null)
                $popover = $(that.element);

            $popover.find('button[data-action]').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'cancel':
                        $(that.settings.eleId).m_floating_popover('closePopover');
                        break;
                    case 'ok':
                        $(that.settings.eleId).m_floating_popover('closePopover');
                        if(that.settings.ok)
                            return that.settings.ok({startDate:that._startDate,endDate:that._endDate});
                        break;
                }


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


