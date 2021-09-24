/**
 * 控制台-订单-开票
 * Created by wrb on 2019/1/23.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_backstage_apply_billing",
        defaults = {
            isDialog:true,
            title:null,
            status: 1,// （1：申请开票,2：开票（卯丁填写物流信息），3：已开票）
            orderId:null,//订单ID
            invoiceId:null,//发票ID
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
            if(that.settings.invoiceId){
                that.getData(function (data) {
                    that.renderPage(data);
                })
            }else{
                that.renderPage(null);
            }
        }
        ,renderPage:function (data) {
            var that = this;
            if(data==null)
                data = {};

            data.status=that.settings.status;

            var html = template('m_backstage/m_backstage_apply_billing',{dataInfo:data});
            that.renderDialog(html,function () {
                if(that.settings.status && (that.settings.status==2||that.settings.status==3))
                    $(that.element).find('input').attr('disabled','disabled');

                that.save_validate();

            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                var option = {};
                option.title = that._title||'申请发票';
                option.area = '765px';
                option.content = html;
                option.cancel = function () {};
                if(that.settings.status==1){
                    option.ok = function () {
                        var flag = $(that.element).find('form.form-invoice').valid();
                        if (!flag || that.save()) {
                            return false;
                        }
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
        ,getData:function (callBack) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_queryOrderInvoice+'/'+that.settings.orderId;
            m_ajax.post(option,function (response) {
                if(response.code == '0'){

                    if(callBack)
                        callBack(response.data);

                }else{
                    S_layer.error(response.info);
                }
            })
        }
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_saveOrUpdateOrderInvoice;
            option.postData = $(that.element).find("form.form-invoice").serializeObject();

            if(that.settings.orderId)
                option.postData.orderId = that.settings.orderId;

            m_ajax.postJson(option,function (response) {
                if(response.code == '0'){

                    S_toastr.success('操作成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                }else{
                    S_layer.error(response.info);
                }
            })
        }
        //表单验证
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form.form-invoice').validate({
                rules: {
                    relationCompanyName:{
                        required: true
                    },
                    taxIdNumber:{
                        required: true
                    },
                    recipients:{
                        required: true
                    },
                    cellphone:{
                        required: true
                    },
                    receiveAddress:{
                        required: true
                    },
                    express:{
                        required: true
                    },
                    expressNumber:{
                        required: true
                    }
                },
                messages: {
                    relationCompanyName:{
                        required: '请输入单位名称！'
                    },
                    taxIdNumber:{
                        required: '请输入纳税人识别号！'
                    },
                    recipients:{
                        required: '请输入姓名！'
                    },
                    cellphone:{
                        required: '请输入联系电话！'
                    },
                    receiveAddress:{
                        required: '请输入收件地址！'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
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
