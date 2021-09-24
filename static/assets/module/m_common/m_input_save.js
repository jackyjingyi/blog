/**
 * 文本编辑
 * Created by wrb on 2019/11/20.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_input_save",
        defaults = {
            title:null,
            isDialog:true,
            postData:null,//保存另外参数
            postUrl:null,
            fieldKey:'name',//字段名称
            fieldName:'',
            fieldValue:null,
            saveCallBack:null,
            cancelCallBack:null
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
            that.renderPage();
        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'复制流程',
                    area : '600px',
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var flag = $(that.element).find('form').valid();
                        if(flag){
                            that.save();
                        }else{
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
        //生成html
        ,renderPage:function () {
            var that = this;
            var html = template('m_common/m_input_save', {
                isDialog:that.settings.isDialog,
                fieldName:that.settings.fieldName,
                fieldValue:that.settings.fieldValue
            });
            that.renderDialog(html, function () {

                that.save_validate();
                that.bindActionClick();
            });
        }

        //保存
        ,save:function () {
            var that = this;
            var option = {};
            option.classId = that.element;
            option.url = that.settings.postUrl || restApi.url_copyProcess;
            option.postData = {};

            option.postData[that.settings.fieldKey] = $(that.element).find('input[name="name"]').val();

            if(that.settings.postData)
                $.extend( option.postData, that.settings.postData);

            m_ajax.postJson(option, function (response) {
                if (response.code == '0') {

                    S_toastr.success('操作成功！');

                    if(that.settings.saveCallBack)
                        that.settings.saveCallBack();

                } else {
                    S_layer.error(response.info);
                }
            });
        }
        //验证
        ,save_validate: function () {
            var that = this;
            $(that.element).find('form').validate({
                rules: {
                    name: {
                        required: true,
                        maxlength:50
                    }
                },
                messages: {
                    name: {
                        required: '请输入'+that.settings.fieldName,
                        maxlength: '请控制'+that.settings.fieldName+'在50字符内'
                    }
                },
                errorElement: "label",  //用来创建错误提示信息标签
                errorPlacement: function (error, element) {  //重新编辑error信息的显示位置
                    error.appendTo(element.closest('div'));
                }
            });

        }
        ,bindActionClick:function () {
            var that = this;
            $(that.element).find('button[data-action]').off('click').on('click',function (e) {
                var $this = $(this);
                var dataAction = $this.attr('data-action');
                switch (dataAction){
                    case 'save'://
                        var flag = $(that.element).find('form').valid();
                        if(flag){
                            that.save();
                        }else{
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        break;

                    case 'cancel'://

                        if(that.settings.cancelCallBack)
                            that.settings.cancelCallBack();

                        break;


                }
                return false;
            });
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


