/**
 * 费用核销
 * Created by wrb on 2019/11/27.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_cost_off",
        defaults = {
            isDialog:true,
            dataInfo:null,//dataInfo不为null,即编辑
            doType: 1,//
            saveCallBack:null,
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyUserId = window.currentCompanyUserId;
        this._currentCompanyUserName = window.companyUserInfo.userName;
        this._currentCompanyId = window.currentCompanyId;
        this._currentUserId = window.currentUserId;
        this._fastdfsUrl = window.fastdfsUrl;
        this._uploadmgrContainer = null;
        this._uuid = UUID.genV4().hexNoDelim;//targetId

        this._baseData = {};
        this._dataInfo = {};
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getExpBaseData;
            option.postData = {};

            if(that.settings.dataInfo && that.settings.dataInfo.formId)
                option.postData.formId = that.settings.dataInfo.formId;

            if(that.settings.dataInfo && that.settings.dataInfo.id)
                option.postData.id = that.settings.dataInfo.id;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._baseData = response.data;
                    var html = template('m_approval/m_approval_cost_off', {
                        data: that._baseData,
                        dataInfo:that.settings.dataInfo
                    });
                    that.renderDialog(html,function () {
                        that.fileUpload();
                        that.bindActionClick();
                        that.addItem();
                        //that.save_validate();
                        that.validateIsProcessForVerification(function (data) {
                            if(data.auditFlag==1){
                                that.renderApproverPage();
                            }
                        });

                        /*$(that.element).find('input[name="returnAmount"]').on('keyup',function () {

                            that.renderVerificationAmount();
                        });*/
                        if(that.settings.renderCallBack)
                            that.settings.renderCallBack();

                    });

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
                    title: that.settings.title||that._title+'申请',
                    area : ['980px'],
                    content:html,
                    btn:false
                    /*cancel:function () {
                    },
                    ok:function () {

                        var error = [];
                        var flag = $(that.element).find('form').valid();

                        $(that.element).find('.panel.panel-default form').each(function (i) {
                            if(!$(this).valid()){
                                error.push(i);
                            }
                        });
                        if(error.length>0){
                            flag = false;
                        }
                        if (!flag || that.save()) {
                            return false;
                        }
                    }*/

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    S_layer.resize(layero,index,dialogEle);
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
            var that = this;
            var $data = {};
            $data.detailList = [];
            $(that.element).find('.panel.panel-default').each(function () {
                var $this = $(this), expItem = {};
                expItem.expAmount = $this.find('input[name="expAmount"]').val();
                expItem.expUse = $this.find('textarea[name="expUse"]').val();
                expItem.projectId = $this.find('select[name="projectName"]').val();
                expItem.expType =  $this.find('select[name="expType"]').val();
                expItem.expAllName = $this.find('select[name="expType"] option:selected').parent().attr('label')+'-'+$this.find('select[name="expType"] option:selected').text();

                var linkageApproval = $this.find('select[name="linkageApproval"]').val();
                if(!isNullOrBlank(linkageApproval)){
                    expItem.relationRecord = {
                        relationId : linkageApproval,
                        recordType : '13'
                    };
                }
                $data.detailList.push(expItem);
            });
            $data.userId = that._currentCompanyUserId;
            $data.targetId = that._uuid;


            //存在流程，且需要添加审批人
            /*if(that._dataInfo && that._dataInfo.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && that._auditList!=null && that._auditList.length>0){
                $data.auditPerson = that._auditList[0].id;
            }*/
            if(that._auditList!=null && that._auditList.length>0){
                $data.auditProcessList = that._auditList;
                $data.processType = 1;
            }else{
                $data.auditProcessList = that._auditProcessList;
                $data.processType = 2;
            }
            //$data.auditProcessList = that._auditProcessList;
            $data.ccCompanyUserList = that._ccCompanyUserList;
            $data.sumExpAmount = $(that.element).find('#expAmount').text()-0;

            if($(that.element).find('.panel.panel-default').length==0)
                $data.sumExpAmount = 0;//如果没有明显，sumExpAmount = 0


            $data.returnAmount = $(that.element).find('input[name="returnAmount"]').val()-0;


            if(that.settings.dataInfo && that.settings.dataInfo.id)
                $data.relationId = that.settings.dataInfo.id;


            var option = {};
            option.classId = that.element;
            option.url = restApi.url_saveVerificationReceipts;
            option.postData = $data;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    S_layer.close($(that.element));
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //添加明细
        ,addItem:function (item) {
            var that = this;
            var panelBoxLen = $(that.element).find('.panel').length;
            that._baseData.itemIndex = panelBoxLen+1;
            var html = template('m_approval/m_approval_cost_off_item', {
                data:that._baseData,
                dataInfo:item
            });
            $(that.element).find('button[data-action="addItem"]').parents('.form-group').before(html);

            var $ele = $(that.element).find('button[data-action="addItem"]').parents('.form-group').prev();
            var $expType = $ele.find('select[name="expType"]');
            var $project = $ele.find('select[name="projectName"]');
            $expType.select2({
                tags:false,
                allowClear: false,
                minimumResultsForSearch: -1,
                width:'100%',
                language: "zh-CN"
            });
            $project.select2({
                allowClear: true,
                //minimumResultsForSearch: -1,
                placeholder: "请选择关联项目!",
                width:'100%',
                language: "zh-CN"
            });
            var changeFun = function ($this,selectVal) {

                var isProject = $this.find('option[value="'+selectVal+'"]').parent().attr('label')=='支出';
                var isProjectRequired = $project.find('.control-label span.fc-red').length>0?true:false;

                if(!isProjectRequired){
                    if(isProject){
                        $project.closest('.form-group').find('.control-label').html('关联项目<span class="color-red">*</span>：');
                    }else{
                        $project.closest('.form-group').find('.control-label').html('关联项目：');
                    }
                }
            };
            $expType.on('change',function (e) {

                var selectVal = $(this).val();
                changeFun($expType,selectVal);
            });
            var selectVal = $expType.val();
            changeFun($expType,selectVal);

            $ele.find('a[data-action="delItem"]').on('click',function () {
                $(this).closest('.panel').remove();
                $(that.element).find('span[data-action="itemIndex"]').each(function (i) {
                    $(this).html(i+1);
                });
            });

            $ele.find('input[name="expAmount"]').on('keyup',function () {

                var expAmout = 0;
                $(that.element).find('input[name="expAmount"]').each(function () {

                    expAmout = expAmout + ($(this).val()-0);
                });
                $(that.element).find('#expAmount').html(expNumberFilter(expAmout)).attr('data-value',expAmout);

                //var expBalance = expNumberFilter(expAmout-that.settings.dataInfo.sumExpAmount);
                //$(that.element).find('#expBalance').html(expBalance);
                that.renderApproverPage();

                that.renderVerificationAmount();

            });
            that.save_itemValidate($ele);
        }
        ,renderVerificationAmount:function () {
            var that = this;

            var returnAmount = 0;//$(that.element).find('input[name="returnAmount"]').val()-0;
              //  returnAmount = math.add(math.bignumber(that.settings.dataInfo.returnAmount),math.bignumber(returnAmount))-0;

            //报销金额
            var verificationAmount = $(that.element).find('#expAmount').attr('data-value')-0;
              //  verificationAmount = math.add(math.bignumber(that.settings.dataInfo.verificationAmount),math.bignumber(verificationAmount))-0;

            //计算当前申请金额+已经申请的金额
            var amount = math.add(math.bignumber(that.settings.dataInfo.applyAmount),math.bignumber(verificationAmount));
                amount = math.add(math.bignumber(returnAmount),math.bignumber(amount))-0;

            //如果amount>费用申请的总金额，核销金额= 总金额-已经申请的金额，否则 核销金额 = 当前的退还金额+报销金额
            if(amount>that.settings.dataInfo.sumExpAmount){
                var verificationAmountNew =　math.format(math.subtract(math.bignumber(that.settings.dataInfo.sumExpAmount),math.bignumber(that.settings.dataInfo.applyAmount)));
                $(that.element).find('#verificationAmount').html(expNumberFilter(verificationAmountNew));
            }else{

                var verificationAmountNew =　math.format(math.add(math.bignumber(returnAmount),math.bignumber(verificationAmount)));
                $(that.element).find('#verificationAmount').html(expNumberFilter(verificationAmountNew));
            }

        }
        //上传附件
        ,fileUpload:function () {
            var that =this;
            var option = {};
            that._uploadmgrContainer = $(that.element).find('.uploadmgrContainer:eq(0)');
            option.server = restApi.url_attachment_uploadExpenseAttach;
            option.accept={
                title: '上传附件',
                extensions: '*',
                mimeTypes: '*'
            };
            option.btnPickText = '<i class="fa fa-upload"></i>&nbsp;上传附件';
            option.ifCloseItemFinished = true;
            option.boxClass = 'no-borders';
            option.isShowBtnClose = false;
            option.uploadBeforeSend = function (object, data, headers) {
                data.companyId = that._currentCompanyId;
                data.accountId = that._currentUserId;
                data.targetId = that._uuid;
            };
            option.uploadSuccessCallback = function (file, response) {
                var fileData = {
                    netFileId: response.data.netFileId,
                    fileName: response.data.fileName,
                    fullPath: that._fastdfsUrl + response.data.fastdfsGroup + '/' + response.data.fastdfsPath
                };
                var $uploadItem = that._uploadmgrContainer.find('.uploadItem_' + file.id + ':eq(0)');
                if (!isNullOrBlank(fileData.netFileId)) {
                    $uploadItem.find('.span_status:eq(0)').html('上传成功');
                    var html = template('m_common/m_attach', fileData);
                    $('#showFileLoading').append(html);
                    that.bindAttachDelele();
                } else {
                    $uploadItem.find('.span_status:eq(0)').html('上传失败');
                }

            };
            that._uploadmgrContainer.m_uploadmgr(option, true);
        }
        ,bindAttachDelele: function () {
            var that = this;
            $.each($('#showFileLoading').find('a[data-action="deleteAttach"]'), function (i, o) {
                $(o).off('click.deleteAttach').on('click.deleteAttach', function () {
                    var netFileId = $(this).attr('data-net-file-id');
                    var type = $(this).attr('data-type');

                    var ajaxDelete = function () {
                        var ajaxOption = {};
                        ajaxOption.classId = '.file-list:eq(0)';
                        ajaxOption.url = restApi.url_attachment_delete;
                        ajaxOption.postData = {
                            id: netFileId,
                            accountId: that._currentUserId
                        };
                        m_ajax.postJson(ajaxOption, function (res) {
                            if (res.code === '0') {
                                S_toastr.success("删除成功");
                            } else if (res.code === '1') {
                                S_layer.error(res.msg);
                            }
                        });
                    };

                    if(type==-1){
                        that._deleteAttachList.push(netFileId);
                    }else{
                        ajaxDelete();
                    }
                    $(this).closest('span').remove();
                })
            });
            $.each($('#showFileLoading').find('a[data-action="preview"]'), function (i, o) {
                $(o).off('click.preview').on('click.preview', function () {
                    window.open($(this).attr('data-src'));
                })
            });
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action],a[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');

                switch (dataAction){
                    case 'addItem'://添加明细
                        that.addItem();
                        return false;
                        break;
                    case 'save'://保存
                        var error = [];
                        var flag = true;

                        if(!$(that.element).find('form.m-approval-cost-off').valid()){
                            error.push(-1);
                        }

                        $(that.element).find('.panel.panel-default form').each(function (i) {
                            if(!$(this).valid()){
                                error.push(i);
                            }
                        });
                        if(error.length>0){
                            flag = false;
                        }
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
                        break;
                    case 'cancel'://取消
                        S_layer.close($(that.element));
                        return false;
                        break;


                }

            })
        }
        ,save_itemValidate:function($ele){
            var that = this;
            $ele.find('form').validate({
                rules: {
                    expAmount: {
                        required: true,
                        number:true,
                        minNumber:true,
                        maxlength:25,//是否超过25位
                        pointTwo:true
                    },
                    expUse:{
                        required: true
                    },
                    projectName:{
                        associatedProjectCk: true
                    }
                },
                messages: {
                    expAmount: {
                        required: '请输入金额！',
                        number:'请输入有效数字',
                        minNumber:'请输入大于0的数字!',
                        maxlength:'对不起，您的操作超出了系统允许的范围。',
                        pointTwo:'请保留小数点后两位!'
                    },
                    expUse:{
                        required: '请输入用途说明！'
                    },
                    projectName:{
                        associatedProjectCk: '请选择关联项目！'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
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
            $.validator.addMethod('pointTwo', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(!regularExpressions.proportionnumber.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请保留小数点后两位!');
            $.validator.addMethod('associatedProjectCk', function(value, element) {

                var isOk = true;
                var $panel = $(element).closest('.panel');
                value = $panel.find('select[name="projectName"]').val();
                var expParentType = $panel.find('select[name="expType"] option:selected').parent().attr('label');
                if(expParentType == '支出' && isNullOrBlank(value)){
                    isOk = false;
                }
                return  isOk;

            }, '请选择关联项目!');
        }
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form.m-approval-cost-off').validate({
                rules: {
                    returnAmount: {
                        number:true,
                        minNumber1:true,
                        maxlength:25,//是否超过25位
                        pointTwo1:true
                    }
                },
                messages: {
                    returnAmount: {
                        number:'请输入有效数字',
                        minNumber1:'请输入大于0的数字!',
                        maxlength:'对不起，您的操作超出了系统允许的范围。',
                        pointTwo1:'请保留小数点后两位!'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
            });
            $.validator.addMethod('minNumber1', function(value, element) {
                value = $.trim(value)-0;
                var isOk = true;
                if(value<0){
                    isOk = false;
                }
                return  isOk;
            }, '请输入大于0的数字!');
            $.validator.addMethod('pointTwo1', function(value, element) {
                value = $.trim(value)-0;

                var isOk = true;
                if(!regularExpressions.proportionnumber.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请保留小数点后两位!');
        }
        //渲染审批人、抄送
        ,renderApproverPage:function (departId) {
            var that = this;

            var condNum = $(that.element).find('#expAmount').text()-0;

            $(that.element).find('#approverOutBox').m_approval_dynamic_audit({
                doType:0,
                //isDynamicForm:true,
                departId:that.settings.dataInfo.departId,
                dynamicAuditMap:that._dataInfo,
                condNum:condNum,
                inputEle:$(that.element).find('input[name="expAmount"]'),
                renderCallBack:function (data,userList,ccUserList,conditionFieldId) {
                    that._auditProcessList = userList;
                    that._ccCompanyUserList = ccUserList;
                    that._conditionFieldId = conditionFieldId;
                },
                addApproverCallBack:function (data) {
                    that._auditList = data;
                },
                addCcUserCallBack:function (data) {
                    that._ccCompanyUserList = data;
                }
            },true);
        }
        //重新请求审批数据
        ,getApproverData:function (callBack) {
            var that = this;
            var option  = {};
            var applyUserId = window.currentCompanyUserId;
            option.url = restApi.url_getCurrentProcessByApplyUser;
            option.postData = {formId:'expApply',applyUserId:applyUserId};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    that._dataInfo.conditionList = response.data.conditionList;
                    that._dataInfo.auditFlag = '1';
                    if(callBack)
                        callBack();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //判断是否走审批
        ,validateIsProcessForVerification:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_validateIsProcessForVerification;
            option.postData = {};
            option.postData.id = that.settings.dataInfo.id;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataInfo.conditionList = response.data.conditionList;
                    that._dataInfo.auditFlag = response.data.auditFlag;
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
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
