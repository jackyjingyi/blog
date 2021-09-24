/**
 * 登录
 * Created by wrb on 2018/5/10.
 */

;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_website_login",
        defaults = {
            type : ''
        };

    function Plugin(element, options) {
        this.element = element;

        this.settings = options;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    $.extend(Plugin.prototype, {
        init: function () {
            var that = this;
            that.renderPage();
        }
        , renderPage: function () {
            var that = this;
            var html = template('m_website/m_website_login', {rootPath:window.rootPath});
            $(that.element).html(html);

            that.login_validate();
            that.initLoginForm();

            that.bindReceiveCodeClick();
            that.loginByCode_validate();
            that.initMobileLoginForm();
        }
        ,initLoginForm: function () {
            var that = this;

            $('#password').off('keydown.pwd').on('keydown.login',function (e)
            {
                if (event.keyCode == 13)
                    that.login();
            });

            $('#btnLogin').click(function(){
                that.login();
            });
        },
        login: function () {
            var that = this;
            if ($("#loginForm").valid()) {


                var pwdReg = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;//8位以上包含大小写字母数值及特殊字符
                var password = $('#password').val();
               var isReg =  pwdReg.test(password);

               if(!isReg){
                   //不符合规则
                   $('body').m_uptPassword();//打开修改密码弹窗
                   return ;
               }

                var option = {};
                option.url = restApi.url_homeLogin;
                option.postData = {};
                option.postData.cellphone = $('#account').val();
                option.postData.password = $('#password').val();
                m_ajax.postJson(option, function (response) {
                    if (response.code == 0) {

                        removeCookiesOnLoginOut();
                        that.toHomePage();

                    }
                    else {
                        S_toastr['error'](response.info);
                    }
                });
            }
            return false;
        },
        login_validate: function () {//点击登录时进行密码验证
            $("#loginForm").validate({
                rules: {
                    account: "required",
                    password: "required"
                },
                messages: {
                    account: "请输入手机号码",
                    password: "请输入账号密码"
                }
            });
        }
        //重定向判断
        ,toHomePage:function () {
            var option = {};
            option.url = restApi.url_haveViewAllProject;
            option.postData = {};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    window.location.href = window.serverPath + '/iWork/home/workbench';

                } else {
                    S_layer.error(response.info);
                }
            });
        }

        //发送验证
        ,receiveCode: function () {
            var that = this;
            that.getCode();
            var option = {};
            option.url = restApi.url_sendSecurityCodeAndValidateCellphone;
            option.postData = {cellphone: $(that.element).find('input[name="cellphone"]').val()};
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {
                    //S_layer.tips('发送成功！');
                } else {
                    if ("undefined" != typeof that.timer) {
                        window.clearInterval(that.timer);
                    }
                    S_layer.error(response.info);
                }
            })
        }
        //生成时间倒计时
        ,getCode: function () {
            var clock = 60;
            var that = this;
            var updateClock = function () {
                if (clock > 0) {
                    clock = clock - 1;
                    $(that.element).find('form a[data-action="receiveCode"]').html(clock + 's');
                    $(that.element).find('form a[data-action="receiveCode"]').attr('disabled', 'disabled');
                }
            };
            updateClock();
            that.timer = setInterval(function () {
                updateClock();
                if (clock <= 0) {
                    $(that.element).find('form a[data-action="receiveCode"]').html('获取验证码');
                    $(that.element).find('form a[data-action="receiveCode"]').removeAttr('disabled');
                    if ("undefined" != typeof that.timer) {
                        window.clearInterval(that.timer);
                    }
                }
            }, 1000);
        }
        //按钮事件绑定
        ,bindReceiveCodeClick: function () {
            var that = this;
            $(that.element).find('form a[data-action="receiveCode"]').on('click', function (event) {
                that.remove_loginByCode_validate();
                //发送验证码
                if ($(this).html() == '获取验证码') {
                    if ($("#mobileLoginForm").valid()) {
                        that.receiveCode();
                    }
                } else {
                    return false;
                }
                stopPropagation(event);
                return false;
            });
        }
        //手机发送或登录验证
        ,loginByCode_validate: function () {
            var that = this;
            $(that.element).find('form#mobileLoginForm').validate({
                rules: {
                    cellphone: {
                        required: true,
                        isMobile: 11
                    }
                },
                messages: {
                    cellphone: {
                        required: "请输入手机号码",
                        isMobile: "请正确填写您的手机号码"
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    if (element.closest('.col-sm-12').length>0) {
                        error.appendTo(element.closest('.col-sm-12'));
                    } else {
                        error.insertAfter(element);
                    }
                }
            });
            // 手机号码验证
            jQuery.validator.addMethod("isMobile", function (value, element) {
                var length = value.length;
                var mobile = regularExpressions.mobile;
                return this.optional(element) || (length == 11 && mobile.test(value));
            }, "请正确填写您的手机号码");
        }
        //添加验证
        ,add_loginByCode_validate:function () {
            var that = this;
            $(that.element).find('form input[name="code"]').rules('add',{
                required:true,
                messages:{
                    required:'请输入验证码！'
                }
            });
        }
        //删除发票验证
        ,remove_loginByCode_validate:function () {
            var that = this;
            $(that.element).find('form input[name="code"]').rules('remove','required');
        }
        //绑定登录按钮
        ,initMobileLoginForm: function () {
            var that = this;

            $('#receiveCode').off('keydown.mobileLogin').on('keydown.mobileLogin',function (e)
            {
                if (event.keyCode == 13)
                    that.mobileLogin();
            });

            $('#btnMobileLogin').click(function(){
                that.add_loginByCode_validate();
                that.mobileLogin();
            });
        },
        //手机登录
        mobileLogin: function () {
            var that = this;
            if ($("#mobileLoginForm").valid()) {
                var option = {};
               option.url = restApi.url_loginByCode;
                option.postData = {};
                option.postData.cellphone = $('#cellphone').val();
                option.postData.code = $('#receiveCode').val();
                m_ajax.postJson(option, function (response) {
                    if (response.code == 0) {

                        removeCookiesOnLoginOut();
                        that.toHomePage();

                    }
                    else {
                        S_toastr['error'](response.info);
                    }
                });
            }
            return false;
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
