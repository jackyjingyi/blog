/**
 * 添加费用申请2
 * Created by wrb on 2018/9/4.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_cost_add",
        defaults = {
            isDialog:true,
            dataInfo:null,//dataInfo不为null,即编辑
            doType: 1,//1=费用申请
            saveCallBack:null
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

        this._dataInfo = {};
        this._auditList = [];//审批人
        this._ccCompanyUserList = [];//抄送人
        this._deleteAttachList = [];//编辑才用，已有删除的集合
        this._auditProcessList = [];//流程 的人员/部门主管
        this._conditionFieldId = null;
        this._listAllCompany = null;//收付款方

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var option = {};
            option.url = restApi.url_initDynamicAudit;
            option.postData = {};

            if(that.settings.dataInfo && that.settings.dataInfo.formId)
                option.postData.formId = that.settings.dataInfo.formId;

            if(that.settings.dataInfo && that.settings.dataInfo.id)
                option.postData.id = that.settings.dataInfo.id;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._dataInfo = response.data;
                    var html = template('m_approval/m_approval_cost_add', {
                        doType:that.settings.doType,
                        dataInfo:response.data,
                        currentCompanyUserId:that._currentCompanyUserId,
                        currentCompanyUserName:that._currentCompanyUserName
                    });
                    that.renderDialog(html,function () {

                        that.renderApproverPage();
                        that.renderApplyUserSelect2();
                        that.initExpTypeSelect2();
                        that.initExpMethodSelect2();
                        that.getListAllCompany(function () {
                            that.initSelect2ByPayee('enterprise');
                            that.initSelect2ByPayee('fromCompany');
                        });
                        that.fileUpload();
                        that.save_validate();
                        //禁用申请人选择
                        $(that.element).find('select[name="applyUserId"]').prop('disabled', true);
                        //禁用部门选择
                        $(that.element).find('select[name="departId"]').prop('disabled', true);
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
                    title: that.settings.title||'往来',
                    area : '980px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();
                        if (!flag) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        //收款方
                        var enterpriseName = $(that.element).find('input[name="enterpriseName"]').val();
                        //付款方
                        var fromCompanyName = $(that.element).find('input[name="fromCompanyName"]').val();

                        if(enterpriseName!='' && fromCompanyName!='' && enterpriseName==fromCompanyName){
                            S_toastr.error('收付款方不能一样，请重新选择或输入！');
                            return false;
                        }
                        if(that._dataInfo && that._dataInfo.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && (that._auditList==null || that._auditList.length==0)){
                            //存在审批，且需要添加审批人
                            S_toastr.error('请选择审批人！');
                            return false;
                        }
                        that.save()
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                    S_layer.resize(layero,index,dialogEle);
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //申请人select2
        ,renderApplyUserSelect2:function () {
            var that = this;

            var renderDepart = function (data) {
                that.getUserDepart(function (resData) {
                    if(resData){
                        that.renderDepartSelect2(resData);
                        $(that.element).find('select[name="departId"]').val(resData[0].departId).trigger('change');
                    }
                },data);
            };

            $(that.element).find('select[name="applyUserId"]').m_select2_by_search({
                type:1,
                isCookies:false,
                changeCallBack:function (data) {

                    that.getApproverData(function () {
                        renderDepart(data);
                    });
                },
                option:{
                    multiple:false,
                    url:restApi.url_getUserByKeyWord,
                    params:that.settings.postParam,
                    value:[{id:that._currentCompanyUserId,text:that._currentCompanyUserName}]
                }},true);
        }
        //获取部门
        ,getUserDepart:function (callBack,id) {
            var option = {};
            option.url = restApi.url_getUserDepart;
            if(!isNullOrBlank(id))
                option.url = restApi.url_getUserDepart+'/'+id;

            m_ajax.get(option, function (response) {
                if (response.code == '0') {

                    if(callBack)
                        callBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,renderDepartSelect2:function (resData) {
            var that = this;

            var renderDepart = function (datas) {
                var data = [];
                $.each(datas, function (i, o) {
                    data.push({id: o.departId, text: o.departName});
                });
                var $select = $(that.element).find('select[name="departId"]');

                if($select.next('.select2-container').length>0){
                    $select.select2('destroy').empty();
                }
                $select.select2({
                    width: '100%',
                    allowClear: false,
                    language: 'zh-CN',
                    minimumResultsForSearch: Infinity,
                    data: data
                });
                $select.on('change',function () {

                    var departId = $(this).val();
                    that.renderApproverPage(departId);
                });
            };

            if(!isNullOrBlank(resData)){
                renderDepart(resData);
            }else{
                that.getUserDepart(function (datas) {
                    renderDepart(datas);
                });
            }

        }
        //重新请求审批数据
        ,getApproverData:function (callBack) {
            var that = this;
            var option  = {};
            var applyUserId = $(that.element).find('select[name="applyUserId"]').val();
            option.url = restApi.url_getCurrentProcessByApplyUser;
            option.postData = {formId:that.settings.dataInfo.formId,applyUserId:applyUserId};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    that._dataInfo.conditionList = response.data.conditionList;
                    if(callBack)
                        callBack();
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //渲染审批人、抄送
        ,renderApproverPage:function (departId) {
            var that = this;
            $(that.element).find('#approverOutBox').m_approval_dynamic_audit({
                doType:0,
                departId:departId,
                dynamicAuditMap:that._dataInfo,
                inputEle:$(that.element).find('input[name="sumExpAmount"]'),
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
        //费用类型
        ,initExpTypeSelect2:function () {
            var that = this;
            var option = {};
            option.url = restApi.url_getExpCategoryTypeList2;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var data = [];//[{id:'',text:'请选择'}];

                    if(response.data && response.data.length>0){

                        $.each(response.data,function (i,item) {

                            var child = [];
                            if(item.child){
                                $.each(item.child,function (ci,citem) {
                                    child.push({
                                        id:citem.id,
                                        text:citem.name
                                    })
                                })
                            }
                            data.push({
                                text:item.parent.name,
                                children:child
                            })
                        });
                    }

                    $(that.element).find('select[name="expAllName"]').select2({
                        width: '100%',
                        allowClear: false,
                        language: 'zh-CN',
                        minimumResultsForSearch: Infinity,
                        data: data
                    });
                    $(that.element).find('select[name="expAllName"]').on('change',function () {

                    });


                } else {
                    S_layer.error(response.info);
                }
            });

        }
        ,initExpMethodSelect2:function () {
            var that = this;
            var data = [
                {id:'',text:'请选择'},
                {id:'支票',text:'支票'},
                {id:'贷记',text:'贷记'},
                {id:'电汇',text:'电汇'},
                {id:'汇票',text:'汇票'},
                {id:'现金',text:'现金'},
                {id:'银行卡',text:'银行卡'},
                {id:'转账',text:'转账'},
                {id:'其他',text:'其他'}
            ];
            $(that.element).find('select[name="expType"]').select2({
                width: '100%',
                allowClear: false,
                language: 'zh-CN',
                minimumResultsForSearch: Infinity,
                data: data
            });
        }
        //初始化收付款方
        ,initSelect2ByPayee:function (name) {
            var that = this;
            var $select = $(that.element).find('select[name="'+name+'Id"]');
            var key = name+'Name',placeholder = $select.attr('data-placeholder');
            var data = [{id:'',text:placeholder}];
            if(that._listAllCompany){
                $.each(that._listAllCompany,function (i,item) {
                    data.push({id:item.id,text:item.orgName});
                });
            }
            $select.m_select2_by_search({
                type:3,
                isCookies:false,
                option:{
                    data:data,
                    multiple:false,
                    isResultsText:false,
                    placeholder:placeholder,
                    tags:false,
                    containerCssClass:'',
                    width:'100%',
                    key:key
                },
                renderCallBack:function () {

                },
                changeCallBack:function (data) {
                    //console.log('changeCallBack')
                },
                inputKeyupCallBack:function (data) {
                    //console.log('inputKeyupCallBack')
                }
            },true);
        }
        //获取收付款方
        ,getListAllCompany:function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_listAllCompany;
            m_ajax.post(option, function (response) {
                if (response.code == '0') {

                    that._listAllCompany = response.data;
                    if(callBack)
                        callBack();

                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveApplyFee;
            option.postData = $(that.element).find('form').serializeObject();
            option.postData.type = 'expApply';

            var expTypePName = $(that.element).find('select[name="expAllName"] option:selected').parent().attr('label');
            var expTypeName = $(that.element).find('select[name="expAllName"] option:selected').text();
            option.postData.expAllName = expTypePName+'-'+expTypeName;
            option.postData.targetId = that._uuid;

            //收款方
            var $enterprise = $(that.element).find('select[name="enterpriseId"]');
            var enterpriseName = $.trim($enterprise.next().find('.new-input input').val());
            var enterpriseId = $enterprise.find('option[data-text="'+enterpriseName+'"]').attr('value');
            option.postData.enterpriseId = enterpriseName;
            if(!isNullOrBlank(enterpriseId)){
                option.postData.enterpriseId = enterpriseId;
            }

            //付款方
            var $fromCompany = $(that.element).find('select[name="fromCompanyId"]');
            var fromCompanyName = $.trim($fromCompany.next().find('.new-input input').val());
            var fromCompanyId = $fromCompany.find('option[data-text="'+fromCompanyName+'"]').attr('value');
            option.postData.fromCompanyId = fromCompanyName;
            if(!isNullOrBlank(fromCompanyId)){
                option.postData.fromCompanyId = fromCompanyId;
            }

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
            option.postData.ccCompanyUserList = that._ccCompanyUserList;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();
                } else {
                    S_layer.error(response.info);
                }
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

                    case 'addCcUser'://添加抄送人

                        var options = {};
                        options.title = '添加抄送人员';
                        options.selectedUserList = [];
                        options.saveCallback = function (data) {
                            that._ccCompanyUserList = data.selectedUserList;
                            var html = template('m_approval/m_approval_cost_add_ccUser', {userList: data.selectedUserList});
                            $(that.element).find('#ccUserListBox').html(html);
                            that.ccBoxDeal();
                        };
                        $('body').m_orgByTree(options);
                        break;

                    case 'addApprover'://添加审批人

                        var options = {};
                        options.title = '添加审批人员';
                        options.selectedUserList = that._auditList;
                        options.isASingleSelectUser = 2;
                        options.saveCallback = function (data) {
                            that._auditList = data.selectedUserList;
                            var html = template('m_approval/m_approval_cost_add_approver', {userList: data.selectedUserList});
                            $(that.element).find('#approverBox').html(html);
                            $(that.element).find('#approver-error.error').remove();//若有提示，删除
                        };
                        $('body').m_orgByTree(options);
                        break;

                }

            })
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
        //表单验证
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form.form-horizontal').validate({
                ignore : [],
                rules: {
                    applyUserId:{
                        required: true
                    },
                    departId:{
                        required: true
                    },
                    expAllName:{
                        required: true
                    },
                    sumExpAmount:{
                        required: true,
                        number:true,
                        minNumber:true
                    },
                    enterpriseName:{
                        required: true
                    },
                    fromCompanyName:{
                        required: true
                    }
                },
                messages: {
                    applyUserId:{
                        required: '请选择申请人'
                    },
                    departId:{
                        required: '请选择部门'
                    },
                    expAllName:{
                        required: '请选择付款类型'
                    },
                    sumExpAmount:{
                        required: '请输入金额',
                        number:'请输入数字',
                        minNumber:'请输入大于0的数字'
                    },
                    enterpriseName:{
                        required: '请输入或选择收款方'
                    },
                    fromCompanyName:{
                        required: '请输入或选择付款方'
                    }
                },
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
            }, '请输入大于0的数字');
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
