/**
 * Created by wrb on 2016/12/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_uptPassword",
        defaults = {
            savePasswordCallBack:null
        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.initHtml();

        }
        ,initHtml:function(){
            var that = this;
            S_layer.dialog({
                title: '修改密码',
                area : '500px',
                content:template('m_personal/m_uptPassword',{}),
                cancel:function () {
                },
                ok:function () {

                    var flag = $('form.changePassWordOBox').valid();
                    if(!flag){
                        return false;
                    }else{
                        that.savePassword();
                    }
                }

            },function(layero,index,dialogEle){//加载html后触发
                that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                that.element = dialogEle;
                that.savePassword_validate();
            });
        }
        //保存密码
        ,savePassword:function () {
            var that = this;
            var option  = {};
            option.url = restApi.url_changePassword;
            var $data = $('form.changePassWordOBox').serializeObject();
            option.postData = $data;
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_layer.success('修改成功，请重新登录!','提示',function(){
                        window.location.href = window.serverPath+'/iWork/sys/logout';
                    })
                }else {
                    S_layer.error(response.info);
                    return false;
                }
            });
        }
        ,savePassword_validate:function(){
            $('form.changePassWordOBox').validate({
                rules: {
                    oldPassword: {
                        required: true
                    },
                    password:{
                        required:true,
                        checkSpace: true,
                        checkPattern:true
                    },
                    rePassword:{
                        required:true,
                        checkSpace: true,
                        checkPattern:true,
                        equalTo: "#password"
                    }
                },
                messages: {
                    oldPassword: {
                        required: '请输入旧密码！'
                    },
                    password:{
                        required:'请输入新密码！',
                        checkSpace: '密码不应该有空格！',
                        checkPattern:'请输入8位以上包含大小写字母数字及特殊字符组合!'
                    },
                    rePassword:{
                        required:'请确认新密码！',
                        checkSpace: '密码不应该有空格！',
                        checkPattern:'请输入8位以上包含大小写字母数字及特殊字符组合!',
                        equalTo: '两次密码输入不一致'
                    }
                }
            });
            //密码验证
            $.validator.addMethod("checkSpace", function (value, element) {
                var pattern = /^\S+$/gi;
                return this.optional(element) || pattern.test(value);
            }, "密码不应含有空格!");
            //密码验证
            $.validator.addMethod("checkPattern", function (value, element) {
                var pattern = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*~-]).{8,}$/;
                return this.optional(element) || pattern.test(value);
            }, "请输入8位以上包含大小写字母数字及特殊字符组合!");
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
