/**
 * 项目信息－付款计划-付款申请
 * Created by wrb on 2018/8/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_cost_paymentApplication",
        defaults = {
            isDialog:true,
            projectId:null,
            pointInfo:null,//节点信息
            pointId:null,
            dataCompanyId:null,//视图组织ID
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID

        this._auditList = [];//审批人
        this._ccCompanyUserList = [];//抄送人
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_initProjectCostPaymentDetailAudit;
            option.postData = {};
            option.postData.pointId = that.settings.pointInfo.pointId;
            if(that.settings.pointInfo.pointDetailId)
                option.postData.pointDetailId = that.settings.pointInfo.pointDetailId;

            if(!isNullOrBlank(that.settings.dataCompanyId)){
                option.postData.companyId = that.settings.dataCompanyId;
            }else{
                option.postData.companyId = window.currentCompanyId;
            }

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    that._dataInfo = response.data;
                    that._dataInfo.isInnerCompany = that.settings.pointInfo.isInnerCompany;
                    var html = template('m_cost/m_cost_paymentApplication',that._dataInfo);
                    that.renderDialog(html,function () {
                        that.save_validate();
                        that.renderApproverPage();
                        return false;
                    });
                }else {
                    S_layer.error(response.info);
                }
            });

        },
        //初始化数据,生成html
        renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'付款申请',
                    area : '900px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();
                        if (!flag) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        if(that._dataInfo && that._dataInfo.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && (that._auditList==null || that._auditList.length==0)){
                            //存在审批，且需要添加审批人
                            S_toastr.error('请选择审批人！');
                            return false;
                        }
                        that.save();
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
        //保存
        ,save:function () {

            var that = this,option  = {};
            option.classId = that.element;
            option.postData = {};
            var projectCostPointDetail = {};
            option.url = restApi.url_applyProjectCostPayFee;
            if(that.settings.pointInfo.isInnerCompany){//内部
                projectCostPointDetail.id = that.settings.pointInfo.pointDetailId;
            }else{
                //option.url = restApi.url_saveReturnMoneyDetail;
            }

            projectCostPointDetail.projectId = that.settings.projectId;
            projectCostPointDetail.pointId = that.settings.pointInfo.pointId;
            projectCostPointDetail.payType = 2;
            projectCostPointDetail.fee = $(that.element).find('input[name="fee"]').val();
            projectCostPointDetail.pointDetailDescription = $(that.element).find('textarea[name="pointDetailDescription"]').val();

            option.postData.projectCostPointDetail = projectCostPointDetail;

            option.postData.ccCompanyUserList = that._ccCompanyUserList;

            //存在流程，且需要添加审批人
            /*if(that._dataInfo && that._dataInfo.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && that._auditList!=null && that._auditList.length>0){
                option.postData.auditPerson = that._auditList[0].id;
            }*/
            if(that._auditList!=null && that._auditList.length>0){
                option.postData.auditProcessList = that._auditList;
                option.postData.processType = 1;
            }else{
                option.postData.auditProcessList = that._auditProcessList;
                option.postData.processType = 2;
            }
            //option.postData.auditProcessList = that._auditProcessList;

            if(!isNullOrBlank(that.settings.dataCompanyId)){
                option.postData.projectCostPointDetail.companyId = that.settings.dataCompanyId;
            }else{
                option.postData.projectCostPointDetail.companyId = that._currentCompanyId;
            }

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染审批人、抄送
        ,renderApproverPage:function () {
            var that = this;

            //无需审批屏蔽分割线
            if(that._dataInfo.auditFlag==0){
                $(that.element).find('#approverOutBox').prev('.hr-line-dashed').hide();
            }
            var expAmout = $(that.element).find('input[name="fee"]').val()-0;
            $(that.element).find('#approverOutBox').m_approval_dynamic_audit({
                doType:0,
                colClass:{labelClass:'col-24-xs-3',contentClass:'col-24-xs-21'},
                condNum:expAmout,
                dynamicAuditMap:that._dataInfo,
                inputEle:$(that.element).find('input[name="fee"]'),
                renderCallBack:function (data,userList,ccUserList) {
                    that._auditProcessList = userList;
                    that._ccCompanyUserList = ccUserList;
                },
                addApproverCallBack:function (data) {
                    that._auditList = data;
                },
                addCcUserCallBack:function (data) {
                    that._ccCompanyUserList = data;
                }
            },true);
        }
        //添加回款的表单验证
        ,save_validate:function(){
            var that = this;
            var maxFee = (that.settings.pointInfo.fee).sub(that.settings.pointInfo.backFee);
            $(that.element).find('form').validate({
                rules: {
                    fee:{
                        required: true,
                        number:true,
                        minNumber:true,
                        over20:true,//整数部分是否超过10位
                        pointTwo:true,
                        ckFee:true
                    }
                },
                messages: {
                    fee:{
                        required:'请输入金额！',
                        number:'请输入有效数字',
                        minNumber:'请输入大于0的数字!',
                        over20:'对不起，您的操作超出了系统允许的范围。合同总金额的单位为“元”',
                        pointTwo:'请保留小数点后六位!',
                        ckFee:'发起申请金额不能大于'+maxFee+'!'

                    }

                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.insertAfter(element);
                }
            });
            $.validator.addMethod('minNumber', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if( value<=0){
                    isOk = false;
                }
                return  isOk;
            }, '请输入大于0的数字!');
            $.validator.addMethod('over20', function (value, element) {
                value = $.trim(value);
                var isOk = true;
                if(parseInt(value).toString().length>20)
                    isOk=false;
                return isOk;
            }, '对不起，您的操作超出了系统允许的范围。合同总金额的单位为“元”');
            $.validator.addMethod('pointTwo', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(!regularExpressions.numberWithPoints_2.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请保留小数点后两位');

            $.validator.addMethod('ckFee', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                var total = maxFee-0;
                if(value>total ){
                    isOk = false;
                }
                return  isOk;
            }, '发起申请金额不能大于'+maxFee+'!');
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
