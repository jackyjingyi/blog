/**
 * 项目信息－生产安排-项目负责人
 * Created by wrb on 2019/5/29.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_production_design_manager",
        defaults = {
            doType:1,//1=商务秘书，2=项目负责人
            businessType:1,//1：业务类型，2：研发类型
            projectId:null,
            dataCompanyId:null,//视图组织ID
            dataInfo:null,//初始数据
            renderCallBack:null,
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._tabindex = 0;//当前选中TAB页

        this._title = '商务秘书';

        if(this.settings.doType==2||this.settings.doType==3){
            this._title = '项目负责人';
            if(this.settings.businessType==2){
                this._title = '课题负责人';
            }
        }

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        }

        //渲染初始界面
        ,renderPage:function () {

            var that = this;

            var renderFun = function (data) {
                var html = template('m_production/m_production_design_manager',{
                    projectManager:data.projectManager,
                    assistant:data.assistant,
                    dataCompanyId:data.dataCompanyId,
                    currentCompanyId:window.currentCompanyId,
                    currentCompanyUserId:window.currentCompanyUserId,
                    doType:that.settings.doType,
                    title:that._title
                });
                $(that.element).html(html);

                that.bindClickAction();
                $(that.element).find('a[data-toggle="tooltip"]').tooltip({});
                if(that.settings.renderCallBack)
                    that.settings.renderCallBack(data);
            };

            if(that.settings.dataInfo){

                renderFun(that.settings.dataInfo);

            }else{
                var options={};
                options.classId = 'body';
                options.url=restApi.url_getDesignManagerInfo;
                options.postData = {};
                options.postData.projectId = that.settings.projectId;

                if(!isNullOrBlank(that.settings.dataCompanyId))
                    options.postData.companyId = that.settings.dataCompanyId;

                m_ajax.postJson(options,function (response) {

                    if(response.code=='0'){

                        renderFun(response.data);

                    }else {
                        S_layer.error(response.info);
                    }
                })
            }

        }
        //更改项目负责人或设计人事件
        ,managerChangeEvent:function ($this) {
            var that = this;
            var action = $this.attr('data-action');
            var companyId = $this.attr('data-company-id');//当前要获取的项目立项组织的index

            if (action == 'changeOperatorPerson') {
                var operatorPersonId = $this.attr('data-id'),userName=$this.attr('data-user-name');

                var option = {};
                option.type = that.settings.doType;
                option.title = '选择'+that._title;
                option.selectedUserList = [{
                    id:operatorPersonId,
                    userName:userName
                }];
                option.selectUserCallback = function (data, $ele) {//1
                    data.type = 1;
                    var targetUser='<strong style="color:red;margin:0 3px;">'+data.userName+'</strong>';
                    S_layer.confirm('确定将'+that._title+'更换为'+targetUser+'？', function () {
                        that.postManagerChange(data, companyId, $ele);
                    }, function () {
                        //S_layer.close($($ele));
                    });
                };
                $('body').m_changeOperator(option);

            } else if (action == 'changeManagerPerson') {

                var isFirstSetDesign = $.trim($this.text()) == '未设置' ? true : false;
                var designPersonId = $this.attr('data-id'),userName=$this.attr('data-user-name');
                var options = {};
                options.isASingleSelectUser = true;
                options.delChoseUserCallBack = function () {
                    $(that.element).find('input[name="chooseManager"]').removeAttr('companyUserId');
                    $(that.element).find('input[name="chooseManager"]').val('');
                };
                options.title = '选择助理';
                if(designPersonId!=undefined && designPersonId!=''){
                    options.selectedUserList = [{
                        id:designPersonId,
                        userName:userName
                    }];
                }

                options.isOkSave = true;
                options.saveCallback = function (data, $ele) {
                    var obj = {};
                    obj.type = 2;
                    if(data!=null && data.selectedUserList!=null && data.selectedUserList.length>0){
                        obj.userName = data.selectedUserList[0].userName;
                        obj.companyUserId = data.selectedUserList[0].id;
                        obj.isFirstSetDesign = isFirstSetDesign;
                        var targetUser='<strong style="color:red;margin:0 3px;">'+obj.userName+'</strong>';
                        S_layer.confirm('确定将助理更换为'+targetUser+'？', function () {
                            that.postManagerChange(obj, companyId, $ele);
                        }, function () {
                        });
                    }else{
                        obj.companyUserId=null;
                        S_layer.confirm('确定将助理置空？', function () {
                            that.postManagerChange(obj, companyId, $ele);
                        }, function () {
                        });
                    }
                };
                $('body').m_orgByTree(options);
            }
            return false;
        }
        //移交项目负责人或助理的请求
        ,postManagerChange: function (data, companyId, $ele) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.postData = {};
            if(data.type==2){//助理

                option.url = restApi.url_updateProjectAssistant;
                option.postData.type = that.settings.doType;

            }else{//商务秘书/项目负责人

                if (data.isFirstSetDesign != null && data.isFirstSetDesign == false) {
                    option.url = restApi.url_transferTaskDesigner;
                } else {
                    option.url = restApi.url_updateProjectManager;
                }
                option.postData.type = that.settings.doType;
            }
            option.postData.projectId = that.settings.projectId;
            option.postData.companyId = companyId;
            option.postData.companyUserId = data.companyUserId;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    if(!isNullOrBlank($ele))
                        S_layer.close($ele);

                    S_toastr.success('保存成功！');

                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                } else {
                    S_layer.error(response.info);
                }
            })
        }
        ,bindClickAction:function(){
            var that = this;

            $(that.element).find('a[data-action]').off('click').on('click',function(){
                var $this = $(this),
                    dataAction = $this.attr('data-action');

                switch (dataAction) {

                    case 'changeOperatorPerson'://修改当前组织项目负责人

                        that.managerChangeEvent($this);
                        break;
                    case 'changeManagerPerson'://修改当前组织设计助理

                        that.managerChangeEvent($this);
                        break;

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
