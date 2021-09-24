/**
 * 项目－收款计划
 * Created by wrb on 2018/8/8.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_cost_collectionPlan",
        defaults = {
            myTaskId:null,//任务ID
            projectId:null,//项目ID
            projectName:null,
            dataCompanyId:null,//视图组织ID
            isView:false//是否只展示
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentCompanyId = window.currentCompanyId;//当前组织ID
        this._currentCompanyUserId = window.currentCompanyUserId;//当前员工ID
        this._collectionPlan = null;
        this._dataInfo = null;//请求数据对象
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        }
        //初始化数据,生成html
        ,renderPage:function (callBack) {

            var that = this;
            var option  = {};
            option.classId = that.element;
            option.url = restApi.url_listProjectCost;
            option.postData = {};
            option.postData.payType = '1';
            option.postData.projectId = that.settings.projectId;
            if(that.settings.myTaskId!=null)
                option.postData.myTaskId = that.settings.myTaskId;

            if(!isNullOrBlank(that.settings.dataCompanyId))
                option.postData.companyId = that.settings.dataCompanyId;

            if(that.settings.isView==true)
                option.postData.isView = '1';

            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    that._dataInfo = response.data;
                    that._collectionPlan = response.data.costList;

                    var projectCostRole = response.data.projectCostRole;

                    //去掉编辑权限
                    if(that.settings.isView==true){
                        projectCostRole = {};
                    }

                    var html = template('m_cost/m_cost_collectionPlan',{
                        dataList:that._collectionPlan,
                        isFinancial:response.data.isFinancial,
                        isManager:response.data.isManager,
                        projectCostRole:projectCostRole
                    });
                    $(that.element).html(html);

                    that.bindActionClick();
                    that.renderDesignManager();

                    if(that._collectionPlan!=null && that._collectionPlan.length>0){
                        $.each(that._collectionPlan,function (i,item) {

                            var option = {};
                            option.projectCost = item;
                            option.projectId = that.settings.projectId;
                            option.projectName = that.settings.projectName;
                            option.isAppend = true;
                            option.myTaskId = that.settings.myTaskId;
                            option.projectCostRole = projectCostRole;
                            option.dataCompanyId = that.settings.dataCompanyId;
                            option.isView = that.settings.isView;
                            option.businessType = that.settings.businessType;
                            option.projectNo = that._dataInfo.projectNo;
                            option.renderParentPage = function () {
                                that.renderPage();
                            };
                            option.renderCallBack = function () {

                                //禁用编辑
                                if(that.settings.isView==true){
                                    $(that.element).find('a[data-action],button[data-action],div.btn-operate').not('a[data-action="xeditable"]').remove();
                                    $(that.element).find('a[data-action="xeditable"]').addClass('color-public').off('click');
                                }

                                if(i==that._collectionPlan.length-1 && callBack)
                                    callBack();
                            };
                            $(that.element).find('#collectionPlanBox').m_cost_collectionPlan_item(option,true);

                        });
                    }

                }else {
                    S_layer.error(response.info);
                }
            })
        }
        //渲染商务秘书
        ,renderDesignManager:function () {
            var that = this;
            $(that.element).find('#designManagerBox').m_production_design_manager({
                doType:1,
                projectId:that.settings.projectId,
                dataInfo:{
                    projectManager:that._dataInfo.projectManager,
                    assistant:that._dataInfo.assistant,
                    dataCompanyId:that._dataInfo.dataCompanyId?that._dataInfo.dataCompanyId:that.settings.dataCompanyId
                },
                saveCallBack:function () {
                    that.renderPage();
                }
            },true);
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click',function () {
                var $this = $(this),dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'addCollectionPlan'://添加收款计划

                        var option = {};
                        option.projectId = that.settings.projectId;
                        option.dataCompanyId = that.settings.dataCompanyId;
                        option.oKCallBack = function (data) {
                            that.renderPage(function () {
                                //当节点比例大于等于100%时，无需再提醒用户
                              // that.promptAfterAddPlan(data);
                            });
                        };
                        $('body').m_cost_collectionPlan_add(option,true);

                        break;
                }
            });
        }
        //添加收付款计划后提示
        ,promptAfterAddPlan:function (costId) {
            var that = this;
            var $panel = $(that.element).find('.panel[data-id="'+costId+'"]');
            if(costId==null)
                $panel = $(that.element).find('#collectionPlanBox .panel:last');

            $('body').m_tips_common({
                doType:'receiveProjectCost',
                option:{
                    ele:$panel.find('a[data-action="addContract"] i'),
                    tipsContent:'添加节点信息及对应收款比例及金额。',
                    okText:'下一步',
                    ok:function () {

                        $('body').m_tips_common({
                            doType:'receiveProjectCost',
                            option:{
                                ele:$panel.find('div.btn-operate'),
                                tipsContent:'添加完成后，发布或提交('+$panel.find('#costTitle').text()+')收款计划。',
                                isShowCancel:false,
                                isShowCheck:true,
                                ok:function () {

                                }
                            }
                        });
                    }
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
