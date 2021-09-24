/**
 * 项目信息－收款计划列表-子项
 * Created by wrb on 2018/8/10.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_cost_collectionPlan_item",
        defaults = {
            myTaskId:null,//任务ID
            projectId:null,
            projectName:null,
            isAppend:false,//是否追加到that.element
            projectCostRole:null,//权限
            projectCost:null,//合同回款对象
            dataCompanyId:null,//视图组织ID
            renderCallBack:null,
            renderParentPage:null,//渲染父界面
            isView:false//是否只展示
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID
        this._projectCost = this.settings.projectCost;
        this._pageText = {};//界面的文字

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            if(that.settings.isAppend){
                $(that.element).append('<div class="panel revenue-expenditure" data-id="'+that._projectCost.costId+'"></div>');
                that.element = '.panel[data-id="'+that._projectCost.costId+'"]';
            }

            that.initHtml();

        }
        //初始化数据,生成html
        ,initHtml:function (t) {
            var that = this;
            that.postData(function () {

                if(that.settings.dataCompanyId==null){
                    that.settings.dataCompanyId = that._currentCompanyId;
                }
                that.initText();
                that._projectCost.dataCompanyId = that.settings.dataCompanyId;
                that._projectCost.currentCompanyId = that._currentCompanyId;
                that._projectCost.projectCostRole = that.settings.projectCostRole;
                that._projectCost.projectNo = that.settings.projectNo;
                that._projectCost.businessType = that.settings.businessType;

                //去掉编辑权限
                if(that.settings.isView==true){
                    that._projectCost.projectCostRole = {};
                    that._projectCost.editFlag = 0;
                }

                var html = template('m_cost/m_cost_collectionPlan_item',that._projectCost);
                $(that.element).html(html);

                $(that.element).find('[data-toggle="tooltip"]').tooltip({trigger:'hover'});

                rolesControl();//权限控制初始化

                that.bindEditable();
                that.initiatedContract();
                that.initEditCostPoint();
                that.uploadRecordFile();
                //that.renderMaskLayerByNode();
                that.bindActionClick();

                var width = ($(that.element).find('table.table').width())*0.18;
                //这里有时候 获取出来的width 为18，导致展示异常，所以强制最低190
                if(width<190){
                    width = 190;
                }
                stringCtrl($('.feeDescription'),width,true);

                if(that.settings.renderCallBack)
                    that.settings.renderCallBack();


            },t);
        }
        //{t==1，重新请求数据}
        ,postData:function (callBack,t) {

            var that = this;
            //重新请求数据
            if(t==1 || that._projectCost==null){
                var option  = {};
                option.classId = that.element;
                option.url = restApi.url_listProjectCost;
                option.postData = {};
                option.postData.payType = '1';
                option.postData.projectId = that.settings.projectId;
                option.postData.costId = that._projectCost.costId;
                if(that.settings.myTaskId!=null)
                    option.postData.myTaskId = that.settings.myTaskId;

                if(!isNullOrBlank(that.settings.dataCompanyId))
                    option.postData.companyId = that.settings.dataCompanyId;

                m_ajax.postJson(option,function (response) {
                    if(response.code=='0'){

                        that._projectCost = response.data.costList[0];
                        if(callBack!=null)
                            callBack();
                    }else {
                        S_layer.error(response.info);
                    }
                })
            }else{
                if(callBack!=null)
                    callBack();
            }
        }
        //初始化文字
        ,initText : function () {
            var that = this;

            switch (that._projectCost.type){
                case '1': //合同回款
                    that._pageText = {
                        title:'合同回款'
                    };
                    break;
                case '2': //技术审查费
                    that._pageText = {
                        title:'技术审查费'
                    };
                    break;
                case '3': //合作设计费
                    that._pageText = {
                        title:'合作设计费'
                    };
                    break;
                case '4': //
                    that._pageText = {
                        title:'合同回款'
                    };
                    break;
                case '5': //其他收款
                    that._pageText = {
                        title:'其他收款'
                    };
                    break;
            }
            //that._projectCost.pageText = that._pageText;
            that._projectCost.pageText = {title:that._projectCost.typeName};
        }
        //初始化合同总金额 － 在位编辑
        ,bindEditable:function () {
            var that = this;
            var $xeditable = $(that.element).find('a[data-action="xeditable"]');

            $xeditable.each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');
                var dataInfo = null;
                if(key=='status'){

                    dataInfo=[{id: 0, name: '进行中'},
                        {id: 6, name: '已终止'},
                        {id: 2, name: '已暂停'},
                        {id: 7, name: '已完成'}];

                    //当前状态是修改中
                    if(value==3){
                        dataInfo.push({id:3,name:'修改中'});
                    }

                    $this.m_editable({
                        inline:true,
                        popoverStyle:{'width':'100px'},
                        value:value,
                        dataInfo:dataInfo,
                        hideElement:true,
                        targetNotQuickCloseArr : ['select2-selection__choice','select2-search--dropdown','select2-search__field','select2-results__options'],
                        closed:function (data) {

                            if(data!=false){
                                var param = {};
                                param[key] = data[key];
                                param.id = that._projectCost.costId;
                                that.updateProjectCostStatus(param);
                            }
                            $this.parent().find('.show-span').show();
                        },
                        completed:function ($popover) {
                            $(that.element).find('.show-span').show();
                            $this.parent().find('.show-span').hide();
                        }
                    },true);

                }else{
                    $this.m_editable({
                        title:'编辑',
                        popoverStyle:{'width':'330px'},
                        value:value,
                        ok:function (data) {
                            if(data==false)
                                return false;

                            that.saveInitContract(data);
                        },
                        cancel:function () {

                        }
                    },true);
                }
            });

            //hover事件
            /*$(that.element).find('.xeditable-hover').hover(function () {
                $(this).find('a[data-action]').css('visibility','visible');
            },function () {
                $(this).find('a[data-action]').css('visibility','hidden');
            });*/
        }
        //编辑任务名称
        ,saveInitContract:function (data) {

            var that = this,option  = {};
            option.classId = that.element;
            option.url = restApi.url_saveProjectCost;
            var param = data;
            param.type = that._projectCost.type;
            param.projectId = that.settings.projectId;
            if(that._projectCost!=null && that._projectCost.costId!=null && that._projectCost.costId!=''){
                param.id = that._projectCost.costId;
            }
            option.postData = param;

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.initHtml(1);

                }else {
                    S_layer.error(response.info);
                }
            })
        }

        //发起回款
        ,initiatedContract:function () {
            var that = this;

            $(that.element).find('a[data-action="initiatedContract"]').on('click',function () {
                var option={};
                option.relationCompany = that._projectCost.relationCompany;
                option.backFee = $(this).closest('tr').attr('data-backfee')-0;
                option.maxFee = $(this).closest('tr').attr('data-fee')-0;
                option.pointId = $(this).attr('data-id');
                option.projectId = that.settings.projectId;
                option.costId = that._projectCost.costId;
                option.dataCompanyId = that.settings.dataCompanyId;
                option.saveCallBack = function () {
                    that.initHtml(1);
                };
                $('body').m_cost_addPayment(option,true);
            });
        }

        //初始化编辑x-editable{dataEditType:1=节点描述，2＝比例，3＝金额，4＝明细金额,6=明细到账金额}
        ,initEditCostPoint:function () {
            var that = this;

            $(that.element).find('a[data-action="editContract"]').each(function () {
                var $this = $(this);
                var dataEditType = $(this).attr('data-edit-type');
                var key = $this.attr('data-key');
                var value = $this.attr('data-value');

                switch (dataEditType){
                    case '1'://描述
                        value = $this.parent().attr('data-string');
                        $this.m_editable({
                            title:'编辑',
                            popoverStyle:{'width':'330px'},
                            value:value,
                            //popoverClass : 'full-width',
                            ok:function (data) {
                                if(data==false)
                                    return false;
                                var $data = {};
                                $data.id = $this.closest('tr').attr('data-id');
                                $data.feeDescription = data[key];
                                that.saveConstPoint($data,dataEditType)
                            },
                            cancel:function () {

                            }
                        },true);
                        break;
                    case '2'://比例
                    case '3'://金额
                        value = {
                            fee:$this.closest('TR').find('td.fee').attr('data-value'),
                            feeProportion:$this.closest('TR').find('td.feeProportion').attr('data-value')
                        };
                        $this.m_editable({
                            title:'编辑',
                            value:value,
                            btnRight:true,
                            ok:function (data) {
                                if(data==false)
                                    return false;
                                var $data = {};
                                $data.id = $this.closest('tr').attr('data-id');
                                $data.feeProportion = parseFloat(data.feeProportion);
                                $data.fee = data.fee;
                                that.saveConstPoint($data,dataEditType)
                            },
                            cancel:function () {

                            }
                        },true);
                        break;
                    case '4'://金额
                        value = $this.attr('data-value');
                        $this.m_editable({
                            title:'编辑',
                            popoverStyle:{'width':'330px'},
                            value:value,
                            ok:function (data) {
                                if(data==false)
                                    return false;
                                var $data = {};
                                $data.id = $this.attr('data-id');
                                $data.pointId = $this.closest('tr').attr('data-id');
                                $data[key] = data[key];
                                that.saveConstPoint($data,dataEditType)
                            },
                            cancel:function () {

                            }
                        },true);
                        break;
                    case '5'://确认到账
                        $this.m_editable({
                            title:'编辑',
                            value:null,
                            dataInfo:{doType:1},
                            btnRight:true,
                            isNotSet:false,
                            ok:function (data) {
                                if(data==false)
                                    return false;
                                var option = {};
                                option.url = restApi.url_handleMyTask;
                                option.postData = {id: $this.attr('data-id'), status: '1', result: data.fee,paidDate:data.paidDate};
                                m_ajax.postJson(option, function (response) {
                                    if (response.code == '0') {
                                        S_toastr.success('操作成功');
                                        that.initHtml(1);
                                    } else {
                                        S_layer.error(response.info);
                                    }
                                });
                            },
                            cancel:function () {

                            }
                        },true);
                        break;
                    case '6'://发票号码修改
                        value = $.trim($this.text());
                        $this.m_editable({
                            title:'编辑',
                            value:value,
                            ok:function (data) {
                                if(data==false)
                                    return false;
                                var $data = {};
                                $data.id = $this.attr('data-invoice');
                                $data.invoiceNo = data[key];
                                that.saveInvoice($data)
                            },
                            cancel:function () {

                            }
                        },true);
                        break;
                }

            });
        }
        //编辑节点名称，金额，明细金额
        ,saveConstPoint:function (data,dataEditType) {
            var that = this,option  = {},isError = false;
            option.classId = '#content-right';
            if(dataEditType==4 || dataEditType==6){//费用明细
                option.url = restApi.url_saveReturnMoneyDetail;
            }else{//费用节点
                option.url = restApi.url_saveProjectCostPoint;
            }
            option.async = false;
            option.postData = data;
            option.postData.projectId = that.settings.projectId;
            option.postData.type = that._projectCost.type;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');

                    that.initHtml(1);

                }else {
                    S_layer.error(response.info);
                    isError = true;
                }
            });
            return isError;
        }
        //编辑节点名称，金额，明细金额
        ,saveInvoice:function (data) {
            var that = this,option  = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveInvoice;
            option.postData = data;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_toastr.success('保存成功！');
                    that.initHtml(1);

                }else {
                    S_layer.error(response.info);
                }
            });
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;

            $(that.element).find('a[data-action]').on('click',function () {
                var $this = $(this), dataAction = $this.attr('data-action');
                var pointId = $this.closest('tr').attr('data-id');//节点ID
                var dataId = $this.attr('data-id');//当前元素赋予的ID
                //获取节点数据
                var dataItem = getObjectInArray(that._projectCost.pointList,pointId);
                //获取子节点数据
                var dataSubItem = dataItem==null?null: getObjectInArray(dataItem.pointDetailList,dataId);

                switch (dataAction) {
                    case 'addContract':
                        if(that._projectCost.totalCost==null || that._projectCost.totalCost<=0){
                            S_toastr.warning('请确定合同总金额！');
                            return false;
                        }
                        var options = {};
                        options.projectId = that.settings.projectId;
                        options.totalCost = that._projectCost.totalCost;
                        options.costId = that._projectCost.costId;
                        options.costType = that._projectCost.type;
                        options.payType = '1';
                        options.saveCallBack = function () {
                            that.initHtml(1);
                        };
                        $('body').m_cost_addNode(options);
                        return false;
                        break;

                    case 'delCost'://删除费用
                        /*S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_deleteProjectCost+'/'+$this.attr('data-id');
                            m_ajax.get(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    $this.closest('.panel').remove();
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });*/
                        $('body').m_cost_delete({
                            id:$this.attr('data-id'),
                            payType:1,
                            fee:that._projectCost.totalCost,
                            dataCompanyId : that.settings.dataCompanyId,
                            saveCallBack:function () {
                                //that.initHtml(1);
                                if(that.settings.renderParentPage)
                                    that.settings.renderParentPage();
                            }
                        },true);
                        return false;
                        break;
                    case 'delCostPointDetail'://删除费用明细

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_deleteProjectCostPointDetail+'/'+$this.attr('data-id');
                            m_ajax.get(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.initHtml(1);
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });

                        /*$('body').m_cost_delete({
                            id:$this.attr('data-id'),
                            pointId:pointId,
                            fee:dataSubItem.fee,
                            payType:1,
                            doType:1,
                            saveCallBack:function () {
                                //that.initHtml(1);
                                if(that.settings.renderParentPage)
                                    that.settings.renderParentPage();
                            }
                        },true);*/

                        break;

                    case 'delCostPoint'://删除费用节点

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_deleteProjectCostPoint+'/'+$this.attr('data-id');
                            m_ajax.get(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.initHtml(1);
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;

                    case 'delPaidFee'://删除到账节点

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_deleteProjectCostPaymentDetail+'/'+$this.attr('data-id');
                            m_ajax.get(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.initHtml(1);
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;

                    case 'confirmInvoice'://确认开票

                        var option = {};
                        option.invoiceId = $this.attr('data-invoice');
                        option.pointInfo = {
                            fee:dataSubItem.fee
                        };
                        option.taskId = dataSubItem.roleMap.invoiceConfirm;
                        option.projectId = that.settings.projectId;
                        option.saveCallBack = function () {
                            that.initHtml(1);
                        };
                        $('body').m_cost_confirmInvoice(option,true);
                        return false;
                        break;

                    case 'editInvoice'://修改开票号码

                      /*  $('body').m_cost_confirmInvoice({
                            doType:2,
                            invoiceId:$this.attr('data-invoice'),
                            pointInfo:{fee:dataSubItem.fee},
                            saveCallBack:function () {
                                that.initHtml(1);
                            }
                        },true);
*/
                        $('body').m_cost_addPayment({
                            doType:3,
                            title:'修改发票信息',
                            invoiceId:$this.attr('data-invoice'),
                            pointInfo:{fee:dataSubItem.fee},
                            pointDetail:{
                                fee:dataSubItem.fee,
                                id:dataSubItem.id
                            },
                            saveCallBack:function () {
                                that.initHtml(1);
                            }
                        },true);
                        return false;
                        break;

                    case 'deleteInvoice'://删除开票号码
                        var id = $this.attr('data-invoice');
                        var deleteType= $this.attr('delete-type');
                        var message = deleteType=="1" ?'删除后将不能恢复，您确定要删除吗？':'您确定要作废吗？';
                        that.deleteInvoice(id,deleteType,message,that);
                        break;
                    case 'replenishInvoice'://补录发票

                        $('body').m_cost_addPayment({
                            doType:2,
                            title:'补录发票',
                            relationCompany:that._projectCost.relationCompany,
                            pointId:pointId,
                            projectId:that.settings.projectId,
                            pointDetail:{
                                fee:dataSubItem.fee,
                                id:dataSubItem.id
                            },
                            saveCallBack:function () {
                                that.initHtml(1);
                            }
                        },true);
                        return false;
                        break;
                    case 'delAttach'://删除附件

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {

                            var option = {};
                            option.url = restApi.url_netFile_delete;
                            option.postData = {
                                id: dataId,
                                accountId: window.currentUserId
                            };
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    that.initHtml(1);
                                } else {
                                    S_layer.error(response.msg?response.msg:response.info);
                                }
                            });

                        }, function () {
                        });
                        break;

                    case 'approvalDetails'://审批详情
                        $('body').m_form_template_generate_details({
                            //preTitle:'【删除】'+that.settings.projectName,
                            dataInfo : {
                                id : $this.attr('data-id')
                            },
                            saveCallBack : function () {
                                if(that.settings.renderParentPage)
                                    that.settings.renderParentPage();
                            }
                        },true);
                        return false;
                        break;
                    case 'approvalSubmit'://提交审批
                        that._projectCost.projectName = that.settings.projectName;
                        $('body').m_cost_approval_submit({
                            dataInfo : that._projectCost,
                            dataCompanyId : that.settings.dataCompanyId,
                            saveCallBack : function () {
                                if(that.settings.renderParentPage)
                                    that.settings.renderParentPage();
                            }
                        },true);
                        break;
                    case 'suspendProjectCost'://终止收付款计划

                        var status = $this.attr('data-status');
                        var tipText = '终止'+that._projectCost.pageText.title+'收款计划后，计划中所有内容将不能进入执行。确定是否终止'+that._projectCost.pageText.title+'收款计划？',newStatus=2;
                        if(status==2){
                            newStatus=0;
                            tipText = '您确定要启动收款计划吗？';
                        }
                        S_layer.confirm(tipText, function () {

                            var option = {};
                            option.url = restApi.url_suspendProjectCost;
                            option.postData = {};
                            option.postData.projectCostEditDTO = {};
                            option.postData.projectCostEditDTO.id = that._projectCost.costId;
                            option.postData.projectCostEditDTO.payType = 1;
                            option.postData.projectCostEditDTO.status = newStatus;
                            m_ajax.postJson(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('操作成功！');
                                    that.initHtml(1);
                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;
                    case 'costConfirm'://到账确认(兼容旧数据)

                        var fee = $this.attr('data-fee');
                        $this.m_floating_popover({
                            content: template('m_cost/m_fee_confirm', {confirmDate:getNowDate()}),
                            isArrow:true,
                            placement: 'top',
                            renderedCallBack: function ($popover) {

                                $popover.find('form').validate({
                                    rules: {
                                        confirmDate: {
                                            required: true
                                        }
                                    },
                                    messages: {
                                        confirmDate: {
                                            required: '时间不能为空'
                                        }
                                    },
                                    errorElement: "label",  //用来创建错误提示信息标签
                                    errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                                        error.appendTo(element.closest('.col-sm-9'));
                                    }
                                });

                                $popover.find('button').on('click',function () {
                                    var flag = $($popover).find('form').valid();
                                    if (!flag) {
                                        return false;
                                    }else {
                                        var paidDate = $popover.find('input').val();
                                        var option = {};
                                        option.url = restApi.url_handleMyTask;
                                        option.postData = {id: dataId, status: '1', result: fee,paidDate:paidDate};
                                        m_ajax.postJson(option, function (response) {
                                            if (response.code == '0') {
                                                S_toastr.success('操作成功');
                                                $this.m_floating_popover('closePopover');
                                                that.initHtml(1);
                                            } else {
                                                S_layer.error(response.info);
                                            }
                                        });
                                    }
                                    return false;
                                });
                            }
                        }, true);
                        return false;
                        break;
                    case 'approvalRecord'://审批记录
                        $('body').m_approval_submit_record({
                            projectId:dataId,
                            companyId:that._currentCompanyId,
                            type:'receiveProjectCost',
                            saveCallBack:function () {
                                that.initHtml(1);
                            }
                        });
                        return false;
                        break;
                    case 'modifyPlan':
                        var status = $this.attr('data-status');
                        that.updateProjectCostStatus({id: dataId, status: status});
                        break;

                    case 'editCostInfo'://编辑收款计划
                        var option = {};
                        option.title = '编辑收款计划';
                        option.projectId = that.settings.projectId;
                        option.dataCompanyId = that.settings.dataCompanyId;
                        option.dataInfo = that._projectCost;
                        option.oKCallBack = function (data) {
                            that.initHtml(1);
                        };
                        $('body').m_cost_collectionPlan_add(option,true);

                        break;
                        return false;
                }
            });
        }

        //上传附件
        ,uploadRecordFile: function () {
            var that = this;
            $(that.element).find('a[data-action="recordAttach"]').m_fileUploader({
                server: restApi.url_attachment_uploadCostPlanAttach,
                fileExts: '*',
                fileSingleSizeLimit:20*1024*1024,
                formData: {},
                multiple:true,
                //duplicate:false,
                loadingId: '#content-right',
                innerHTML: '<i class="fa fa-upload fa-fixed"></i>',
                uploadBeforeSend: function (object, data, headers) {
                    data.companyId = window.currentCompanyId;
                    data.accountId = window.currentUserId;
                    data.projectId = that.settings.projectId;
                    data.targetId = that._projectCost.costId;

                },
                uploadSuccessCallback: function (file, response) {
                    //console.log(response)
                    S_toastr.success('上传成功！');
                    that.initHtml(1);
                }
            },true);
        }
        //节点渲染遮罩层
        ,renderMaskLayerByNode:function () {
            var that = this;
            //var pointList = that._projectCost.pointList;
            var mainIdsArr = [];//存在审批流程所有流程ID
            //获取存在流程ID的行
            $(that.element).find('tr[data-main-id!=""]').each(function () {
                var mainId = $(this).attr('data-main-id');

                if(mainIdsArr.indexOf(mainId)>-1 || mainId==undefined){//存在或mainId为空
                    return true;
                }else{
                    mainIdsArr.push(mainId);

                    var $tr = $(that.element).find('tr[data-main-id="'+mainId+'"]');
                    var $panelBody = $(that.element).find('.panel-body');


                    var $content = $('<div class="mask-layer mask-layer-content" data-id="'+mainId+'" ><h2 class="fc-dark-grey m-b-md no-margins dp-inline-block">审批中&nbsp;&nbsp;</h2>' +
                        '<p class="f-s-md vertical-middle dp-inline-block">查看审批情况请点击【<a class="fc-dark-blue" data-action="approvalDetails" data-id="'+mainId+'">审批详情</a>】</p></div>');

                    $panelBody.prepend($content);
                    $panelBody.prepend('<div class="mask-layer" data-id="'+mainId+'"></div>');
                    var top = $tr.eq(0).position().top;
                    var height = $tr.length*40;
                    $('.mask-layer[data-id="'+mainId+'"]').css({'top': top+'px','height':height+'px'});

                    var pdTop = height/2-13;
                    $('.mask-layer.mask-layer-content[data-id="'+mainId+'"]').css({'padding-top': pdTop+'px'});

                }
            });
        }
        //删除发票
        ,deleteInvoice:function(id,deleteType,message,that){
            S_layer.confirm(message, function () {
                var option = {};
                option.url = restApi.url_deleteInvoice;
                option.postData = {
                    id:id,
                    deleteType:deleteType,
                    accountId: window.currentUserId
                };
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {
                        S_toastr.success('操作成功！');
                        that.initHtml(1);
                    } else {
                        S_layer.error(response.msg?response.msg:response.info);
                    }
                });

            }, function () {
            });
        }
        //修改状态
        ,updateProjectCostStatus:function (param) {
            var that = this;
            var option = {};
            option.url = restApi.url_updateProjectCostStatus;
            option.postData = param;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    that.initHtml(1);
                } else {
                    S_layer.error(response.info);
                }
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
