/**
 * 台账详情
 * Created by wrb on 2019/5/31.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_payments_ledger_details",
        defaults = {
            isDialog:true,
            dataInfo:null,//发票信息
            saveCallBack:null
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
            if(that.settings.dataInfo.feeType==1 || that.settings.dataInfo.feeType==2 || that.settings.dataInfo.feeType==3 || that.settings.dataInfo.feeType==4){
                that.getData(function (data) {
                    data.feeTypeParentName = that.settings.dataInfo.feeTypeParentName;
                    data.feeTypeName = that.settings.dataInfo.feeTypeName;
                    data.profitType = that.settings.dataInfo.profitType;
                    data.feeType = that.settings.dataInfo.feeType;
                    data.profitFee = that.settings.dataInfo.profitFee;
                    var html = template('m_payments/m_payments_ledger_details',data);
                    that.renderDialog(html,function () {

                    });
                });
            }else{
                var html = template('m_payments/m_payments_ledger_details',that.settings.dataInfo);
                that.renderDialog(html,function () {

                });
            }

        }
        ,getData:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_getProjectCostPaymentDetailByPointDetailIdForReceive;

            if(that.settings.dataInfo.profitType==2)
                option.url = restApi.url_getProjectCostPaymentDetailByIdForPay;

            option.postData = {
                companyId:that.settings.dataInfo.companyId,
                paymentDetailId:that.settings.dataInfo.targetId
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(callBack)
                        callBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                var option = {};
                option.title = that.settings.title||'台账详情';
                option.area = '750px';
                option.content = html;
                option.cancel = function () {

                };
                if(that.settings.dataInfo.myTaskStatus=='0'){//可开票
                    option.btn = ['确认开票', '取消'];
                    option.ok = function () {
                        that.confirmInvoice();
                        return false;
                    };
                }else if(that.settings.dataInfo.updateInvoice==1){
                    option.btn = ['修改发票', '取消'];
                    option.ok = function () {
                        that.editInvoice();
                        return false;
                    };
                }else{
                    option.cancelText = '关闭';
                }

                S_layer.dialog(option,function(layero,index,dialogEle){//加载html后触发
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
        ,reRenderContent:function () {
            var that = this;
            that.getData(function (data) {
                var html = template('m_summary/m_summary_invoice_details',data);
                $(that.element).html(html);
            });
            if(that.settings.saveCallBack)
                that.settings.saveCallBack();
        }
        //确认开票
        ,confirmInvoice:function () {
            var that = this;
            var option = {};
            option.invoiceId = that.settings.dataInfo.id;
            option.taskId = that.settings.dataInfo.myTaskId;
            option.projectId = that.settings.dataInfo.projectId;
            option.dialogHeight = '100';
            option.saveCallBack = function () {
                that.reRenderContent();
            };
            $('body').m_cost_confirmInvoice(option,true);
        }
        //修改发票
        ,editInvoice:function () {
            var that = this;
            $('body').m_cost_confirmInvoice({
                doType:2,
                invoiceId:that.settings.dataInfo.id,
                pointInfo:{fee:that.settings.dataInfo.fee},
                saveCallBack:function () {
                    that.reRenderContent();
                }
            },true);
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
