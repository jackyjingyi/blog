/**
 * Created by wrb on 2016/12/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_login_uptPassword",
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
            that.bindClickAction();
        }
        ,initHtml:function(){
            var that = this;
            S_layer.dialog({
                title: '修改密码',
                area : '500px',
                content:template('m_login/m_login_uptPassword',{cellphone:that.settings.cellphone,type:that.settings.type}),
                cancel:function () {
                },
                ok:function () {

                    var flag = $('form.changePassWordOBox').valid();
                    if(!flag){
                        return false;
                    }else{
                        that.savePassword();
                        return false;

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
            option.url = restApi.url_changePasswordForLogin;
            var $data = $('form.changePassWordOBox').serializeObject();
            option.postData = $data;
            option.postData.cellphone= that.settings.cellphone;
            option.postData.code=$('input[name="verifcationCode"]').val();
            m_ajax.postJson(option,function (response) {
                if(response.code=='0'){
                    S_layer.close();
                    if(that.settings.saveCallback){
                        that.settings.saveCallback();
                    }

                }else {
                    S_layer.error(response.info);
                }
            });
        }
        ,bindClickAction:function(){//给按钮添加绑定事件
                var that = this;
                $(that.element).find('a[data-action],input[data-action]').bind('click',function(){
                    var action = $(this).attr('data-action');
                    if($(this).attr('disabled')=='disabled'){
                        return false;
                    }
                    if(action == "getCode"){
                            $('#getCode').attr('disabled', 'disabled');
                            that.receiveCode();
                    }
                });
            }
        , receiveCode:function(){//点击获取验证码
            var clock = 0;
            var that = this;
            that.getCode(clock);
            var option = {};
            option.classId='forgetOBox';
            var userId = that.settings.userId;

                option.url=restApi.url_securityCode;
                option.postData={};
                option.postData.cellphone = that.settings.cellphone;

            /* option.postData.userId=$('#userId').val();
             option.postData.cellphone=$('#cellphone').val();*/
            m_ajax.postJson(option,function (response) {
                if (response.code == 0) {
                }
                else {
                    S_layer.error(response.info);
                    clock = 0;
                    window.clearInterval(timer);
                    window.timer=null;
                    $('#getCode').removeClass('startCode').addClass('endCode');
                    $('#getCode').removeAttr('disabled');
                    $('#getCode').html('获取验证码');
                }
            });
        }
        , getCode:function(c,type){
            c = 60;
            $('#getCode').html(c);
            window.timer=setInterval(function() {
                if(c>0)
                {
                    c = c-1;
                    $('#getCode').removeClass('endCode').addClass('startCode').attr('disabled','disabled');

                    $('#getCode').html(c);
                }else{
                    if("undefined" != typeof timer){
                        window.clearInterval(timer);
                    }
                    $('#getCode').removeClass('endCode').addClass('startCode').removeAttr('disabled');
                    $('#getCode').removeClass('startCode').addClass('endCode');
                    $('#getCode').html('获取验证码');
                }
            }, 1000);
        }
        , savePassword_validate:function(){
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
                        equalTo: "#newPassword"
                    },
                    verifcationCode: "required"
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
                    },
                    verifcationCode: "请输入验证码"
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
