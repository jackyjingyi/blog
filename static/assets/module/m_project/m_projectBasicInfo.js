/**
 * Created by wrb on 2016/12/19.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_projectBasicInfo",
        defaults = {
            isDialog: false,//是否弹窗
            doType: 1,//1=基本信息，2=立项审批详情,3=合同审批详情
            isView: false,//是否信息浏览,是则屏蔽操作,屏蔽面包屑
            projectId: null,
            projectName: null,
            projectOperator: {},//操作权限
            mainId: null,//审批记录ID
            isLoadDataByMainId: false,
            renderCallBack: null,
            menuReRenderCallBack: null,//刷新，包括项目菜单
            dataCompanyId: null//视图ID
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;
        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._projectInfo = null;//项目信息
        this._currentUserId = null;//当前用户id
        this._currentCompanyId = window.currentCompanyId;
        this._currentCompanyUserId = window.currentCompanyUserId;
        this._currentRoleCodes = window.currentRoleCodes;

        this._projectTypeList = null;//设计分类
        this._zoneList = [];//公司列表
        this._deanList = [];//分管院长列表
        this._companyList = [];//组织列表
        this._projectPartnerList = [];//外部协作单位列表

        this._editFlag = this.settings.projectOperator.projectEdit;
        this._deleteFlag = this.settings.projectOperator.projectDelete;
        this._updateProjectStatus = this.settings.projectOperator.updateProjectStatus;

        this._projectProgressRate = 0;

        //查看时设置不能编辑
        if (this.settings.isView)
            this._editFlag = 0;

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            that.getProjectData(function () {

                that.renderPage(function () {

                    $(that.element).find('span[data-toggle="tooltip"]').tooltip();

                    that.renderProjectPartner();
                    that.renderDesignManager();
                    that.renderProjectNotice();
                    that.renderTaskOrder(function (totalRatio) {
                        that.renderProjectProcess(totalRatio);
                    });

                    that.bindActionClick();

                    if (!that.settings.isView && that._editFlag == 1) {
                        that.getProjectType(function () {
                            that.bindEditable();
                        });
                    } else {
                        $(that.element).find('a.editable-click').addClass('color-public').off('click');
                        $(that.element).find('a.editable-click span.fc-v1-grey').remove();
                    }

                    $(that.element).find('a[data-role="0"]').addClass('color-public').off('click');

                    that.settings.projectName = that._projectInfo.projectName;
                    that._breadcrumb = [
                        {
                            name: that.settings.businessType == 1 ? '我的项目' : '我的课题'
                        },
                        {
                            name: that.settings.projectName,
                            url: '#/project/basicInfo?id=' + that.settings.projectId + '&projectName=' + encodeURI(that.settings.projectName) + '&dataCompanyId=' + that.settings.dataCompanyId + '&businessType=' + that.settings.businessType
                        },
                        {
                            name: '基本信息'
                        }
                    ];
                    $(that.element).find('#breadcrumb').m_breadcrumb({dataList: that._breadcrumb}, true);

                    that.publishProjecttips($(that.element).find('a[data-action="publishProject"]'), 1);
                    that.publishProjecttips($(that.element).find('button.project-submit'), 2);
                    rolesControl();
                    if (that.settings.renderCallBack)
                        that.settings.renderCallBack();

                });

            });

        }
        //请求项目数据
        , getProjectData: function (callback) {
            var that = this;
            var option = {};

            var companyId = that._currentCompanyId;
            if (!isNullOrBlank(that.settings.dataCompanyId))
                companyId = that.settings.dataCompanyId;

            option.url = restApi.url_loadProjectDetails + '/' + that.settings.projectId + '/' + companyId;

            if ((that.settings.doType == 2 || that.settings.doType == 3) && that.settings.isLoadDataByMainId == true)
                option.url = restApi.url_loadProjectDetailsByMainId + '/' + that.settings.mainId;

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._projectInfo = response.data;

                    if (response.data.projectStatus)
                        that._projectInfo.status = response.data.projectStatus.valueId;

                    if (callback)
                        callback();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //渲染界面
        , renderPage: function (callBack) {
            var that = this;
            var flag = that._editFlag != null && that._editFlag == 1 ? true : false;//编辑标识
            var html = template('m_project/m_projectBasicInfo', {
                project: that._projectInfo,
                editFlag: flag,
                deleteFlag: that._deleteFlag,
                updateProjectStatus: that._updateProjectStatus,
                currentCompanyId: that._currentCompanyId,
                roles: that._currentRoleCodes,
                companyVersion: window.companyVersion,
                isView: that.settings.isView,
                doType: that.settings.doType
            });
            if (that.settings.isDialog) {
                S_layer.dialog({
                    title: that.settings.title || '项目基本信息',
                    area: '1000px',
                    fixed: true,
                    //scrollbar:false,
                    content: html,
                    anim: 2,
                    shadeClose: true,
                    btn: false

                }, function (layero, index, dialogEle) {//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if (callBack)
                        callBack(flag);
                    S_layer.resize(layero, index, dialogEle);
                });
            } else {
                $(that.element).html(html);
                if (callBack)
                    callBack(flag);
            }

        }
        //保存基本信息
        , saveProjectData: function (value, name) {
            var that = this;
            var options = {};
            options.url = restApi.url_project;
            options.classId = '#content-right';
            options.postData = {};

            if (name && name == 'companyBid') {
                options.postData.companyBid = value;
                options.postData.flag = 3;
            } else if (name && name == 'address') {
                options.postData.province = value.province;
                options.postData.city = value.city;
                options.postData.county = value.county;
                options.postData.detailAddress = value.detailAddress;
            } else if (name && name == 'signDate') {
                options.postData.flag = 4;
                options.postData[name] = value;
            } else if (typeof value == "object") {
                options.postData = value;
            }  else {
                options.postData[name] = value;
            }
            options.postData.id = that._projectInfo.id;

            m_ajax.postJson(options, function (response) {
                if (response.code == '0') {

                    S_toastr.success('保存成功！');
                    that.init();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //获取设计分类
        , getProjectType: function (callBack) {
            var that = this;
            var option = {};
            option.url = restApi.url_projectType;
            option.postData = {
                businessType: that._projectInfo.businessType
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._projectTypeList = response.data;
                    if (callBack != null) {
                        return callBack(response.data);
                    }
                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //在位编辑内容初始化
        , bindEditable: function () {
            var that = this;
            $(that.element).find('a[data-action="xeditable"]').each(function () {
                var $this = $(this);
                var key = $this.attr('data-key');
                var dataInfo = null;
                var noInternalInit = false;
                var value = $this.attr('data-value');

                if (key == 'status') {

                    dataInfo = [{id: 0, name: '进行中'},
                        {id: 2, name: '已完成'},
                        {id: 1, name: '已暂停'},
                        {id: 3, name: '已终止'}];
                } else if (key == 'isAudit') {

                    dataInfo = [{id: 1, name: '是'},
                        {id: 0, name: '否'}];
                } else if (key == 'projectTypeId') {

                    dataInfo = that._projectTypeList;
                } else if (key == 'companyBid') {

                    dataInfo = [{id: '深圳华侨城创新研究院有限公司', name: '深圳华侨城创新研究院有限公司'}];
                }
                $this.m_editable({
                    inline: true,
                    popoverClass: 'full-width',
                    hideElement: true,
                    value: value,
                    dataInfo: dataInfo,
                    targetNotQuickCloseArr: ['m-org-tree-select'],
                    closed: function (data) {

                        if (data == false || key == 'companyId')
                            return false;

                        if (key == 'projectTypeId') {
                            var projectTypeItem = getObjectInArray(that._projectTypeList, data[key]);
                            data.projectType = projectTypeItem ? projectTypeItem.name : '';
                            that.saveProjectData(data, key);
                        } else if (key == 'status') {

                            that.updateProjectStatus(data);
                        } else if (key == 'companyBid') {
                            data = data.companyBid;
                            that.saveProjectData(data, key);
                        }else if (key == 'totalContractAmount'||key == 'investmentEstimation') {
                            if((key=='totalContractAmount'&&(data.totalContractAmount==null||data.totalContractAmount==''))||(key=='investmentEstimation'&&(data.investmentEstimation==null||data.investmentEstimation==''))){
                                data = -1;//后台要求的，传递-1就清空该字段。
                            }
                            var investmentEstimationRatio = '';
                            var value = '';
                            var totalValue ='';
                            if(key=='totalContractAmount'){
                                value =  $(that.element).find('a[data-key="investmentEstimation"]').attr('data-value');
                                totalValue = data.totalContractAmount;
                            }
                            if(key=='investmentEstimation'){
                                totalValue=  $(that.element).find('a[data-key="totalContractAmount"]').attr('data-value');
                                value = data.investmentEstimation;
                            }
                            if(totalValue==null||totalValue==''||value==null||value==''){
                                investmentEstimationRatio = '';
                            }else if(totalValue==0){
                                investmentEstimationRatio = '0';
                            }else{
                                investmentEstimationRatio =value*100/totalValue;//外协率单位是百分比，所以需要*100
                            }
                            data.investmentEstimationRatio = investmentEstimationRatio;
                            that.saveProjectData(data, key);
                        }else  {
                            that.saveProjectData(data, key);
                        }

                    },
                    noInternalInit: noInternalInit,
                    completed: function ($popover) {
                        if (key == 'companyId') {
                            var $input = $popover.find('input[name="companyId"]');
                            $input.attr('readonly', 'true');
                            $input.m_org_tree_select({
                                //treeData:data,
                                clearOnInit: false,
                                selectedCallBack: function (data) {
                                    //console.log(data);
                                    var oldValue = $this.attr('data-id');
                                    if (data.id != oldValue) {
                                        that.saveProjectData({companyId: data.id}, key);
                                    }
                                }
                            });
                        }
                    }
                }, true);
            });
        }
        //事件绑定
        , bindActionClick: function () {
            var that = this;
            $(that.element).find('a[data-action]:not([data-action="xeditable"])').off('click').on('click', function () {
                var $this = $(this), dataAction = $this.attr('data-action');
                switch (dataAction) {
                    case 'deleteProject'://删除项目

                        S_layer.confirm('删除后将不能恢复，您确定要删除吗？', function () {
                            var option = {};
                            var id = $($this).attr('data-id');
                            option.url = restApi.url_deleteProject + '/' + id;
                            m_ajax.get(option, function (response) {
                                if (response.code == '0') {
                                    S_toastr.success('删除成功！');
                                    if(that.settings.type=='0'){
                                        location.hash = '/myProjectList?businessType='+that.settings.businessType;
                                    }else  if(that.settings.type=='1'){
                                        location.hash = '/projectOverview?businessType='+that.settings.businessType;
                                    }else  if(that.settings.type=='3'){
                                        location.hash = '/studyProjectList?businessType='+that.settings.businessType;
                                    }else  if(that.settings.type=='4'){
                                        location.hash = '/studyProjectOverview?businessType='+that.settings.businessType;
                                    }

                                } else {
                                    S_layer.error(response.info);
                                }
                            });

                        }, function () {
                        });
                        break;
                    case 'edit_signDate'://合同签订按钮绑定
                        var options = {};
                        options.placement = 'right';
                        options.eleId = 'a[data-action="edit_signDate"]';
                        options.okCallBack = function ($data) {
                            that.saveProjectData($data, 'signDate');
                        };
                        $this.m_quickDatePicker(options);
                        return false;
                        break;
                    case 'edit_projectCreateDate'://立项时间
                        var options = {};
                        options.placement = 'right';
                        options.isClear = false;
                        options.eleId = 'a[data-action="edit_projectCreateDate"]';
                        options.okCallBack = function ($data) {
                            that.saveProjectData($data, 'projectCreateDate');
                        };
                        $this.m_quickDatePicker(options);
                        return false;
                        break;

                    case 'edit_address'://编辑地址按钮绑定

                        var options = {};
                        options.title = '编辑';
                        if (that._projectInfo.projectLocation != null) {
                            options.province = that._projectInfo.projectLocation.province;
                            options.city = that._projectInfo.projectLocation.city;
                            options.county = that._projectInfo.projectLocation.county;
                            options.detailAddress = that._projectInfo.projectLocation.detailAddress;
                        }
                        options.placement = 'top';
                        options.okCallBack = function (data) {
                            if (data.province == '' && data.city == '' && data.detailAddress == '') {
                                S_toastr.warning('项目地点不能为空')
                            } else {
                                that.saveProjectData(data, 'address');
                            }
                        };
                        $(this).m_entryAddress(options);
                        break;


                    case 'publishProject'://发布项目信息

                        if (window.companyVersion != '03') {//非免费版
                            $('body').m_project_manager_settings({
                                saveCallBack: function (data) {

                                    that.publishProject(data);
                                }
                            });
                        } else {
                            that.publishProject();
                        }
                        break;
                    case 'edit_projectZone'://修改公司

                        that.getOrgZone(function (data) {
                            var key = $this.attr('data-key');
                            var value = $this.attr('data-value');
                            $this.m_editable({
                                inline: true,
                                popoverClass: 'full-width',
                                hideElement: true,
                                value: value,
                                dataInfo: data,
                                isInitAndStart: true,
                                closed: function (data) {
                                    if (data != false) {
                                        that.saveProjectData(data, key);
                                    }
                                },
                                completed: function ($popover) {

                                }
                            }, true);
                        });


                        break;
                    case 'edit_projectDean'://分管院长

                        that.getProjectDean(function (data) {
                            var key = $this.attr('data-key');
                            var value = $this.attr('data-value');
                            $this.m_editable({
                                inline: true,
                                popoverClass: 'full-width',
                                hideElement: true,
                                value: value,
                                dataInfo: data,
                                isInitAndStart: true,
                                closed: function (data) {
                                    if (data != false) {
                                        that.updateProjectDean(data);
                                    }
                                },
                                completed: function ($popover) {

                                }
                            }, true);
                        });

                        break;
                    case 'editProjectPartner'://外部协作单位编辑

                        $('body').m_project_partner_edit({
                            projectId: that.settings.projectId,
                            businessType: that._projectInfo.businessType,
                            projectPartnerList: that._projectPartnerList,
                            saveCallBack: function () {
                                that.renderProjectPartner();
                            }
                        });
                        break;
                    case 'addProjectNotice'://添加项目动态
                        $('body').m_project_notice_edit({
                            projectId: that.settings.projectId,
                            title:that.settings.businessType==1?'添加项目动态':'添加课题动态',
                            saveCallBack: function () {
                                that.renderProjectNotice();
                            }
                        });
                        break;
               /*     case 'editProjectProcess'://修改项目进度
                        $('body').m_project_process_edit({
                            projectId: that.settings.projectId,
                            progressRate: that._projectProgressRate,
                            saveCallBack: function () {
                                that.renderProjectProcess();
                            }
                        });
                        break;*/
                }
                return false;

            });

        }
        //发布项目信息提示
        , publishProjecttips: function ($btn, type) {
            var that = this;
            if ($btn.length == 0)
                return false;

            if (that._projectInfo.status == 4 && !(Cookies.get('cookiesData_publishProjectTips_' + type) == 1)) {

                var top = $btn.offset().top - 6;
                var left = $btn.offset().left - 345;
                $('body').m_project_submit_tips({
                    doType: type,
                    businessType: that.settings.businessType,
                    offset: [top + 'px', left + 'px']
                });
            }
        }
        //发布项目信息
        , publishProject: function (param) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_submitProjectAudit;
            option.postData = {};
            option.postData.projectDTO = {};
            option.postData.projectDTO.id = that.settings.projectId;
            option.postData.projectDTO = $.extend({}, option.postData.projectDTO, param);

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    if (that.settings.menuReRenderCallBack)
                        that.settings.menuReRenderCallBack();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //更改项目状态，合同状态
        , updateProjectStatus: function (param) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_updateProjectStatus;
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
            option.postData.companyId = that._currentCompanyId;
            if (!isNullOrBlank(that.settings.dataCompanyId))
                option.postData.companyId = that.settings.dataCompanyId;

            option.postData = $.extend({}, option.postData, param);

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    that.init();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //获取公司数据
        , getOrgZone: function (callBack) {
            var that = this;

            if (that._zoneList && that._zoneList.length > 0) {
                if (callBack)
                    callBack(that._zoneList);
            } else {
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_listZone;
                option.postData = {};
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        var dataList = [];
                        if (response.data != null && response.data.length > 0) {
                            $.each(response.data, function (i, o) {
                                dataList.push({
                                    id: o.id,
                                    name: o.orgName
                                });
                            });
                        }
                        that._zoneList = dataList;
                        if (callBack)
                            callBack(dataList);

                    } else {
                        S_layer.error(response.info);
                    }
                })
            }
        }
        //获取分管院长数据
        , getProjectDean: function (callBack) {
            var that = this;

            if (that._deanList && that._deanList.length > 0) {
                if (callBack)
                    callBack(that._deanList);
            } else {
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_getProjectDean;
                m_ajax.get(option, function (response) {
                    if (response.code == '0') {

                        var dataList = [];
                        if (response.data != null && response.data.length > 0) {
                            $.each(response.data, function (i, o) {
                                dataList.push({
                                    id: o.id,
                                    name: o.userName
                                });
                            });
                        }
                        that._deanList = dataList;
                        if (callBack)
                            callBack(dataList);

                    } else {
                        S_layer.error(response.info);
                    }
                })
            }
        }
        //更改分管院长
        , updateProjectDean: function (param) {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_saveProjectDean;
            option.postData = {};
            option.postData.projectId = that.settings.projectId;
            option.postData = $.extend({}, option.postData, param);

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('操作成功');
                    that.init();
                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //获取组织数据
        , getCompanyList: function (callBack) {
            var that = this;

            if (that._companyList && that._companyList.length > 0) {
                if (callBack)
                    callBack(that._companyList);
            } else {
                var option = {};
                option.classId = that.element;
                option.url = restApi.url_listCreateProjectCompany;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        var dataList = [];
                        if (response.data != null && response.data.length > 0) {
                            $.each(response.data, function (i, o) {
                                dataList.push({
                                    id: o.id,
                                    name: o.companyName
                                });
                            });
                        }
                        that._companyList = dataList;
                        if (callBack)
                            callBack(dataList);

                    } else {
                        S_layer.error(response.info);
                    }
                })
            }
        }
        //渲染外部协作单位
        , renderProjectPartner: function () {
            var that = this;
            $(that.element).find('#projectPartner').m_project_partner_list({
                projectId: that.settings.projectId,
                renderCallBack: function (data) {
                    that._projectPartnerList = data;
                }
            });
        }
        //渲染项目负责人
        , renderDesignManager: function (callBack) {
            var that = this;

            $(that.element).find('#designManagerBox').m_production_design_manager({
                doType: 3,
                businessType: that.settings.businessType,
                projectId: that.settings.projectId,
                dataCompanyId: that._currentCompanyId,
                renderCallBack: function (data) {
                },
                saveCallBack: function () {
                    that.init();
                }
            }, true);
        }
        //渲染项目动态
        , renderProjectNotice: function () {
            var that = this;
            $(that.element).find('#projectNotice').m_project_notice({
                projectId: that.settings.projectId,
                businessType: that._projectInfo.businessType,
                renderCallBack: function (data) {
                }
            });
        }
        //渲染院内团队协同
        , renderTaskOrder: function (callback) {
            var that = this;
            $(that.element).find('#listTaskOrder').m_project_task_order({
                projectId: that.settings.projectId,
                businessType: that._projectInfo.businessType,
                renderCallBack: function (data) {
                    var totalRatio = data.totalRatio;
                    if(callback){
                        callback(totalRatio);
                    }
                }
            });
        }
        //渲染项目进度
        , renderProjectProcess: function (totalRatio) {
            var that = this;
            $(that.element).find('#projectProcess').m_project_process({
                projectId: that.settings.projectId,
                businessType: that._projectInfo.businessType,
                editFlag:that._editFlag,
                isView:that.settings.isView,
                totalRatio:totalRatio,
                renderCallBack: function (data) {
                    that._projectProgressRate = data.progressRate;
                }
            });
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
            } else if (typeof options === "string" && typeof instance[options] === "function") {

                //options作为方法名，args则作为方法要调用的参数
                //如果方法没有返回值，funcReuslt为undefined
                funcResult = instance[options].call(instance, args);
            }
        });

        return funcResult === undefined ? jqObj : funcResult;
    };

})(jQuery, window, document);
