/**
 *
 * Created by veata on 2016/12/22.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_login",
        defaults = {

        };

    // The actual plugin constructor
    function Plugin(element, options) {
        this.element = element;

        this.settings = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._remember = 0;
        this.init();
    }

    // Avoid Plugin.prototype conflicts
    $.extend(Plugin.prototype, {
        init:function(){
            var that=this;
            that.initHtmlData(function(){
                that.login_validate();
                that.bindKeyDownEnter();
                that.bindOkLogin()
                 that.initICheck();
                that.bindReceiveCodeClick();
                that.loginByCode_validate();
                that.initMobileLoginForm();
                that.getCookie();
            });

        },
        initHtmlData:function(callback){
            var that = this;
            var html = template('m_login/m_login',{});
            $(that.element).html(html);
            if(callback) return callback();
        },
        bindKeyDownEnter: function () {
            var that = this;
            $('#password').keydown(function () {
                if (event.keyCode == 13)
                    that.login();
            });
        },
        bindOkLogin: function(){
            var that = this;
            $(that.element).find('#btnLogin').on('click',function(event){
                that.login();
            });
        }
        //初始化iCheck
        ,initICheck:function () {

            var that = this;
            var ifChecked = function (e) {
            };
            var ifUnchecked = function (e) {
            };
            var ifClicked = function (e) {
            };
            $(that.element).find('.i-checks').iCheck({
                checkboxClass: 'icheckbox_square-green',
                radioClass: 'iradio_square-green'
            }).on('ifUnchecked.s', ifUnchecked).on('ifChecked.s', ifChecked).on('ifClicked',ifClicked);

    },

        login: function () {
            var that = this;
            if ($("#loginForm").valid()) {

                that.setCookie();
                var option = {};
                option.classId = '.login-form';
                option.url = restApi.url_homeLogin;
                option.postData = {};
                option.postData.cellphone = $('#loginForm #cellphone').val();
                option.postData.password = $('#loginForm #password').val();
                m_ajax.postJson(option, function (response) {
                    if (response.code == 0) {

                        removeCookiesOnLoginOut();
                        that.toHomePage();
                    } else if(response.code=='2') {

                        $('body').m_login_uptPassword({cellphone:$('#loginForm #cellphone').val(),type:1,saveCallback:function () {
                                S_layer.success('修改成功，请重新登录!','提示',function(){
                                    $('#loginForm #password').val('');
                                });
                            }});//打开修改密码弹窗
                        return false;
                    }else if(response.code=='3') {

                        $('body').m_login_uptPassword({cellphone:$('#loginForm #cellphone').val(),type:2,saveCallback:function () {
                                S_layer.success('修改成功，请重新登录!','提示',function(){
                                    $('#loginForm #password').val('');
                                });
                            }});//打开修改密码弹窗
                        return false;
                    }else{
                        S_layer.error(response.info);
                        return false;
                    }

                });
            }
            return false;
        },
        login_validate: function () {//点击登录时进行密码验证
            $("#loginForm").validate({
                rules: {
                    cellphone: "required",
                    password: "required"
                },
                messages: {
                    cellphone: "请输入手机号码",
                    password: "请输入账号密码"
                },
                highlight: function (element, errorClass, validClass) {
                    $(element).removeClass("valid-success").addClass("valid-error");
                },
                unhighlight: function (element, errorClass, validClass) {
                    $(element).tooltip('destroy');
                    $(element).removeClass("valid-error");
                    //$(element).removeClass("valid-error").addClass("valid-success");
                },
                success: function (element, errorClass, validClass) {
                    $(element).tooltip('destroy');
                    $(element).removeClass("valid-error");
                    //$(element).removeClass("valid-error").addClass("valid-success");
                },
                /*errorElement:"span",*/
                errorPlacement: function (label, element) {
                    /* $(element).appendTo(r.is(":radio")||r.is(":checkbox")?r.parent().parent().parent():r.parent());*/
                    $(element).attr('title', $(label).text()).tooltip({placement: 'left'}).tooltip('show');
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
        ,setCookie:function () {
            var loginCode = $("#cellphone").val();
            var pwd = $("#password").val();
            var checked = $("input[type='checkbox']").is(':checked');
            if(checked){
                var date = new Date();
                date.setTime(date.getTime()+60*60*24*7);
                var newLogin = Encrypt(loginCode);
                var newPwd = Encrypt(pwd);
                Cookies.set("login_code",newLogin,{ expires: date, path: '/' });
                Cookies.set("pwd",newPwd,{ expires: date, path: '/' });
            }else{
                Cookies.set("login_code", null);
                Cookies.set("pwd", null);
            }      
        },
        getCookie:function () {
            var that = this;
            var loginCode = Cookies.get("login_code");
            var pwd =Cookies.get("pwd");

        /*    $("[flag='password']").focus(function(){
                var pss = $("#password").val();
                if(pss.length>0){
                    $(this).attr("type","password");
                }
            });*/

            if (!loginCode||loginCode==0||loginCode=='null') {
                $("#cellphone").val("");
            }else{
                var newLogin = Decrypt(loginCode);
                $("#cellphone").val(newLogin);
            }
            if(!pwd||pwd==0||pwd=='null'){
                $("#password").val("");
                $(that.element).find('input[name="remember"]').prop('checked',false);
                $(that.element).find('input[name="remember"][value=""]').iCheck('update');
            }else{
                var newPwd = Decrypt(pwd);
                $("#password").val(newPwd);
                $("#password").attr("type","password");
                $(that.element).find('input[name="remember"]').prop('checked',true);
                $(that.element).find('input[name="remember"]').iCheck('update');
            }

        }
        //发送验证
        ,receiveCode: function () {
            var that = this;
            that.getCode();
            var option = {};
            option.url = restApi.url_sendSecurityCodeAndValidateCellphone;
            option.postData = {cellphone: $(that.element).find('form#mobileLoginForm input[name="cellphone"]').val()};
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
                    $(that.element).find('form#mobileLoginForm a[data-action="receiveCode"]').html(clock + 's');
                    $(that.element).find('form#mobileLoginForm a[data-action="receiveCode"]').attr('disabled', 'disabled');
                }
            };
            updateClock();
            that.timer = setInterval(function () {
                updateClock();
                if (clock <= 0) {
                    $(that.element).find('form#mobileLoginForm a[data-action="receiveCode"]').html('获取验证码');
                    $(that.element).find('form#mobileLoginForm a[data-action="receiveCode"]').removeAttr('disabled');
                    if ("undefined" != typeof that.timer) {
                        window.clearInterval(that.timer);
                    }
                }
            }, 1000);
        }
        //按钮事件绑定
        ,bindReceiveCodeClick: function () {
            var that = this;
            $(that.element).find('form#mobileLoginForm a[data-action="receiveCode"]').on('click', function (event) {
                that.remove_loginByCode_validate();
                //发送验证码
                if ($(this).html() == '获取验证码') {
                    if ($("form#mobileLoginForm").valid()) {
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
                highlight: function (element, errorClass, validClass) {
                    $(element).removeClass("valid-success").addClass("valid-error");
                },
                unhighlight: function (element, errorClass, validClass) {
                    $(element).tooltip('destroy');
                    $(element).removeClass("valid-error");
                    //$(element).removeClass("valid-error").addClass("valid-success");
                },
                success: function (element, errorClass, validClass) {
                    $(element).tooltip('destroy');
                    $(element).removeClass("valid-error");
                    //$(element).removeClass("valid-error").addClass("valid-success");
                },
                /*errorElement:"span",*/
                errorPlacement: function (label, element) {
                    /* $(element).appendTo(r.is(":radio")||r.is(":checkbox")?r.parent().parent().parent():r.parent());*/
                    $(element).attr('title', $(label).text()).tooltip({placement: 'left'}).tooltip('show');
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
            $(that.element).find('form#mobileLoginForm input[name="code"]').rules('add',{
                required:true,
                messages:{
                    required:'请输入验证码！'
                }
            });
        }
        //删除发票验证
        ,remove_loginByCode_validate:function () {
            var that = this;
            $(that.element).find('form#mobileLoginForm input[name="code"]').rules('remove','required');
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
                // option.url = restApi.url_loginByCode;
                option.url = restApi.url_loginByTest;
                option.postData = {};
                option.postData.cellphone = $('form#mobileLoginForm #cellphone').val();
                option.postData.code = $('form#mobileLoginForm #receiveCode').val();
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

    $.fn[pluginName] = function (options) {
        return this.each(function () {

            //if (!$.data(this, "plugin_" + pluginName)) {
            $.data(this, "plugin_" +
                pluginName, new Plugin(this, options));
            //}
        });
    };

})(jQuery, window, document);
