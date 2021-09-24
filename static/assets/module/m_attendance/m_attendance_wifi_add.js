/**
 * 添加打卡wifi
 * Created by wrb on 2018/10/15.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_attendance_wifi_add",
        defaults = {
            isDialog:true,
            okCallBack:null
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
            that.render();
        }
        , render: function () {
            var that = this;

            var html = template('m_attendance/m_attendance_wifi_add', {});
            that.renderPage(html,function () {

                that.enterAfterNext();
                that.ok_validate();

            });
        }
        //渲染界面
        ,renderPage:function (html,callBack) {

            var that = this;
            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title|| '添加打卡wifi',
                    area : '750px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {
                        var flag = $(that.element).find('form').valid();
                        if (!flag) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        var data = $(that.element).find('form').serializeObject();
                        data.itemKey = UUID.genV4().hexNoDelim;
                        if(that.settings.okCallBack)
                            that.settings.okCallBack(data);

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
        ,enterAfterNext:function () {
            var that = this;
            $(that.element).find('input[name="wifiAddress"]').on('keyup',function () {
                var val = $(this).val();
                if(val.length==2 && $(this).next('input').length>0)
                    $(this).next('input').focus();
            });
        }
        //表单验证
        ,ok_validate:function(){
            var that = this;
            $(that.element).find('form.form-horizontal').validate({
                rules: {
                    wifiName: {
                        required: true
                    },
                    wifiAddress: {
                        wifiAddressCk: true
                    }
                },
                messages: {
                    wifiName: {
                        required: '请输入wifi名称'
                    },
                    wifiAddress: {
                        wifiAddressCk: '请输入BSSID'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-sm-10'));
                }
            });
            $.validator.addMethod('wifiAddressCk', function(value, element) {
                var isOk = true;
                $(that.element).find('input[name="wifiAddress"]').each(function () {
                    if($.trim($(this).val())==''){
                        isOk = false;
                        return false;
                    }
                });
                return  isOk;
            }, '请输入BSSID');
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