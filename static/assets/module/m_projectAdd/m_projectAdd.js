/**
 * Created by Wuwq on 2017/1/5.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_projectAdd",
        defaults = {
            rangeList: [],
            contentList: []
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;
        this._projectTypeList = [];//项目类型列表

        this._dataInfo = {};
        this._auditList = [];//审批人
        this._ccCompanyUserList = [];//抄送人
        this._auditProcessList = [];//流程 的人员/部门主管
        this._businessType ='';

        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.render();
        }
        ,getProjectType:function (callBack) {
            var that = this;
            var option  = {};
            option.url = restApi.url_listProjectTypeForSetProject;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    that._projectTypeList = response.data;
                    if(callBack!=null){
                        return callBack();
                    }
                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //获取立项基本数据（设计范围，设计阶段）{t==1时，重新渲染审批}
        ,render: function () {
            var that = this;

            that._dataInfo.projectTypeList = that._projectTypeList;
            that._dataInfo.currentDate = getNowDate();

            var html = template('m_projectAdd/m_projectAdd', that._dataInfo);
            $(that.element).html(html);

            $("#selectRegion").citySelect({
                prov:null,
                city:null,
                dist:null,
                nodata:"none",
                required:false
            });
            //that.initSelect2ByOrg();
            that.initSelect2ByProjectType();
            that.initSelect2ByOrgZone();
            that.bindAddressClick();
            //that.bindPartyAEvent();
            that.bindActionClick();
            $(that.element).find('span[data-toggle="tooltip"]').tooltip();

        }
        ,renderApproverPage:function (companyId) {
            var that = this;
            $(that.element).find('#approverOutBox').m_approval_dynamic_audit({
                doType:1,
                companyId:companyId,
                renderCallBack:function (data,userList,ccUserList) {

                    that._dataInfo.dynamicAuditMap = data;
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
        //项目类型
        ,initSelect2ByProjectType:function () {
            var that = this;
            that.getProjectType(function () {
                var staffArr = [];
                //数据结构转换
                if(that._projectTypeList!=null && that._projectTypeList.length>0){
                    $.each(that._projectTypeList, function (i, o) {
                        var obj = {
                            id: o.id,
                            text: o.name,
                            children:[]
                        };
                        if(o.childList){
                            $.each(o.childList,function (si,s) {
                                obj.children.push({ id: s.id,text: s.name,type:s.type})
                            });
                        }
                        staffArr.push(obj);
                    });
                }
                var $select = $(that.element).find('select[name="projectTypeId"]');
                $select.select2({
                    //tags: true,
                    language: "zh-CN",
                    minimumResultsForSearch: Infinity,
                    placeholder: '请选择项目类型',
                    data: staffArr
                });
                $select.on("change", function (e) {

                    var data = $select.select2('data')[0];
                    console.log(data);
                    if(data.type==2){
                        $(that.element).find('.form-group[data-type=1]').hide();
                        $(that.element).find('span.label-projectName').html('创新研究');
                        $(that.element).find('input[name="projectName"]').attr('placeholder','请输入创新研究');
                    }else{
                        $(that.element).find('.form-group[data-type=1]').show();
                        $(that.element).find('span.label-projectName').html('项目名称');
                        $(that.element).find('input[name="projectName"]').attr('placeholder','请输入项目名称');
                    }

                })
            });

        }
        //初始化select2
        ,initSelect2ByOrg:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listCreateProjectCompany;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    var staffArr = [];
                    if(response.data!=null && response.data.length>0){
                        $.each(response.data, function (i, o) {
                            staffArr.push({
                                id: o.id,
                                text: o.companyName
                            });
                        });
                    }

                    var $select = $(that.element).find('select[name="companyId"]');
                    $select.select2({
                        //tags: true,
                        language: "zh-CN",
                        minimumResultsForSearch: Infinity,
                        placeholder: '请选择立项组织',
                        data: staffArr
                    });
                    $select.val(that._currentCompanyId).trigger('change');

                    /*$select.on('change',function () {

                        var companyId = $(this).val();
                        that.renderApproverPage(companyId);
                    });*/


                }else {
                    S_layer.error(response.info);
                }
            })

        }
        //初始化select2
        ,initSelect2ByOrgZone:function () {
            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listZone;
            option.postData = {};
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){

                    var staffArr = [];
                    if(response.data!=null && response.data.length>0){
                        $.each(response.data, function (i, o) {
                            staffArr.push({
                                id: o.id,
                                text: o.orgName
                            });
                        });
                    }

                    var $select = $(that.element).find('select[name="orgId"]');
                    $select.select2({
                        //tags: true,
                        language: "zh-CN",
                        minimumResultsForSearch: Infinity,
                        placeholder: '请选择所属公司',
                        data: staffArr
                    });
                    //$select.val(that._currentCompanyId).trigger('change');

                }else {
                    S_layer.error(response.info);
                }
            })

        }
        //地区选择事件绑定
        ,bindAddressClick:function () {
            var that = this;
            $(that.element).find('.cityBox select').change(function () {
                var w = 508;
                var p = $(that.element).find('select.prov').val();
                var c = $(that.element).find('select.city').val();
                var d = $(that.element).find('select.dist').val();
                if(p==null|| p==undefined)
                    p='';
                if(c==null|| c==undefined)
                    c='';
                if(d==null|| d==undefined)
                    d='';
                var txt = p+c+d;
                $(that.element).find('.cityText').html(txt);
                $(that.element).find('.detailAddressLabel').css('width',(w-(txt.length*14)-5)+'px');
            });
        }
        //立项提交事件
        ,saveAddProjectFunc: function () {
            var that = this;

            var option = {};
            //option.url = restApi.url_project;
            option.url = restApi.url_saveProjectAudit;
            option.classId = 'body';
            option.postData = {};

            var projectData = $(that.element).find('form').serializeObject();
            var projectType = $(that.element).find('select[name="projectTypeId"]').select2('data')[0];
            that._businessType = projectType.type;
            projectData.projectType = projectType.text;
            projectData.businessType = projectType.type;
            projectData.flag = 2;//新建甲方的标识
            projectData.companyId = $(that.element).find('input[name="companyId"]').attr('data-id');

            option.postData.projectDTO = projectData;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('保存成功！');
                    that.goProjectDetail(response.data,projectName);

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        ,goProjectDetail:function (id,name) {
            var that = this;
            location.hash = '/project/basicInfo?id='+id+'&projectName='+encodeURI(name)+'&dataCompanyId='+window.currentCompanyId +'&businessType='+that._businessType;
        }
        //按钮绑定事件
        , bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'submit'://保存
                        that.validateSaveAppProject() && that.saveAddProjectFunc();
                        return false;
                        break;
                    case 'cancel':
                        location.hash = '/';
                        return false;
                        break;
                }

            });
            $(that.element).find('input[name="companyId"]').off('click').on('click',function () {
                var $this = $(this);
                $this.m_org_tree_select({
                    //treeData:data,
                    selectedCallBack:function (data) {
                        console.log(data);
                        $this.attr('data-id',data.id);
                        $this.val(data.text);
                    }
                });
            });
        }
        //地区选择
        , bindRegionSelect: function () {
            var that = this;
            $("#selectRegion").citySelect({
                nodata: "none",
                required: false
            });
            $(that.element).find('.cityBox select').change(function () {
                var w = 678;
                var p = $(that.element).find('select.prov').val();
                var c = $(that.element).find('select.city').val();
                var d = $(that.element).find('select.dist').val();
                if (p == null || p == undefined)
                    p = '';
                if (c == null || c == undefined)
                    c = '';
                if (d == null || d == undefined)
                    d = '';
                var txt = p + c + d;
                $(that.element).find('.cityText').html(txt);
                $(that.element).find('.detailAddressLabel').css('width', (w - (txt.length * 14) - 5) + 'px');
            });
        }
        //甲方input事件
        , bindPartyAEvent:function () {
            var that = this;
            $(that.element).find('#constructCompanyName').m_partyA({
                eleId:'constructCompanyName'
            });
        }
        //验证设计设计内容是否为空
        , validateSaveAppProject:function(){
            var that = this,error = '';
            $(that.element).find('input,select').each(function(){
                var $this = $(this);
                var name = $(this).attr('name');
                if($.trim($this.val())==''){
                    switch (name){
                        case 'projectTypeId':
                            error = '请选择项目类型!';
                            break;
                        case 'projectName':
                            if($(that.element).find('select[name="projectTypeId"]').select2('data')[0].type==2){
                                error = '请输入创新研究!';
                            }else{
                                error = '请输入项目名称!';
                            }
                            break;
                        case 'constructCompanyName':
                            error = '请输入甲方名称!';
                            break;
                        case 'province':
                            error = '请选择所在地区!';
                            break;
                        case 'companyId':
                            error = '请选择所属组!';
                            break;
                        case 'projectCreateDate':
                            error = '请选择立项时间!';
                            break;

                    }
                    return false;
                }
            });

            if( error!=''){
                S_toastr.warning(error);
                return false;
            }else{
                return true;
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
