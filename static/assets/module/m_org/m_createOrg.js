/**
 * Created by wrb on 2016/12/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_createOrg",
        defaults = {
            orgId: '',
            userUrl: '',
            showPre: null,//是否展示提示页
            doType:null,//1=第一次创建组织
            saveOrgCallback: null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this._busInformation = null;//选择的工商信息
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            if (that.settings.showPre === '1')
                that.initPre();
            else
                that.initMain();

        }
        , initPre: function () {
            var that = this;
            var html = template('m_org/m_firstCreateOrg_pre', {});
            $(that.element).html(html);
            $(that.element).find('a[data-action="startCreateOrg"]').click(function (e) {
                that.initMain();
            });
        }
        //初始化数据并加载模板
        , initMain: function (callback) {
            var that = this;
            var option = {};
            option.url = restApi.url_listCompanyServerType;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    var html = template('m_org/m_createOrg', {serverTypeList: response.data});
                    $(that.element).html(html);
                    $(that.element).find("#citysBox").citySelect({//加载省市区
                        nodata: "none",
                        required: false
                    });
                    $(that.element).find('#serviceTypeBox').m_org_service_type_edit({serverTypeList: response.data});
                    that.bindKeyDownEnter();
                    that.saveCreateOrg_validate();
                    that.bindActionClick();
                    //that.companyNameKeyupFun();

                    if (callback != null)
                        callback();

                } else {
                    S_layer.error(response.info);
                }
            })
        }
        //保存组织
        , saveOrg: function () {
            var that = this;
            var option = {};
            option.classId = 'form.createOrgBox';
            option.url = restApi.url_registerCompany;
            option.postData = $(that.element).find('form.createOrgBox').serializeObject();
            option.postData.companyShortName=option.postData.companyName;
            var serverTypeStr = '';
            var i = 0;
            $(that.element).find('input[name="serverType"]:checked').each(function () {
                var $customServerType = $(this).closest('.service-type').find('input[name="customServerType"]');
                if($customServerType.length>0){
                    serverTypeStr += $customServerType.val() + ',';
                }else{
                    serverTypeStr += $(this).closest('.service-type').find('.i-checks-span-default').text() + ',';
                }
                i++;
            });
            if (i > 0) {
                serverTypeStr = serverTypeStr.substring(0, serverTypeStr.length - 1);
            }
            option.postData.serverType = serverTypeStr;
            delete option.postData.customServerType;

            if(that._busInformation && that._busInformation.corpname==option.postData.companyName){
                option.postData.enterpriseId = that._busInformation.enterpriseOrgId;
                option.postData.taxNumber = that._busInformation.taxNumber;
            }
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    S_toastr.success('保存成功！');
                    if (that.settings.saveOrgCallback != null)
                        that.settings.saveOrgCallback(response.data);
                } else {
                    S_layer.error(response.info);
                }
            });

        }
        //敲打回车enter键提交请求
        ,bindKeyDownEnter: function () {
            var that = this;
            $(that.element).find('input').keydown(function () {
                if (event.keyCode == 13){
                    if ($(that.element).find('form.createOrgBox').valid()) {
                        that.saveOrg();
                    }else{
                        S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                        return false;
                    }
                    preventDefault(event);
                }
            });
        }
        //按钮事件绑定
        , bindActionClick: function () {
            var that = this;
            $(that.element).find('a[data-action]').on('click', function (event) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch(dataAction){
                    case 'saveOrg'://保存组织
                        if ($(that.element).find('form.createOrgBox').valid()) {
                            that.saveOrg();
                        }else{
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                        }
                        return false;
                        break;

                    case 'viewPartyACompany'://查看组织工商信息

                        if(!that._busInformation)
                            return false;

                        $this.m_partyA_info({
                            busInformation:that._busInformation,
                            clearOnInit:true
                        },true);

                        break;
                }

            });
        }
        //给组织名称增加change focus事件，进行模糊搜索
        , companyNameKeyupFun:function(){
            var that = this;
            var $viewBusInfomation = $(that.element).find('a#viewPartyACompany');
            $(that.element).find('#companyName').m_partyA({
                eleId:'companyName',
                inputChangeCallBack:function (txt) {
                    //判断信息图标是否展示
                    if(that._busInformation && that._busInformation.corpname==txt){
                        $viewBusInfomation.show();
                    }else{
                        $viewBusInfomation.hide();
                    }
                },
                selectCallBack:function (data) {
                    that._busInformation = data;
                    $viewBusInfomation.show();
                }
            });
        }
        , saveCreateOrg_validate: function () {
            var that = this;
            $(that.element).find('form.createOrgBox').validate({
                rules: {
                    companyName: {
                        required: true,
                        maxlength: 50,
                        isEmpty:true
                    },
                    customServerType:{
                        requiredCk:true
                    }
                },
                messages: {
                    companyName: {
                        required: '请输入组织名称!',
                        maxlength: '组织名称不超过50位!',
                        isEmpty:'请输入组织名称!'
                    },
                    customServerType:{
                        requiredCk:'请输入经营范围名称!'
                    }
                },
                errorElement: 'label',
                errorPlacement: function (error, element) {
                    if(element.closest('.service-type-box').length>0){
                        error.insertBefore(element.closest('.service-type-box').find('button[data-action="addServerType"]'));
                    }else{
                        error.insertAfter(element);
                    }

                }
            });
            // 名称空格验证
            jQuery.validator.addMethod("isEmpty", function (value, element) {
                if($.trim(value)==''){
                    return false;
                }else{
                    return true;
                }

            }, "请输入组织名称!");
            jQuery.validator.addMethod("requiredCk", function (value, element) {
                if($.trim(value)=='' && $(element).closest('.service-type').find('input[name="serverType"]').is(':checked')){
                    return false;
                }else{
                    return true;
                }

            }, "请输入经营范围名称!");
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
