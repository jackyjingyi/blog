/**
 * 审批管理-网格模式展示
 * Created by wrb on 2019/8/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_mgt_grid",
        defaults = {
            selectedOrg:null,
            orgSelectCallBack:null,
            toProcessSettingsCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._currentUserId = window.currentUserId;
        this._currentCompanyId = window.currentCompanyId;

        this._selectedOrg = null;//当前组织筛选-选中组织对象
        this._dataList = [];
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_approval/m_approval_mgt_grid',{});
            $(that.element).html(html);
            that.initOrgSelect();


        }
        //获取数据
        ,getData:function (callBack) {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_listForm;
            option.postData = {};
            option.postData.formStatus = 1;
            option.postData.status = 1;
            option.postData.accountId = that._currentUserId;
            option.postData.currentCompanyId = that._currentCompanyId;
            option.postData.companyId = that._selectedOrg.id;
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    that._dataList = response.data;
                    if(callBack)
                        callBack(response.data);

                } else {
                    S_layer.error(response.info);
                }
            })

        }
        //渲染内容
        ,renderContent:function () {
            var that = this;
            that.getData(function (data) {
                var html = template('m_approval/m_approval_mgt_grid_content',{dataList:data});
                $(that.element).find('#gridContent').html(html);
                that.bindActionClick();

            });
        }
        //渲染组织选择
        ,initOrgSelect:function () {
            var that = this;
            $(that.element).find('#selectOrg').m_org_chose_byTree({
                type:4,
                param : {permissionCode:'300001'},
                selectedId:that.settings.selectedOrg?that.settings.selectedOrg.id:that._currentCompanyId,
                selectedCallBack:function (data,childIdList) {
                    that._selectedOrg = data;
                    that.renderContent();
                    if(that.settings.orgSelectCallBack)
                        that.settings.orgSelectCallBack(data);

                }
            },true);
        }
        //事件绑定
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('a[data-action],button[data-action]').off('click').on('click',function () {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                var dataId = $this.closest('.grid-item').attr('data-id');
                var dataPid = $this.closest('.grid-item').attr('data-pid');

                //获取节点数据
                var dataItem = null;
                var pidDataItem = null;

                if(!isNullOrBlank(dataPid))
                    pidDataItem = getObjectInArray(that._dataList,dataPid);

                if(!isNullOrBlank(dataId) && pidDataItem)
                    dataItem = getObjectInArray(pidDataItem.formList,dataId);

               switch (dataAction){
                   case 'setProcess':

                       if(that.settings.toProcessSettingsCallBack)
                           that.settings.toProcessSettingsCallBack(dataItem,that._selectedOrg);

                       return false;
                       break;

                   case 'whetherEnable'://是否启用

                       var option = {};
                       option.url = restApi.url_updateStatusDynamicForm ;
                       option.postData = {
                           id:dataId,
                           status:$this.attr('data-status')
                       };
                       m_ajax.postJson(option, function (response) {
                           if (response.code == '0') {
                               S_toastr.success('操作成功！');
                               that.renderContent();
                           } else {
                               S_layer.error(response.info);
                           }
                       });
                       return false;
                       break;
                   case 'preview'://预览
                       $('body').m_form_template_preview({
                           selectedOrg : that._selectedOrg,
                           formId:dataItem.formId
                       },true);
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
