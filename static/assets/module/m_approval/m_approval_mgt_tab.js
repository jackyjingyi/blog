/**
 * 审批管理
 * Created by wrb on 2018/8/2.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_mgt_tab",
        defaults = {
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;


        this._approvalGridOrgSelectData = null;//渲染审批列表-组织选择数据

        this._listForm = null;

        this._processTreeData = null;//tab3树数据

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_approval/m_approval_mgt_tab',{});
            $(that.element).html(html);

            that.renderApprovalGrid();
            $(that.element).find('a[data-toggle="tab"]').on('click',function () {

                var href = $(this).attr('href');
                if(href=='#tab-1'){

                    that.renderApprovalGrid();

                }else if(href=='#tab-2'){

                    $(that.element).find('.tab-pane[data-type="approvalList"] .panel-body').m_approval_mgt({},true);

                }else{

                    that.renderSelect2();
                }
            });


        }
        //渲染审批列表
        ,renderApprovalGrid:function () {
            var that = this;
            $(that.element).find('.tab-pane[data-type="approvalGrid"] .panel-body').m_approval_mgt_grid({
                selectedOrg:that._approvalGridOrgSelectData?that._approvalGridOrgSelectData:null,
                toProcessSettingsCallBack:function (data,selectedOrg) {

                    $(that.element).find('a[data-toggle="tab"][href="#tab-3"]').parent().addClass('active').siblings().removeClass('active');
                    $(that.element).find('div[id="tab-3"].tab-pane').addClass('active').siblings().removeClass('active');
                    that.renderSelect2(data,selectedOrg);

                },
                orgSelectCallBack:function (data) {
                    that._approvalGridOrgSelectData = data;
                }
            },true);
        }
        //渲染审批流程设置界面
        ,renderProcessSettings:function (data,selectedOrg) {
            var that = this;
            var option = {};
            option.id = data.id;
            option.type = data.type;
            option.formId = data.formId;
            option.name = data.name;
            option.isSystem = data.isSystem;
            option.selectedOrg = selectedOrg==null?{id:window.currentCompanyId}:selectedOrg;
            $(that.element).find('#processSettingsBox').m_approval_mgt_setProcess(option,true);


        }
        //获取数据
        ,renderSelect2:function (selectedItem,selectedOrg) {
            var that = this;
            that.getProcessTreeData(function (resData) {

                if($(that.element).find('select[name="approvalList"]').next('.select2-container').length>0)
                    $(that.element).find('select[name="approvalList"]').off('change').select2('destroy').empty();

                that._listForm = resData;
                var data = [];
                $.each(that._listForm,function (i,item) {
                    var children = [];
                    if(item.formList){
                        $.each(item.formList,function (ci,citem) {
                            children.push({id:citem.id,text:citem.name});
                        });
                    }
                    data.push({
                        id: item.id,
                        text: item.name,
                        children:children
                    })
                });

                $(that.element).find('select[name="approvalList"]').select2({
                    allowClear: false,
                    containerCssClass:'select-sm',
                    width:'300px',
                    language: "zh-CN",
                    minimumResultsForSearch: -1,
                    data:data
                });


                $(that.element).find('select[name="approvalList"]').on('change', function (e) {

                    var selectId = $(this).val();
                    var index = $(that.element).find('select[name="approvalList"] option:selected',this).parent().index();
                    var dataItem = that._listForm[index];
                    var dataSubItem = getObjectInArray(dataItem.formList,selectId);
                    that.renderProcessSettings(dataSubItem,selectedOrg);
                    stopPropagation(e);
                    return false;
                });

                if(selectedItem!=null && selectedItem.id!=null){

                    $(that.element).find('select[name="approvalList"]').val(selectedItem.id).trigger('change');

                }else if(that._listForm && that._listForm.length>0 && that._listForm[0].formList && that._listForm[0].formList.length>0){

                    $(that.element).find('select[name="approvalList"]').val(that._listForm[0].formList[0].id).trigger('change');
                }

            });




        },
        getProcessTreeData:function (callBack) {
            var that = this;

            if(isNullOrBlank(that._processTreeData)){
                var option = {};
                option.classId = '#content-right';
                option.url = restApi.url_listForm;
                option.postData = {};
                option.postData.formStatus = 1;
                option.postData.accountId = window.currentUserId;
                option.postData.currentCompanyId = window.currentCompanyId;
                option.postData.companyId = window.currentCompanyId;
                m_ajax.postJson(option, function (response) {
                    if (response.code == '0') {

                        that._processTreeData = response.data;
                        if(callBack)
                            callBack(that._processTreeData);

                    } else {
                        S_layer.error(response.info);
                    }
                })
            }else{
                if(callBack)
                    callBack(that._processTreeData);
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
