/**
 * 发票详情
 * Created by wrb on 2019/5/31.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_summary_invoice_details",
        defaults = {
            isDialog:true,
            dataInfo:null,//发票信息
            isView:false,//是否查看
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._isHadConfirmInvoice = false;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.getData(function (data) {
                var html = template('m_summary/m_summary_invoice_details',data);
                that.renderDialog(html,function () {

                });
            });
        }
        ,getData:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_getProjectCostInvoiceDetail;
            option.postData = {
                companyId:that.settings.dataInfo.companyId,
                projectId:that.settings.dataInfo.projectId,
                costId:that.settings.dataInfo.costId,
                pointDetailId:that.settings.dataInfo.pointDetailId
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
                option.title = that.settings.title||'开票详情';
                option.area = '750px';
                option.content = html;
                option.cancel = function () {

                };
                if(that.settings.dataInfo.myTaskStatus=='0' && !that.settings.isView){//可开票
                    option.btn = ['确认开票', '取消'];
                    option.ok = function () {
                        if(that._isHadConfirmInvoice){
                            that.editInvoice();
                        }else{
                            that.confirmInvoice();
                        }

                        return false;
                    };
                }else if(that.settings.dataInfo.updateInvoice==1 && !that.settings.isView){
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
        ,reRenderContent:function (type) {
            var that = this;
            that.getData(function (data) {
                var html = template('m_summary/m_summary_invoice_details',data);
                $(that.element).html(html);
                if(type==1)
                    $(that.element).closest('.layui-layer').find('.layui-layer-btn .layui-layer-btn0').html('修改发票');
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
                that.reRenderContent(1);
                that._isHadConfirmInvoice = true;
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
                    that.reRenderContent(2);
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
