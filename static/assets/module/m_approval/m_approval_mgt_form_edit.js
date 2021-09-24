/**
 * 审批管理-表单属性编辑
 * Created by wrb on 2019/8/6.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_approval_mgt_form_edit",
        defaults = {
            isDialog:true,
            dataInfo:null,//dataInfo不为null,即编辑
            selectedOrg:null//父页面选择的组织对象
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._currentCompanyUserId = window.currentCompanyUserId;
        this._currentCompanyId = window.currentCompanyId;
        this._currentUserId = window.currentUserId;
        this._fastdfsUrl = window.fastdfsUrl;

        this._selectedOrg = this.settings.selectedOrg;//当前组织筛选-选中组织对象
        this._companyList = null;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            var html = template('m_approval/m_approval_mgt_form_edit', {
                dataInfo:that.settings.dataInfo,
                iconList:window.icon_list_form
            });
            that.renderDialog(html,function () {
                that.renderGroupSelect2();
                that.save_validate();
                $(that.element).find('.icon-circle').on('click',function () {
                    $(that.element).find('.icon-circle-out').removeClass('active');
                    $(this).parent().addClass('active');
                });
            });

        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'表单属性编辑',
                    area : '750px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var error = [];
                        var flag = $(that.element).find('form').valid();

                        if (!flag || that.save()) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        //流程分类渲染
        ,renderGroupSelect2:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = restApi.url_selectDynamicGroupList;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    var data = [];
                    $.each(response.data, function (i, o) {
                        if(!isNullOrBlank(o.groupName)){
                            data.push({
                                id: o.id,
                                text: o.groupName
                            });
                        }
                    });
                    $(that.element).find('select[name="formType"]').select2({
                        allowClear: false,
                        language: "zh-CN",
                        width: '100%',
                        minimumResultsForSearch: Infinity,
                        placeholder: "请选择流程分类!",
                        data: data
                    });
                    if(that.settings.dataInfo && that.settings.dataInfo.formType)
                        $(that.element).find('select[name="formType"]').val(that.settings.dataInfo.formType).trigger('change');

                } else {
                    S_layer.error(response.info);
                }
            });


        }
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_saveDynamicFormBase;
            option.postData = $(that.element).find('form').serializeObject();
            option.postData.iconKey = $(that.element).find('.icon-circle-out.active i').attr('data-icon');

            if(that.settings.dataInfo && that.settings.dataInfo.formId!=null)
                option.postData.id = that.settings.dataInfo.formId;

            option.postData.companyId = that._selectedOrg.id;
            option.postData.companyList = that._companyList;

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

        //表单验证
        ,save_validate:function(){
            var that = this;
            $(that.element).find('form.form-horizontal').validate({
                ignore : [],
                rules: {
                    formType:{
                        required: true
                    },
                    formName:{
                        required: true
                    },
                    rulePrefixKey:{
                        required: true
                    }
                },
                messages: {
                    formType:{
                        required: '请选择流程分类！'
                    },
                    formName:{
                        required: '请输入流程名称！'
                    },
                    rulePrefixKey:{
                        required: '请输入编号！'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
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
