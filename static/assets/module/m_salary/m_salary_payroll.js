/**
 * 工资条
 * Created by wrb on 2019/3/8.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_salary_payroll",
        defaults = {
            isDialog:true
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._filterData = {
            year:new Date().getFullYear().toString(),//当前年
            companyId:window.currentCompanyId,
            companyUserId:window.currentCompanyUserId
        };
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_salary/m_salary_payroll', {year:momentFormat(that._filterData.year,'YYYY年')});
            that.renderDialog(html,function () {
                that.timeSelectBind();
                that.renderContent();
            });


        }
        ,renderContent:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_queryMySalaryReport;
            option.postData = that._filterData;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var html = template('m_salary/m_salary_tax_calculation_table_list', {
                        dataList:response.data,
                        doType:1
                    });
                    $(that.element).find('#payrollBox').html(html);

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
                    title: that.settings.title||'工资条',
                    area : ['1250px','650px'],
                    maxmin:true,
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
        //时间选择绑定
        , timeSelectBind:function () {
            var that = this;
            $(that.element).find('span[data-action="timeSelect"]').off('click').on('click',function () {

                var endTime = $(that.element).find('input[name="endTime"]').val();
                var onpicked =function(dp){

                    that._filterData.year = dp.cal.getNewDateStr().toString();
                    $(that.element).find('.time-span').html(momentFormat(that._filterData.year,'YYYY年'));
                    that.renderContent();

                };
                WdatePicker({el:'d12',dateFmt:'yyyy',onpicked:onpicked,isShowClear:false,isShowToday:false});
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
