/**
 * 项目信息－收款计划-添加节点
 * Created by wrb on 2018/8/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_cost_addNode",
        defaults = {
            isDialog:true,
            projectId:null,
            totalCost:null,
            costId:null,
            costType:null,//类型1:合同回款，2：技术审查费,3合作设计费付款，4其他付款，5其他收款
            payType:null,//1=收款，2=付款
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
        this._dynamicAuditMap = null;//审批单数据
        this._isDynamicAudit = true;//是否动态审批
        this._auditProcessList = [];//流程 的人员/部门主管

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_cost/m_cost_addNode',{});
            that.renderDialog(html,function () {
                that.save_itemValidate($(that.element).find('.panel.panel-item').eq(0));
                that.bindFeeCalculation();
                that.bindAddItem();
                that.bindDelItem();
            });
        },
        //初始化数据,生成html
        renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'添加收款节点',
                    area : '650px',
                    fixed:true,
                    //scrollbar:false,
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var error = [];
                        var flag = true;//$(that.element).find('form').valid();

                        $(that.element).find('.panel.panel-item form').each(function (i) {
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
                        /*if(that._dynamicAuditMap && that._dynamicAuditMap.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && (that._auditList==null || that._auditList.length==0)){
                            //存在审批，且需要添加审批人
                            S_toastr.error('请选择审批人！');
                            return false;
                        }*/
                        that.save();
                        return false;
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    that._layero = {
                        layero:layero,
                        index:index,
                        dialogEle:dialogEle
                    };
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //保存合同收款节点
        ,save:function () {

            var that = this,option  = {},isError = false;
            option.classId = that.element;
            //option.url = restApi.url_saveProjectCostPoint;
            option.url = restApi.url_saveProjectCostPointAudit;
            option.postData = {};

            var projectCostEditDTO = {},pointList = [];
            $(that.element).find('.panel.panel-item').each(function () {
                var pointData = $(this).find('form').serializeObject();
                pointData.projectId = that.settings.projectId;
                pointData.feeProportion = parseFloat(pointData.feeProportion);
                pointData.type = that.settings.costType;
                pointData.costId = that.settings.costId;
                pointList.push(pointData);
            });

            projectCostEditDTO.pointList = pointList;
            projectCostEditDTO.id = that.settings.costId;
            projectCostEditDTO.payType = that.settings.payType;

            option.postData.projectCostEditDTO = projectCostEditDTO;

            /*option.postData.ccCompanyUserList = that._ccCompanyUserList;

            //存在流程，且需要添加审批人
            if(that._dynamicAuditMap && that._dynamicAuditMap.auditFlag==1 && (that._auditProcessList==null || that._auditProcessList.length==0) && that._auditList!=null && that._auditList.length>0){
                option.postData.auditPerson = that._auditList[0].id;
            }
            option.postData.auditProcessList = that._auditProcessList;*/

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    S_layer.close($(that.element));
                    if(that.settings.saveCallBack!=null)
                        that.settings.saveCallBack();

                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //添加收款的表单验证
        ,save_itemValidate:function($ele){
            var that = this;
            $ele.find('form').validate({
                rules: {
                    feeDescription: {
                        required: true,
                        maxlength: 250
                    },
                    feeProportion:{
                        required: true,
                        number:true,
                        limitProportion:true,
                        pointNumber:true
                    },
                    fee:{
                        required: true,
                        number:true,
                        minNumber:true,
                        over20:true,//整数部分是否超过20位
                        pointTwo:true,
                        ckFee:true
                    }
                },
                messages: {
                    feeDescription: {
                        required: '请输入节点描述!',
                        maxlength: '节点描述不超过250位!'
                    },
                    feeProportion:{
                        required:'请输入比例',
                        number:'请输入有效数字',
                        limitProportion:'请输入0到100之间的数字!',
                        pointNumber:'请保留小数点后两位!'
                    },
                    fee:{
                        required:'金额不能为空',
                        number:'请输入有效数字',
                        minNumber:'请输入大于0的数字!',
                        over20:'对不起，您的操作超出了系统允许的范围。合同总金额的单位为“元”',
                        pointTwo:'请保留小数点后两位!',
                        ckFee:'金额不能超过合同总金额!'

                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-md-10'));
                    //error.insertAfter(element);
                }
            });
            $.validator.addMethod('limitProportion', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if( value<=0 || value>100){
                    isOk = false;
                }
                return  isOk;
            }, '请输入0到100之间的数字!');
            $.validator.addMethod('minNumber', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if( value<=0){
                    isOk = false;
                }
                return  isOk;
            }, '请输入大于0的数字!');
            $.validator.addMethod('pointNumber', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if(!regularExpressions.proportionnumber.test(value)){
                    isOk = false;
                }
                return  isOk;
            }, '请保留小数点后两位!');
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
                var that = this;
                value = $.trim(value);
                var isOk = true;
                var total = that.settings.totalCost-0;
                if(value>total ){
                    isOk = false;
                }
                return  isOk;
            }, '金额不能超过合同总金额!');
        }
        //金额比例keyup事件
        ,bindFeeCalculation:function () {
            var that = this;
            $(that.element).find('input[data-action="feeCalculation"]').keyup(function () {

                var $panel = $(this).closest('.panel.panel-item');
                var name = $(this).attr('name');
                var val = $(this).val();
                var total = that.settings.totalCost;
                if(name=='feeProportion'){//比例
                    var fee = (val-0)*(total-0)/100;
                    fee = decimal(fee,7);
                    fee = parseFloat(decimal(fee,6));
                    $panel.find('input[name="fee"]').val(fee);
                    $panel.find('#fee-error').hide();
                }
                if(name=='fee'){//金额
                    var proportion = (val-0)/(total-0)*100;
                    proportion = decimal(proportion,3);
                    proportion = decimal(proportion,2);
                    $panel.find('input[name="feeProportion"]').val(proportion);
                    $panel.find('#feeProportion-error').hide();
                }
            });
        }
        //添加明细
        ,bindAddItem:function ($ele) {
            var that = this;
            $(that.element).find('button[data-action="addItem"]').on('click',function () {
                var $panel = $(that.element).find('.panel.panel-item');
                var $panelClone = $panel.eq(0).clone();
                $panelClone.find('input').val('');
                $panelClone.find('.title-line span').html($panel.length+1);
                $(this).before($panelClone);
                $(that.element).find('.panel.panel-item a[data-action="delItem"]').removeClass('hide');
                that.save_itemValidate($(that.element).find('.panel.panel-item:last'));
                that.bindDelItem();
                that.bindFeeCalculation();
                if(that._layero)
                    S_layer.resize(that._layero.layero,that._layero.index,that._layero.dialogEle);
            });

        }
        //删除明细
        ,bindDelItem:function () {
            var that = this;
            $(that.element).find('a[data-action="delItem"]').on('click',function () {
                $(this).closest('.panel.panel-item').remove();
                $(that.element).find('.panel.panel-item').each(function (i) {
                    $(this).find('.title-line span').html(i+1);
                });
                if($(that.element).find('.panel.panel-item').length==1)
                    $(that.element).find('.panel.panel-item').eq(0).find('a[data-action="delItem"]').addClass('hide');
            });
        }


    });

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);
