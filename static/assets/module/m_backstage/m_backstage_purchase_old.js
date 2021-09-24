/**
 * 后台管理-购买
 * Created by wrb on 2018/11/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_backstage_purchase_old",
        defaults = {
            orderId:null//订单ID
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;

        this._companyInfo = window.companyInfo;
        this._companyVersion = window.companyVersion;
        this._orderList = [];

        this._dataInfo = null;//请求数据

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_backstage/m_backstage_purchase', {});
            $(that.element).html(html);
            if(isNullOrBlank(that.settings.orderId)){
                that.renderStep1();
            }else{
                var option = {};
                option.classId = '#content-right';
                option.url = restApi.url_getOrderDetail+'/'+that.settings.orderId;
                m_ajax.get(option, function (response) {
                    if (response.code == '0') {
                        that._orderList = response.data.list;
                        that.renderStep2(response.data);
                    } else {
                        S_layer.error(response.info);
                    }
                });
            }
        }
        //渲染购买第一步
        , renderStep1: function () {
            var that = this;

            that.getBaseInfo(1,function (data) {
                var html = template('m_backstage/m_backstage_purchase_step1', {version:that._companyVersion,dataInfo:data});
                $(that.element).find('.step-container').html(html);

                that.initICheck();
                that.bindActionClick();

                if(that._companyVersion=='03'){

                    that.step1_validate($(that.element).find("form#baseVersion"));
                    that.step_space_validate($(that.element).find("form#baseSpace"));

                }else if(that._companyVersion=='02' || that._companyVersion=='01'){

                    that.step1_validate($(that.element).find("form#professionalVersion"));
                }
            });
        }
        //渲染购买第二步
        , renderStep2: function (data) {
            var that = this;
            data.companyName = that._companyInfo.companyName;
            var html = template('m_backstage/m_backstage_purchase_step2', data);
            $(that.element).find('.step-container').html(html);

            if(that._orderList && that._orderList.length>0 && that._orderList[0].isPayment==1){

                $(that.element).find('div[data-step="1"],div[data-step="2"]').removeClass('active').addClass('done');
                $(that.element).find('div[data-step="3"]').addClass('active');

            }else{

                $(that.element).find('div[data-step="1"]').removeClass('active').addClass('done');
                $(that.element).find('div[data-step="2"]').addClass('active');
            }

            that.bindEditable();
        }
        //初始化iCheck
        ,initICheck:function () {
            var that = this;
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });
            //版本购买内容选项
            $(that.element).find('input[name="productType"]').on('ifClicked', function(e){

                var productType = $(this).val();
                if(productType==1){
                    $(that.element).find('.product-content-type label[data-type="1"]').removeClass('hide');
                    $(that.element).find('.product-content-type label[data-type="2"]').addClass('hide');
                    $(that.element).find('.product-content-type label[data-type="1"]').eq(0).find('input').iCheck('check');
                }else{
                    $(that.element).find('.product-content-type label[data-type="1"]').addClass('hide');
                    $(that.element).find('.product-content-type label[data-type="2"]').removeClass('hide');
                    $(that.element).find('.product-content-type label[data-type="2"]').eq(0).find('input').iCheck('check');
                }
                $(this).iCheck('check');
                stopPropagation(e);
                return false;
            }).on('ifChecked', function(e){

                that.getBaseInfo();
                stopPropagation(e);
                return false;
            });
            var setText = function (label,placeholder,unit,tip) {
                $(that.element).find('.order-count label.control-label').html(label);
                $(that.element).find('.order-count input').attr('placeholder',placeholder);
                $(that.element).find('.order-count .input-group-addon').html(unit);
                $(that.element).find('.order-count .fc-v1-grey').html(tip);
            };
            var productContentTypeCheckFun = function ($this) {
                var productContentType = $this.val();
                $(that.element).find('.order-count').removeClass('hide');
                $(that.element).find('.service-time').addClass('hide');
                switch (productContentType){
                    case '1':
                        $(that.element).find('.order-count').addClass('hide');
                        $(that.element).find('.service-time[data-type="1"]').removeClass('hide');
                        $(that.element).find('#serviceTimeBox').html($(that.element).find('#accountEffectTime').html());
                        break;
                    case '2':
                        setText('成员名额：','请输入成员名额','人','');
                        $(that.element).find('.service-time[data-type="1"]').removeClass('hide');
                        $(that.element).find('#serviceTimeBox').html($(that.element).find('#accountEffectTime').html());
                        break;
                    case '3':
                        setText('成员名额：','请输入成员名额','人','购买人数不得小于当前实际人数“'+(that._dataInfo?that._dataInfo.accountCount:'0')+'”人。');
                        $(that.element).find('.service-time[data-type="2"]').removeClass('hide');
                        $(that.element).find('input[name="serviceTime"][value="2"],input[name="serviceTime"][value="3"],input[name="serviceTime"][value="4"]').parents('.i-checks').removeClass('hide');
                        break;
                    case '4':
                        setText('空间容量：','请输入空间容量','G','');
                        $(that.element).find('.service-time[data-type="1"]').removeClass('hide');
                        $(that.element).find('#serviceTimeBox').html($(that.element).find('#spaceEffectTime').html());
                        break;
                    case '5':
                        $(that.element).find('.service-time[data-type="2"]').removeClass('hide');
                        $(that.element).find('.order-count').addClass('hide');
                        $(that.element).find('input[name="serviceTime"][value="2"],input[name="serviceTime"][value="3"],input[name="serviceTime"][value="4"]').parents('.i-checks').addClass('hide');
                        break;
                }
            };
            //内容选项
            $(that.element).find('input[name="productContentType"]').on('ifClicked', function(e){

                $(this).iCheck('check');
                stopPropagation(e);
                return false;
            }).on('ifChecked', function(e){

                if(that._companyVersion=='03'){

                    var productContentType = $(this).val();
                    $(that.element).find('#baseSpace .service-time').addClass('hide');
                    if(productContentType=='4'){

                        $(that.element).find('#baseSpace .service-time[data-type="2"]').removeClass('hide');
                        $(that.element).find('#baseSpace input[name="orderCount"]').parents('.form-group').removeClass('hide');

                    }else if(productContentType=='5'){

                        $(that.element).find('#baseSpace .service-time[data-type="1"]').removeClass('hide');
                        $(that.element).find('#baseSpace input[name="orderCount"]').parents('.form-group').addClass('hide');
                    }

                }else{
                    productContentTypeCheckFun($(this));
                }
                that.getBaseInfo();
                stopPropagation(e);
                return false;
            });
            //时长选项
            $(that.element).find('input[name="serviceTime"]').on('ifClicked', function(e){
                $(this).iCheck('check');
                stopPropagation(e);
                return false;
            }).on('ifChecked', function(e){

                that.getBaseInfo(3);
                stopPropagation(e);
                return false;
            });
            //版本选项
            $(that.element).find('input[name="productCode"]').on('ifClicked', function(e){
                $(this).iCheck('check');
                stopPropagation(e);
                return false;
            }).on('ifChecked', function(e){

                that.getBaseInfo();
                stopPropagation(e);
                return false;
            });

        }
        //获取第一步基础数据{t==1=第一次初始化，t=2=文本keyup事件,t=3=选择时长事件}
        ,getBaseInfo:function (t,callBack) {
            var that = this;
            if(t!=1){
                //验证
                var productContentType = $(that.element).find('input[name="productContentType"]:checked').val();
                if (that._companyVersion=='03') {
                    var flag1 = $(that.element).find('form#baseVersion').valid();
                    var flag2 = $(that.element).find('form#baseSpace').valid();
                    //切换productContentType隐藏错误信息
                    $(that.element).find('label[id="orderCount-error"]').hide();
                    //切换productContentType清空数据
                    if(t!=2 && t!=3)
                        $(that.element).find('form#baseSpace input[name="orderCount"]').val('');

                    if(!flag1 || !flag2){
                        $(that.element).find('#orderAmount').html(0);
                        return false;
                    }

                }
                if (that._companyVersion=='02' || that._companyVersion=='01') {

                    //切换productContentType清空数据
                    if(t!=2 && t!=3)
                        $(that.element).find('form#professionalVersion input[name="orderCount"]').val('');

                    //需要录入的选项进行验证
                    if(productContentType=='2' || productContentType=='3' || productContentType=='4'){
                        var flag3 = $(that.element).find('form#professionalVersion').valid();
                        $(that.element).find('label[id="orderCount-error"]').hide();
                        if(!flag3){
                            $(that.element).find('#orderAmount').html(0);
                            return false;
                        }
                    }
                }
            }
            var option = {};
            option.url = restApi.url_purchaseTable;
            option.postData = that.getPostParam();

            if(t==1 && that._companyVersion=='02'){//第一次请求
                option.postData.productDTO={
                    productContentType: "1",
                    productCode: "01",
                    productType: "1"
                }
            }
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo = response.data;
                    $(that.element).find('#orderAmount').html(response.data.orderAmount);
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //组装提交参数
        ,getPostParam:function () {
            var that = this;
            var paramData = {};

            if (that._companyVersion == '03'){

                paramData.productDTO = $(that.element).find("form#baseVersion").serializeObject();
                paramData.productDTO.productType = '1';
                paramData.fileSpaceDTO = $(that.element).find("form#baseSpace").serializeObject();
                paramData.fileSpaceDTO.productType = '0';

                paramData.productDTO = filterParam(paramData.productDTO);
                paramData.fileSpaceDTO = filterParam(paramData.fileSpaceDTO);

            }else if(that._companyVersion=='02' || that._companyVersion=='01'){


                var data = $(that.element).find("form#professionalVersion").serializeObject();
                data.productCode = '02';

                if(that._companyVersion=='01')
                    data.productCode = '01';

                if((that._companyVersion=='02' && data.productContentType=='1') || that._companyVersion=='01')
                    data.productCode = '01';

                if(data.productContentType!='3' && data.productContentType!='5')
                    data.serviceTime = null;
                if(data.productContentType=='1' || data.productContentType=='5')
                    data.orderCount = null;

                if(data.productContentType=='1' || data.productContentType=='2' || data.productContentType=='3'){
                    paramData.productDTO = filterParam(data);
                }else{
                    paramData.fileSpaceDTO = filterParam(data);
                }

            }
            return paramData;
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'submitOrders'://提交订单

                        if (that._companyVersion=='03') {
                            var flag1 = $(that.element).find('form#baseVersion').valid();
                            var flag2 = $(that.element).find('form#baseSpace').valid();
                            if(flag1 && flag2){
                                that.saveOrder(function (data) {
                                    that.renderStep2(data);
                                });
                            }
                        }
                        if (that._companyVersion=='02' || that._companyVersion=='01') {
                            var flag3 = $(that.element).find('form#professionalVersion').valid();
                            if(flag3){
                                that.saveOrder(function (data) {
                                    that.renderStep2(data);
                                });
                            }
                        }
                        return false;
                        break;


                }
            });

            $(that.element).find('input[name="orderCount"]').on('keyup',function () {
                that.getBaseInfo(2);
            })
        }
        //手机号码编辑
        ,bindEditable:function () {
            var that = this;
            $(that.element).find('a.editable-click[data-action="editCellphone"]').each(function () {
                var $this = $(this),$cellphone = $(that.element).find('.order-cellphone');
                var key = $this.attr('data-key');
                $this.m_editable({
                    title: '编辑',
                    popoverClass: 'w-330',
                    value: $.trim($cellphone.html()),
                    ok: function (data) {
                        if (data == false)
                            return false;

                        var $data = {};
                        $data.idList = [];
                        $.each(that._orderList,function (i,item) {
                            $data.idList.push(item.id);
                        });
                        $data[key] = data[key];
                        if (that.updateOrderCellphone($data)) {
                            return false;
                        }
                        $cellphone.html($data[key]);
                    },
                    cancel: function () {

                    },
                    completed:function ($popover) {
                        //刷新文本，二次编辑需要
                        $popover.find('input[name="cellphone"]').val($.trim($cellphone.html()));
                    }
                }, true);
            });
        }
        //提交订单
        ,saveOrder:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveOrder;
            option.postData = that.getPostParam();
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    that._orderList = response.data.list;
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,updateOrderCellphone:function (data) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_updateOrderCellphone;
            option.postData = data;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,step1_validate:function($ele){
            var that = this;
            $ele.validate({
                rules: {
                    orderCount: {
                        required: true,
                        number:true,
                        minNumber:true,
                        digits:true,
                        multiple10:true,
                        maxlength:25//是否超过25位
                    }
                },
                messages: {
                    orderCount: {
                        required: '请输入数字',
                        number:'请输入有效数字',
                        minNumber:'请输入大于0的数字',
                        digits:'请输入整数',
                        multiple10:'请输入10的倍数',
                        maxlength:'对不起，您的操作超出了系统允许的范围'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-md-9'));
                }
            });
            $.validator.addMethod('minNumber', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                var productType = $(that.element).find('input[name="productType"]:checked').val();

                if(value<=0){
                    isOk = false;
                }
                return  isOk;
            }, '请输入大于0的数字!');
            $.validator.addMethod('multiple10', function(value, element) {
                value = $.trim(value);
                var isOk = true;

                var unitText = $(element).parent().find('.input-group-addon').text();

                if(!(value%10==0) && unitText=='G'){
                    isOk = false;
                }
                return  isOk;
            }, '请输入10的倍数');

        }
        ,step_space_validate:function($ele){
            var that = this;
            var isRequired = $ele.attr('id')=='baseSpace'?false:true;
            $ele.validate({
                rules: {
                    orderCount: {
                        required: isRequired,
                        number:true,
                        minNumber:true,
                        digits:true,
                        multiple10:true,
                        maxlength:25//是否超过25位
                    }
                },
                messages: {
                    orderCount: {
                        required: '请输入数字',
                        number:'请输入有效数字',
                        minNumber:'请输入大于0的数字',
                        digits:'请输入整数',
                        multiple10:'请输入10的倍数',
                        maxlength:'对不起，您的操作超出了系统允许的范围'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-md-9'));
                }
            });
            $.validator.addMethod('minNumber', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(value!='' && value-0<=0){
                    isOk = false;
                }
                return  isOk;
            }, '请输入大于0的数字!');
            $.validator.addMethod('multiple10', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                var unitText = $(element).parent().find('.input-group-addon').text();

                if(!(value%10==0) && unitText=='G'){
                    isOk = false;
                }
                return  isOk;
            }, '请输入10的倍数');

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
