/**
 * 审批管理-设置流程
 * Created by wrb on 2018/8/3.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_mgt_setProcess",
        defaults = {
            type:null,//类型
            id:null,//记录ID
            name:null,//审批名称
            isSystem:null,//是否系统默认审批
            selectedOrg:null,//父页面选择的组织对象
            formId:null,
            backCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._leftBoxHeightResize = null;//左边div高度自适应设定初始对象

        this._processDetail = null;//当前流程信息
        this._editFixedProcess = [];//固定流程保存数据
        this._editCondProcess = [];//条件流程保存数据
        this._optionalCondition = null;

        this._selectedOrg = this.settings.selectedOrg;//当前组织筛选-选中组织对象
        this._treeSelectedData = null;//当前树-选中对象
        this._orgList = [];//

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var html = template('m_approval/m_approval_mgt_setProcess',{isSystem:that.settings.isSystem});
            $(that.element).html(html);
            that.initOrgTree(function () {
                that.render();
            });

        }
        ,render:function () {
            var that = this;
            that.renderContent(function (data) {
                that.initICheck();
                that.bindActionClick();
                that.approvalRemoveIconHover();

                that._leftBoxHeightResize = new leftBoxHeightResize($(that.element).find('#leftBox'),$(that.element).find('#orgTreeH'),$(that.element).find('#rightBox'),169);
                that._leftBoxHeightResize.init();

                if(data.type==null){
                    $(that.element).find('input[name="iCheck"][type="radio"]').eq(0).iCheck('check');
                }else{
                    $(that.element).find('input[type="radio"][data-type="'+data.type+'"]').iCheck('check');
                }
                if(window.currentRoleCodes.indexOf('30000102')<0){
                    $(that.element).find('a[data-action="setApprovalCondition"],a[data-action="addApprover"],a[data-action="addCcUser"],a[data-action="save"]').addClass('disabled');
                    $(that.element).find('input[name="iCheck"]').iCheck('disable');
                    $(that.element).find('a[data-action="removeApprover"],a[data-action="removeCcUser"]').remove();
                }

            });
        }
        //渲染列表内容
        ,renderContent:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_prepareProcessDefine;
            option.postData = {};
            option.postData.formId = that.settings.formId;
            option.postData.currentCompanyId = that._currentCompanyId;
            option.postData.companyId = that._selectedOrg.id;
            option.postData.orgId = that._treeSelectedData.id;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    that._processDetail = $.extend(true, {}, response.data);

                    that._optionalCondition = that._processDetail.conditionFieldId;

                    //生成固定流程保存数据
                    if(that._processDetail.type==2){
                        that._editFixedProcess = $.extend(true, [], that._processDetail.flowTaskGroupList);
                    }

                    //空数据时，创建默认数据
                    if(that._editCondProcess==null || that._editFixedProcess[0]==null || that._processDetail.type!=2){
                        that._editFixedProcess = [];
                        that._editFixedProcess[0] = {};
                        that._editFixedProcess[0].flowTaskList = [];
                        that._editFixedProcess[0].copyList = [];
                        that._editFixedProcess[0].maxValue = null;
                        that._editFixedProcess[0].minValue = null;
                        that._editFixedProcess[0].title = null;
                    }

                    //生成条件流程保存数据
                    that._editCondProcess = $.extend(true, [], that._processDetail.flowTaskGroupList);

                    //空数据时，创建默认数据
                    if(that._editCondProcess==null || that._processDetail.type!=3){
                        that._editCondProcess = [];
                        that._editCondProcess[0] = {};
                        that._editCondProcess[0].flowTaskList = [];
                        that._editCondProcess[0].copyList = [];

                    }

                    if(that._editFixedProcess[0] && that._editFixedProcess[0].flowTaskList==null)
                        that._editFixedProcess[0].flowTaskList = [];

                    if(that._editFixedProcess[0] && that._editFixedProcess[0].copyList==null)
                        that._editFixedProcess[0].copyList = [];

                    if(that._editCondProcess[0] && that._editCondProcess[0].flowTaskList==null)
                        that._editCondProcess[0].flowTaskList = [];

                    if(that._editCondProcess[0] && that._editCondProcess[0].copyList==null)
                        that._editCondProcess[0].copyList = [];

                    var html = template('m_approval/m_approval_mgt_setProcess_content',{
                        name:response.data.name || that.settings.name,
                        formId:that.settings.formId,
                        isSystem:that.settings.isSystem,
                        fixedProcess:that._editFixedProcess,
                        condProcess:that._editCondProcess,
                        optionalConditionList:that._processDetail.optionalConditionList,
                        treeSelectedData:that._treeSelectedData
                    });
                    $(that.element).find('#rightBox').html(html);


                    //渲染审批人、抄送人
                    //固定流程-审批人
                    if(that._editFixedProcess[0].flowTaskList){
                        var $fixedAddApproverBtn = $(that.element).find('.panel[data-i="0"] .panel-item').find('a[data-action="addApprover"]');
                        that.renderApprover($fixedAddApproverBtn,that._editFixedProcess[0].flowTaskList);
                    }
                    //固定流程-抄送人
                    if(that._editFixedProcess[0].copyList){
                        var $fixedAddCcUserBtn = $(that.element).find('.panel[data-i="0"] .panel-item').find('a[data-action="addCcUser"]');
                        that.renderApprover($fixedAddCcUserBtn,that._editFixedProcess[0].copyList);
                    }

                    //条件流程
                    if(that._editCondProcess && that._editCondProcess.length>0){

                        //渲染flow panel
                        var flowHtml = template('m_approval/m_approval_mgt_setProcess_flow',{
                            flowTaskGroupList:that._editCondProcess
                        });
                        $(that.element).find('#flowTaskGroupList').html(flowHtml);

                        $.each(that._editCondProcess,function (i,item) {

                            var $panel = $(that.element).find('#flowTaskGroupList .panel[data-i="'+i+'"]');
                            //渲染-审批人
                            var $condAddApproverBtn = $panel.find('a[data-action="addApprover"]');
                            that.renderApprover($condAddApproverBtn,item.flowTaskList);
                            //渲染-抄送人
                            var $condAddCcUserBtn = $panel.find('a[data-action="addCcUser"]');
                            that.renderApprover($condAddCcUserBtn,item.copyList);

                        });
                    }

                    if(callBack)
                        callBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            })

        }
        //初始化iCheck
        ,initICheck:function () {
            var that = this;
            var ifChecked = function (e) {
                var type = $(this).attr('data-type');
                $(that.element).find('.panel[data-type]').hide();
                $(that.element).find('.panel[data-type="'+type+'"]').show();
                if(type==3){
                    $(that.element).find('a[data-action="setApprovalCondition"]').show();
                }else{
                    $(that.element).find('a[data-action="setApprovalCondition"]').hide();
                }
                that._leftBoxHeightResize.setHeight();
            };
            var ifUnchecked = function (e) {
            };
            var ifClicked = function (e) {

            };
            $(that.element).find('input[name^="iCheck"]').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);



        }
        //初始化组织树
        ,initOrgTree: function (callBack) {//type==1为显示完整组织树并可操作，type！=1为只显示本组织下的树
            var that = this;
            $(that.element).find('#leftBox').m_org_chose_byTree({
                type:6,
                renderType:1,
                //isCheck:true,
                isRootDisabled:true,
                selectedId:that._selectedOrg?that._selectedOrg.id:that._currentCompanyId,
                param : {companyId:that._selectedOrg.id,isSystem : that.settings.isSystem},
                selectedCallBack:function (data,childIdList) {

                    that._treeSelectedData = data;
                    that._orgList = [];

                    if(data)
                        that._orgList.push(data.id);


                    if(callBack)
                        callBack();
                }
            },true);
        }
        //保存设置
        ,saveProcess:function () {
            var that =this;
            var type = $(that.element).find('input[type="radio"]:checked').attr('data-type');

            var isError = false;

            if(type==2){

                if(that._editFixedProcess==null)
                    isError = true;
                if(that._editFixedProcess && (that._editFixedProcess[0].flowTaskList==null || that._editFixedProcess[0].flowTaskList.length==0))
                    isError = true;

                that._processDetail.flowTaskGroupList = that._editFixedProcess;

            }else if(type==3){

                if(that._editCondProcess==null )
                    isError = true;
                if(that._editFixedProcess){
                    $.each(that._editCondProcess,function (i,item) {
                        if(item.flowTaskList==null || item.flowTaskList.length==0){
                            isError = true;
                            return false;
                        }
                    })
                }

                that._processDetail.flowTaskGroupList = that._editCondProcess;

            }else{

                that._processDetail.flowTaskGroupList = [];
            }

            if(isError){
                S_toastr.error('请设置审批人！');
                return false;
            }

            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_changeProcessDefine;
            option.postData = {};
            option.postData = that._processDetail;
            option.postData.type = type;
            option.postData.companyId = that._treeSelectedData.companyId?that._treeSelectedData.companyId:that._selectedOrg.id;

            option.postData.conditionFieldId = that._optionalCondition;

            if(that.settings.id)
                option.postData.fromGroupId = that.settings.id;

            option.postData.orgList = that._orgList;

            option.postData.varUnit = that._processDetail.unit;
            option.postData.varName = that._processDetail.name;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('保存成功！');

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //选择人员(doType=1=审批人，doType=2=抄送人)
        ,addApprover:function ($this,doType) {
            var that = this,selectedUserList = [],selectedRoleList = [],options = {};

            var type = $(that.element).find('input[type="radio"]:checked').attr('data-type');
            var panelI = $this.closest('div.panel').attr('data-i');
            //固定流程
            if(type==2){
                selectedUserList = doType==2?that._editFixedProcess[0].copyList:that._editFixedProcess[0].flowTaskList;
            }
            //自由流程
            if(type==3){
                selectedUserList = doType==2?that._editCondProcess[panelI].copyList:that._editCondProcess[panelI].flowTaskList;
            }
            $.each(selectedUserList,function (i,item) {
                $.each(item.candidateUserList,function (ci,citem) {
                    if(citem.orgType==1){
                        selectedRoleList.push(citem);
                    }
                });
            });
            options.title = '添加审批人员';
            options.selectedUserList = [];
            options.selectedRoleList = selectedRoleList;
            options.treeUrl = restApi.url_getOrgStructureTree+'/'+that._treeSelectedData.id;
            //options.isShowRole = that.settings.isSystem==1?0:1;
            options.saveCallback = function (data) {

                //数据处理
                var flowTaskList = [];
                $.each(data.selectedUserList,function (i,item) {
                    var userList = [] ,name = '',attrMap = {};
                    if(item.userName)
                        item.name = item.userName;

                    item.orgType = item.orgType;
                    item.imgUrl = item.fileFullPath;
                    userList.push(item);

                    if(item.orgType==1 || item.orgType==3 && item.candidateUserList){

                        $.each(item.candidateUserList,function (ci,citem) {
                            name += '['+citem.name+']'
                        });
                        name = name+'-第'+item.level+'级('+(item.orgType==1?'单级':'多级')+')';

                        userList = item.candidateUserList;

                    }else{
                        name = item.name;
                    }

                    attrMap.orgType=item.orgType?item.orgType:2;
                    attrMap.level=item.level;
                    attrMap.isNullCondition=item.isNullCondition;
                    flowTaskList.push({candidateUserList:userList,name:name,attrMap:attrMap});
                });

                //固定流程
                if(type==2 && doType==1){
                    that._editFixedProcess[0].flowTaskList =  that._editFixedProcess[0].flowTaskList.concat(flowTaskList);
                    that._editFixedProcess[0].flowTaskList = that.reSetFlowTaskList(that._editFixedProcess[0].flowTaskList);
                    flowTaskList = that._editFixedProcess[0].flowTaskList;
                }else if(type==2 && doType==2){
                    that._editFixedProcess[0].copyList =  that._editFixedProcess[0].copyList.concat(flowTaskList);
                    that._editFixedProcess[0].copyList = that.reSetFlowTaskList(that._editFixedProcess[0].copyList);
                    flowTaskList = that._editFixedProcess[0].copyList;
                }
                //自由流程
                if(type==3 && doType==1){

                    if(that._editCondProcess[panelI].flowTaskList==null)
                        that._editCondProcess[panelI].flowTaskList = [];

                    that._editCondProcess[panelI].flowTaskList =  that._editCondProcess[panelI].flowTaskList.concat(flowTaskList);
                    that._editCondProcess[panelI].flowTaskList = that.reSetFlowTaskList(that._editCondProcess[panelI].flowTaskList);
                    flowTaskList = that._editCondProcess[panelI].flowTaskList;

                }else if(type==3 && doType==2){

                    if(that._editCondProcess[panelI].copyList==null)
                        that._editCondProcess[panelI].copyList = [];

                    that._editCondProcess[panelI].copyList =  that._editCondProcess[panelI].copyList.concat(flowTaskList);
                    that._editCondProcess[panelI].copyList = that.reSetFlowTaskList(that._editCondProcess[panelI].copyList);
                    flowTaskList = that._editCondProcess[panelI].copyList;
                }

                that.renderApprover($this,flowTaskList);

            };
            $('body').m_org_role_select(options,true);
        }
        ,renderApprover:function ($this,flowTaskList) {
            var that = this;

            var doType = 1;
            if($this.attr('data-action')=='addCcUser')
                doType = 2;

            var html = template('m_approval/m_approval_mgt_setProcess_approver',{flowTaskList:flowTaskList,doType:doType});
            //删除原有审批人
            $this.parent().siblings().remove();
            $this.parent().before(html);
            that.approvalRemoveIconHover();
            //绑定删除事件
            that.bindActionClick();
            $(that.element).find('[data-toggle="tooltip"]').tooltip();
        }
        //删除审批人图标hover事件
        ,approvalRemoveIconHover:function ($ele) {
            var that = this;
            if(isNullOrBlank($ele))
                $ele = $(that.element);

            $ele.find('.approver-box').hover(function () {
                $(this).find('.approver-remove').show();
            },function () {
                $(this).find('.approver-remove').hide();
            });
        }
        //删除审批人处理
        ,removeApprover:function ($this,doType) {
            var that = this;
            //var $ele = $this.closest('.approver-outbox');
            //var i = $this.closest('.approver-outbox').index('.approver-outbox');
            //var i = $this.closest('.panel-body').find('.approver-outbox').index($this.closest('.approver-outbox'));

            var panelI = $this.closest('.panel').attr('data-i');
            var index = $this.attr('data-i');
            var type = $(that.element).find('input[type="radio"]:checked').attr('data-type');
            var flowTaskList = [];
            //固定流程
            if(type==2 && doType==1){
                that._editFixedProcess[0].flowTaskList = that.reSetFlowTaskList(that._editFixedProcess[0].flowTaskList,index);
                flowTaskList = that._editFixedProcess[0].flowTaskList;
            }else if(type==2 && doType==2){
                that._editFixedProcess[0].copyList = that.reSetFlowTaskList(that._editFixedProcess[0].copyList,index);
                flowTaskList = that._editFixedProcess[0].copyList;
            }
            //自由流程
            if(type==3 && doType==1){
                that._editCondProcess[panelI].flowTaskList = that.reSetFlowTaskList(that._editCondProcess[panelI].flowTaskList,index);
                flowTaskList = that._editCondProcess[panelI].flowTaskList;
            }else if(type==3 && doType==2){
                that._editCondProcess[panelI].copyList = that.reSetFlowTaskList(that._editCondProcess[panelI].copyList,index);
                flowTaskList = that._editCondProcess[panelI].copyList;
            }
            var $btn = $this.closest('.panel-item').find('a[data-action="addApprover"]');
            if(doType==2)
                $btn = $this.closest('.panel-item').find('a[data-action="addCcUser"]');

            that.renderApprover($btn,flowTaskList);

        }
        //重新组装数据
        ,reSetFlowTaskList:function (flowTaskList,removeIndex) {

            if(removeIndex)
                flowTaskList.splice(removeIndex,1);

            var index = 1;
            $.each(flowTaskList,function (i,item) {
                //部门负责人level重设
                $.each(item.candidateUserList,function (ci,citem) {
                    if(citem.orgType==1){
                        citem.level = index;
                        //citem.userName = index+'级部门管理';
                        citem.name = citem.userName;//index+'级部门管理';
                        index++;
                    }
                });
            });
            return flowTaskList;
        }
        //添加抄送人
        ,addCcUser:function ($this) {
            var that = this;

            var panelI = $this.closest('div.panel').attr('data-i');
            var type = $(that.element).find('input[type="radio"]:checked').attr('data-type');

            var copyList = [];
            //固定流程
            if(type==2){
                copyList = that._editFixedProcess[0].copyList;
            }
            //自由流程
            if(type==3){

                if(that._editCondProcess[panelI].copyList==null)
                    that._editCondProcess[panelI].copyList = [];

                copyList = that._editCondProcess[panelI].copyList;

            }

            $.each(copyList,function (i,item) {
                item.userName = item.name;
            });

            var options = {};
            options.title = '添加抄送人员';
            options.treeUrl = restApi.url_getOrgStructureTree+'/'+that._treeSelectedData.id;
            options.selectedUserList = copyList;
            options.saveCallback = function (data) {
                that._ccCompanyUserList = data.selectedUserList;

                if(data && data.selectedUserList && data.selectedUserList.length>0){
                    $.each(data.selectedUserList,function (i,item) {
                        item.name = item.userName;
                        item.imgUrl = item.fileFullPath;
                    });
                }
                //固定流程
                if(type==2){
                    that._editFixedProcess[0].copyList = data.selectedUserList;
                }
                //自由流程
                if(type==3){

                    if(that._editCondProcess[panelI].copyList==null)
                        that._editCondProcess[panelI].copyList = [];

                    that._editCondProcess[panelI].copyList =  data.selectedUserList;
                }
                that.renderCcUser($this,data.selectedUserList);
            };
            $('body').m_orgByTree(options);
        }
        //渲染抄送人
        ,renderCcUser:function ($this,copyList) {

            var that = this;
            var html = template('m_approval/m_approval_mgt_setProcess_cc',{userList:copyList});
            //删除原有审批人
            $this.parent().siblings().remove();
            $this.parent().before(html);
            that.approvalRemoveIconHover();
            //绑定删除事件
            that.bindActionClick();
        }
        //删除抄送人
        ,removeCcUser:function ($this) {
            var that = this;
            var panelI = $this.closest('.panel').attr('data-i');
            var index = $this.attr('data-i');
            var type = $(that.element).find('input[type="radio"]:checked').attr('data-type');
            var copyList = [];
            //固定流程
            if(type==2){
                that._editFixedProcess[0].copyList.splice(index,1);
                copyList = that._editFixedProcess[0].copyList;
            }
            //自由流程
            if(type==3){
                that._editCondProcess[panelI].copyList.splice(index,1);
                copyList = that._editCondProcess[panelI].copyList;
            }
            var $btn = $this.closest('.panel-item').find('a[data-action="addCcUser"]');
            that.renderCcUser($btn,copyList);
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');

                //禁用处理
                if($this.hasClass('disabled'))
                    return;

                switch (dataAction){
                    case 'setApprovalCondition'://设置审批流程

                        var option = {};
                        option.type = $this.attr('data-type');
                        option.processData = that._processDetail;
                        option.selectedOrg = that._selectedOrg;
                        option.formId = that.settings.formId;
                        option.oKCallBack = function (data,optionalCondition) {

                            that._editCondProcess = data.flowTaskGroupList;
                            that._processDetail.flowTaskGroupList = data.flowTaskGroupList;
                            that._processDetail.name = data.name;
                            that._processDetail.unit = data.unit;
                            var html = template('m_approval/m_approval_mgt_setProcess_flow',{flowTaskGroupList:data.flowTaskGroupList});
                            $(that.element).find('#flowTaskGroupList').html(html);
                            that.bindActionClick();//重新绑定事件
                            that._optionalCondition = optionalCondition;
                            that._leftBoxHeightResize.setHeight();
                        };
                        $('body').m_approval_mgt_setProcessCondition(option,true);
                        break;
                    case 'addApprover'://添加审批人员

                        var type = $this.closest('.panel').attr('data-type');
                        //条件流程，未设置条件，提醒
                        if(type==3 && isNullOrBlank(that._optionalCondition)){
                            S_toastr.warning('请设置审批条件');
                            return false;
                        }
                        that.addApprover($this,1);
                        break;
                    case 'removeApprover'://删除审批人员

                        var doType = $this.attr('data-type');
                        that.removeApprover($this,doType);

                        break;
                    case 'back'://返回

                        //$(that.element).m_approval_mgt({selectedOrg:that._selectedOrg}, true);
                        if(that.settings.backCallBack)
                            that.settings.backCallBack(that._selectedOrg);

                        break;

                    case 'save'://保存
                        //$('#d18bda5241da402c965923aca6554fb0').jstree(true).get_json();
                        var treeData = $('.m_approval_mgt_setProcess #orgTreeH').jstree(true).get_json('#'+that._treeSelectedData.id);
                        //console.log(treeData);
                        if(treeData && treeData.children && treeData.children.length>0){
                            $('body').m_org_select_multiple({
                                title:'保存修改',
                                selectIds:null,
                                treeData:treeData,
                                disabledRoot:true,
                                tipsStr:'说明：保存修改后，当前部门下所有部门是否需要修改，如需要请进行勾选需要的部门。',
                                okCallBack:function (ids,data) {
                                    that._orgList = ids;
                                    //that._orgList.push(that._treeSelectedData.id);
                                    that.saveProcess();
                                }
                            },true);
                        }else{
                            that.saveProcess();
                        }
                        break;

                    case 'addCcUser'://添加抄送人

                        var type = $this.closest('.panel').attr('data-type');
                        //条件流程，未设置条件，提醒
                        if(type==3 && isNullOrBlank(that._optionalCondition)){
                            S_toastr.warning('请设置审批条件');
                            return false;
                        }
                        //that.addCcUser($this);
                        that.addApprover($this,2);
                        break;
                    case 'removeCcUser'://删除抄送人

                        //that.removeCcUser($this);
                        that.removeApprover($this,2);

                        break;
                }
            })
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
