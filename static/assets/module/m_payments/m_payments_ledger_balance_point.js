/**
 * 收支明细汇总-时点余额
 * Created by wrb on 2019/12/31.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_payments_ledger_balance_point",
        defaults = {
            isDialog:true,
            companyId:null,
            id:null//余额主表Id
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._year = new Date().getFullYear();

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_payments/m_payments_ledger_balance_point', {
                year:that._year
            });
            that.renderDialog(html,function () {

                that.renderContent();

            });

        }
        //初始化数据,生成html
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑
                S_layer.dialog({
                    title: that.settings.title||'时点余额',
                    area : '1000px',
                    content:html,
                    cancel:function () {

                    },
                    cancelText:'关闭'

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
        ,renderContent:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_companyBill_listCompanyMonthlyAccount;
            option.postData = {};
            option.postData.companyId = that.settings.companyId;
            option.postData.year = that._year;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var iHtml = template('m_payments/m_payments_ledger_balance_point_list', {dataList:response.data});
                    $(that.element).find('#content').html(iHtml);
                    that.bindActionClick();
                    rolesControl();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //按钮事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){

                    case 'selectDate'://年份选择

                        var endTime = new Date().getFullYear();
                        var onpicked =function(dp){

                            //console.log(dp.cal.getNewDateStr());
                            that._year = dp.cal.newdate.y;
                            that.renderContent();

                        };
                        WdatePicker({el:'yearSelect',dateFmt:'yyyy年',maxDate:endTime,onpicked:onpicked,isShowClear:false,isShowToday:false});
                        break;

                    case 'tieBill'://确认扎账

                        S_layer.confirm('您确认扎账吗？', function () {
                            var option = {};
                            option.url = restApi.url_companyBill_plungeIntoAccount;
                            option.postData = {
                                companyId:that.settings.companyId,
                                month: $this.closest('tr').attr('data-month')
                            };
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('操作成功！');
                                    that.renderContent();
                                } else {
                                    S_layer.error(response.msg?response.msg:response.info);
                                }
                            });

                        }, function () {
                        });
                        break;

                    case 'cancelBill'://取消扎账

                        S_layer.confirm('取消扎帐后，当前月份及当前月份以后扎帐完成的月份，将需要重新扎帐处理，是否取消扎帐处理？？', function () {
                            var option = {};
                            option.url = restApi.url_companyBill_relieveCompanyAccount;
                            option.postData = {
                                id: $this.closest('tr').attr('data-id')
                            };
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('操作成功！');
                                    that.renderContent();
                                } else {
                                    S_layer.error(response.msg?response.msg:response.info);
                                }
                            });

                        }, function () {
                        });
                        break;
                }
                return false;
            });
            $(that.element).find('#yearSelect').on('click',function () {
                $(that.element).find('button[data-action="selectDate"]').click();
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
