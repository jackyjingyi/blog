/**
 * 基本信息－编辑外部协作单位
 * Created by wrb on 2020/6/18.
 */
;(function ($, window, document, undefined) {

    "use strict";
    var pluginName = "m_project_process_edit",
        defaults = {
            title:null,
            isDialog:true,
            projectId:null,
            progressRate:null,
            saveCallBack:null
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
            var html = template('m_project/m_project_process_edit',{progressRate:that.settings.progressRate});
            that.renderDialog(html,function () {


                that.save_validate();


            });

        },
        //初始化数据
        renderDialog:function (html,callBack) {
            var that = this;

            if(that.settings.isDialog===true){//以弹窗编辑

                S_layer.dialog({
                    title: that.settings.title||'编辑项目进度',
                    area : ['500px','200px'],
                    content:html,
                    cancel:function () {
                    },
                    ok:function () {

                        var error = [];
                        var flag = $(that.element).find('form').valid();
                        if (!flag) {
                            S_toastr.error($(that.element).find('form label.error:visible').eq(0).text());
                            return false;
                        }
                        that.save();

                    }

                },function(layero,index,dialogEle){//加载html后触发
                    that.settings.isDialog = index;//设置值为index,重新渲染时不重新加载弹窗
                    that.element = dialogEle;
                    //S_layer.resize(layero,index,dialogEle);
                    if(callBack)
                        callBack();
                });

            }else{//不以弹窗编辑
                $(that.element).html(html);
                if(callBack)
                    callBack();
            }
        }
        ,save:function () {
            var that = this;
            var options = {};
            options.url = restApi.url_project;
            options.classId = that.element;
            options.postData = {};

            options.postData.progressRate = $(that.element).find('input[name="progressRate"]').val();
            options.postData.id = that.settings.projectId;

            m_ajax.postJson(options, function (response) {
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
                ignore : [],
                rules: {
                    progressRate:{
                        required: true,
                        number:true,
                        minNumber:true
                    }
                },
                messages: {
                    progressRate:{
                        required: '请输入进度值',
                        number:'请输入有效数字',
                        minNumber:'请输入>=0且<=100的数字'
                    }
                },
                errorPlacement: function (error, element) { //指定错误信息位置
                    error.appendTo(element.closest('.col-xs-9'));
                }
            });
            $.validator.addMethod('minNumber', function(value, element) {
                value = $.trim(value);
                var isOk = true;
                if( value<0 || value>100){
                    isOk = false;
                }
                return  isOk;
            }, '请输入>=0且<=100的数字');
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


