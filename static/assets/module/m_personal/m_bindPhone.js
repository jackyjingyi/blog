/**
 * Created by wrb on 2016/12/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_bindPhone",
        defaults = {
            saveBindPhoneCallBack: null
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
        //初始化页面
        ,initHtml:function(){
            var that = this;
            S_layer.dialog({
                title: '绑定手机',
                area : '500px',
                content:template('m_personal/m_bindPhone', {}),
                ok:function () {

                    var flag = $('form.bindPhoneBox').valid();
                    if(!flag){
                        return false;
                    }else{
                        that.saveBindPhone();
                    }
                }

            },function(layero,index,dialogEle){//加载html后触发
                that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                that.element = dialogEle;
                that.saveBindPhone_validate();
                that.bindActionClick();
                that.closeDialog();
            });
        }
        //发送验证
        , receiveCode: function () {

            var that = this;
                that.getCode();
                var option = {};
                option.url = restApi.url_securityCode;
                option.postData = {cellphone: $('form.bindPhoneBox input[name="bindCellPhoneDtoCellphone"]').val()};
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
        //给关闭弹窗按钮绑定事件
        ,closeDialog:function(){
            var that = this;
            $(that.element).closest('.ui-dialog').find('td[i="header"] button.ui-dialog-close,.panel-footer button.btn-u-default')
                .on('click.clearInterval',function(event){
                    window.clearInterval(that.timer);
                    stopPropagation(event);
                });
        }
        //保存绑定手机号
        , saveBindPhone: function () {
            var that = this;
            var option = {};
            option.url = restApi.url_changeCellphone;
            option.postData = {
                cellphone: $('form.bindPhoneBox input[name="bindCellPhoneDtoCellphone"]').val(),
                code: $('form.bindPhoneBox input[name="bindCellPhoneDtoCode"]').val()
            };
            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_layer.success('更改手机号成功，系统将跳转至登录界面','提示',function(){
                        window.location.href = window.serverPath + '/iWork/sys/logout';
                    })

                } else {
                    S_layer.error(response.info);
                    return false;
                }
            });
        }
        , getCode: function () {//生成时间倒计时
            var clock = 60;
            var that = this;
            var updateClock = function () {
                if (clock > 0) {
                    clock = clock - 1;
                    $('form.bindPhoneBox a[data-action="receiveCode"]').html(clock + 's');
                    // $('form.bindPhoneBox a[data-action="receiveCode"]').css('opacity','0.5');
                    $('form.bindPhoneBox a[data-action="receiveCode"]').attr('disabled', 'disabled');
                }
            };
            updateClock();
            that.timer = setInterval(function () {
                updateClock();
                if (clock <= 0) {
                    $('form.bindPhoneBox a[data-action="receiveCode"]').html('获取验证码');
                    // $('form.bindPhoneBox a[data-action="receiveCode"]').css('opacity','1');
                    $('form.bindPhoneBox a[data-action="receiveCode"]').removeAttr('disabled');
                    if ("undefined" != typeof that.timer) {
                        window.clearInterval(that.timer);
                    }
                }
            }, 1000);
        }
        //按钮事件绑定
        , bindActionClick: function () {
            var that = this;
            $('form.bindPhoneBox a[data-action]').on('click', function (event) {
                var dataAction = $(this).attr('data-action');
                if (dataAction == "receiveCode") {//发送验证码
                    if ($(this).html() == '获取验证码') {
                        if (that.receiveCode_validate()) {
                            that.receiveCode();
                        }
                    } else {
                        return false;
                    }
                } else if (dataAction == 'saveBindPhone') {//保存绑定
                    that.saveBindPhone();
                }
                stopPropagation(event);
                return false;
            });
        }

        //发送验证码表单验证
        , receiveCode_validate: function () {//step1的表单验证
            var error = [];
            var cellphone = $('#cellphone').val();
            var mobile = regularExpressions.mobile;
            if (cellphone == '' || cellphone == null) {
                error.push('请输入手机号码');
            } else if (!mobile.test(cellphone)) {
                error.push('请正确填写您的手机号码');
            }
            if (error.length > 0) {
                var html = '<label id="cellphone-error" class="error" for="cellphone">';
                html += error[0];
                html += '</label>';
                if ($('#cellphone').closest('.form-group').find('#cellphone-error').length < 1) {
                    $('#cellphone').closest('.form-group').append(html);
                }
                return false;
            } else {
                return true;
            }
        }
        , saveBindPhone_validate: function () {
            var that = this;
            $(that.element).find('form.bindPhoneBox').validate({
                rules: {
                    bindCellPhoneDtoCellphone: {
                        required: true,
                        isMobile: 11
                    },
                    bindCellPhoneDtoCode: {
                        required: true
                    }
                },
                messages: {
                    bindCellPhoneDtoCellphone: {
                        required: "请输入手机号码",
                        isMobile: "请正确填写您的手机号码"
                    },
                    bindCellPhoneDtoCode: {
                        required: '请输入验证码!'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    if ($(element).attr('name') == 'bindCellPhoneDtoCellphone') {
                        error.appendTo(element.closest('.col-md-12 .form-group'));
                        error.addClass('input_error');
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
