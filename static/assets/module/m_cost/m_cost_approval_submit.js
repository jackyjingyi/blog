/**
 * 收付款审批提交
 * Created by wrb on 2019/9/11.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_cost_approval_submit",
        defaults = {
            isDialog:true,
            projectId:null,//项目Id
            doType:1,//1=收款，2=付款
            dataInfo:null,
            dataCompanyId:null,//视图组织ID
            isShowTips:true,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyId = window.currentCompanyId;

        this._dynamicAuditMap = {};//审批数据
        this._auditList = [];//审批人
        this._ccCompanyUserList = [];//抄送人

        this._title = this.settings.dataInfo.pageText.title;

        this.settings.title = '收款计划审批 - ' + this._title;
        if(this.settings.doType==2){
            this.settings.title = '付款计划审批 - ' + this._title;
        }
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            $.extend(that.settings.dataInfo, {isShowTips:that.settings.isShowTips});
            $.extend(that.settings.dataInfo, {title:that._title});

            var html = template('m_cost/m_cost_approval_submit', that.settings.dataInfo);
            that.renderDialog(html,function () {
                that.renderApproverPage();
                that.bindActionClick();
            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'收款审批',
                    area : '980px',
                    content:html,
                    fixed:true,
                    cancel:function () {
                    },
                    ok:function () {


                        if(that.settings.dataInfo==null || that.settings.dataInfo.pointList.length==0){
                            S_toastr.error('该'+that.settings.title+'没有明细，请先添加！');
                            return false;
                        }
                        var  totalFee = 0;
                        $.each(that.settings.dataInfo.pointList,function (i,item) {
                            totalFee = math.add(math.bignumber(item.fee),math.bignumber(totalFee));
                        });
                        //console.log(totalFee-0)
                        if(totalFee-0!=that.settings.dataInfo.totalCost){
                            S_toastr.error('该'+that.settings.title+'合同总金额不等于合同明细总金额，请重新录入！');
                            return false;
                        }
                        if(that._dynamicAuditMap && that._dynamicAuditMap.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && (that._auditList==null || that._auditList.length==0)){
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
                    var t = setTimeout(function () {
                        S_layer.resize(layero,index,dialogEle);
                        clearTimeout(t);
                    },500);

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
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_submitProjectCostPointAudit;
            option.postData = {};

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
            option.postData.ccCompanyUserList = that._ccCompanyUserList;

            option.postData.projectCostEditDTO = {};
            option.postData.projectCostEditDTO.id = that.settings.dataInfo.costId;
            option.postData.projectCostEditDTO.payType = that.settings.doType;

            if(!isNullOrBlank(that.settings.dataCompanyId)){
                option.postData.projectCostEditDTO.operateCompanyId = that.settings.dataCompanyId;
            }else{
                option.postData.projectCostEditDTO.operateCompanyId = window.currentCompanyId;
            }

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
        //渲染审批
        ,renderApproverPage:function (callBack) {
            var that = this;
            var fee = 0;
            if(that.settings.dataInfo && that.settings.dataInfo.pointList){
                $.each(that.settings.dataInfo.pointList,function (i,item) {
                    var amount = item.fee-0;
                    fee = math.add(math.bignumber(fee),math.bignumber(amount));
                })
            }
            $(that.element).find('#approverOutBox').m_approval_dynamic_audit({
                doType:that.settings.doType=='1'?5:6,
                condNum:fee,
                colClass:{labelClass:'col-24-xs-3',contentClass:'col-24-xs-21'},
                postParam:{companyId:that.settings.dataCompanyId?that.settings.dataCompanyId:window.currentCompanyId},
                dataCompanyId:that.settings.dataCompanyId,
                renderCallBack:function (data,userList,ccUserList) {

                    that._dynamicAuditMap = data;
                    that._auditProcessList = userList;
                    that._ccCompanyUserList = ccUserList;
                    if(callBack)
                        callBack();
                },
                addApproverCallBack:function (data) {
                    that._auditList = data;
                },
                addCcUserCallBack:function (data) {
                    that._ccCompanyUserList = data;
                }
            },true);
        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');

                switch(dataAction){
                    case 'preview'://查看文件

                        //window.open($this.attr('data-src'));
                        var fileExt = $this.attr('data-file-ext');
                        fileExt = fileExt.toLowerCase();
                        var fileUrl = $this.attr('data-src');
                        var imgSrcArr = [];
                        if('gif,jpg,jpeg,bmp,png'.indexOf(fileExt)>-1){
                            var index = 0,currentIndex = 0;
                            $(that.element).find('a[data-action="preview"]').each(function (i) {
                                var url = $(this).attr('data-src');
                                var ext = $this.attr('data-file-ext');
                                if('gif,jpg,jpeg,bmp,png'.indexOf(ext)>-1){
                                    imgSrcArr.push({
                                        src:url,
                                        thumb:url
                                    });
                                    if(fileUrl==url){
                                        currentIndex = index;
                                    }
                                    index ++;
                                }

                            });
                            S_layer.photos(imgSrcArr,currentIndex);
                        }else{
                            window.open(fileUrl);
                        }

                        break;
                }
                return false;

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
