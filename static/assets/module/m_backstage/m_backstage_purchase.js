/**
 * 后台管理-购买
 * Created by wrb on 2018/11/28.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_backstage_purchase",
        defaults = {
            type:1,//1=版本购买，2=账号扩充，3=存储空间购买与扩容
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
                var html = template('m_backstage/m_backstage_purchase_step1', {
                    version:that._companyVersion,
                    dataInfo:data,
                    nowDate:moment().format('YYYY-MM-DD')
                });
                $(that.element).find('.step-container').html(html);

                that.initICheck();
                that.step_validate($(that.element).find('.tab-pane[data-type="versionPurchase"] form'));
                that.step_validate($(that.element).find('.tab-pane[data-type="personnelPurchase"] form'));
                that.step_validate($(that.element).find('.tab-pane[data-type="spacePurchase"] form'));
                that.bindActionClick();

                if(that.settings.type)
                    $(that.element).find('a[data-toggle="tab"][href="#tab-'+that.settings.type+'"]').click();

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
        //初始化iCheck(版本购买及续费、容量购买及续费)
        ,initICheck:function () {
            var that = this;


            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });

            var getDateStr = function ($this) {
                var year = $this.val();
                var startTime = $this.closest('div[data-start-time]').attr('data-start-time');
                var endTime = $this.closest('div[data-start-time]').attr('data-end-time');
                var newTimeStr = '',nowDate = moment().format('YYYY-MM-DD');
                if(isNullOrBlank(startTime) && isNullOrBlank(endTime)){
                    newTimeStr = moment(nowDate).format('YYYY/MM/DD') + ' - ' + moment(nowDate).add(year, 'years').format('YYYY/MM/DD');
                }else{
                    newTimeStr = moment(startTime).format('YYYY/MM/DD') + ' - ' + moment(endTime).add(year, 'years').format('YYYY/MM/DD');
                }
                return newTimeStr;
            };

            $(that.element).find('input[name="productContentType"]').on('ifClicked',function (e) {


                var $this = $(this),type=$this.val();
                var $pane = $(that.element).find('.tab-pane.active');

                $pane.find('.content-box[data-type]').addClass('hide');
                $pane.find('.content-box[data-type="'+type+'"]').removeClass('hide').siblings('.content-box').addClass('hide');

                $(this).iCheck('check');

            }).on('ifChecked', function(e){

                that.getBaseInfo();
            });

            $(that.element).find('input[name="productCode"]').on('ifClicked',function (e) {

                $(this).iCheck('check');

            }).on('ifChecked', function(e){

                that.getBaseInfo(3);
            });
            $(that.element).find('input[name="purchaseTime"]').on('ifClicked',function (e) {

                $(this).iCheck('check');
                var newTimeStr = getDateStr($(this));
                $(that.element).find('.tab-pane.active .purchase-time-show').html(newTimeStr);


            }).on('ifChecked', function(e){

                that.getBaseInfo();
            });
            $(that.element).find('input[name="serviceTime"]').on('ifClicked',function (e) {

                $(this).iCheck('check');
                var newTimeStr = getDateStr($(this));
                $(that.element).find('.tab-pane.active .service-time-show').html(newTimeStr);


            }).on('ifChecked', function(e){

                that.getBaseInfo();
            });

        }
        //获取第一步基础数据
        ,getBaseInfo:function (t,callBack) {
            var that = this;
            var $pane = $(that.element).find('.tab-pane.active');
            var data = {};
            if(t==1){

                if(that._companyVersion=='02'){//默认参数

                    data.productDTO = {productType: '1',productCode:'01',productContentType:'1'};

                }else if(that._companyVersion=='03'){

                    data.productDTO = {productType: '1'};

                }else if(that._companyVersion=='01'){

                    data.productDTO = {productType: '1',productCode:'01',serviceTime:'1',productContentType:'3'};
                }

            }else{
                var flag = $pane.find('form').valid();
                if(!flag){
                    //S_toastr.error($pane.find('form label.error:visible').eq(0).text());
                    return false;
                }
                data = filterParam(that.getPostParam());
            }

            var option = {};
            option.url = restApi.url_purchaseTable;
            option.postData = data;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo = response.data;
                    $pane.find('.order-amount').html(response.data.orderAmount);
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
            var $pane = $(that.element).find('.tab-pane.active');
            var type = $(that.element).find('.tab-pane.active').attr('data-type');

            //{productCode: "02", orderCount: "40", serviceTime: "1", productType: "1"}

            switch (type){
                case 'versionPurchase'://版本购买、续费
                    paramData.productDTO = {};
                    if($pane.find('input[name="productContentType"]:checked').val()=='3'){//续费时长

                        paramData.productDTO.productCode = that._companyVersion;
                        paramData.productDTO.serviceTime = $pane.find('input[name="serviceTime"]:checked').val();
                        //paramData.productDTO.orderCount = that._dataInfo && that._dataInfo.accountCount?that._dataInfo.accountCount:null;
                        paramData.productDTO.productContentType = '3';

                    }else{//版本购买

                        paramData.productDTO.productCode = $pane.find('input[name="productCode"]:checked').val();
                        if($pane.find('input[name="orderCount"]').val()!=undefined)
                            paramData.productDTO.orderCount = $pane.find('input[name="orderCount"]').val();

                        if(that._companyVersion!='03')//版本升级
                            paramData.productDTO.productContentType = '1';

                        if($pane.find('input[name="purchaseTime"]:checked').val()!=undefined){//购买时长

                            paramData.productDTO.serviceTime = $pane.find('input[name="purchaseTime"]:checked').val();
                        }
                    }

                    paramData.productDTO.productType = '1';

                    break;
                case 'personnelPurchase'://人员扩充

                    paramData.productDTO = {};
                    paramData.productDTO.productCode = that._companyVersion;
                    paramData.productDTO.orderCount = $pane.find('input[name="orderCount"]').val();
                    paramData.productDTO.productContentType = '2';
                    paramData.productDTO.productType = '1';

                    break;
                case 'spacePurchase'://容量扩充、续费

                    paramData.fileSpaceDTO = {};
                    paramData.fileSpaceDTO.productType = '0';

                    if($pane.find('input[name="productContentType"]:checked').val()=='5') {//续费时长

                        paramData.fileSpaceDTO.productCode = that._companyVersion;
                        paramData.fileSpaceDTO.serviceTime = $pane.find('input[name="serviceTime"]:checked').val();
                        paramData.fileSpaceDTO.productContentType = '5';

                    }else{//容量扩充

                        paramData.fileSpaceDTO.productCode = that._companyVersion;
                        paramData.fileSpaceDTO.orderCount = $pane.find('input[name="orderCount"]').val();
                        paramData.fileSpaceDTO.productContentType = '4';
                        paramData.fileSpaceDTO.productType = '0';
                    }

                    break;
            }

            return paramData;
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
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'submitOrders'://提交订单

                        var $pane = $(that.element).find('.tab-pane.active');
                        var paneType = $pane.attr('data-type');
                        var flag = $pane.find('form').valid();

                        var dataInfo = that.getPostParam();

                        var endDate = $pane.find('.current-effect-time').attr('data-end-time');
                        var nowDate = moment().format('YYYY-MM-DD');

                        if(dataInfo.fileSpaceDTO && dataInfo.fileSpaceDTO.productContentType=='4'){//空间扩容

                            if(!isNullOrBlank(endDate)){
                                if(!moment(endDate).isAfter(nowDate, 'day')){
                                    S_toastr.error('空间有效时间已过期，请先选择续费！');
                                    return false;
                                }
                            }
                        }else if(dataInfo.productDTO && dataInfo.productDTO.productContentType=='2'){//人员扩容

                            if(!isNullOrBlank(endDate)){
                                if(!moment(endDate).isAfter(nowDate, 'day')){
                                    S_toastr.error('版本有效时间已过期，请先选择续费！');
                                    return false;
                                }
                            }
                        }
                        if(flag){

                            var data = {};
                            data.version = that._companyVersion;
                            //购买时长
                            data.purchaseTime = $pane.find('input[name="purchaseTime"]:checked').val();
                            data.purchaseTimeStr = $pane.find('.purchase-time-show').text();
                            //续费时长
                            data.serviceTime = $pane.find('input[name="serviceTime"]:checked').val();
                            data.serviceTimeStr = $pane.find('.service-time-show').text();
                            //当前版本有效时间
                            data.currentEffectTimeStr = $pane.find('.current-effect-time').text();
                            data.purchasedNum = $pane.find('.purchased-num').text();
                            data.oldPurchasedNum = $pane.find('div[data-account-count]').attr('data-account-count');
                            data.oldSpaceCapacity = $pane.find('div[data-space-capacity]').attr('data-space-capacity');

                            data.orderAmount = $pane.find('.order-amount').text();



                            if(paneType=='versionPurchase' || paneType=='personnelPurchase'){
                                data = $.extend({},data,dataInfo.productDTO);
                            }else{
                                data = $.extend({},data,dataInfo.fileSpaceDTO);
                            }

                            $('body').m_backstage_purchase_confirm({
                                dataInfo:data,
                                okCallBack:function () {
                                    that.saveOrder(function (data) {
                                        that.renderStep2(data);
                                    });
                                }
                            },true);


                        }else{
                            S_toastr.error($pane.find('form label.error:visible').eq(0).text());
                            return false;
                        }

                        return false;
                        break;


                }
            });

            $(that.element).find('input[name="orderCount"]').on('keyup',function () {
                that.getBaseInfo();
                var $this = $(this),type=$this.attr('data-type'),val = $this.val();
                var unit = $this.parent().find('.input-group-addon').text();
                if(type==1){
                    $this.closest('.tab-pane').find('.purchased-num').text(val-0);
                }else if(type==2){
                    var accountCount = $this.closest('.tab-pane').find('div[data-account-count]').eq(0).attr('data-account-count')-0;
                    $this.closest('.tab-pane').find('.purchased-num').text(val-0+accountCount);
                }else if(type==3){
                    var spaceCapacity = $this.closest('.tab-pane').find('div[data-space-capacity]').eq(0).attr('data-space-capacity')-0;
                    $this.closest('.tab-pane').find('.purchased-num').text(val-0+spaceCapacity);
                }
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
        //验证(版本购买及续费\人员扩充)
        ,step_validate:function($ele){
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
                        //minNumber:'请输入大于0的数字',
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
                var minValue = $(element).attr('data-min-value');

                //console.log($.validator.messages)
                if(!isNullOrBlank(minValue) && value<(minValue-0)){
                    $.validator.messages.minNumber = '请输入大于等于'+minValue+'的数字';
                    return false;
                }else if(value<=0){
                    return  false;
                }
                return true;
            }, '请输入大于0的数字');
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
