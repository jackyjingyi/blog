/**
 * 审批管理
 * Created by wrb on 2019/4/30.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_dynamic_audit",
        defaults = {
            doType:0,//0=发起审批，1=项目立项,2=收款，3=付款,4=收付款申请删除审批,5=收款添加节点,6=付款添加节点,7=合同审批
            colClass:null,//
            departId:null,//根据部门切换流程
            companyId:null,
            ccCompanyUserList:null,
            auditList:null,
            dynamicAuditMap:null,
            condNum :0,//分条件数字
            isDynamicForm:false,//是否动态表单
            inputEle:null,//keyup事件元素
            postParam:null,//请求参数
            dataCompanyId:null,//视图组织ID
            renderCallBack:null,
            addApproverCallBack:null,
            addCcUserCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._ccCompanyUserList = this.settings.ccCompanyUserList;//抄送人
        this._auditList = this.settings.auditList;//审批人
        this._dynamicAuditMap = this.settings.dynamicAuditMap;

        this._userList = [];//用于返回所对应的流程人员

        this._conditionInfo = {};//当前匹配的条件信息

        this._labelClass = 'col-sm-2';
        this._contentClass = 'col-sm-10';

        if(this.settings.doType==1){
            this._labelClass = 'col-24-md-3';
            this._contentClass = 'col-24-md-8';
        }
        else if(this.settings.doType==2 || this.settings.doType==3){
            this._labelClass = 'col-24-md-5';
            this._contentClass = 'col-24-md-19';
        }

        if(this.settings.colClass){
            this._labelClass = this.settings.colClass.labelClass;
            this._contentClass = this.settings.colClass.contentClass;
        }


        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var companyId = that.settings.companyId;
            if(isNullOrBlank(companyId))
                companyId = that._currentCompanyId;

            that.getAuditData(companyId,function (data) {

                if(that._dynamicAuditMap==null || that._dynamicAuditMap.auditFlag==0){

                    $(that.element).html('');
                    return;
                }

                that.getConditionInfo(that._dynamicAuditMap);
                that.render();
                that.bindInputKeyup();
            });

        }
        //渲染界面
        ,render:function () {
            var that = this;
            that.dealApproverData();
            var iHtml = template('m_approval/m_approval_dynamic_audit', {
                dynamicAuditMap:that._dynamicAuditMap,
                userList:that._userList,
                processFlag:that._conditionInfo.processFlag,
                labelClass:that._labelClass,
                contentClass:that._contentClass
            });
            $(that.element).html(iHtml);

            that.renderApprover();
            that.renderCCBox(that._dynamicAuditMap);
            that.bindActionClick();
            $(that.element).find('[data-toggle="tooltip"]').tooltip();
            if(that.settings.renderCallBack)
                that.settings.renderCallBack(that._dynamicAuditMap,that._userList,that._ccCompanyUserList,that._conditionInfo.conditionFieldId);
        }
        //根据当前组织ID，获取当前条件数据
        ,getConditionInfo:function (dynamicAuditMap) {
            var that = this;
            if(dynamicAuditMap==null)
                return;

            if(dynamicAuditMap.conditionList && dynamicAuditMap.conditionList.length>0){

                if(that.settings.departId==null){
                    that._conditionInfo = dynamicAuditMap.conditionList[0];
                }else{
                    $.each(dynamicAuditMap.conditionList,function (i,item) {

                        if(that.settings.departId!=null && that.settings.departId==item.key){
                            that._conditionInfo = item;
                            return false;
                        }
                    });
                }
            }
        }
        //数据处理
        ,dealApproverData:function () {
            var that = this;
            var userList = [],ccUserList = [], conditionList = that._conditionInfo.conditionList;

            //重新取得分条件字段的值
            var condNum = 0;
            if(that._conditionInfo && that._conditionInfo.conditionFieldId && that.settings.isDynamicForm==true){

                $('.m-form-template-generate-edit ').find('div.form-item[data-type="5"][data-field-id="'+that._conditionInfo.conditionFieldId+'"]').each(function (i) {
                    var num = $(this).find('input').val()-0;
                    condNum += num;
                });
            }else if(that.settings.inputEle){
                //用于分条件，流程变化
                that.settings.inputEle.each(function (i) {
                    condNum += ($(this).val()-0);
                });
            }else{
                condNum = that.settings.condNum;
            }
            //that.settings.condNum = condNum;
            if(isNullOrBlank(condNum))
                condNum = 0;

            if(that._conditionInfo.processType=='2'  && conditionList!=null && conditionList.length>0){//固定流程

                userList = conditionList[0].userList;
                ccUserList = conditionList[0].ccCompanyUserList;

            }else if(that._conditionInfo.processType=='3'  && conditionList!=null && conditionList.length>0){//条件流程

                $.each(conditionList,function (i,item) {

                    if((item.min=='null' || isNullOrBlank(item.min)) && condNum>=0 && (item.max!='null' && !isNullOrBlank(item.max) && condNum<item.max-0)){//min为空，max不为空
                        userList = item.userList;
                        ccUserList = item.ccCompanyUserList;
                        return false;
                    }else if(item.min!='null' && !isNullOrBlank(item.min) && condNum>=item.min-0 && item.max!='null' && !isNullOrBlank(item.max) && condNum<item.max-0){//min不为空，max不为空
                        userList = item.userList;
                        ccUserList = item.ccCompanyUserList;
                        return false;
                    }else if(item.min!='null' && !isNullOrBlank(item.min) && condNum>=item.min-0 && (item.max=='null' || isNullOrBlank(item.max))){//min不为空，max为空
                        userList = item.userList;
                        ccUserList = item.ccCompanyUserList;
                        return false;
                    }
                });
            }
            that._userList = userList;
            that._ccCompanyUserList = ccUserList;
        }
        ,renderApprover:function () {
            var that = this;
            var html = template('m_approval/m_approval_cost_add_approver', {userList: that._userList});
            that.insertHtmlByApprover(html);
        }
        //插入审批人
        ,insertHtmlByApprover:function (html) {
            var that = this;
            var $addApprover = $(that.element).find('#approverBox a[data-action="addApprover"]');
            if($addApprover.length>0){
                $addApprover.parent().siblings().remove();
                $(that.element).find('#approverBox').prepend(html);
            }else{
                $(that.element).find('#approverBox').html(html);
            }
            if($(that.element).find('#approver-error.error').length>0)
                $(that.element).find('#approver-error.error').remove();//若有提示，删除
        }
        ,renderCCBox:function (dynamicAuditMap) {
            var that = this;
            if(dynamicAuditMap==null)
                return;

            if(that._ccCompanyUserList){

                /*that._ccCompanyUserList = [];
                $.each(dynamicAuditMap.dynamicAudit.ccCompanyUserList,function (i,item) {
                    that._ccCompanyUserList.push({
                        id:item.companyUserId,
                        userName:item.userName,
                        userId:item.userId
                    })
                });*/
                $.each(that._ccCompanyUserList,function (i,item) {
                    if(item.imgUrl)
                        item.fileFullPath = item.imgUrl;
                });
                var html = template('m_approval/m_approval_cost_add_ccUser', {userList: that._ccCompanyUserList});
                $(that.element).find('#ccUserListBox a[data-action="addCcUser"]').parent().siblings().remove();
                $(that.element).find('#ccUserListBox').prepend(html);
                that.ccBoxDeal();
            }
        }
        //抄送人事件处理
        ,ccBoxDeal:function () {
            var that = this;
            $(that.element).find('#ccUserListBox .approver-box').hover(function () {
                $(this).find('.cc-remove').show();
            },function () {
                $(this).find('.cc-remove').hide();
            });
            $(that.element).find('#ccUserListBox a[data-action="removeCcUser"]').off('click').on('click',function () {

                var i = $(that.element).find('#ccUserListBox .approver-outbox').index($(this).closest('.approver-outbox'));
                that._ccCompanyUserList.splice(i,1);
                $(this).closest('.approver-outbox').remove();
            });
        }
        ,getAuditData:function (companyId,callBack) {
            var that = this;

            if(that.settings.dynamicAuditMap){

                that._dynamicAuditMap = that.settings.dynamicAuditMap;
                if(callBack)
                    return callBack(that._dynamicAuditMap);

            }else{

                var option  = {};
                option.url = restApi.url_queryDynamicAudit+'/'+companyId;

                if(that.settings.doType==2 || that.settings.doType==5){

                    option.url = restApi.url_queryConstDynamicAudit;
                    option.postData = {formId:'receiveProjectCost'};

                }else if(that.settings.doType==3 || that.settings.doType==6){

                    option.url = restApi.url_queryConstDynamicAudit;
                    option.postData = {formId:'payProjectCost'};

                }else if(that.settings.doType==4){

                    option.url = restApi.url_initProjectCostPaymentDetailAudit;
                    option.postData = {};
                }
                else if(that.settings.doType==7){

                    option.url = restApi.url_queryProjectContractDynamicAudit+'/'+companyId;
                }

                var resultFun = function (response) {
                    if(response.code=='0'){
                        that._dynamicAuditMap = response.data;
                        if(callBack)
                            return callBack(that._dynamicAuditMap);

                    }else {
                        S_layer.error(response.info);
                    }
                };

                if(that.settings.doType==4 || that.settings.doType==2 || that.settings.doType==5 || that.settings.doType==3 || that.settings.doType==6){

                    option.postData = $.extend({}, option.postData, that.settings.postParam);

                    m_ajax.postJson(option,function (response) {
                        resultFun(response);
                    })
                }else{
                    m_ajax.post(option,function (response) {
                        resultFun(response);
                    })
                }

            }


        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'addCcUser'://添加抄送人

                        var options = {};
                        options.title = '添加抄送人员';
                        options.selectedUserList = that._ccCompanyUserList;

                        var companyId = that.settings.dataCompanyId;
                        if(isNullOrBlank(companyId))
                            companyId = that._currentCompanyId;

                        if(that.settings.doType==5||that.settings.doType==6 || that.settings.doType==0){
                            options.treeUrl = restApi.url_getOrgStructureTree+'/'+companyId;
                        }
                        options.saveCallback = function (data) {
                            that._ccCompanyUserList = data.selectedUserList;
                            var html = template('m_approval/m_approval_cost_add_ccUser', {userList: data.selectedUserList});
                            $(that.element).find('#ccUserListBox a[data-action="addCcUser"]').parent().siblings().remove();
                            $(that.element).find('#ccUserListBox').prepend(html);
                            that.ccBoxDeal();
                            if(that.settings.addCcUserCallBack)
                                that.settings.addCcUserCallBack(that._ccCompanyUserList);
                        };
                        $('body').m_orgByTree(options);
                        break;

                    case 'addApprover'://添加审批人

                        var options = {};
                        options.title = '添加审批人员';
                        options.selectedUserList = that._auditList;
                        //options.isASingleSelectUser = true;

                        var companyId = that.settings.dataCompanyId;
                        if(isNullOrBlank(companyId))
                            companyId = that._currentCompanyId;

                        if(that.settings.doType==5||that.settings.doType==6 || that.settings.doType==0){
                            options.treeUrl = restApi.url_getOrgStructureTree+'/'+companyId;
                        }

                        options.saveCallback = function (data) {
                            that._auditList = data.selectedUserList;
                            var html = template('m_approval/m_approval_cost_add_approver', {userList: data.selectedUserList});
                            that.insertHtmlByApprover(html);

                            if(that.settings.addApproverCallBack)
                                that.settings.addApproverCallBack(that._auditList);
                        };
                        $('body').m_orgByTree(options);
                        break;

                }

            });
        }
        ,bindInputKeyup:function () {
            var that = this;
            if(that._conditionInfo && that._conditionInfo.conditionFieldId && that.settings.isDynamicForm==true){
                //重新绑定事件用于分条件，流程变化
                $('.m-form-template-generate-edit ').find('div.form-item[data-type="5"][data-field-id="'+that._conditionInfo.conditionFieldId+'"] input').off('keyup').on('keyup',function () {
                    that.render();
                });
            }else if(that.settings.inputEle){
                //用于分条件，流程变化
                that.settings.inputEle.on('keyup',function () {
                    that.render();
                });
            }
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
