/**
 * 设置为直属部门/设置成独立机构
 * Created by wrb on 2019/8/1.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_role_org_change",
        defaults = {
            isDialog:true,
            dataInfo:null,//
            doType: 0,// 0=设置为直属部门 ,1=设置成独立机构,2=变更权限
            saveCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        this.settings.title = '设置“'+this.settings.dataInfo.orgName+'”的权限';

        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;

            var renderFun = function (data) {
                var html = template('m_role/m_role_org_change', {
                    dataInfo:that.settings.dataInfo,
                    doType:that.settings.doType,
                    roleData:data
                });
                that.renderDialog(html,function () {

                    that.initICheck();
                    that.save_validate();
                });
            };
            if(that.settings.doType==0){
                renderFun();
            }else{
                that.getData(function (data) {
                    renderFun(data);
                });
            }
        }
        ,initICheck:function () {
            var that = this;
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            });
            $(that.element).find('input[name="roleType"]').on('ifClicked',function (e) {

                var roleType = $(this).val();
                if(roleType=='0'){
                    $(that.element).find('.form-group[data-type="orgType"]').addClass('hide');
                }else{
                    $(that.element).find('.form-group[data-type="orgType"]').removeClass('hide');
                }

            });
        }
        //获取权限类型数据
        ,getData:function (callBack) {
            var option = {};
            option.url=restApi.url_getRoleInfoByChange;
            m_ajax.get(option, function (res) {
                if (res.code === '0') {

                    if(callBack)
                        callBack(res.data);

                } else {
                    S_toastr.error(res.info);
                }
            });
        }
        //渲染界面
        ,renderDialog:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'变更权限',
                    area : '650px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

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
        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = '#content-right';
            option.url = restApi.url_orgChangeOrgType;
            option.postData = $(that.element).find('form').serializeObject();
            option.postData.id = that.settings.dataInfo.id;
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
            $(that.element).find('form').validate({
                rules: {
                    roleType:{
                        required: true
                    },
                    orgGroupId:{
                        typeRequired: true
                    },
                    userName:{
                        required: true,
                        isEmpty:true
                    },
                    cellphone: {
                        required: true,
                        isMobile: true
                    }
                },
                messages: {
                    roleType:{
                        required: '请选择权限类型！'
                    },
                    orgGroupId:{
                        typeRequired: '请选择部门分组！'
                    },
                    userName:{
                        required: '请输入负责人姓名！',
                        isEmpty:"请输入负责人姓名!"
                    },
                    cellphone: {
                        required: "请输入手机号码",
                        isMobile: "请正确填写您的手机号码"
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-9'));
                }
            });
            // 名称空格验证
            jQuery.validator.addMethod("isEmpty", function (value, element) {
                if($.trim(value)==''){
                    return false;
                }else{
                    return true;
                }

            }, "请输入负责人姓名!");
            // 手机号码验证
            jQuery.validator.addMethod("isMobile", function(value, element) {
                var length = value.length;
                var mobile = regularExpressions.mobile;
                return this.optional(element) || (length == 11 && mobile.test(value));
            }, "请正确填写您的手机号码");

            jQuery.validator.addMethod("typeRequired", function (value, element) {
                var roleType = $(that.element).find('input[name="roleType"]:checked').val();
                if(roleType!='0' && value==undefined){
                    return false;
                }else{
                    return true;
                }

            }, "请选择部门分组!");
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
