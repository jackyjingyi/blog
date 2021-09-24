/**
 * 收付款－删除
 * Created by wrb on 2019/4/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_cost_delete",
        defaults = {
            isDialog:true
            ,doType:0//0=默认，1=付款申请删除
            ,title:null
            ,id:null
            ,pointId:null//节点ID
            ,dataCompanyId:null//视图组织ID
            ,payType:null
            ,fee:0
            ,saveCallBack:null

        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._auditList = [];//审批人
        this._ccCompanyUserList = [];//抄送人
        this._dynamicAuditMap = null;//审批单数据
        this._auditProcessList = [];//流程 的人员/部门主管

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_cost/m_cost_delete',{});
            that.renderDialog(html,function () {

                that.renderApproverPage();
                that.save_validate();

            });

        }
        //渲染列表内容
        ,renderDialog:function (html,callBack) {
            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title:that.settings.title || '删除原因',
                    area : '500px',
                    fixed:true,
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();

                        if(that._dynamicAuditMap && that._dynamicAuditMap.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && (that._auditList==null || that._auditList.length==0)){
                            //存在审批，且需要添加审批人
                            S_toastr.error('请选择审批人！');
                            return false;
                        }

                        if (!flag || that.save()) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
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
        //保存合同回款节点
        ,save:function () {

            var that = this,option  = {},isError = false;
            option.classId = that.element;
            option.url = restApi.url_deleteProjectCostAudit;
            option.postData = $(that.element).find('form').serializeObject();

            if(that.settings.doType==1){
                option.url = restApi.url_deleteProjectCostPaymentDetailAudit;
                option.postData.projectCostPointDetail = {
                    id: that.settings.id,
                    payType: that.settings.payType
                };
            }else{
                option.postData.projectCostEditDTO = {
                    id: that.settings.id,
                    payType: that.settings.payType
                };
            }

            option.postData.ccCompanyUserList = that._ccCompanyUserList;

            //存在流程，且需要添加审批人
            /*if(that._dynamicAuditMap && that._dynamicAuditMap.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && that._auditList!=null && that._auditList.length>0){
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

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('操作成功！');
                    if(that.settings.saveCallBack!=null)
                        that.settings.saveCallBack();


                }else {
                    S_layer.error(response.info);
                    isError = true;
                }
            });
            return isError;
        }
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    reason: {
                        required: true,
                        maxlength: 250
                    }
                },
                messages: {
                    reason: {
                        required: '请输入原因!',
                        maxlength: '原因描述不超过250位!'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-24-md-19'));

                }
            });
        }
        ,renderApproverPage:function (companyId) {
            var that = this;

            var param = {companyId:that.settings.dataCompanyId?that.settings.dataCompanyId:window.currentCompanyId};
            var doType = that.settings.payType==2?3:2;
            if(that.settings.doType==1){
                doType = 4;
                param = {
                    pointId: that.settings.pointId,
                    pointDetailId: that.settings.id,
                    companyId:that.settings.dataCompanyId?that.settings.dataCompanyId:window.currentCompanyId
                };

            }

            $(that.element).find('#approverOutBox').m_approval_dynamic_audit({
                doType:doType,
                postParam:param,
                condNum:that.settings.fee,
                renderCallBack:function (data,userList,ccUserList) {

                    that._dynamicAuditMap = data;
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
