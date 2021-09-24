/**
 * 费用核销
 * Created by wrb on 2020/3/25.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_cost_off_return",
        defaults = {
            isDialog:true,
            dataInfo:null,//dataInfo不为null,即编辑
            isFinanceVerification: 1,//isFinanceVerification = 1:财务直接核销，0：非财务发起核销
            saveCallBack:null,
            renderCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyUserId = window.currentCompanyUserId;//员工ID
        this._currentCompanyId = window.currentCompanyId;//组织ID
        this._currentUserId = window.currentUserId;//用户ID
        this._uploadmgrContainer = null;
        this._uuid = UUID.genV4().hexNoDelim;//targetId
        this._targertId = null;
        this._fastdfsUrl = window.fastdfsUrl;
        this._baseData = {};
        this._dataInfo = {};
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            //console.log(that.settings.dataInfo);
            var html = template('m_approval/m_approval_cost_off_return', that.settings.dataInfo);
            that.renderDialog(html,function () {
                that.fileUpload();
                that.validateIsProcessForVerification(function (data) {
                    if(data.auditFlag==1){
                        that.renderApproverPage();
                    }
                });
                that.bindActionClick();
                that.save_validate();
                if(that.settings.renderCallBack)
                    that.settings.renderCallBack();

            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||that._title+'申请',
                    area : ['750px','650px'],
                    content:html,
                    btn:false

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
        ,save:function (allocationDate) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_financialVerificationForExpApply2;
            option.postData = {};
            option.postData.relationId = that.settings.dataInfo.id;
            option.postData.returnAmount = $(that.element).find('input[name="returnAmount"]').val()-0;
            option.postData.verificationAmount = $(that.element).find('input[name="returnAmount"]').val()-0;
            option.postData.targetId = that._targertId;
            option.postData.allocationDate = allocationDate;
            if(that._auditList!=null && that._auditList.length>0){
                option.postData.auditProcessList = that._auditList;
                option.postData.processType = 1;
            }else{
                option.postData.auditProcessList = that._auditProcessList;
                option.postData.processType = 2;
            }
            option.postData.ccCompanyUserList = that._ccCompanyUserList;
            option.postData.isFinanceVerification = that.settings.isFinanceVerification;

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
                    that._targertId = that._uuid;
                    $uploadItem.find('.span_status:eq(0)').html('上传成功');
                    var html = template('m_common/m_attach', fileData);
                    $(that.element).find('#showFileLoading').append(html);
                    that.bindAttachDelete();
                } else {
                    $uploadItem.find('.span_status:eq(0)').html('上传失败');
                }

            };
            that._uploadmgrContainer.m_uploadmgr(option, true);
        }
        ,bindAttachDelete: function () {
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
                    case 'save'://保存
                        if(!$(that.element).find('form').valid()){
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        if(that._dataInfo && that._dataInfo.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && (that._auditList==null || that._auditList.length==0)){
                            //存在审批，且需要添加审批人
                            S_toastr.error('请选择审批人！');
                            return false;
                        }
                        if(that._dataInfo.auditFlag==0 && that.settings.isFinanceVerification==1){//不走审批
                            var currDate = getNowDate();
                            S_layer.dialog({
                                title: '请选择时间',
                                area : ['300px','165px'],
                                content:'<form class="agreeToGrantForm m"><div class="form-group text-center col-md-12 "><input class="form-control" type="text" name="allocationDate" onclick="WdatePicker()" value="'+currDate+'" readonly></div></form>',
                                cancel:function () {
                                },
                                ok:function () {
                                    if ($('form.agreeToGrantForm').valid()) {
                                        var allocationDate = $('form.agreeToGrantForm input[name="allocationDate"]').val();
                                        that.save(allocationDate);
                                    } else {
                                        return false;
                                    }
                                }
                            },function(layero,index,dialogEle){//加载html后触发
                                that.saveAgreeToGrant_validate();
                            });
                        }else{//走审批
                            that.save(null);
                        }


                        break;
                    case 'cancel'://取消
                        S_layer.close($(that.element));
                        return false;
                        break;


                }

            });

            $(that.element).find('input[name="returnAmount"]').on('keyup',function () {

                var fee = $(this).val()-0;
                fee = expNumberFilter(fee);
                $(that.element).find('#verificationAmount').html(fee);

            })
        }

        ,save_validate:function(){
            var that = this;
            var checkMaxAmount = math.subtract(math.bignumber(that.settings.dataInfo.sumExpAmount),math.bignumber(that.settings.dataInfo.applyAmount)) - 0;
            $(that.element).find('form').validate({
                rules: {
                    returnAmount: {
                        required: true,
                        number:true,
                        minNumber:true,
                        checkMax:true,
                        maxlength:25,//是否超过25位
                        pointTwo:true
                    }
                },
                messages: {
                    returnAmount: {
                        required: '请输入金额！',
                        number:'请输入有效数字！',
                        minNumber:'请输入大于0的数字！',
                        checkMax:'输入的金额不能大于剩余核销金额（￥'+checkMaxAmount+'）！',
                        maxlength:'对不起，您的操作超出了系统允许的范围。',
                        pointTwo:'请保留小数点后两位！'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-24-xs-21'));
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
            $.validator.addMethod('checkMax', function(value, element) {
                value = $.trim(value)-0;
                var isOk = true;
                if( value>checkMaxAmount){
                    isOk = false;
                }
                return  isOk;
            }, '输入的金额不能大于剩余核销金额（￥'+checkMaxAmount+'）！');
            $.validator.addMethod('pointTwo', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(!regularExpressions.proportionnumber.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请保留小数点后两位!');
        }
        //时间验证
        ,saveAgreeToGrant_validate: function () {
            var that = this;
            $('form.agreeToGrantForm').validate({
                rules: {
                    allocationDate: 'required'
                },
                messages: {
                    allocationDate: '请选择时间！'
                }
            });
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
                    that._dataInfo.companyId = response.data.companyId;
                    if(callBack)
                        callBack(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });
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
                dataCompanyId:that._dataInfo.companyId,
                condNum:condNum,
                colClass:{labelClass:'col-24-xs-3',contentClass:'col-24-xs-21'},
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
